const TMDB_API = "0bed9bd88f685b96e7091e3776308a9d";
const TMDB_BASE = "https://api.themoviedb.org/3";
const JIKAN_BASE = "https://api.jikan.moe/v4";

const moviesGrid = document.getElementById("moviesGrid");
const tvGrid = document.getElementById("tvGrid");
const animeGrid = document.getElementById("animeGrid");
const wishlistGrid = document.getElementById("wishlistGrid");
const genreSelect = document.getElementById("genreSelect");
const searchInput = document.getElementById("searchInput");
const detailsModal = document.getElementById("detailsModal");
const detailsContainer = document.getElementById("detailsContainer");
const closeModal = document.querySelector(".close");
const wishlistBtn = document.getElementById("wishlistBtn");

const homeBtn = document.getElementById("homeBtn");
const moviesBtn = document.getElementById("moviesBtn");
const tvBtn = document.getElementById("tvBtn");

const heroBanner = document.getElementById("heroBanner");
const heroImage = document.getElementById("heroImage");
const heroTitle = document.getElementById("heroTitle");
const heroOverview = document.getElementById("heroOverview");
const playBtn = document.getElementById("playBtn");
const detailsBtn = document.getElementById("detailsBtn");

let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

async function loadGenres() {
    try {
        const res = await fetch(`${TMDB_BASE}/genre/movie/list?api_key=${TMDB_API}`);
        const data = await res.json();
        genreSelect.innerHTML = `<option value="">All Genres</option>`;
        data.genres.forEach(genre => {
            const option = document.createElement("option");
            option.value = genre.id;
            option.textContent = genre.name;
            genreSelect.appendChild(option);
        });
    } catch (err) {
        console.error("Genres fetch error:", err);
    }
}

async function fetchTMDB(endpoint, grid, type = "movie") {
    try {
        const res = await fetch(`${TMDB_BASE}${endpoint}&api_key=${TMDB_API}`);
        const data = await res.json();
        grid.innerHTML = "";

        data.results.slice(0, 15).forEach(item => {
            const title = item.title || item.name;
            const poster = item.poster_path
                ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                : "images/no-poster.png";
            const rating = item.vote_average.toFixed(1);

            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
                <img src="${poster}" alt="${title}">
                <div class="rating">⭐ ${rating}</div>
                <div class="title">${title}</div>
                <button class="wishlist-btn">+ My List</button>
            `;
            card.querySelector(".wishlist-btn").addEventListener("click", e => {
                e.stopPropagation();
                addToWishlist({ id: item.id, title, poster, rating, type });
            });
            card.addEventListener("click", () => showDetailsTMDB(item.id, type === "tv"));
            grid.appendChild(card);
        });
    } catch (err) {
        console.error("TMDb fetch error:", err);
        grid.innerHTML = "<p style='color:red'>⚠ Unable to load data right now.</p>";
    }
}

async function loadHeroBanner() {
    try {
        const res = await fetch(`${TMDB_BASE}/trending/movie/day?api_key=${TMDB_API}`);
        const data = await res.json();
        const random = data.results[Math.floor(Math.random() * data.results.length)];
        const bannerImage = random.backdrop_path
            ? `https://image.tmdb.org/t/p/original${random.backdrop_path}`
            : "images/no-poster.png";

        heroImage.src = bannerImage;
        heroTitle.textContent = random.title;
        heroOverview.textContent = random.overview.slice(0, 150) + "...";

        playBtn.onclick = () => {
            alert("Simulated Playback: Playing trailer...");
            showDetailsTMDB(random.id, false);
        };
        detailsBtn.onclick = () => showDetailsTMDB(random.id, false);
    } catch (err) {
        console.error("Hero banner error:", err);
    }
}

async function showDetailsTMDB(id, isTV = false) {
    const type = isTV ? "tv" : "movie";
    try {
        const [detailsRes, creditsRes, videosRes] = await Promise.all([
            fetch(`${TMDB_BASE}/${type}/${id}?api_key=${TMDB_API}`),
            fetch(`${TMDB_BASE}/${type}/${id}/credits?api_key=${TMDB_API}`),
            fetch(`${TMDB_BASE}/${type}/${id}/videos?api_key=${TMDB_API}`)
        ]);

        const details = await detailsRes.json();
        const credits = await creditsRes.json();
        const videos = await videosRes.json();
        const trailer = videos.results.find(v => v.type === "Trailer");

        detailsContainer.innerHTML = `
            <h2>${details.title || details.name}</h2>
            <p><b>Genres:</b> ${details.genres.map(g => g.name).join(", ")}</p>
            <p><b>Overview:</b> ${details.overview}</p>
            <p><b>Release:</b> ${details.release_date || details.first_air_date}</p>
            <p><b>Rating:</b> ⭐ ${details.vote_average.toFixed(1)}</p>
            ${trailer ? `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${trailer.key}" frameborder="0" allowfullscreen></iframe>` : ""}
            <h3>Actors</h3>
            <div class="actor-grid">
                ${credits.cast.slice(0, 6).map(actor => `
                    <div class="actor-card">
                        <img src="https://image.tmdb.org/t/p/w200${actor.profile_path}" alt="${actor.name}">
                        <p>${actor.name}</p>
                        <small>${actor.character}</small>
                    </div>
                `).join("")}
            </div>
        `;
        detailsModal.style.display = "block";
    } catch (err) {
        console.error("Details fetch failed:", err);
    }
}

async function fetchAnime() {
    const categories = [
        { endpoint: "top/anime", label: "Top Anime" },
        { endpoint: "seasons/now", label: "Airing Now" }
    ];
    animeGrid.innerHTML = "";

    for (let cat of categories) {
        try {
            const res = await fetch(`${JIKAN_BASE}/${cat.endpoint}?limit=10`);
            const data = await res.json();

            data.data.forEach(anime => {
                const title = anime.title;
                const poster = anime.images.jpg.image_url;
                const rating = anime.score || "N/A";

                const card = document.createElement("div");
                card.className = "card";
                card.innerHTML = `
                    <img src="${poster}" alt="${title}">
                    <div class="rating">⭐ ${rating}</div>
                    <div class="title">${title}</div>
                    <button class="wishlist-btn">+ My List</button>
                `;
                card.querySelector(".wishlist-btn").addEventListener("click", e => {
                    e.stopPropagation();
                    addToWishlist({ id: anime.mal_id, title, poster, rating, type: "anime" });
                });
                card.addEventListener("click", () => showDetailsAnime(anime.mal_id));
                animeGrid.appendChild(card);
            });
        } catch (err) {
            console.error("Anime fetch failed:", err);
        }
    }
}

async function showDetailsAnime(id) {
    try {
        const res = await fetch(`${JIKAN_BASE}/anime/${id}/full`);
        const anime = await res.json();
        const data = anime.data;

        detailsContainer.innerHTML = `
            <h2>${data.title}</h2>
            <p><b>Genres:</b> ${data.genres.map(g => g.name).join(", ")}</p>
            <p><b>Synopsis:</b> ${data.synopsis}</p>
            <p><b>Aired:</b> ${data.aired.string}</p>
            <p><b>Rating:</b> ⭐ ${data.score || "N/A"}</p>
            ${data.trailer?.embed_url ? `<iframe width="100%" height="315" src="${data.trailer.embed_url}" frameborder="0" allowfullscreen></iframe>` : ""}
        `;
        detailsModal.style.display = "block";
    } catch (err) {
        console.error("Anime details fetch failed:", err);
    }
}

function addToWishlist(item) {
    if (!wishlist.find(w => w.id === item.id && w.type === item.type)) {
        wishlist.push(item);
        localStorage.setItem("wishlist", JSON.stringify(wishlist));
        renderWishlist();
        alert(`${item.title} added to wishlist!`);
    }
}
function renderWishlist() {
    wishlistGrid.innerHTML = "";
    if (wishlist.length === 0) {
        wishlistGrid.innerHTML = "<p style='margin-left:20px; color: #999;'>No items in your wishlist yet.</p>";
        return;
    }
    wishlist.forEach(item => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
            <img src="${item.poster}" alt="${item.title}">
            <div class="rating">⭐ ${item.rating}</div>
            <div class="title">${item.title}</div>
            <button class="remove-btn" title="Remove from wishlist">❌</button>
        `;
        card.querySelector(".remove-btn").addEventListener("click", e => {
            e.stopPropagation();
            removeFromWishlist(item.id, item.type);
        });
        card.addEventListener("click", () => {
            if (item.type === "anime") {
                showDetailsAnime(item.id);
            } else {
                showDetailsTMDB(item.id, item.type === "tv");
            }
        });
        wishlistGrid.appendChild(card);
    });
}
function removeFromWishlist(id, type) {
    const itemToRemove = wishlist.find(w => w.id === id && w.type === type);
    if (itemToRemove) {
        wishlist = wishlist.filter(w => !(w.id === id && w.type === type));
        localStorage.setItem("wishlist", JSON.stringify(wishlist));
        renderWishlist();
        
        const feedback = document.createElement('div');
        feedback.textContent = `Removed "${itemToRemove.title}" from wishlist`;
        feedback.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: #E50914;
            color: white;
            padding: 10px 15px;
            border-radius: 4px;
            z-index: 3000;
            font-size: 0.9rem;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.parentNode.removeChild(feedback);
                }
            }, 300);
        }, 2000);
    }
}

function showAllContent() {
    document.querySelectorAll('main section').forEach(section => {
        section.style.display = 'block';
    });
    heroBanner.style.display = 'block';
    updateActiveNavButton(homeBtn);
}

function showMoviesOnly() {
    document.querySelectorAll('main section').forEach((section, index) => {
        if (index === 1 || index === 2) {
            section.style.display = 'none';
        } else {
            section.style.display = 'block';
        }
    });
    heroBanner.style.display = 'block';
    updateActiveNavButton(moviesBtn);
}

function showTVOnly() {
    document.querySelectorAll('main section').forEach((section, index) => {
        if (index === 0 || index === 2) {
            section.style.display = 'none';
        } else {
            section.style.display = 'block';
        }
    });
    heroBanner.style.display = 'block';
    updateActiveNavButton(tvBtn);
}

function updateActiveNavButton(activeBtn) {
    [homeBtn, moviesBtn, tvBtn].forEach(btn => {
        btn.classList.remove('active');
    });
    activeBtn.classList.add('active');
}

homeBtn.addEventListener('click', showAllContent);
moviesBtn.addEventListener('click', showMoviesOnly);
tvBtn.addEventListener('click', showTVOnly);

genreSelect.addEventListener("change", () => {
    const genreId = genreSelect.value;
    if (genreId) {
        fetchTMDB(`/discover/movie?with_genres=${genreId}&sort_by=popularity.desc`, moviesGrid, "movie");
    } else {
        fetchTMDB("/trending/movie/day?", moviesGrid, "movie");
    }
});

searchInput.addEventListener("keypress", e => {
    if (e.key === "Enter") {
        const query = searchInput.value.trim();
        if (query) {
            searchMovies(query);
            searchTV(query);
            searchAnime(query);
        }
    }
});

async function searchMovies(query) {
    fetchTMDB(`/search/movie?query=${encodeURIComponent(query)}`, moviesGrid, "movie");
}
async function searchTV(query) {
    fetchTMDB(`/search/tv?query=${encodeURIComponent(query)}`, tvGrid, "tv");
}
async function searchAnime(query) {
    animeGrid.innerHTML = "";
    try {
        const res = await fetch(`${JIKAN_BASE}/anime?q=${encodeURIComponent(query)}&limit=10`);
        const data = await res.json();
        data.data.forEach(anime => {
            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
                <img src="${anime.images.jpg.image_url}" alt="${anime.title}">
                <div class="rating">⭐ ${anime.score || "N/A"}</div>
                <div class="title">${anime.title}</div>
            `;
            card.addEventListener("click", () => showDetailsAnime(anime.mal_id));
            animeGrid.appendChild(card);
        });
    } catch (err) {
        console.error("Anime search error:", err);
    }
}

closeModal.addEventListener("click", () => (detailsModal.style.display = "none"));
window.addEventListener("click", e => {
    if (e.target === detailsModal) detailsModal.style.display = "none";
});

wishlistBtn.addEventListener("click", () => {
    document.querySelector("section:last-child").scrollIntoView({ behavior: "smooth" });
});

loadGenres();
loadHeroBanner();
fetchTMDB("/trending/movie/day?", moviesGrid, "movie");
fetchTMDB("/trending/tv/day?", tvGrid, "tv");
fetchAnime();
renderWishlist();

updateActiveNavButton(homeBtn);
