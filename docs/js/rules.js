// js/rules.js
document.addEventListener('DOMContentLoaded', async () => {
    const rulesMenu = document.getElementById('rules-menu');
    const rulesContent = document.getElementById('rules-content');
    const dataPath = '../dist/rag_database.json'; // Path to the JSON file

    // Function to render Markdown to HTML (simple version)
    function renderMarkdown(markdownText) {
        if (!markdownText) return '';
        // Basic markdown to HTML conversion
        let html = markdownText
            .replace(/^### (.*$)/gim, '<h3>$1</h3>') // H3
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')   // H2
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')    // H1
            .replace(/^- (.*$)/gim, '<li>$1</li>')    // Unordered list
            .replace(/\* (.*$)/gim, '<li>$1</li>')    // Unordered list (asterisk)
            .replace(/(\n|^)(<li>.*<\/li>)+/gim, '<ul>$1</ul>') // Wrap lists
            .replace(/(\r\n|\r|\n){2,}/g, '</p><p>') // Double newlines for paragraphs
            .replace(/(\r\n|\r|\n)/g, '<br>')       // Single newlines for <br>
            .replace(/(<p>)?(<h2>|<h3>|<ul>)/g, '$2') // Remove paragraph tags around headings/lists
            .replace(/(<\/ul>|<\/h2>|<\/h3>)(<\/p>)?/g, '$1'); // Remove paragraph tags around headings/lists

        // Strong emphasis (bold)
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

        // Emphasis (italic)
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/_(.*?)_/g, '<em>$1</em>');
        
        // Code blocks
        html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        return `<p>${html}</p>`;
    }

    try {
        const response = await fetch(dataPath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        rulesMenu.innerHTML = '';

        const appendMenuItem = (parentUl, item, categoryId) => {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = `#${item.id}`;
            link.textContent = item.title;
            link.dataset.categoryId = categoryId;
            link.dataset.itemId = item.id;
            listItem.appendChild(link);
            parentUl.appendChild(listItem);

            link.addEventListener('click', (event) => {
                event.preventDefault();
                displayContent(item.title, item.content);
                // Remove active class from all links
                document.querySelectorAll('#rules-menu a').forEach(a => a.classList.remove('active'));
                // Add active class to the clicked link
                link.classList.add('active');
            });
        };

        const createCategoryMenu = (categoryName, items, categoryId) => {
            const categoryHeading = document.createElement('h4');
            categoryHeading.style.color = 'var(--color-accent-blue)';
            categoryHeading.style.marginTop = '1rem';
            categoryHeading.textContent = categoryName;
            rulesMenu.appendChild(categoryHeading);

            const ul = document.createElement('ul');
            ul.classList.add('nested-menu-list');
            items.forEach(item => appendMenuItem(ul, item, categoryId));
            rulesMenu.appendChild(ul);
        };

        if (data.diver_protocol && Array.isArray(data.diver_protocol)) {
            createCategoryMenu('ダイバーズ・プロトコル', data.diver_protocol, 'diver_protocol');
        } else {
            console.warn("diver_protocol not found or not an array in rag_database.json");
            if (data.rules && Array.isArray(data.rules)) {
                createCategoryMenu('ルール', data.rules, 'general_rules');
            }
        }

        if (data.data_archive && Array.isArray(data.data_archive)) {
            createCategoryMenu('データ・アーカイブ', data.data_archive, 'data_archive');
        } else {
            console.warn("data_archive not found or not an array in rag_database.json");
        }

        // Handle direct URL hash for initial content display
        const hash = window.location.hash.substring(1);
        if (hash) {
            let foundItem = null;
            if (data.diver_protocol) {
                foundItem = data.diver_protocol.find(item => item.id === hash);
            }
            if (!foundItem && data.data_archive) {
                foundItem = data.data_archive.find(item => item.id === hash);
            }
            if (!foundItem && data.rules) {
                foundItem = data.rules.find(item => item.id === hash);
            }

            if (foundItem) {
                displayContent(foundItem.title, foundItem.content);
                const activeLink = document.querySelector(`#rules-menu a[data-item-id="${hash}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                    activeLink.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }

    } catch (error) {
        console.error('Error fetching or parsing rules data:', error);
        rulesMenu.innerHTML = `<p style="color:var(--color-accent-red);">データの読み込みに失敗しました。</p>`;
        rulesContent.innerHTML = `<h2>エラー</h2><p style="color:var(--color-accent-red);">ルールデータの読み込み中に問題が発生しました。コンソールを確認してください。</p>`;
    }

    function displayContent(title, content) {
        rulesContent.innerHTML = `<h2>${title}</h2>${renderMarkdown(content)}`;
        rulesContent.scrollTop = 0; // Scroll to top of content
    }

    // Simple active link highlighting for header nav
    const currentPath = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('header nav ul li a');
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});