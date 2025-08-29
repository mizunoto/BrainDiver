// js/editor.js
document.addEventListener('DOMContentLoaded', async () => {
    const editorMenu = document.getElementById('editor-menu');
    const markdownEditor = document.getElementById('markdown-editor');
    const loadCookieButton = document.getElementById('load-cookie-button');
    const saveCookieButton = document.getElementById('save-cookie-button');
    const downloadMdButton = document.getElementById('download-md-button');
    const dataPath = '/dist/rag_database.json'; // Path to the JSON file
    const editorCookieName = 'brain_diver_editor_content';

    // Helper function to insert text at cursor position in textarea
    function insertTextAtCursor(textarea, text) {
        let start = textarea.selectionStart;
        let end = textarea.selectionEnd;
        let value = textarea.value;
        textarea.value = value.substring(0, start) + text + value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
        textarea.focus();
    }

    // --- Cookie Management ---
    function saveContentToCookie() {
        try {
            document.cookie = `${editorCookieName}=${encodeURIComponent(markdownEditor.value)}; Max-Age=${60 * 60 * 24 * 30}; path=/`; // 30 days
            alert('内容をCookieに保存しました！');
        } catch (e) {
            console.error('Failed to save to cookie:', e);
            alert('Cookieへの保存に失敗しました。');
        }
    }

    function loadContentFromCookie() {
        const name = editorCookieName + '=';
        const decodedCookie = decodeURIComponent(document.cookie);
        const ca = decodedCookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) === 0) {
                markdownEditor.value = c.substring(name.length, c.length);
                alert('Cookieから内容を読み込みました！');
                return;
            }
        }
        alert('保存された内容がありません。');
    }

    // --- Markdown Download ---
    function downloadMarkdown() {
        const content = markdownEditor.value;
        if (!content) {
            alert('エディタに内容がありません。');
            return;
        }
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'brain_diver_scenario.md';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }

    // --- Menu Generation ---
    async function loadTemplateMenu() {
        try {
            const response = await fetch(dataPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            editorMenu.innerHTML = ''; // Clear loading message

            const createNestedList = (obj, parentUl) => {
                for (const key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        const item = obj[key];
                        const listItem = document.createElement('li');
                        const itemSpan = document.createElement('span');
                        itemSpan.textContent = key;
                        listItem.appendChild(itemSpan);

                        if (typeof item === 'object' && item !== null && !item.content && !item.summary) {
                            // This is a category, make it collapsible
                            itemSpan.classList.add('toggle-category');
                            const toggleIcon = document.createElement('span');
                            toggleIcon.classList.add('toggle-icon');
                            toggleIcon.textContent = '▶'; // Right-pointing triangle
                            itemSpan.prepend(toggleIcon);

                            const nestedUl = document.createElement('ul');
                            nestedUl.classList.add('nested'); // Hidden by default
                            createNestedList(item, nestedUl);
                            listItem.appendChild(nestedUl);

                            itemSpan.addEventListener('click', () => {
                                nestedUl.style.display = nestedUl.style.display === 'block' ? 'none' : 'block';
                                toggleIcon.textContent = nestedUl.style.display === 'block' ? '▼' : '▶';
                                listItem.classList.toggle('active-category', nestedUl.style.display === 'block');
                            });
                        } else {
                            // This is a content item
                            itemSpan.classList.add('content-item');
                            itemSpan.dataset.key = key; // Store key for identification if needed
                            itemSpan.addEventListener('click', () => {
                                const contentToInsert = item.content || item.summary || '';
                                if (contentToInsert) {
                                    insertTextAtCursor(markdownEditor, `\n\n## ${item.title || key}\n\n${contentToInsert}\n\n`);
                                    document.querySelectorAll('.editor-menu-list .content-item').forEach(el => el.classList.remove('active'));
                                    itemSpan.classList.add('active'); // Highlight active content item
                                } else {
                                    alert('挿入するコンテンツが見つかりませんでした。');
                                }
                            });
                        }
                        parentUl.appendChild(listItem);
                    }
                }
            };

            const rootUl = document.createElement('ul');
            const editorTemplates = {};
            if (data.diver_protocol) {
                editorTemplates['ダイバーズ・プロトコル'] = data.diver_protocol.reduce((acc, curr) => {
                    acc[curr.title] = curr;
                    return acc;
                }, {});
            }
            if (data.data_archive) {
                editorTemplates['データ・アーカイブ'] = data.data_archive.reduce((acc, curr) => {
                    acc[curr.title] = curr;
                    return acc;
                }, {});
            }
            if (data.scenarios) {
                editorTemplates['シナリオ例'] = data.scenarios.reduce((acc, curr) => {
                    acc[curr.title] = curr;
                    return acc;
                }, {});
            }

            createNestedList(editorTemplates, rootUl);
            editorMenu.appendChild(rootUl);

        } catch (error) {
            console.error('Error fetching or parsing template data:', error);
            editorMenu.innerHTML = `<p style="color:var(--color-accent-red);">テンプレートの読み込みに失敗しました。</p>`;
        }
    }

    // --- Event Listeners ---
    saveCookieButton.addEventListener('click', saveContentToCookie);
    loadCookieButton.addEventListener('click', loadContentFromCookie);
    downloadMdButton.addEventListener('click', downloadMarkdown);

    // Initial load for editor
    loadTemplateMenu();

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
