document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const autocompleteDropdown = document.getElementById('autocompleteDropdown');
    const repositoriesList = document.getElementById('repositoriesList');

    const debounceDelay = 400;
    const REPOS_PER_PAGE = 5;

    // Функция для ограничения частоты запросов
    function debounce(func, delay) {
        let timer; // Теперь timer локальный для каждого вызова debounce
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timer);
            timer = setTimeout(() => func.apply(context, args), delay);
        };
    }

    // Запрос репозиториев из GitHub API
    async function fetchRepositories(query) {
        if (!query.trim()) {
            autocompleteDropdown.style.display = 'none';
            return [];
        }

        try {
            const response = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=${REPOS_PER_PAGE}`);
            if (!response.ok) throw new Error('Ошибка запроса к GitHub API');
            const data = await response.json();
            return data.items || [];
        } catch (error) {
            console.error('Ошибка при получении репозиториев:', error);
            return [];
        }
    }

    // Отображение подсказок автодополнения
    function displayAutocomplete(repositories) {
        autocompleteDropdown.innerHTML = '';

        if (repositories.length === 0) {
            autocompleteDropdown.style.display = 'none';
            return;
        }

        repositories.forEach(repo => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.textContent = repo.full_name;
            item.addEventListener('click', () => {
                addRepository(repo);
                searchInput.value = '';
                autocompleteDropdown.style.display = 'none';
            });
            autocompleteDropdown.appendChild(item);
        });

        autocompleteDropdown.style.display = 'block';
    }

    // Добавление репозитория в список
    function addRepository(repo) {
        const existingRepos = Array.from(repositoriesList.children).map(item => item.dataset.id);
        if (existingRepos.includes(repo.id.toString())) {
            return; // Не добавляем дубликаты
        }

        const repoItem = document.createElement('div');
        repoItem.className = 'repository-item';
        repoItem.dataset.id = repo.id;

        repoItem.innerHTML = `
            <div class="repository-info">
                <div class="repository-name">Name: ${repo.name}</div>
                <div class="repository-owner">Owner: ${repo.owner.login}</div>
                <div class="repository-stars">Stars: ${repo.stargazers_count}</div>
            </div>
            <button class="delete-btn">
                <svg viewBox="0 0 46 43" xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none">
                    <path stroke="red" stroke-width="4" d="M44 40.5 2 2"/>
                    <path stroke="red" stroke-width="4" d="M2 40.5 44 2"/>
                </svg>
            </button>
        `;

        repoItem.querySelector('.delete-btn').addEventListener('click', () => {
            repositoriesList.removeChild(repoItem);
        });

        repositoriesList.appendChild(repoItem);
    }

    // Обработчик ввода с debounce
    searchInput.addEventListener('input', debounce(async function() {
        const query = this.value.trim();
        if (!query) {
            autocompleteDropdown.style.display = 'none';
            return;
        }

        const repositories = await fetchRepositories(query);
        displayAutocomplete(repositories);
    }, debounceDelay));

    // Скрываем выпадающий список при клике вне его
    document.addEventListener('click', function(event) {
        if (!searchInput.contains(event.target) && !autocompleteDropdown.contains(event.target)) {
            autocompleteDropdown.style.display = 'none';
        }
    });
});