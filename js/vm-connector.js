// VM File Connector
class VMConnector {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.loadDefaults();
    }

    initializeElements() {
        this.vmHostInput = document.getElementById('vm-host');
        this.vmUsernameInput = document.getElementById('vm-username');
        this.vmPasswordInput = document.getElementById('vm-password');
        this.vmPortInput = document.getElementById('vm-port');
        this.filePathInput = document.getElementById('vm-file-path');
        this.connectBtn = document.getElementById('connect-vm');
        this.reloadDefaultsBtn = document.getElementById('reload-defaults');
        this.toggleSettingsBtn = document.getElementById('toggle-vm-settings');
        this.settingsForm = document.getElementById('vm-settings-form');
        this.connectionInfo = document.getElementById('connection-info');
        this.statusDiv = document.getElementById('vm-status');
        this.fileContentDiv = document.getElementById('vm-file-content');

        // File browser elements
        this.browserModeToggle = document.getElementById('browser-mode-toggle');
        this.fileBrowserSection = document.getElementById('file-browser-section');
        this.manualPathSection = document.getElementById('manual-path-section');
        this.currentDirectoryInput = document.getElementById('current-directory');
        this.browseDirectoryBtn = document.getElementById('browse-directory');
        this.fileBrowser = document.getElementById('file-browser');

        // Navigation history elements
        this.navBackBtn = document.getElementById('nav-back');
        this.navForwardBtn = document.getElementById('nav-forward');

        // Preview elements
        this.previewTitle = document.getElementById('preview-title');
        this.previewActions = document.getElementById('preview-actions');

        // Track state
        this.settingsVisible = false;
        this.hasDefaults = false;
        this.browserMode = true;
        this.currentPath = '/';
        this.selectedFilePath = '';
        this.currentFileContent = '';

        // Navigation history
        this.pathHistory = ['/'];
        this.historyIndex = 0;
        
        // Initialize navigation buttons
        this.updateNavigationButtons();
    }

    bindEvents() {
        this.reloadDefaultsBtn.addEventListener('click', () => this.loadDefaults());
        this.toggleSettingsBtn.addEventListener('click', () => this.toggleSettings());
        this.browserModeToggle.addEventListener('change', () => this.toggleBrowserMode());
        this.browseDirectoryBtn.addEventListener('click', () => this.browseDirectory());
        this.navBackBtn.addEventListener('click', () => this.navigateBack());
        this.navForwardBtn.addEventListener('click', () => this.navigateForward());

        // Manual mode connect button
        if (this.connectBtn) {
            this.connectBtn.addEventListener('click', () => this.getFileFromVM());
        }

        // Allow Enter key to trigger actions
        [this.vmHostInput, this.vmUsernameInput, this.vmPasswordInput].forEach(input => {
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.browseDirectory();
                    }
                });
            }
        });

        if (this.filePathInput) {
            this.filePathInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.getFileFromVM();
                }
            });
        }

        this.currentDirectoryInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.browseDirectory();
            }
        });
    }

    async getFileFromVM() {
        let filePath;

        if (this.browserMode) {
            filePath = this.selectedFilePath;
            if (!filePath) {
                this.showStatus('Please select a file from the browser', 'error');
                return;
            }
        } else {
            filePath = this.filePathInput.value.trim();
            if (!filePath) {
                this.showStatus('Please enter a file path', 'error');
                return;
            }
        }

        // Prepare request payload
        const requestData = {
            filePath: filePath,
            useDefaults: !this.settingsVisible && this.hasDefaults
        };

        // If settings are visible, include custom VM config
        if (this.settingsVisible || !this.hasDefaults) {
            const vmConfig = {
                host: this.vmHostInput.value.trim(),
                username: this.vmUsernameInput.value.trim(),
                password: this.vmPasswordInput.value,
                port: parseInt(this.vmPortInput.value) || 22
            };

            // Validation for custom settings
            if (!vmConfig.host || !vmConfig.username || !vmConfig.password) {
                this.showStatus('Please fill in all required VM connection fields', 'error');
                return;
            }

            requestData.vmConfig = vmConfig;
        }

        this.showStatus('Connecting to VM...', 'info');
        this.connectBtn.disabled = true;

        try {
            const response = await fetch('/api/vm-file', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            const result = await response.json();

            if (response.ok) {
                this.displayFileContent(result.content, filePath);
                this.showStatus(`Successfully retrieved file: ${filePath}`, 'success');
            } else {
                this.showStatus(`Error: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showStatus(`Connection failed: ${error.message}`, 'error');
        } finally {
            this.connectBtn.disabled = false;
        }
    }

    displayFileContent(content, filePath) {
        const fileExtension = filePath.split('.').pop().toLowerCase();

        // Determine content type for syntax highlighting
        let language = 'text';
        if (['js', 'javascript'].includes(fileExtension)) language = 'javascript';
        else if (['json'].includes(fileExtension)) language = 'json';
        else if (['php'].includes(fileExtension)) language = 'php';
        else if (['py', 'python'].includes(fileExtension)) language = 'python';
        else if (['sql'].includes(fileExtension)) language = 'sql';
        else if (['log'].includes(fileExtension)) language = 'log';

        this.fileContentDiv.innerHTML = `
            <div class="file-header">
                <h4>📁 ${filePath}</h4>
                <div class="file-actions">
                    <button id="copy-file-content" class="copy-btn">📋 Copy</button>
                    <button id="download-file" class="download-btn">💾 Download</button>
                </div>
            </div>
            <pre class="file-content ${language}"><code>${this.escapeHtml(content)}</code></pre>
        `;

        // Add event listeners for actions
        document.getElementById('copy-file-content').addEventListener('click', () => {
            this.copyToClipboard(content);
        });

        document.getElementById('download-file').addEventListener('click', () => {
            this.downloadFile(content, filePath.split('/').pop());
        });
    }

    async copyToClipboard(content) {
        try {
            await navigator.clipboard.writeText(content);
            window.notify.success('📋 File content copied to clipboard!');
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = content;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            window.notify.success('📋 File content copied to clipboard!');
        }
    }

    downloadFile(content, filename) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        window.notify.success(`💾 File downloaded: ${filename}`);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showStatus(message, type) {
        // Use global notification system
        if (window.notify) {
            switch (type) {
                case 'success':
                    window.notify.success(message);
                    break;
                case 'error':
                    window.notify.error(message);
                    break;
                case 'warning':
                    window.notify.warning(message);
                    break;
                default:
                    window.notify.info(message);
            }
        } else {
            // Fallback to old system if notifications not loaded
            this.statusDiv.textContent = message;
            this.statusDiv.className = `status-message ${type}`;
            if (type === 'success') {
                setTimeout(() => this.hideStatus(), 3000);
            }
        }
    }

    hideStatus() {
        this.statusDiv.className = 'status-message';
    }

    async loadDefaults() {
        try {
            const response = await fetch('/api/vm-defaults');
            if (response.ok) {
                const defaults = await response.json();

                // Set default values from .env
                this.vmHostInput.value = defaults.host;
                this.vmPortInput.value = defaults.port;
                this.vmUsernameInput.value = defaults.username;
                this.filePathInput.value = defaults.defaultFilePath;

                // Update connection status
                this.hasDefaults = !!(defaults.host && defaults.username);
                this.updateConnectionStatus(defaults);

                // Show status if defaults were loaded
                if (defaults.host) {
                    this.showStatus('Default VM settings loaded from configuration', 'info');
                    setTimeout(() => this.hideStatus(), 2000);
                }
            }
        } catch (error) {
            console.log('Could not load default VM settings:', error.message);
            this.hasDefaults = false;
            this.updateConnectionStatus(null);
        }
    }

    toggleSettings() {
        this.settingsVisible = !this.settingsVisible;

        if (this.settingsVisible) {
            this.settingsForm.classList.remove('hidden');
            this.toggleSettingsBtn.textContent = '🔒 Hide Settings';
            this.toggleSettingsBtn.classList.add('active');
        } else {
            this.settingsForm.classList.add('hidden');
            this.toggleSettingsBtn.textContent = '⚙️ Show Settings';
            this.toggleSettingsBtn.classList.remove('active');
        }
    }

    updateConnectionStatus(defaults) {
        if (defaults && defaults.host) {
            this.connectionInfo.innerHTML = `
                <strong>Connected to:</strong> ${defaults.username}@${defaults.host}:${defaults.port}
                <br><small>Using environment configuration</small>
            `;
        } else {
            this.connectionInfo.textContent = 'No default configuration found - please configure manually';
        }
    }

    toggleBrowserMode() {
        this.browserMode = this.browserModeToggle.checked;

        if (this.browserMode) {
            this.fileBrowserSection.classList.remove('hidden');
            this.manualPathSection.classList.add('hidden');
            this.connectBtn.textContent = '🔗 Get Selected File';
        } else {
            this.fileBrowserSection.classList.add('hidden');
            this.manualPathSection.classList.remove('hidden');
            this.connectBtn.textContent = '🔗 Connect & Get File';
        }
    }

    async browseDirectory() {
        const directoryPath = this.currentDirectoryInput.value.trim() || '/';

        this.showStatus('Loading directory...', 'info');
        this.browseDirectoryBtn.disabled = true;

        try {
            const requestData = {
                directoryPath: directoryPath,
                useDefaults: !this.settingsVisible && this.hasDefaults
            };

            // If settings are visible, include custom VM config
            if (this.settingsVisible || !this.hasDefaults) {
                const vmConfig = {
                    host: this.vmHostInput.value.trim(),
                    username: this.vmUsernameInput.value.trim(),
                    password: this.vmPasswordInput.value,
                    port: parseInt(this.vmPortInput.value) || 22
                };

                if (!vmConfig.host || !vmConfig.username || !vmConfig.password) {
                    this.showStatus('Please configure VM connection settings first', 'error');
                    return;
                }

                requestData.vmConfig = vmConfig;
            }

            const response = await fetch('/api/vm-browse', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            const result = await response.json();

            if (response.ok) {
                this.displayDirectoryContents(result.path, result.contents);
                this.addToHistory(result.path);
                this.currentPath = result.path;
                this.showStatus(`Loaded directory: ${result.path}`, 'success');
            } else {
                this.showStatus(`Error: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showStatus(`Failed to browse directory: ${error.message}`, 'error');
        } finally {
            this.browseDirectoryBtn.disabled = false;
        }
    }

    displayDirectoryContents(path, contents) {
        if (!contents || contents.length === 0) {
            this.fileBrowser.innerHTML = '<div class="browser-placeholder">Directory is empty</div>';
            return;
        }

        let html = '<div class="file-list">';

        // Add parent directory link if not at root
        if (path !== '/') {
            const parentPath = path.split('/').slice(0, -1).join('/') || '/';
            html += `
                <div class="file-item directory parent-dir" data-path="${parentPath}">
                    <span class="file-icon">📁</span>
                    <span class="file-name">..</span>
                    <span class="file-info">Parent Directory</span>
                </div>
            `;
        }

        // Add directory contents
        contents.forEach(item => {
            const fullPath = path.endsWith('/') ? path + item.name : path + '/' + item.name;
            const icon = item.isDirectory ? '📁' : this.getFileIcon(item.name);
            const itemClass = item.isDirectory ? 'directory' : 'file';
            const size = item.isFile ? this.formatFileSize(item.size) : '';
            const modified = new Date(item.modified).toLocaleDateString();

            html += `
                <div class="file-item ${itemClass}" data-path="${fullPath}" data-is-file="${item.isFile}">
                    <span class="file-icon">${icon}</span>
                    <span class="file-name">${item.name}</span>
                    <span class="file-info">${size} ${modified}</span>
                </div>
            `;
        });

        html += '</div>';
        this.fileBrowser.innerHTML = html;

        // Add click event listeners
        this.fileBrowser.querySelectorAll('.file-item').forEach(item => {
            item.addEventListener('click', () => this.handleFileItemClick(item));
        });
    }

    handleFileItemClick(item) {
        const path = item.dataset.path;
        const isFile = item.dataset.isFile === 'true';

        if (isFile) {
            // Select file
            this.selectedFilePath = path;

            // Update visual selection
            this.fileBrowser.querySelectorAll('.file-item').forEach(el => el.classList.remove('selected'));
            item.classList.add('selected');

            // Auto-preview the file
            this.previewFile(path);

            this.showStatus(`Selected file: ${path}`, 'info');
        } else {
            // Navigate to directory
            this.currentDirectoryInput.value = path;
            this.browseDirectory(); // This will automatically add to history
        }
    }

    async previewFile(filePath) {
        this.previewTitle.textContent = `Loading ${filePath.split('/').pop()}...`;
        this.previewActions.classList.add('hidden');

        try {
            const requestData = {
                filePath: filePath,
                useDefaults: !this.settingsVisible && this.hasDefaults
            };

            // If settings are visible, include custom VM config
            if (this.settingsVisible || !this.hasDefaults) {
                const vmConfig = {
                    host: this.vmHostInput.value.trim(),
                    username: this.vmUsernameInput.value.trim(),
                    password: this.vmPasswordInput.value,
                    port: parseInt(this.vmPortInput.value) || 22
                };

                if (!vmConfig.host || !vmConfig.username || !vmConfig.password) {
                    this.showPreviewError('VM connection not configured');
                    return;
                }

                requestData.vmConfig = vmConfig;
            }

            const response = await fetch('/api/vm-file', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            const result = await response.json();

            if (response.ok) {
                this.displayFilePreview(result.content, filePath);
                this.currentFileContent = result.content;
                this.showStatus(`Loaded file: ${filePath}`, 'success');
            } else {
                this.showPreviewError(`Error: ${result.error}`);
                this.showStatus(`Error loading file: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showPreviewError(`Failed to load file: ${error.message}`);
            this.showStatus(`Failed to load file: ${error.message}`, 'error');
        }
    }

    displayFilePreview(content, filePath) {
        const fileName = filePath.split('/').pop();
        const fileExtension = fileName.split('.').pop().toLowerCase();

        // Determine content type for syntax highlighting
        let language = 'text';
        if (['js', 'javascript'].includes(fileExtension)) language = 'javascript';
        else if (['json'].includes(fileExtension)) language = 'json';
        else if (['php'].includes(fileExtension)) language = 'php';
        else if (['py', 'python'].includes(fileExtension)) language = 'python';
        else if (['sql'].includes(fileExtension)) language = 'sql';
        else if (['log'].includes(fileExtension)) language = 'log';

        this.previewTitle.textContent = `📄 ${fileName}`;
        this.previewActions.classList.remove('hidden');

        this.fileContentDiv.innerHTML = `
            <pre class="file-content-preview ${language}"><code>${this.escapeHtml(content)}</code></pre>
        `;

        // Add event listeners for preview actions
        document.getElementById('copy-file-content').addEventListener('click', () => {
            this.copyToClipboard(this.currentFileContent);
        });

        document.getElementById('download-file').addEventListener('click', () => {
            this.downloadFile(this.currentFileContent, fileName);
        });
    }

    showPreviewError(message) {
        this.previewTitle.textContent = '❌ Error';
        this.previewActions.classList.add('hidden');
        this.fileContentDiv.innerHTML = `
            <div class="preview-error">
                <div class="error-icon">⚠️</div>
                <p>${message}</p>
            </div>
        `;
    }

    getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const iconMap = {
            'log': '📄',
            'json': '📋',
            'js': '📜',
            'php': '🐘',
            'py': '🐍',
            'sql': '🗃️',
            'txt': '📝',
            'md': '📖',
            'yml': '⚙️',
            'yaml': '⚙️',
            'xml': '📰',
            'html': '🌐',
            'css': '🎨',
            'zip': '📦',
            'tar': '📦',
            'gz': '📦'
        };
        return iconMap[ext] || '📄';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    clearForm() {
        this.vmHostInput.value = '';
        this.vmUsernameInput.value = '';
        this.vmPasswordInput.value = '';
        this.vmPortInput.value = '22';
        if (this.filePathInput) this.filePathInput.value = '';
        this.currentDirectoryInput.value = '/';
        this.selectedFilePath = '';
        this.currentFileContent = '';

        // Reset file browser
        this.fileBrowser.innerHTML = '<div class="browser-placeholder">Click 📂 to explore directories</div>';

        // Reset preview panel
        this.previewTitle.textContent = 'Select a file to preview';
        this.previewActions.classList.add('hidden');
        this.fileContentDiv.innerHTML = `
            <div class="preview-placeholder">
                <div class="placeholder-icon">📄</div>
                <p>No file selected</p>
                <small>Browse and click on a file to view its contents</small>
            </div>
        `;

        this.hideStatus();
        this.showStatus('Form cleared', 'info');
        setTimeout(() => this.hideStatus(), 1500);
    }

    // Navigation History Methods
    addToHistory(path) {
        // Don't add if it's the same as current path
        if (this.pathHistory[this.historyIndex] === path) {
            return;
        }

        // Remove any forward history when navigating to a new path
        this.pathHistory = this.pathHistory.slice(0, this.historyIndex + 1);
        
        // Add new path to history
        this.pathHistory.push(path);
        this.historyIndex = this.pathHistory.length - 1;
        
        // Update button states
        this.updateNavigationButtons();
    }

    navigateBack() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const path = this.pathHistory[this.historyIndex];
            this.navigateToPath(path);
        }
    }

    navigateForward() {
        if (this.historyIndex < this.pathHistory.length - 1) {
            this.historyIndex++;
            const path = this.pathHistory[this.historyIndex];
            this.navigateToPath(path);
        }
    }

    async navigateToPath(path) {
        // Update the input field
        this.currentDirectoryInput.value = path;
        
        // Browse to the path without adding to history (to avoid infinite loop)
        await this.browseDirectoryWithoutHistory(path);
        
        // Update button states
        this.updateNavigationButtons();
    }

    async browseDirectoryWithoutHistory(directoryPath) {
        this.showStatus('Loading directory...', 'info');
        this.browseDirectoryBtn.disabled = true;

        try {
            const requestData = {
                directoryPath: directoryPath,
                useDefaults: !this.settingsVisible && this.hasDefaults
            };

            // If settings are visible, include custom VM config
            if (this.settingsVisible || !this.hasDefaults) {
                const vmConfig = {
                    host: this.vmHostInput.value.trim(),
                    username: this.vmUsernameInput.value.trim(),
                    password: this.vmPasswordInput.value,
                    port: parseInt(this.vmPortInput.value) || 22
                };

                if (!vmConfig.host || !vmConfig.username || !vmConfig.password) {
                    this.showStatus('Please configure VM connection settings first', 'error');
                    return;
                }

                requestData.vmConfig = vmConfig;
            }

            const response = await fetch('/api/vm-browse', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            const result = await response.json();

            if (response.ok) {
                this.displayDirectoryContents(result.path, result.contents);
                this.currentPath = result.path;
                this.showStatus(`Loaded directory: ${result.path}`, 'success');
            } else {
                this.showStatus(`Error: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showStatus(`Failed to browse directory: ${error.message}`, 'error');
        } finally {
            this.browseDirectoryBtn.disabled = false;
        }
    }

    updateNavigationButtons() {
        // Update back button
        this.navBackBtn.disabled = this.historyIndex <= 0;
        
        // Update forward button
        this.navForwardBtn.disabled = this.historyIndex >= this.pathHistory.length - 1;
        
        // Update tooltips with path info
        if (this.historyIndex > 0) {
            this.navBackBtn.title = `Go back to: ${this.pathHistory[this.historyIndex - 1]}`;
        } else {
            this.navBackBtn.title = 'Go back';
        }
        
        if (this.historyIndex < this.pathHistory.length - 1) {
            this.navForwardBtn.title = `Go forward to: ${this.pathHistory[this.historyIndex + 1]}`;
        } else {
            this.navForwardBtn.title = 'Go forward';
        }
    }
}

// Initialize VM Connector when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('vm-host')) {
        new VMConnector();
    }
});