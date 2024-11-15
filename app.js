const SearchModule = {
    init() {
        this.searchInput = document.getElementById('searchQuery');
        this.searchButton = document.getElementById('searchButton');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.toggleButton = document.getElementById('darkModeToggle'); // Updated ID here
        this.bindEvents();
    },

    bindEvents() {
        // Handle Enter key press
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                ResultsModule.performSearch(this.searchInput.value);
                this.clearSearchInput(); // Clear input after search
            }
        });

        // Handle Search button click
        this.searchButton.addEventListener('click', () => {
            ResultsModule.performSearch(this.searchInput.value);
            this.clearSearchInput(); // Clear input after search
        });

        // Handle dark mode toggle button click
        this.toggleButton.addEventListener('click', () => {
            this.toggleDarkMode();
        });
    },

    // Clear search input
    clearSearchInput() {
        this.searchInput.value = '';
    },

    // Switch between light and dark mode
    toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        const currentMode = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        localStorage.setItem('mode', currentMode); // Save the mode preference
    }
};

const ResultsModule = {
    resultsContainer: document.getElementById('resultsContainer'),
    lastSearchQuery: '',

    showLoading() {
        this.resultsContainer.innerHTML = '<div class="loading">Looking for cool stuff... 🔍</div>';
    },

    showError(message) {
        this.resultsContainer.innerHTML = `<div class="error">
            <i class="fas fa-exclamation-circle"></i> ${message}
        </div>`;
    },

    async performSearch(query) {
        query = query.trim();
        this.lastSearchQuery = query;

        if (!query) {
            this.showError('Type something to search! 🤔');
            return;
        }

        this.showLoading();

        try {
            const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=10&srprop=snippet`);
            const data = await response.json();

            if (!data.query?.search) {
                throw new Error('Invalid API response');
            }

            this.displayResults(data.query.search);
        } catch (error) {
            console.error('Search error:', error);
            this.showError('Oops! Something went wrong 😅 Try again?');
        }
    },

    displayResults(results) {
        if (results.length === 0) {
            this.showError('No results found 😢');
            return;
        }

        this.resultsContainer.innerHTML = results
            .map(result => {
                const { title, snippet, pageid } = result;
                return `
                    <div class="result-item" onclick="ContentModule.showContent('${pageid}', '${title}')">
                        <h3>${title}</h3>
                        <p>${snippet}...</p>
                    </div>
                `;
            })
            .join('');
    }
};

const ContentModule = {
    async showContent(pageid, title) {
        try {
            const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&pageids=${pageid}&format=json&origin=*`);
            const data = await response.json();
            const page = data.query.pages[pageid];

            ResultsModule.resultsContainer.innerHTML = `
                <div class="content-module">
                    <button class="back-button" onclick="ContentModule.goBack()">Back</button>
                    <h2>${title}</h2>
                    <div class="content-text">
                        <p>${page.extract}</p>
                    </div>
                    <a href="https://en.wikipedia.org/?curid=${pageid}" target="_blank" class="read-full-article">Read full article</a>
                </div>
            `;
        } catch (error) {
            console.error('Content fetch error:', error);
            ResultsModule.showError('Failed to load content. Please try again.');
        }
    },

    goBack() {
        ResultsModule.performSearch(ResultsModule.lastSearchQuery);
    }
};

// Ensure the last mode preference is loaded on page load
document.addEventListener('DOMContentLoaded', () => {
    SearchModule.init();

    const savedMode = localStorage.getItem('mode');
    if (savedMode === 'dark') {
        document.body.classList.add('dark-mode');
    }

    // Add default About page content
    ResultsModule.resultsContainer.innerHTML = `
        <h2>About SmolWiki</h2>
        <p>This is a simple Wiki application where content is fetched directly from Wikipedia using the Wikipedia API. You can search for any topic, and we will provide relevant Wikipedia articles for you.</p>
        <p>All the content shown here is sourced from Wikipedia, and this tool serves as a lightweight, quick access point for finding information.</p>
        <p>Visit the <a href="https://en.wikipedia.org/" target="_blank">Wikipedia</a> for more information.</p>
        <p>Contact me: <a href="mailto:your-pheklom@gmail.com">pheklom@gmail.com</a></p>
    `;
});