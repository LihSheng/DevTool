// Markdown Editor with Live Preview
class MarkdownEditor {
    constructor() {
        this.initializeElements();
        this.setupMarked();
        this.bindEvents();
        this.loadSavedContent();
    }

    initializeElements() {
        this.input = document.getElementById('markdown-input');
        this.preview = document.getElementById('markdown-preview');
        this.charCount = document.getElementById('md-char-count');
        this.wordCount = document.getElementById('md-word-count');
        this.lineCount = document.getElementById('md-line-count');
        this.syncScrollToggle = document.getElementById('sync-scroll');
        this.clearBtn = document.getElementById('md-clear');
        this.copyHtmlBtn = document.getElementById('md-copy-html');
        this.downloadBtn = document.getElementById('md-download');
        this.layout = document.querySelector('.markdown-layout');
        this.viewButtons = document.querySelectorAll('.view-btn');
    }

    setupMarked() {
        // Configure marked with highlight.js
        marked.setOptions({
            highlight: function(code, lang) {
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return hljs.highlight(code, { language: lang }).value;
                    } catch (e) {
                        console.error('Highlight error:', e);
                    }
                }
                return hljs.highlightAuto(code).value;
            },
            breaks: true,
            gfm: true
        });
    }

    bindEvents() {
        // Live preview on input
        this.input.addEventListener('input', () => {
            this.updatePreview();
            this.updateCharCount();
            this.saveContent();
        });

        // Sync scroll
        this.input.addEventListener('scroll', () => {
            if (this.syncScrollToggle.checked) {
                this.syncScroll();
            }
        });

        // Toolbar buttons
        document.querySelectorAll('.md-btn[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleToolbarAction(btn.dataset.action);
            });
        });

        // Clear button
        this.clearBtn.addEventListener('click', () => this.clearContent());

        // Copy button
        this.copyHtmlBtn.addEventListener('click', () => this.copyHtml());

        // Download button
        this.downloadBtn.addEventListener('click', () => this.downloadMarkdown());

        // View mode buttons
        this.viewButtons.forEach(btn => {
            btn.addEventListener('click', () => this.switchView(btn.dataset.view));
        });

        // Keyboard shortcuts
        this.input.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key.toLowerCase()) {
                    case 'b':
                        e.preventDefault();
                        this.handleToolbarAction('bold');
                        break;
                    case 'i':
                        e.preventDefault();
                        this.handleToolbarAction('italic');
                        break;
                }
            }
        });
    }

    switchView(view) {
        this.viewButtons.forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`.view-btn[data-view="${view}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        this.layout.classList.remove('editor-only', 'preview-only');
        
        if (view === 'editor') {
            this.layout.classList.add('editor-only');
        } else if (view === 'preview') {
            this.layout.classList.add('preview-only');
        }
        // 'split' view is the default, no class needed
    }

    updatePreview() {
        const markdown = this.input.value;
        
        if (!markdown.trim()) {
            this.preview.innerHTML = `
                <div class="preview-placeholder">
                    <div class="placeholder-icon">📝</div>
                    <p>Start typing to see preview</p>
                </div>
            `;
            return;
        }

        try {
            const html = marked.parse(markdown);
            this.preview.innerHTML = html;
            
            // Re-highlight code blocks
            this.preview.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        } catch (error) {
            this.preview.innerHTML = `<div class="error">Error rendering markdown: ${error.message}</div>`;
        }
    }

    updateCharCount() {
        const text = this.input.value;
        const chars = text.length;
        const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
        const lines = text.split('\n').length;
        
        this.charCount.textContent = `${chars} character${chars !== 1 ? 's' : ''}`;
        if (this.wordCount) this.wordCount.textContent = `${words} word${words !== 1 ? 's' : ''}`;
        if (this.lineCount) this.lineCount.textContent = `${lines} line${lines !== 1 ? 's' : ''}`;
    }

    syncScroll() {
        const scrollPercentage = this.input.scrollTop / (this.input.scrollHeight - this.input.clientHeight);
        this.preview.scrollTop = scrollPercentage * (this.preview.scrollHeight - this.preview.clientHeight);
    }

    handleToolbarAction(action) {
        const start = this.input.selectionStart;
        const end = this.input.selectionEnd;
        const selectedText = this.input.value.substring(start, end);
        let replacement = '';
        let cursorOffset = 0;

        switch(action) {
            case 'bold':
                replacement = `**${selectedText || 'bold text'}**`;
                cursorOffset = selectedText ? 0 : -2;
                break;
            case 'italic':
                replacement = `*${selectedText || 'italic text'}*`;
                cursorOffset = selectedText ? 0 : -1;
                break;
            case 'strikethrough':
                replacement = `~~${selectedText || 'strikethrough'}~~`;
                cursorOffset = selectedText ? 0 : -2;
                break;
            case 'heading':
                replacement = `\n## ${selectedText || 'Heading'}\n`;
                cursorOffset = selectedText ? 0 : -1;
                break;
            case 'link':
                replacement = `[${selectedText || 'link text'}](url)`;
                cursorOffset = selectedText ? -4 : -10;
                break;
            case 'image':
                replacement = `![${selectedText || 'alt text'}](image-url)`;
                cursorOffset = selectedText ? -11 : -21;
                break;
            case 'code':
                replacement = `\n\`\`\`javascript\n${selectedText || 'code here'}\n\`\`\`\n`;
                cursorOffset = selectedText ? 0 : -5;
                break;
            case 'list':
                replacement = `\n- ${selectedText || 'List item'}\n`;
                cursorOffset = selectedText ? 0 : -1;
                break;
            case 'ordered-list':
                replacement = `\n1. ${selectedText || 'List item'}\n`;
                cursorOffset = selectedText ? 0 : -1;
                break;
            case 'checklist':
                replacement = `\n- [ ] ${selectedText || 'Task item'}\n`;
                cursorOffset = selectedText ? 0 : -1;
                break;
            case 'quote':
                replacement = `\n> ${selectedText || 'Quote text'}\n`;
                cursorOffset = selectedText ? 0 : -1;
                break;
            case 'table':
                replacement = `\n| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |\n`;
                cursorOffset = 0;
                break;
            case 'hr':
                replacement = `\n---\n`;
                cursorOffset = 0;
                break;
        }

        this.insertText(replacement, start, end, cursorOffset);
    }

    insertText(text, start, end, cursorOffset) {
        const before = this.input.value.substring(0, start);
        const after = this.input.value.substring(end);
        
        this.input.value = before + text + after;
        
        const newCursorPos = start + text.length + cursorOffset;
        this.input.setSelectionRange(newCursorPos, newCursorPos);
        this.input.focus();
        
        this.updatePreview();
        this.updateCharCount();
        this.saveContent();
    }

    clearContent() {
        if (this.input.value && !confirm('Clear all content?')) {
            return;
        }
        
        this.input.value = '';
        this.updatePreview();
        this.updateCharCount();
        this.saveContent();
        window.notify?.success('Content cleared');
    }

    async copyHtml() {
        const html = this.preview.innerHTML;
        
        if (!html || html.includes('preview-placeholder')) {
            window.notify?.warning('Nothing to copy');
            return;
        }

        try {
            await navigator.clipboard.writeText(html);
            window.notify?.success('HTML copied to clipboard!');
        } catch (error) {
            window.notify?.error('Failed to copy HTML');
        }
    }

    async copyMarkdown() {
        const markdown = this.input.value;
        
        if (!markdown.trim()) {
            window.notify?.warning('Nothing to copy');
            return;
        }

        try {
            await navigator.clipboard.writeText(markdown);
            window.notify?.success('Markdown copied to clipboard!');
        } catch (error) {
            window.notify?.error('Failed to copy markdown');
        }
    }

    downloadMarkdown() {
        const markdown = this.input.value;
        
        if (!markdown.trim()) {
            window.notify?.warning('Nothing to download');
            return;
        }

        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `document-${Date.now()}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        window.notify?.success('Markdown downloaded!');
    }

    saveContent() {
        try {
            localStorage.setItem('markdown-editor-content', this.input.value);
        } catch (e) {
            console.error('Failed to save content:', e);
        }
    }

    loadSavedContent() {
        try {
            const saved = localStorage.getItem('markdown-editor-content');
            if (saved) {
                this.input.value = saved;
                this.updatePreview();
                this.updateCharCount();
            }
        } catch (e) {
            console.error('Failed to load saved content:', e);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for marked and hljs to be available
    if (typeof marked !== 'undefined' && typeof hljs !== 'undefined') {
        new MarkdownEditor();
    } else {
        console.error('Marked or Highlight.js not loaded');
    }
});
