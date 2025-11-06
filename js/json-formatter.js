// Enhanced JSON Formatter functionality
class JSONFormatter {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.setupEnhancements();
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
        
        // Track state
        this.isValid = false;
        this.currentData = null;
    }

    setupEnhancements() {
        // Add real-time validation indicator
        this.addValidationIndicator();
        
        // Add file upload support
        this.addFileUploadSupport();
        
        // Add keyboard shortcuts
        this.addKeyboardShortcuts();
        
        // Add line numbers (optional)
        this.setupLineNumbers();
    }

    bindEvents() {
        this.formatBtn.addEventListener('click', () => this.formatJSON());
        this.minifyBtn.addEventListener('click', () => this.minifyJSON());
        this.validateBtn.addEventListener('click', () => this.validateJSON());
        this.clearBtn.addEventListener('click', () => this.clearAll());
        this.copyBtn.addEventListener('click', () => this.copyToClipboard());
        
        // Real-time validation with debounce
        let timeout;
        this.jsonInput.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                this.validateRealTime();
                this.autoFormat();
            }, 300);
        });
        
        // Paste event handling
        this.jsonInput.addEventListener('paste', (e) => {
            setTimeout(() => this.handlePaste(), 10);
        });
    }

    formatJSON() {
        const input = this.jsonInput.value.trim();
        if (!input) {
            window.notify?.error('📝 Please enter some JSON data');
            this.jsonInput.focus();
            return;
        }

        try {
            const parsed = JSON.parse(input);
            const formatted = JSON.stringify(parsed, null, 2);
            this.jsonOutput.value = formatted;
            this.currentData = parsed;
            this.isValid = true;
            this.updateValidationIndicator(true);
            
            const stats = this.getJSONStats(parsed);
            window.notify?.success(`✨ JSON formatted! ${stats.objects} objects, ${stats.arrays} arrays, ${stats.properties} properties`);
        } catch (error) {
            this.jsonOutput.value = '';
            this.isValid = false;
            this.updateValidationIndicator(false, error.message);
            window.notify?.error(`❌ Invalid JSON: ${error.message}`);
        }
    }

    minifyJSON() {
        const input = this.jsonInput.value.trim();
        if (!input) {
            window.notify?.error('📝 Please enter some JSON data');
            this.jsonInput.focus();
            return;
        }

        try {
            const parsed = JSON.parse(input);
            const minified = JSON.stringify(parsed);
            this.jsonOutput.value = minified;
            this.currentData = parsed;
            this.isValid = true;
            this.updateValidationIndicator(true);
            
            const originalSize = input.length;
            const minifiedSize = minified.length;
            const savings = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);
            
            window.notify?.success(`🗜️ JSON minified! Saved ${savings}% (${originalSize - minifiedSize} chars)`);
        } catch (error) {
            this.jsonOutput.value = '';
            this.isValid = false;
            this.updateValidationIndicator(false, error.message);
            window.notify?.error(`❌ Invalid JSON: ${error.message}`);
        }
    }

    validateJSON() {
        const input = this.jsonInput.value.trim();
        if (!input) {
            window.notify?.error('📝 Please enter some JSON data');
            this.jsonInput.focus();
            return;
        }

        try {
            const parsed = JSON.parse(input);
            const stats = this.getJSONStats(parsed);
            this.currentData = parsed;
            this.isValid = true;
            this.updateValidationIndicator(true);
            
            const size = new Blob([input]).size;
            const sizeStr = size > 1024 ? `${(size / 1024).toFixed(1)}KB` : `${size}B`;
            
            window.notify?.success(
                `✅ Valid JSON! ${stats.objects} objects, ${stats.arrays} arrays, ${stats.properties} properties (${sizeStr})`,
                6000
            );
        } catch (error) {
            this.isValid = false;
            this.updateValidationIndicator(false, error.message);
            window.notify?.error(`❌ Invalid JSON: ${error.message}`, 8000);
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
            window.notify?.error('📋 Nothing to copy');
            return;
        }

        try {
            await navigator.clipboard.writeText(output);
            const size = output.length;
            const sizeStr = size > 1000 ? `${(size / 1000).toFixed(1)}K` : size;
            window.notify?.success(`📋 Copied ${sizeStr} characters to clipboard!`);
        } catch (error) {
            // Fallback for older browsers
            try {
                this.jsonOutput.select();
                document.execCommand('copy');
                window.notify?.success('📋 Copied to clipboard!');
            } catch (fallbackError) {
                window.notify?.error('❌ Failed to copy to clipboard');
            }
        }
    }

    // Enhanced features
    addValidationIndicator() {
        // Add validation indicator to input
        const indicator = document.createElement('div');
        indicator.className = 'json-validation-indicator';
        indicator.innerHTML = '<span class="validation-icon">⚪</span><span class="validation-text">Ready</span>';
        
        const inputSection = this.jsonInput.parentElement;
        inputSection.appendChild(indicator);
        this.validationIndicator = indicator;
    }
    
    updateValidationIndicator(isValid, errorMessage = '') {
        if (!this.validationIndicator) return;
        
        const icon = this.validationIndicator.querySelector('.validation-icon');
        const text = this.validationIndicator.querySelector('.validation-text');
        
        if (isValid) {
            icon.textContent = '✅';
            text.textContent = 'Valid JSON';
            this.validationIndicator.className = 'json-validation-indicator valid';
        } else if (errorMessage) {
            icon.textContent = '❌';
            text.textContent = 'Invalid JSON';
            this.validationIndicator.className = 'json-validation-indicator invalid';
            this.validationIndicator.title = errorMessage;
        } else {
            icon.textContent = '⚪';
            text.textContent = 'Ready';
            this.validationIndicator.className = 'json-validation-indicator';
        }
    }
    
    addFileUploadSupport() {
        // Add file upload button
        const uploadBtn = document.createElement('button');
        uploadBtn.innerHTML = '📁 Load File';
        uploadBtn.className = 'upload-btn';
        uploadBtn.addEventListener('click', () => this.openFileDialog());
        
        const buttonGroup = this.formatBtn.parentElement;
        buttonGroup.appendChild(uploadBtn);
        
        // Create hidden file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json,.txt';
        fileInput.style.display = 'none';
        fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        document.body.appendChild(fileInput);
        this.fileInput = fileInput;
    }
    
    openFileDialog() {
        this.fileInput.click();
    }
    
    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            this.jsonInput.value = text;
            window.notify?.info(`📁 Loaded file: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
            
            // Auto-validate after loading
            setTimeout(() => {
                this.validateRealTime();
                this.autoFormat();
            }, 100);
        } catch (error) {
            window.notify?.error(`❌ Failed to load file: ${error.message}`);
        }
    }
    
    addKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when JSON formatter is active
            if (!document.getElementById('json-formatter').classList.contains('active')) return;
            
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'Enter':
                        e.preventDefault();
                        this.formatJSON();
                        break;
                    case 'm':
                        e.preventDefault();
                        this.minifyJSON();
                        break;
                    case 'k':
                        e.preventDefault();
                        this.clearAll();
                        break;
                }
            }
        });
    }
    
    setupLineNumbers() {
        // Add line numbers to textareas (optional enhancement)
        this.jsonInput.addEventListener('scroll', () => this.syncLineNumbers());
        this.jsonOutput.addEventListener('scroll', () => this.syncLineNumbers());
    }
    
    validateRealTime() {
        const input = this.jsonInput.value.trim();
        if (!input) {
            this.updateValidationIndicator(false);
            return;
        }
        
        try {
            JSON.parse(input);
            this.updateValidationIndicator(true);
        } catch (error) {
            this.updateValidationIndicator(false, error.message);
        }
    }
    
    handlePaste() {
        // Auto-detect and format pasted JSON
        setTimeout(() => {
            const input = this.jsonInput.value.trim();
            if (input && input.length > 50) { // Only for substantial content
                try {
                    const parsed = JSON.parse(input);
                    window.notify?.info('📋 JSON detected in paste - auto-formatting...', 2000);
                    setTimeout(() => this.formatJSON(), 500);
                } catch (error) {
                    // Not valid JSON, that's okay
                }
            }
        }, 10);
    }
    
    clearAll() {
        this.jsonInput.value = '';
        this.jsonOutput.value = '';
        this.currentData = null;
        this.isValid = false;
        this.updateValidationIndicator(false);
        this.jsonInput.focus();
        window.notify?.info('🗑️ JSON formatter cleared');
    }

    // Legacy methods (kept for compatibility)
    showStatus(message, type) {
        // All notifications now use the global system
        console.log(`Legacy status: ${message} (${type})`);
    }

    hideStatus() {
        // No longer needed
    }
}

// Initialize JSON Formatter when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new JSONFormatter();
});