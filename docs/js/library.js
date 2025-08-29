document.addEventListener('DOMContentLoaded', () => {
    const scenarioListMenu = document.getElementById('scenario-list-menu');
    const scenarioDetailsContent = document.getElementById('scenario-details-content');

    // Dummy Scenario Data (replace with actual fetch if a JSON endpoint exists)
    const scenarios = [
        {
            id: 'shattered-mirror',
            title: 'シャッタード・ミラー',
            author: 'AI-GM',
            tags: ['探索', 'ハッキング', '企業陰謀'],
            summary: '巨大企業「サイバーダイン」のAIに異常が発生し、都市のシステムが麻痺寸前。プレイヤーはダイバーとして、AIの深層意識にダイブし、その原因を探る。しかし、そこには予想だにしない真実が隠されていた...', 
            difficulty: '中級',
            players: '2-4人',
            time: '3-4時間'
        },
        {
            id: 'neon-echo',
            title: 'ネオン・エコー',
            author: 'ユリコ',
            tags: ['謎解き', '追跡', '過去の遺産'],
            summary: '廃墟となった旧市街の奥深くで、失われた技術の痕跡が発見される。それは、かつて世界を揺るがした伝説のハッカー「ゴースト」の残したデータだった。プレイヤーはゴーストの足跡を追い、ネオンの光に埋もれた過去の真実を解き明かす。',
            difficulty: '上級',
            players: '3-5人',
            time: '4-5時間'
        },
        {
            id: 'ghost-in-the-wire',
            title: 'ワイヤーの亡霊',
            author: 'システムAI',
            tags: ['戦闘', '潜入', 'データ奪取'],
            summary: 'とある企業の重要データサーバーに侵入し、機密情報を奪取するミッション。しかし、そのサーバーは強力なAIセキュリティに守られ、さらに「亡霊」と噂される謎の存在が徘徊しているという。ステルスか、それとも力押しで突破するか、選択はプレイヤーに委ねられる。',
            difficulty: '中級',
            players: '3人',
            time: '2-3時間'
        }
    ];

    // Function to render scenario details
    const renderScenarioDetails = (scenario) => {
        if (!scenario) {
            scenarioDetailsContent.innerHTML = '<h3>シナリオが見つかりません</h3><p>選択されたシナリオの詳細情報がありません。</p>';
            return;
        }

        scenarioDetailsContent.innerHTML = `
            <h3>${scenario.title}</h3>
            <p><strong>作者:</strong> ${scenario.author}</p>
            <p><strong>タグ:</strong> ${scenario.tags.map(tag => `<span class="tag">${tag}</span>`).join(', ')}</p>
            <p><strong>難易度:</strong> ${scenario.difficulty}</p>
            <p><strong>推奨プレイヤー数:</strong> ${scenario.players}</p>
            <p><strong>プレイ時間:</strong> ${scenario.time}</p>
            <h4>概要:</h4>
            <p>${scenario.summary}</p>
            <!-- Add more details as needed -->
        `;
    };

    // Function to handle menu item clicks
    const handleMenuItemClick = (event) => {
        event.preventDefault();
        const scenarioId = event.target.dataset.scenarioId;

        // Remove 'active' class from all menu items
        scenarioListMenu.querySelectorAll('a').forEach(link => {
            link.classList.remove('active');
        });
        // Add 'active' class to the clicked item
        event.target.classList.add('active');

        const selectedScenario = scenarios.find(scenario => scenario.id === scenarioId);
        renderScenarioDetails(selectedScenario);
    };

    // Populate menu and set up listeners
    const initializePage = () => {
        scenarioListMenu.innerHTML = ''; // Clear loading message

        scenarios.forEach(scenario => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `#${scenario.id}`;
            a.dataset.scenarioId = scenario.id;
            a.textContent = scenario.title;
            li.appendChild(a);
            scenarioListMenu.appendChild(li);
        });

        // Add click listeners to menu items
        scenarioListMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', handleMenuItemClick);
        });

        // Display first scenario's content by default, or if URL hash exists
        let initialScenarioId = window.location.hash.substring(1);
        if (!initialScenarioId && scenarios.length > 0) {
            initialScenarioId = scenarios[0].id;
        }

        if (initialScenarioId) {
            const initialScenario = scenarios.find(scenario => scenario.id === initialScenarioId);
            if (initialScenario) {
                renderScenarioDetails(initialScenario);
                scenarioListMenu.querySelector(`a[data-scenario-id="${initialScenarioId}"]`).classList.add('active');
            } else if (scenarios.length > 0) {
                // Fallback to first scenario if hash doesn't match
                renderScenarioDetails(scenarios[0]);
                scenarioListMenu.querySelector(`a[data-scenario-id="${scenarios[0].id}"]`).classList.add('active');
            }
        }
    };

    initializePage();
});
