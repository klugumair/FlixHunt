const TMDB_API = "0bed9bd88f685b96e7091e3776308a9d";
const TMDB_BASE = "https://api.themoviedb.org/3";

const moviesGrid = document.getElementById("moviesGrid");
const tvGrid = document.getElementById("tvGrid");
const actionGrid = document.getElementById("actionGrid");
const comedyGrid = document.getElementById("comedyGrid");
const familyGrid = document.getElementById("familyGrid");
const romanceGrid = document.getElementById("romanceGrid");
const westernGrid = document.getElementById("westernGrid");
const wishlistGrid = document.getElementById("wishlistGrid");

const moviesFullGrid = document.getElementById("moviesFullGrid");
const tvFullGrid = document.getElementById("tvFullGrid");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const searchResults = document.getElementById("searchResults");
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

const homePage = document.getElementById("homePage");
const moviesPage = document.getElementById("moviesPage");
const tvPage = document.getElementById("tvPage");

const loadMoreMovies = document.getElementById("loadMoreMovies");
const loadMoreTV = document.getElementById("loadMoreTV");

const genreSelect = document.getElementById("genreSelect");

let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
let currentMoviesPage = 1;
let currentTVPage = 1;
let allGenres = [];

async function loadGenres() {
    try {
        const [movieGenres, tvGenres] = await Promise.all([
            fetch(`${TMDB_BASE}/genre/movie/list?api_key=${TMDB_API}`),
            fetch(`${TMDB_BASE}/genre/tv/list?api_key=${TMDB_API}`)
        ]);
        
        const movieData = await movieGenres.json();
        const tvData = await tvGenres.json();
        
        // Combine all genres and remove duplicates
        const combinedGenres = [...movieData.genres, ...tvData.genres];
        allGenres = combinedGenres.filter((genre, index, self) => 
            index === self.findIndex(g => g.id === genre.id)
        );
        
        // Populate navbar genre selector
        genreSelect.innerHTML = '<option value="">All Genres</option>';
        allGenres.forEach(genre => {
            const option = document.createElement("option");
            option.value = genre.id;
            option.textContent = genre.name;
            genreSelect.appendChild(option);
        });
        
        // Populate movie page genre filter
        const movieGenreFilter = document.getElementById("movieGenreFilter");
        movieGenreFilter.innerHTML = '<option value="">All Genres</option>';
        movieData.genres.forEach(genre => {
            const option = document.createElement("option");
            option.value = genre.id;
            option.textContent = genre.name;
            movieGenreFilter.appendChild(option);
        });
        
        // Populate TV page genre filter
        const tvGenreFilter = document.getElementById("tvGenreFilter");
        tvGenreFilter.innerHTML = '<option value="">All Genres</option>';
        tvData.genres.forEach(genre => {
            const option = document.createElement("option");
            option.value = genre.id;
            option.textContent = genre.name;
            tvGenreFilter.appendChild(option);
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

        data.results.slice(0, 20).forEach(item => {
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
        heroOverview.textContent = random.overview.slice(0, 200) + "...";

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
                        <img src="https://image.tmdb.org/t/p/w200${actor.profile_path || ''}" alt="${actor.name}">
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

async function loadMoviesPage(page = 1, genre = "", sort = "popularity.desc") {
    try {
        const genreParam = genre ? `&with_genres=${genre}` : "";
        const res = await fetch(`${TMDB_BASE}/discover/movie?sort_by=${sort}&page=${page}${genreParam}&api_key=${TMDB_API}`);
        const data = await res.json();
        
        const movies = data.results.slice(0, 40);
        const container = page === 1 ? moviesFullGrid : moviesFullGrid;
        
        if (page === 1) container.innerHTML = "";
        
        movies.forEach(item => {
            const title = item.title;
            const poster = item.poster_path
                ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                : "images/no-poster.png";
            const rating = item.vote_average.toFixed(1);
            const year = item.release_date ? item.release_date.split('-')[0] : 'N/A';

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
                addToWishlist({ id: item.id, title, poster, rating, type: "movie" });
            });
            card.addEventListener("click", () => showDetailsTMDB(item.id, false));
            container.appendChild(card);
        });
        
        loadMoreMovies.disabled = page >= data.total_pages;
    } catch (err) {
        console.error("Movies page fetch error:", err);
    }
}

async function loadTVPage(page = 1, genre = "", sort = "popularity.desc") {
    try {
        const genreParam = genre ? `&with_genres=${genre}` : "";
        const res = await fetch(`${TMDB_BASE}/discover/tv?sort_by=${sort}&page=${page}${genreParam}&api_key=${TMDB_API}`);
        const data = await res.json();
        
        const shows = data.results.slice(0, 40);
        const container = page === 1 ? tvFullGrid : tvFullGrid;
        
        if (page === 1) container.innerHTML = "";
        
        shows.forEach(item => {
            const title = item.name;
            const poster = item.poster_path
                ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                : "images/no-poster.png";
            const rating = item.vote_average.toFixed(1);
            const year = item.first_air_date ? item.first_air_date.split('-')[0] : 'N/A';

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
                addToWishlist({ id: item.id, title, poster, rating, type: "tv" });
            });
            card.addEventListener("click", () => showDetailsTMDB(item.id, true));
            container.appendChild(card);
        });
        
        loadMoreTV.disabled = page >= data.total_pages;
    } catch (err) {
        console.error("TV page fetch error:", err);
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
            showDetailsTMDB(item.id, item.type === "tv");
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

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

function showHome() {
    showPage('homePage');
    updateActiveNavButton(homeBtn);
}

function showMovies() {
    showPage('moviesPage');
    updateActiveNavButton(moviesBtn);
    if (moviesFullGrid.children.length === 0) {
        loadMoviesPage();
    }
}

function showTV() {
    showPage('tvPage');
    updateActiveNavButton(tvBtn);
    if (tvFullGrid.children.length === 0) {
        loadTVPage();
    }
}

function updateActiveNavButton(activeBtn) {
    [homeBtn, moviesBtn, tvBtn].forEach(btn => {
        btn.classList.remove('active');
    });
    activeBtn.classList.add('active');
}

searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim();
    if (query.length > 2) {
        performSearch(query);
    } else {
        searchResults.style.display = 'none';
    }
});

searchBtn.addEventListener("click", () => {
    const query = searchInput.value.trim();
    if (query) {
        performSearch(query);
    }
});

async function performSearch(query) {
    try {
        const [moviesRes, tvRes] = await Promise.all([
            fetch(`${TMDB_BASE}/search/movie?query=${encodeURIComponent(query)}&api_key=${TMDB_API}`),
            fetch(`${TMDB_BASE}/search/tv?query=${encodeURIComponent(query)}&api_key=${TMDB_API}`)
        ]);

        const moviesData = await moviesRes.json();
        const tvData = await tvRes.json();

        let resultsHTML = '';
        
        moviesData.results.slice(0, 5).forEach(movie => {
            const poster = movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : "images/no-poster.png";
            resultsHTML += `
                <div class="search-result-item" onclick="showDetailsTMDB(${movie.id}, false)">
                    <img src="${poster}" alt="${movie.title}">
                    <div class="search-result-info">
                        <h4>${movie.title}</h4>
                        <p>Movie • ⭐ ${movie.vote_average.toFixed(1)}</p>
                    </div>
                </div>
            `;
        });

        tvData.results.slice(0, 5).forEach(show => {
            const poster = show.poster_path ? `https://image.tmdb.org/t/p/w200${show.poster_path}` : "images/no-poster.png";
            resultsHTML += `
                <div class="search-result-item" onclick="showDetailsTMDB(${show.id}, true)">
                    <img src="${poster}" alt="${show.name}">
                    <div class="search-result-info">
                        <h4>${show.name}</h4>
                        <p>TV Show • ⭐ ${show.vote_average.toFixed(1)}</p>
                    </div>
                </div>
            `;
        });

        if (resultsHTML) {
            searchResults.innerHTML = resultsHTML;
            searchResults.style.display = 'block';
        } else {
            searchResults.innerHTML = '<div class="search-result-item"><p>No results found</p></div>';
            searchResults.style.display = 'block';
        }
    } catch (err) {
        console.error("Search error:", err);
    }
}

document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchBtn.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.style.display = 'none';
    }
});

// Handle navbar genre selection
genreSelect.addEventListener('change', () => {
    const selectedGenreId = genreSelect.value;
    if (selectedGenreId) {
        // Filter both movies and TV shows by selected genre and show on home page
        filterHomeByGenre(selectedGenreId);
    } else {
        // Show all content when "All Genres" is selected
        loadHomeContent();
    }
});

async function filterHomeByGenre(genreId) {
    try {
        // Filter movies by genre
        await fetchTMDB(`/discover/movie?with_genres=${genreId}&sort_by=popularity.desc`, moviesGrid, "movie");
        
        // Filter TV shows by genre
        await fetchTMDB(`/discover/tv?with_genres=${genreId}&sort_by=popularity.desc`, tvGrid, "tv");
        
        // Clear other genre-specific grids since we're filtering by the selected genre
        actionGrid.innerHTML = "";
        comedyGrid.innerHTML = "";
        familyGrid.innerHTML = "";
        romanceGrid.innerHTML = "";
        westernGrid.innerHTML = "";
        
        // Show filtered content for the selected genre in action grid
        await fetchTMDB(`/discover/movie?with_genres=${genreId}&sort_by=popularity.desc`, actionGrid, "movie");
    } catch (err) {
        console.error("Genre filter error:", err);
    }
}

function loadHomeContent() {
    // Load original home content
    fetchTMDB("/trending/movie/day?", moviesGrid, "movie");
    fetchTMDB("/trending/tv/day?", tvGrid, "tv");
    fetchTMDB("/discover/movie?with_genres=28&sort_by=popularity.desc", actionGrid, "movie");
    fetchTMDB("/discover/tv?with_genres=35&sort_by=popularity.desc", comedyGrid, "tv");
    fetchTMDB("/discover/movie?with_genres=10751&sort_by=popularity.desc", familyGrid, "movie");
    fetchTMDB("/discover/movie?with_genres=10749&sort_by=popularity.desc", romanceGrid, "movie");
    fetchTMDB("/discover/movie?with_genres=37&sort_by=popularity.desc", westernGrid, "movie");
}

closeModal.addEventListener("click", () => (detailsModal.style.display = "none"));
window.addEventListener("click", e => {
    if (e.target === detailsModal) detailsModal.style.display = "none";
});

wishlistBtn.addEventListener("click", () => {
    document.querySelector("section:last-child").scrollIntoView({ behavior: "smooth" });
});

homeBtn.addEventListener('click', showHome);
moviesBtn.addEventListener('click', showMovies);
tvBtn.addEventListener('click', showTV);

loadMoreMovies.addEventListener('click', () => {
    currentMoviesPage++;
    const genre = document.getElementById("movieGenreFilter").value;
    const sort = document.getElementById("movieSortFilter").value;
    loadMoviesPage(currentMoviesPage, genre, sort);
});

loadMoreTV.addEventListener('click', () => {
    currentTVPage++;
    const genre = document.getElementById("tvGenreFilter").value;
    const sort = document.getElementById("tvSortFilter").value;
    loadTVPage(currentTVPage, genre, sort);
});

document.getElementById("movieGenreFilter").addEventListener("change", () => {
    currentMoviesPage = 1;
    const genre = document.getElementById("movieGenreFilter").value;
    const sort = document.getElementById("movieSortFilter").value;
    loadMoviesPage(1, genre, sort);
});

document.getElementById("movieSortFilter").addEventListener("change", () => {
    currentMoviesPage = 1;
    const genre = document.getElementById("movieGenreFilter").value;
    const sort = document.getElementById("movieSortFilter").value;
    loadMoviesPage(1, genre, sort);
});

document.getElementById("tvGenreFilter").addEventListener("change", () => {
    currentTVPage = 1;
    const genre = document.getElementById("tvGenreFilter").value;
    const sort = document.getElementById("tvSortFilter").value;
    loadTVPage(1, genre, sort);
});

document.getElementById("tvSortFilter").addEventListener("change", () => {
    currentTVPage = 1;
    const genre = document.getElementById("tvGenreFilter").value;
    const sort = document.getElementById("tvSortFilter").value;
    loadTVPage(1, genre, sort);
});

// Initialize the app
loadGenres();
loadHeroBanner();
loadHomeContent();
renderWishlist();
updateActiveNavButton(homeBtn);