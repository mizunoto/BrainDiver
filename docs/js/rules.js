document.addEventListener('DOMContentLoaded', async () => {
    const rulesMenu = document.getElementById('rules-menu');
    const rulesContentArea = document.getElementById('rules-content');
    let rulesData = [];

    // Function to render content
    const renderContent = (item) => {
        if (!item) {
            rulesContentArea.innerHTML = '<h3>項目が見つかりません</h3><p>選択された項目の詳細情報がありません。</p>';
            return;
        }
        rulesContentArea.innerHTML = `
            <h3>${item.title}</h3>
            <div class="rule-body">${item.content}</div>
        `;
    };

    // Function to handle menu item clicks
    const handleMenuItemClick = (event) => {
        event.preventDefault();
        const sectionId = event.target.dataset.sectionId;

        // Remove 'active' class from all menu items
        rulesMenu.querySelectorAll('a').forEach(link => {
            link.classList.remove('active');
        });
        // Add 'active' class to the clicked item
        event.target.classList.add('active');

        const selectedItem = rulesData.find(item => item.id === sectionId);
        renderContent(selectedItem);
    };

    // Fetch rules data
    try {
        const response = await fetch('/dist/rag_database.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        rulesData = await response.json();

        // Clear loading message and populate menu
        rulesMenu.innerHTML = '';
        rulesData.forEach(item => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `#${item.id}`;
            a.dataset.sectionId = item.id;
            a.textContent = item.title;
            li.appendChild(a);
            rulesMenu.appendChild(li);
        });

        // Add click listeners to menu items
        rulesMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', handleMenuItemClick);
        });

        // Display first item's content by default, or if URL hash exists
        let initialSectionId = window.location.hash.substring(1);
        if (!initialSectionId && rulesData.length > 0) {
            initialSectionId = rulesData[0].id;
        }

        if (initialSectionId) {
            const initialItem = rulesData.find(item => item.id === initialSectionId);
            if (initialItem) {
                renderContent(initialItem);
                // Set active class for the initial item
                rulesMenu.querySelector(`a[data-section-id="${initialSectionId}"]`).classList.add('active');
            } else if (rulesData.length > 0) {
                // Fallback to first item if hash doesn't match
                renderContent(rulesData[0]);
                rulesMenu.querySelector(`a[data-section-id="${rulesData[0].id}"]`).classList.add('active');
            }
        }

    } catch (error) {
        console.error('Failed to load rules data:', error);
        rulesContentArea.innerHTML = '<h3>データの読み込みに失敗しました</h3><p>ルール情報を取得できませんでした。時間をおいて再度お試しください。</p>';
        rulesMenu.innerHTML = '<li>データの読み込みに失敗しました</li>';
    }
});
