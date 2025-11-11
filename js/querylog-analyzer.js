// Laravel QueryLog Analyzer functionality
class QueryLogAnalyzer {
    constructor() {
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.querylogInput = document.getElementById('querylog-input');
        this.analyzeBtn = document.getElementById('analyze-queries');
        this.clearBtn = document.getElementById('clear-querylog');
        this.statusDiv = document.getElementById('querylog-status');
        this.bindValuesToggle = document.getElementById('bind-values-toggle');
        this.sortByTimeToggle = document.getElementById('sort-by-time-toggle');
        this.showHistoryBtn = document.getElementById('show-history');
        this.toggleInputBtn = document.getElementById('toggle-querylog-input');
        this.querySearchInput = document.getElementById('query-search');
        this.clearSearchBtn = document.getElementById('clear-search');
        this.historyModal = document.getElementById('history-modal');
        this.closeHistoryBtn = document.getElementById('close-history');
        this.clearHistoryBtn = document.getElementById('clear-history');
        this.historyList = document.getElementById('history-list');

        // Stats elements
        this.totalQueriesEl = document.getElementById('total-queries');
        this.totalTimeEl = document.getElementById('total-time');
        this.avgTimeEl = document.getElementById('avg-time');
        this.slowestTimeEl = document.getElementById('slowest-time');
        this.queriesTableEl = document.getElementById('queries-table');

        // Store current analysis for re-rendering
        this.currentAnalysis = null;
    }

    bindEvents() {
        this.analyzeBtn.addEventListener('click', () => this.analyzeQueries());
        this.clearBtn.addEventListener('click', () => this.clearAll());
        this.bindValuesToggle.addEventListener('change', () => this.toggleBindValues());
        this.sortByTimeToggle.addEventListener('change', () => this.toggleSortByTime());
        this.showHistoryBtn.addEventListener('click', () => this.showHistory());
        this.toggleInputBtn.addEventListener('click', () => this.toggleInputSection());
        this.querySearchInput.addEventListener('input', () => this.handleSearch());
        this.querySearchInput.addEventListener('keyup', () => this.toggleClearButton());
        this.clearSearchBtn.addEventListener('click', () => this.clearSearch());
        this.closeHistoryBtn.addEventListener('click', () => this.hideHistory());
        this.clearHistoryBtn.addEventListener('click', () => this.clearAllHistory());
        
        // Close modal when clicking outside
        this.historyModal.addEventListener('click', (e) => {
            if (e.target === this.historyModal) {
                this.hideHistory();
            }
        });
    }

    analyzeQueries() {
        const input = this.querylogInput.value.trim();
        if (!input) {
            this.showStatus('Please enter QueryLog data', 'error');
            return;
        }

        // Show loading overlay
        this.showInputLoading('Analyzing queries...');
        this.analyzeBtn.disabled = true;

        // Use setTimeout to allow UI to update before processing
        setTimeout(() => {
            try {
                let queries = this.parseQueryLogInput(input);
                if (!queries || queries.length === 0) {
                    this.hideInputLoading();
                    this.showStatus('No valid queries found in the input', 'error');
                    return;
                }

                const analysis = this.performAnalysis(queries);
                this.displayResults(analysis);
                
                // Save to history
                this.saveToHistory(input, analysis);
                
                this.hideInputLoading();
                this.showStatus(`Successfully analyzed ${queries.length} queries!`, 'success');
            } catch (error) {
                this.hideInputLoading();
                this.showStatus(`Error analyzing queries: ${error.message}`, 'error');
            } finally {
                this.analyzeBtn.disabled = false;
            }
        }, 100); // Small delay to show loading effect
    }

    parseQueryLogInput(input) {
        // Try to parse as JSON first
        try {
            const parsed = JSON.parse(input);
            if (Array.isArray(parsed)) {
                return parsed;
            }
            // If it's an object, look for common QueryLog array properties
            if (parsed.queries) return parsed.queries;
            if (parsed.data) return parsed.data;
            return [parsed]; // Single query object
        } catch (jsonError) {
            // Check if it's Laravel log format with timestamp
            if (this.isLaravelLogFormat(input)) {
                return this.parseLaravelLogFormat(input);
            }
            // Try to parse as PHP array format
            return this.parsePHPArrayFormat(input);
        }
    }

    isLaravelLogFormat(input) {
        // Check for Laravel log pattern: [timestamp] [environment] [app] [level]: array(...)
        return /\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\].*?\[DEBUG\]:\s*array\s*\(/i.test(input);
    }

    parseLaravelLogFormat(input) {
        // Extract the array part from Laravel log format
        // Pattern: [timestamp] [env] [app] [DEBUG]: array(...) {"process_id":...}

        // Find the start of the array
        const arrayStartMatch = input.match(/\[DEBUG\]:\s*array\s*\(/i);
        if (!arrayStartMatch) return [];

        const arrayStart = arrayStartMatch.index + arrayStartMatch[0].length - 1; // -1 to include the opening parenthesis

        // Find the end of the array (before the JSON part if it exists)
        let arrayEnd = input.length;
        const jsonMatch = input.match(/\s*\{[^}]*\}\s*$/);
        if (jsonMatch) {
            arrayEnd = jsonMatch.index;
        }

        const arrayString = 'array(' + input.substring(arrayStart + 1, arrayEnd);

        // Parse the PHP array format
        return this.parseEnhancedPHPArray(arrayString);
    }

    parseEnhancedPHPArray(input) {
        const queries = [];

        // Enhanced regex to capture bindings as well
        const arrayElementRegex = /(\d+)\s*=>\s*array\s*\(\s*'query'\s*=>\s*'([^']*(?:\\'[^']*)*)'\s*,\s*'bindings'\s*=>\s*array\s*\(([^)]*)\)\s*,\s*'time'\s*=>\s*([\d.]+)\s*,\s*\)/g;

        let match;
        while ((match = arrayElementRegex.exec(input)) !== null) {
            const [, index, query, bindingsStr, time] = match;

            // Parse bindings
            let bindings = [];
            if (bindingsStr.trim()) {
                // Extract individual binding values
                const bindingMatches = bindingsStr.match(/(?:\d+\s*=>\s*)?(?:'([^']*)'|"([^"]*)"|(\d+(?:\.\d+)?)|(\w+::\w+\([^)]*\)))/g);
                if (bindingMatches) {
                    bindings = bindingMatches.map(binding => {
                        // Handle different binding formats
                        if (binding.includes("'")) {
                            return binding.match(/'([^']*)'/)[1];
                        } else if (binding.includes('"')) {
                            return binding.match(/"([^"]*)"/)[1];
                        } else if (binding.includes('::')) {
                            // Handle Laravel Expression objects like Illuminate\Database\Query\Expression::__set_state
                            const valueMatch = binding.match(/value.*?(\d+)/);
                            return valueMatch ? valueMatch[1] : binding;
                        } else {
                            // Handle numeric values or simple strings
                            const valueMatch = binding.match(/(?:\d+\s*=>\s*)?(.+)/);
                            return valueMatch ? valueMatch[1].trim() : binding;
                        }
                    });
                }
            }

            queries.push({
                query: query.replace(/\\'/g, "'"), // Unescape single quotes
                time: parseFloat(time),
                bindings: bindings,
                index: parseInt(index)
            });
        }

        // If the enhanced regex didn't work, fall back to line-by-line parsing
        if (queries.length === 0) {
            return this.parsePHPArrayFormat(input);
        }

        return queries;
    }

    parsePHPArrayFormat(input) {
        // Handle Laravel QueryLog format like:
        // array:3 [
        //   0 => array:3 [
        //     "query" => "select * from users"
        //     "bindings" => []
        //     "time" => 1.23
        //   ]
        // ]

        const queries = [];
        const lines = input.split('\n');
        let currentQuery = {};

        for (let line of lines) {
            line = line.trim();

            // Extract query (handle both single and double quotes)
            const queryMatch = line.match(/['"]query['"] *=> *['"]([^'"]+)['"]/);
            if (queryMatch) {
                currentQuery.query = queryMatch[1];
            }

            // Extract time
            const timeMatch = line.match(/['"]time['"] *=> *([\d.]+)/);
            if (timeMatch) {
                currentQuery.time = parseFloat(timeMatch[1]);
            }

            // Extract bindings (optional) - handle both array and object formats
            const bindingsMatch = line.match(/['"]bindings['"] *=> *(array\s*\([^)]*\)|\[.*?\])/);
            if (bindingsMatch) {
                try {
                    let bindingsStr = bindingsMatch[1];
                    if (bindingsStr.startsWith('array')) {
                        // Parse PHP array format: array(0 => '2',)
                        const values = [];
                        const valueMatches = bindingsStr.match(/(?:\d+\s*=>\s*)?['"]([^'"]*)['"]/g);
                        if (valueMatches) {
                            valueMatches.forEach(match => {
                                const value = match.match(/['"]([^'"]*)['"]/);
                                if (value) values.push(value[1]);
                            });
                        }
                        currentQuery.bindings = values;
                    } else {
                        // JSON array format
                        currentQuery.bindings = JSON.parse(bindingsStr.replace(/'/g, '"'));
                    }
                } catch (e) {
                    currentQuery.bindings = [];
                }
            }

            // If we have both query and time, add to results
            if (currentQuery.query && currentQuery.time !== undefined) {
                queries.push({ ...currentQuery });
                currentQuery = {};
            }
        }

        return queries;
    }

    performAnalysis(queries) {
        const totalQueries = queries.length;
        const times = queries.map(q => parseFloat(q.time) || 0);
        const totalTime = times.reduce((sum, time) => sum + time, 0);
        const avgTime = totalTime / totalQueries;
        const slowestTime = Math.max(...times);
        const fastestTime = Math.min(...times);

        // Prepare queries with original index
        const queriesWithIndex = queries.map((query, index) => ({
            ...query,
            originalIndex: index + 1,
            time: parseFloat(query.time) || 0
        }));

        // Sort queries by time (slowest first)
        const sortedQueries = [...queriesWithIndex].sort((a, b) => b.time - a.time);

        // Categorize queries by performance
        const slowQueries = sortedQueries.filter(q => q.time > 100); // > 100ms
        const mediumQueries = sortedQueries.filter(q => q.time > 10 && q.time <= 100); // 10-100ms
        const fastQueries = sortedQueries.filter(q => q.time <= 10); // <= 10ms

        return {
            totalQueries,
            totalTime,
            avgTime,
            slowestTime,
            fastestTime,
            originalQueries: queriesWithIndex,
            sortedQueries,
            slowQueries,
            mediumQueries,
            fastQueries
        };
    }

    displayResults(analysis) {
        // Store analysis for toggle functionality
        this.currentAnalysis = analysis;

        // Update stats cards
        this.totalQueriesEl.textContent = analysis.totalQueries;
        this.totalTimeEl.textContent = `${analysis.totalTime.toFixed(2)}ms`;
        this.avgTimeEl.textContent = `${analysis.avgTime.toFixed(2)}ms`;
        this.slowestTimeEl.textContent = `${analysis.slowestTime.toFixed(2)}ms`;

        // Clear any existing search
        this.querySearchInput.value = '';
        this.toggleClearButton();

        // Generate queries table with enhanced information
        const queriesToDisplay = this.sortByTimeToggle.checked ? analysis.sortedQueries : analysis.originalQueries;
        this.renderQueriesTable(queriesToDisplay);
    }

    renderQueriesTable(queries) {
        // Remove existing search info when rendering fresh results
        const existingInfo = this.queriesTableEl.parentNode.querySelector('.search-results-info');
        if (existingInfo) {
            existingInfo.remove();
        }

        this.generateQueriesTable(queries, this.currentAnalysis);
    }

    generateQueriesTable(queries, analysis) {
        if (queries.length === 0) {
            this.queriesTableEl.innerHTML = '<p>No queries to display</p>';
            return;
        }

        // Calculate stats for current query set (filtered or full)
        const currentSlowQueries = queries.filter(q => q.time > 100);
        const currentFastQueries = queries.filter(q => q.time <= 10);
        const currentTotalTime = queries.reduce((sum, q) => sum + q.time, 0);

        // Add summary information
        const summaryHTML = `
            <div class="query-summary-compact">
                <span class="summary-compact-item">🐌 ${currentSlowQueries.length}</span>
                <span class="summary-compact-item">⚡ ${currentFastQueries.length}</span>
                <span class="summary-compact-item">🎯 #${queries[0].originalIndex || queries[0].index + 1} (${queries[0].time.toFixed(2)}ms)</span>
            </div>
        `;

        const tableHTML = `
            <div class="queries-table">
                <div class="table-header">
                    <div class="header-cell">${this.sortByTimeToggle.checked ? 'Rank' : 'Order'}</div>
                    <div class="header-cell">Original #</div>
                    <div class="header-cell">SQL Query</div>
                    <div class="header-cell">Time</div>
                    <div class="header-cell">% of Total</div>
                    <div class="header-cell">Action</div>
                </div>
                ${queries.map((query, index) => {
            const percentage = ((query.time / currentTotalTime) * 100).toFixed(1);
            const isSlowiest = index === 0;
            return `
                        <div class="query-row ${isSlowiest && this.sortByTimeToggle.checked ? 'slowest-query' : ''}">
                            <div class="query-rank">${index + 1}</div>
                            <div class="query-index">#${query.originalIndex || query.index + 1}</div>
                            <div class="query-sql">${this.formatSQL(query.query, query.bindings)}</div>
                            <div class="query-time ${this.getTimeClass(query.time)}">${query.time.toFixed(2)}ms</div>
                            <div class="query-percentage">${percentage}%</div>
                            <div class="query-action">
                                <button class="copy-query-btn" data-query-index="${index}" title="Copy query to clipboard">
                                    📋
                                </button>
                            </div>
                        </div>
                    `;
        }).join('')}
            </div>
        `;

        this.queriesTableEl.innerHTML = summaryHTML + tableHTML;

        // Add event listeners for copy buttons
        this.addCopyButtonListeners(queries);
    }

    formatSQL(sql, bindings = []) {
        let formattedSQL = sql;

        // If toggle is on and we have bindings, replace ? with actual values
        if (this.bindValuesToggle && this.bindValuesToggle.checked && bindings && bindings.length > 0) {
            formattedSQL = this.bindQueryValues(sql, bindings);
        }

        // Basic SQL formatting for better readability
        return formattedSQL
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/\b(SELECT|FROM|WHERE|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|ORDER BY|GROUP BY|HAVING|LIMIT|INSERT|UPDATE|DELETE|AND|OR|IN|NOT|NULL|IS|LIKE|BETWEEN)\b/gi, '<strong>$1</strong>')
            .trim();
    }

    bindQueryValues(sql, bindings) {
        if (!bindings || bindings.length === 0) {
            return sql;
        }

        let boundSQL = sql;
        let bindingIndex = 0;

        // Replace ? placeholders with actual values
        boundSQL = boundSQL.replace(/\?/g, () => {
            if (bindingIndex < bindings.length) {
                const value = bindings[bindingIndex++];
                // Add quotes around string values, keep numbers as-is
                if (isNaN(value) && value !== 'null' && value !== 'NULL') {
                    return `'${value}'`;
                }
                return value;
            }
            return '?'; // Keep ? if no more bindings
        });

        return boundSQL;
    }

    toggleBindValues() {
        // Re-render with current search if active, otherwise show all
        if (this.currentAnalysis) {
            if (this.querySearchInput.value.trim()) {
                this.handleSearch(); // Re-apply search with new bind values setting
            } else {
                const queriesToDisplay = this.sortByTimeToggle.checked ? this.currentAnalysis.sortedQueries : this.currentAnalysis.originalQueries;
                this.renderQueriesTable(queriesToDisplay);
            }
        }
    }

    toggleSortByTime() {
        // Re-render with current search if active, otherwise show all
        if (this.currentAnalysis) {
            if (this.querySearchInput.value.trim()) {
                this.handleSearch(); // Re-apply search with new sort setting
            } else {
                const queriesToDisplay = this.sortByTimeToggle.checked ? this.currentAnalysis.sortedQueries : this.currentAnalysis.originalQueries;
                this.renderQueriesTable(queriesToDisplay);
            }
        }
    }

    getQueryForCopy(sql, bindings = []) {
        // Return the query based on toggle state
        if (this.bindValuesToggle && this.bindValuesToggle.checked && bindings && bindings.length > 0) {
            return this.bindQueryValues(sql, bindings);
        }
        return sql;
    }



    addCopyButtonListeners(queries) {
        // Remove existing listeners to prevent duplicates
        const copyButtons = this.queriesTableEl.querySelectorAll('.copy-query-btn');
        copyButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const queryIndex = parseInt(e.target.getAttribute('data-query-index'));
                const query = queries[queryIndex];
                if (query) {
                    this.copyQuery(query, queryIndex);
                }
            });
        });
    }

    async copyQuery(queryObj, index) {
        // Get the query text based on current toggle state
        const queryText = this.getQueryForCopy(queryObj.query, queryObj.bindings);

        try {
            await navigator.clipboard.writeText(queryText);
            this.showCopyNotification(`Query #${index + 1} copied to clipboard!`);
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = queryText;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showCopyNotification(`Query #${index + 1} copied to clipboard!`);
        }
    }

    showCopyNotification(message) {
        // Use global notification system
        if (window.notify) {
            window.notify.success(message);
        } else {
            // Fallback to old system
            const notification = document.createElement('div');
            notification.className = 'copy-notification';
            notification.textContent = message;
            document.body.appendChild(notification);
            setTimeout(() => notification.classList.add('show'), 10);
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentNode) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }, 3000);
        }
    }

    getTimeClass(time) {
        if (time > 100) return 'slow';
        if (time > 10) return 'medium';
        return 'fast';
    }

    clearAll() {
        // Clear input
        this.querylogInput.value = '';

        // Reset stats
        this.totalQueriesEl.textContent = '0';
        this.totalTimeEl.textContent = '0ms';
        this.avgTimeEl.textContent = '0ms';
        this.slowestTimeEl.textContent = '0ms';

        // Clear query details table
        this.queriesTableEl.innerHTML = '';

        // Reset toggles to default (ON)
        this.bindValuesToggle.checked = true;
        this.sortByTimeToggle.checked = true;

        // Clear stored analysis
        this.currentAnalysis = null;

        // Hide status messages
        this.hideStatus();

        // Focus back to input
        this.querylogInput.focus();
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
            // Fallback to old system
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

    saveToHistory(inputData, analysis) {
        try {
            // Only store essential summary data, not the full input or queries
            const historyItem = {
                id: Date.now(),
                timestamp: new Date().toLocaleString(),
                // Store only a truncated preview of input data (max 500 chars)
                inputPreview: inputData.substring(0, 500) + (inputData.length > 500 ? '...' : ''),
                // Store only summary statistics, not full queries
                summary: {
                    totalQueries: analysis.totalQueries,
                    totalTime: analysis.totalTime,
                    avgTime: analysis.avgTime,
                    slowestTime: analysis.slowestTime,
                    fastestTime: analysis.fastestTime,
                    slowQueriesCount: analysis.slowQueries.length,
                    mediumQueriesCount: analysis.mediumQueries.length,
                    fastQueriesCount: analysis.fastQueries.length
                },
                preview: this.generatePreview(analysis.originalQueries || analysis.sortedQueries)
            };

            // Get existing history
            let history = JSON.parse(localStorage.getItem('querylog-history') || '[]');
            
            // Add new item to beginning
            history.unshift(historyItem);
            
            // Keep only last 10 items (reduced from 20 to save space)
            history = history.slice(0, 10);
            
            // Save back to localStorage
            localStorage.setItem('querylog-history', JSON.stringify(history));
        } catch (error) {
            // If localStorage is full or unavailable, silently fail
            console.warn('Could not save to history:', error.message);
            // Optionally clear old history and try again
            if (error.name === 'QuotaExceededError') {
                try {
                    localStorage.removeItem('querylog-history');
                    console.log('Cleared history due to quota exceeded');
                } catch (e) {
                    console.error('Could not clear history:', e);
                }
            }
        }
    }

    generatePreview(queries) {
        if (!queries || queries.length === 0) return 'No queries';
        const firstQuery = queries[0].query || '';
        return firstQuery.length > 100 ? firstQuery.substring(0, 100) + '...' : firstQuery;
    }

    showHistory() {
        this.renderHistoryList();
        this.historyModal.classList.add('show');
    }

    hideHistory() {
        this.historyModal.classList.remove('show');
    }

    renderHistoryList() {
        const history = JSON.parse(localStorage.getItem('querylog-history') || '[]');
        
        if (history.length === 0) {
            this.historyList.innerHTML = '<p class="no-history">No history available</p>';
            return;
        }

        const historyHTML = history.map(item => {
            // Support both old format (with analysis) and new format (with summary)
            const stats = item.summary || item.analysis;
            return `
                <div class="history-item" data-id="${item.id}">
                    <div class="history-item-header">
                        <span class="history-timestamp">${item.timestamp}</span>
                        <div>
                            <span class="history-stats">${stats.totalQueries} queries • ${stats.totalTime.toFixed(2)}ms</span>
                            <button class="history-delete" data-id="${item.id}" onclick="event.stopPropagation()">Delete</button>
                        </div>
                    </div>
                    <div class="history-preview">${item.preview}</div>
                    ${!item.inputData && !item.inputPreview ? '<div class="history-note">Summary only - full data not available</div>' : ''}
                </div>
            `;
        }).join('');

        this.historyList.innerHTML = historyHTML;

        // Add click listeners
        this.historyList.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('history-delete')) {
                    this.loadFromHistory(parseInt(item.dataset.id));
                }
            });
        });

        // Add delete listeners
        this.historyList.querySelectorAll('.history-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteHistoryItem(parseInt(btn.dataset.id));
            });
        });
    }

    loadFromHistory(id) {
        const history = JSON.parse(localStorage.getItem('querylog-history') || '[]');
        const item = history.find(h => h.id === id);
        
        if (item) {
            // Check if full data is available (old format) or only summary (new format)
            if (item.inputData && item.analysis) {
                // Old format - full data available
                this.querylogInput.value = item.inputData;
                this.currentAnalysis = item.analysis;
                this.displayResults(item.analysis);
                this.hideHistory();
                this.showStatus('History item loaded successfully!', 'success');
            } else if (item.inputPreview) {
                // New format - only summary available
                this.hideHistory();
                window.notify?.warning('This history item only contains a summary. Full query data is not available.');
            } else {
                // Unknown format
                this.hideHistory();
                window.notify?.error('Unable to load this history item.');
            }
        }
    }

    deleteHistoryItem(id) {
        let history = JSON.parse(localStorage.getItem('querylog-history') || '[]');
        history = history.filter(h => h.id !== id);
        localStorage.setItem('querylog-history', JSON.stringify(history));
        this.renderHistoryList();
    }

    clearAllHistory() {
        if (confirm('Are you sure you want to clear all history?')) {
            localStorage.removeItem('querylog-history');
            this.renderHistoryList();
            this.showStatus('History cleared successfully!', 'success');
        }
    }

    toggleInputSection() {
        const inputSection = this.querylogInput.closest('.input-section');
        const isCollapsed = inputSection.classList.contains('collapsed');
        
        if (isCollapsed) {
            // Expand
            inputSection.classList.remove('collapsed');
            this.toggleInputBtn.textContent = '▲';
            this.toggleInputBtn.title = 'Collapse QueryLog Data';
        } else {
            // Collapse
            inputSection.classList.add('collapsed');
            this.toggleInputBtn.textContent = '▼';
            this.toggleInputBtn.title = 'Expand QueryLog Data';
        }
        
        // Force a reflow to ensure the changes take effect
        inputSection.offsetHeight;
    }

    handleSearch() {
        const searchTerm = this.querySearchInput.value.toLowerCase().trim();
        
        if (!this.currentAnalysis) {
            return;
        }

        // Filter queries based on search term
        const filteredQueries = this.currentAnalysis.originalQueries.filter(query => {
            const sql = query.query.toLowerCase();
            const bindings = query.bindings ? JSON.stringify(query.bindings).toLowerCase() : '';
            return sql.includes(searchTerm) || bindings.includes(searchTerm);
        });

        // Update the display with filtered results
        this.displayFilteredResults(filteredQueries, searchTerm);
        this.toggleClearButton();
    }

    displayFilteredResults(filteredQueries, searchTerm) {
        // Sort filtered queries if sort toggle is enabled
        let queriesToDisplay = [...filteredQueries];
        if (this.sortByTimeToggle.checked) {
            queriesToDisplay.sort((a, b) => b.time - a.time);
        }

        // Add search results info
        this.addSearchResultsInfo(filteredQueries.length, this.currentAnalysis.originalQueries.length, searchTerm);

        // Render the filtered queries
        this.generateQueriesTable(queriesToDisplay, this.currentAnalysis);
    }

    addSearchResultsInfo(filteredCount, totalCount, searchTerm) {
        // Remove existing search info
        const existingInfo = this.queriesTableEl.parentNode.querySelector('.search-results-info');
        if (existingInfo) {
            existingInfo.remove();
        }

        if (searchTerm) {
            const infoDiv = document.createElement('div');
            infoDiv.className = 'search-results-info';
            infoDiv.textContent = `Showing ${filteredCount} of ${totalCount} queries matching "${searchTerm}"`;
            this.queriesTableEl.parentNode.insertBefore(infoDiv, this.queriesTableEl);
        }
    }

    clearSearch() {
        this.querySearchInput.value = '';
        this.handleSearch(); // This will show all queries again
        this.toggleClearButton();
        this.querySearchInput.focus();
    }

    toggleClearButton() {
        const hasValue = this.querySearchInput.value.length > 0;
        this.clearSearchBtn.classList.toggle('visible', hasValue);
    }

    // Input Loading Methods
    showInputLoading(message = 'Processing...') {
        // Remove any existing loading indicator
        this.hideInputLoading();
        
        // Create loading overlay
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'querylog-input-loading';
        loadingOverlay.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">${message}</div>
        `;
        
        // Add to input section
        const inputSection = this.querylogInput.closest('.input-section');
        inputSection.appendChild(loadingOverlay);
    }

    hideInputLoading() {
        const inputSection = this.querylogInput.closest('.input-section');
        const loadingOverlay = inputSection.querySelector('.querylog-input-loading');
        if (loadingOverlay) {
            loadingOverlay.remove();
        }
    }
}

// Initialize QueryLog Analyzer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new QueryLogAnalyzer();
});