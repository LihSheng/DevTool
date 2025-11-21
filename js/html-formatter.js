// HTML Formatter Tool
class HtmlFormatter {
    constructor() {
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.input = document.getElementById('html-input');
        this.output = document.getElementById('html-output');
        this.formatBtn = document.getElementById('format-html');
        this.minifyBtn = document.getElementById('minify-html');
        this.validateBtn = document.getElementById('validate-html');
        this.clearBtn = document.getElementById('clear-html');
        this.copyBtn = document.getElementById('copy-html');
        this.status = document.getElementById('html-status');
    }

    bindEvents() {
        this.formatBtn.addEventListener('click', () => this.formatHtml());
        this.minifyBtn.addEventListener('click', () => this.minifyHtml());
        this.validateBtn.addEventListener('click', () => this.validateHtml());
        this.clearBtn.addEventListener('click', () => this.clearAll());
        this.copyBtn.addEventListener('click', () => this.copyToClipboard());
    }

    formatHtml() {
        const html = this.input.value.trim();
        
        if (!html) {
            window.notify?.error('Please enter HTML to format');
            return;
        }

        try {
            const formatted = this.beautifyHtml(html);
            this.output.value = formatted;
            window.notify?.success('HTML formatted successfully!');
        } catch (error) {
            window.notify?.error(`Error formatting HTML: ${error.message}`);
            this.output.value = '';
        }
    }

    minifyHtml() {
        const html = this.input.value.trim();
        
        if (!html) {
            window.notify?.error('Please enter HTML to minify');
            return;
        }

        try {
            const minified = this.minify(html);
            this.output.value = minified;
            window.notify?.success('HTML minified successfully!');
        } catch (error) {
            window.notify?.error(`Error minifying HTML: ${error.message}`);
            this.output.value = '';
        }
    }

    validateHtml() {
        const html = this.input.value.trim();
        
        if (!html) {
            window.notify?.error('Please enter HTML to validate');
            return;
        }

        const errors = this.checkHtmlValidity(html);
        
        if (errors.length === 0) {
            window.notify?.success('HTML is valid!');
        } else {
            const errorMsg = errors.join('\n');
            window.notify?.warning(`Found ${errors.length} issue(s):\n${errorMsg}`);
        }
    }

    beautifyHtml(html) {
        let formatted = '';
        let indent = 0;
        const tab = '    ';
        
        // Remove extra whitespace
        html = html.replace(/>\s+</g, '><').trim();
        
        // Split by tags
        const tokens = html.split(/(<[^>]+>)/g).filter(token => token.trim());
        
        tokens.forEach(token => {
            if (token.startsWith('</')) {
                // Closing tag
                indent = Math.max(0, indent - 1);
                formatted += tab.repeat(indent) + token + '\n';
            } else if (token.startsWith('<')) {
                // Opening or self-closing tag
                formatted += tab.repeat(indent) + token + '\n';
                
                // Check if it's not self-closing and not a void element
                if (!token.endsWith('/>') && !this.isVoidElement(token)) {
                    indent++;
                }
            } else {
                // Text content
                const trimmed = token.trim();
                if (trimmed) {
                    formatted += tab.repeat(indent) + trimmed + '\n';
                }
            }
        });
        
        return formatted.trim();
    }

    minify(html) {
        return html
            .replace(/\s+/g, ' ')
            .replace(/>\s+</g, '><')
            .replace(/\s+>/g, '>')
            .replace(/<!--.*?-->/g, '')
            .trim();
    }

    isVoidElement(tag) {
        const voidElements = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 
                             'link', 'meta', 'param', 'source', 'track', 'wbr'];
        const tagName = tag.match(/<(\w+)/);
        return tagName && voidElements.includes(tagName[1].toLowerCase());
    }

    checkHtmlValidity(html) {
        const errors = [];
        const tagStack = [];
        const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
        let match;

        while ((match = tagRegex.exec(html)) !== null) {
            const fullTag = match[0];
            const tagName = match[1].toLowerCase();

            if (fullTag.startsWith('</')) {
                // Closing tag
                if (tagStack.length === 0) {
                    errors.push(`Unexpected closing tag: ${fullTag}`);
                } else {
                    const lastTag = tagStack.pop();
                    if (lastTag !== tagName) {
                        errors.push(`Mismatched tags: expected </${lastTag}>, found ${fullTag}`);
                    }
                }
            } else if (!fullTag.endsWith('/>') && !this.isVoidElement(fullTag)) {
                // Opening tag (not self-closing or void)
                tagStack.push(tagName);
            }
        }

        // Check for unclosed tags
        if (tagStack.length > 0) {
            tagStack.forEach(tag => {
                errors.push(`Unclosed tag: <${tag}>`);
            });
        }

        return errors;
    }

    async copyToClipboard() {
        const text = this.output.value;
        
        if (!text) {
            window.notify?.warning('Nothing to copy');
            return;
        }

        try {
            await navigator.clipboard.writeText(text);
            window.notify?.success('HTML copied to clipboard!');
        } catch (error) {
            // Fallback
            this.output.select();
            document.execCommand('copy');
            window.notify?.success('HTML copied to clipboard!');
        }
    }

    clearAll() {
        this.input.value = '';
        this.output.value = '';
        this.input.focus();
        window.notify?.info('Cleared');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HtmlFormatter();
});
