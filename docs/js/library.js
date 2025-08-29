// js/library.js
document.addEventListener('DOMContentLoaded', async () => {
    const scenarioMenu = document.getElementById('scenario-menu');
    const scenarioContent = document.getElementById('scenario-content');
    const dataPath = '../dist/rag_database.json'; // Path to the JSON file

    function renderMarkdown(markdownText) {
        if (!markdownText) return '';
        let html = markdownText
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^- (.*$)/gim, '<li>$1</li>')
            .replace(/\* (.*$)/gim, '<li>$1</li>')
            .replace(/(\n|^)(<li>.*<\/li>)+/gim, '<ul>$1</ul>')
            .replace(/(\r\n|\r|\n){2,}/g, '</p><p>')
            .replace(/(\r\n|\r|\n)/g, '<br>')
            .replace(/(<p>)?(<h2>|<h3>|<ul>)/g, '$2')
            .replace(/(<\/ul>|<\/h2>|<\/h3>)(<\/p>)?/g, '$1');

        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/_(.*?)_/g, '<em>$1</em>');
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

        const scenarios = data.scenarios || [];

        scenarioMenu.innerHTML = ''; // Clear loading message

        if (scenarios.length === 0) {
            scenarioMenu.innerHTML = `<p>現在、利用可能なシナリオはありません。</p>`;
            return;
        }

        const ul = document.createElement('ul');
        scenarios.forEach(scenario => {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = `#${scenario.id}`;
            link.textContent = scenario.title;
            link.dataset.scenarioId = scenario.id;
            listItem.appendChild(link);
            ul.appendChild(listItem);

            link.addEventListener('click', (event) => {
                event.preventDefault();
                displayScenario(scenario);
                // Remove active class from all links
                document.querySelectorAll('#scenario-menu a').forEach(a => a.classList.remove('active'));
                // Add active class to the clicked link
                link.classList.add('active');
            });
        });
        scenarioMenu.appendChild(ul);

        // Handle direct URL hash for initial content display
        const hash = window.location.hash.substring(1);
        if (hash) {
            const foundScenario = scenarios.find(s => s.id === hash);
            if (foundScenario) {
                displayScenario(foundScenario);
                const activeLink = document.querySelector(`#scenario-menu a[data-scenario-id="${hash}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                    activeLink.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }

    } catch (error) {
        console.error('Error fetching or parsing scenario data:', error);
        scenarioMenu.innerHTML = `<p style="color:var(--color-accent-red);">データの読み込みに失敗しました。</p>`;
        scenarioContent.innerHTML = `<h2>エラー</h2><p style="color:var(--color-accent-red);">シナリオデータの読み込み中に問題が発生しました。コンソールを確認してください。</p>`;
    }

    function displayScenario(scenario) {
        scenarioContent.innerHTML = `
            <h2>${scenario.title}</h2>
            ${scenario.subtitle ? `<h3>${scenario.subtitle}</h3>` : ''}
            <p><strong>推奨PC数:</strong> ${scenario.players || '未定'}</p>
            <p><strong>所要時間:</strong> ${scenario.play_time || '未定'}</p>
            <h3>概要</h3>
            ${renderMarkdown(scenario.summary || '概要がありません。')}
            ${scenario.tags ? `<p><strong>タグ:</strong> ${scenario.tags.map(tag => `<code>${tag}</code>`).join(', ')}</p>` : ''}
            ${scenario.details ? `<p>詳細な情報はこのシナリオをダウンロードするか、他の場所で参照してください。</p>` : ''}
        `;
        scenarioContent.scrollTop = 0; // Scroll to top of content
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