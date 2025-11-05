// JSON Formatter functionality
class JSONFormatter {
    constructor() {
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.jsonInput = document.getElementById('json-input');
        this.jsonOutput = document.getElementById('json-output');
        this.formatBtn = document.getElementById('format-json');
        this.minifyBtn = document.getElementById('minify-json');
        this.validateBtn = document.getElementById('validate-json');
        this.clearBtn = document.getElementById('clear-json');
        this.copyBtn = document.getElementById('copy-json');
        this.statusDiv = document.getElementById('json-status');
    }

    bindEvents() {
        this.formatBtn.addEventListener('click', () => this.formatJSON());
        this.minifyBtn.addEventListener('click', () => this.minifyJSON());
        this.validateBtn.addEventListener('click', () => this.validateJSON());
        this.clearBtn.addEventListener('click', () => this.clearAll());
        this.copyBtn.addEventListener('click', () => this.copyToClipboard());
        
        // Auto-format on input (with debounce)
        let timeout;
        this.jsonInput.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => this.autoFormat(), 500);
        });
    }

    formatJSON() {
        const input = this.jsonInput.value.trim();
        if (!input) {
            this.showStatus('Please enter some JSON data', 'error');
            return;
        }

        try {
            const parsed = JSON.parse(input);
            const formatted = JSON.stringify(parsed, null, 2);
            this.jsonOutput.value = formatted;
            this.showStatus('JSON formatted successfully!', 'success');
        } catch (error) {
            this.showStatus(`Invalid JSON: ${error.message}`, 'error');
            this.jsonOutput.value = '';
        }
    }

    minifyJSON() {
        const input = this.jsonInput.value.trim();
        if (!input) {
            this.showStatus('Please enter some JSON data', 'error');
            return;
        }

        try {
            const parsed = JSON.parse(input);
            const minified = JSON.stringify(parsed);
            this.jsonOutput.value = minified;
            this.showStatus('JSON minified successfully!', 'success');
        } catch (error) {
            this.showStatus(`Invalid JSON: ${error.message}`, 'error');
            this.jsonOutput.value = '';
        }
    }

    validateJSON() {
        const input = this.jsonInput.value.trim();
        if (!input) {
            this.showStatus('Please enter some JSON data', 'error');
            return;
        }

        try {
            const parsed = JSON.parse(input);
            const stats = this.getJSONStats(parsed);
            this.showStatus(
                `✅ Valid JSON! Objects: ${stats.objects}, Arrays: ${stats.arrays}, Properties: ${stats.properties}`,
                'success'
            );
        } catch (error) {
            this.showStatus(`❌ Invalid JSON: ${error.message}`, 'error');
        }
    }

    getJSONStats(obj, stats = { objects: 0, arrays: 0, properties: 0 }) {
        if (Array.isArray(obj)) {
            stats.arrays++;
            obj.forEach(item => this.getJSONStats(item, stats));
        } else if (obj !== null && typeof obj === 'object') {
            stats.objects++;
            stats.properties += Object.keys(obj).length;
            Object.values(obj).forEach(value => this.getJSONStats(value, stats));
        }
        return stats;
    }

    autoFormat() {
        const input = this.jsonInput.value.trim();
        if (!input) return;

        try {
            const parsed = JSON.parse(input);
            const formatted = JSON.stringify(parsed, null, 2);
            this.jsonOutput.value = formatted;
            this.hideStatus();
        } catch (error) {
            // Don't show error for auto-format, just clear output
            this.jsonOutput.value = '';
        }
    }

    clearAll() {
        this.jsonInput.value = '';
        this.jsonOutput.value = '';
        this.hideStatus();
        this.jsonInput.focus();
    }

    async copyToClipboard() {
        const output = this.jsonOutput.value;
        if (!output) {
            this.showStatus('Nothing to copy', 'error');
            return;
        }

        try {
            await navigator.clipboard.writeText(output);
            this.showStatus('Copied to clipboard!', 'success');
        } catch (error) {
            // Fallback for older browsers
            this.jsonOutput.select();
            document.execCommand('copy');
            this.showStatus('Copied to clipboard!', 'success');
        }
    }

    showStatus(message, type) {
        this.statusDiv.textContent = message;
        this.statusDiv.className = `status-message ${type}`;
        
        if (type === 'success') {
            setTimeout(() => this.hideStatus(), 3000);
        }
    }

    hideStatus() {
        this.statusDiv.className = 'status-message';
    }
}

// Initialize JSON Formatter when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new JSONFormatter();
});