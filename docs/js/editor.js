document.addEventListener('DOMContentLoaded', () => {
    const markdownInput = document.getElementById('markdown-input');
    const markdownPreview = document.getElementById('markdown-preview');
    const saveToCookieBtn = document.getElementById('save-to-cookie-btn');
    const downloadMdBtn = document.getElementById('download-md-btn');
    const scenarioSectionsMenu = document.getElementById('scenario-sections-menu');
    const editorSectionTitle = document.getElementById('editor-section-title');

    let currentSection = 'overview'; // Default section

    // --- Cookie Management --- //
    const getCookie = (name) => {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
        return null;
    };

    const setCookie = (name, value, days) => {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=/; SameSite=Lax";
    };

    // --- Markdown Preview (Basic) --- //
    const updatePreview = (markdownText) => {
        // A very basic markdown parser for demonstration.
        // For production, consider a more robust solution or displaying raw text.
        let html = markdownText;

        // Headers (h1-h6)
        html = html.replace(/^###### (.*$)/gim, '<h6>$1</h6>');
        html = html.replace(/^##### (.*$)/gim, '<h5>$1</h5>');
        html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        // Bold
        html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
        html = html.replace(/__(.*?)__/gim, '<strong>$1</strong>');

        // Italic
        html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
        html = html.replace(/_(.*?)_/gim, '<em>$1</em>');

        // Unordered lists
        html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');

        // Ordered lists (simple, assumes sequential numbering)
        html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>){2,}/gim, '<ol>$&</ol>'); // This is very basic and won't correctly group complex lists.

        // Code blocks (simple pre-wrap, no syntax highlighting)
        html = html.replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>');
        html = html.replace(/`(.*?)`/gim, '<code>$1</code>');

        // Basic paragraphs for lines not matched by other rules
        html = html.split(/\n\n/).map(para => {
            if (!para.startsWith('<h') && !para.startsWith('<ul') && !para.startsWith('<ol') && !para.startsWith('<pre') && para.trim() !== '') {
                return `<p>${para}</p>`;
            }
            return para;
        }).join('');

        markdownPreview.innerHTML = html;
    };

    // --- Event Listeners --- //

    // Update preview on input change
    markdownInput.addEventListener('input', () => {
        updatePreview(markdownInput.value);
    });

    // Save content to cookie
    saveToCookieBtn.addEventListener('click', () => {
        setCookie(`scenario_section_${currentSection}`, markdownInput.value, 30);
        alert(`${editorSectionTitle.textContent} の内容をCookieに保存しました！`);
    });

    // Download markdown file
    downloadMdBtn.addEventListener('click', () => {
        const content = markdownInput.value;
        const filename = `scenario_${currentSection}.md`;
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // Section menu click handler
    scenarioSectionsMenu.addEventListener('click', (event) => {
        if (event.target.tagName === 'A') {
            event.preventDefault();

            // Save current content before switching
            setCookie(`scenario_section_${currentSection}`, markdownInput.value, 30);

            // Update active class for menu items
            scenarioSectionsMenu.querySelectorAll('a').forEach(link => {
                link.classList.remove('active');
            });
            event.target.classList.add('active');

            // Load new section
            currentSection = event.target.dataset.section;
            editorSectionTitle.textContent = event.target.textContent;
            const savedContent = getCookie(`scenario_section_${currentSection}`);
            markdownInput.value = savedContent || '';
            updatePreview(markdownInput.value);
        }
    });

    // --- Initial Load --- //
    const loadInitialContent = () => {
        // Set initial active menu item
        const initialLink = scenarioSectionsMenu.querySelector(`a[data-section="${currentSection}"]`);
        if (initialLink) {
            initialLink.classList.add('active');
            editorSectionTitle.textContent = initialLink.textContent;
        }

        // Load content for the initial section
        const savedContent = getCookie(`scenario_section_${currentSection}`);
        markdownInput.value = savedContent || `# ${editorSectionTitle.textContent}\n\nこのセクションのシナリオ内容をここに記述します。`;
        updatePreview(markdownInput.value);
    };

    loadInitialContent();
});
