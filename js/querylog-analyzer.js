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
    }

    analyzeQueries() {
        const input = this.querylogInput.value.trim();
        if (!input) {
            this.showStatus('Please enter QueryLog data', 'error');
            return;
        }

        try {
            let queries = this.parseQueryLogInput(input);
            if (!queries || queries.length === 0) {
                this.showStatus('No valid queries found in the input', 'error');
                return;
            }

            const analysis = this.performAnalysis(queries);
            this.displayResults(analysis);
            this.showStatus(`Successfully analyzed ${queries.length} queries!`, 'success');
        } catch (error) {
            this.showStatus(`Error analyzing queries: ${error.message}`, 'error');
        }
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

        // Generate queries table with enhanced information
        const queriesToDisplay = this.sortByTimeToggle.checked ? analysis.sortedQueries : analysis.originalQueries;
        this.generateQueriesTable(queriesToDisplay, analysis);
    }

    generateQueriesTable(queries, analysis) {
        if (queries.length === 0) {
            this.queriesTableEl.innerHTML = '<p>No queries to display</p>';
            return;
        }

        // Add summary information
        const summaryHTML = `
            <div class="query-summary">
                <h4>📊 Performance Summary</h4>
                <div class="summary-stats">
                    <span class="summary-item">🐌 Slow queries (>100ms): <strong>${analysis.slowQueries.length}</strong></span>
                    <span class="summary-item">⚡ Fast queries (≤10ms): <strong>${analysis.fastQueries.length}</strong></span>
                    <span class="summary-item">🎯 Slowest query: <strong>#${queries[0].originalIndex || queries[0].index + 1} (${queries[0].time.toFixed(2)}ms)</strong></span>
                </div>
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
            const percentage = ((query.time / analysis.totalTime) * 100).toFixed(1);
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
        // Re-render the table with current analysis if available
        if (this.currentAnalysis) {
            const queriesToDisplay = this.sortByTimeToggle.checked ? this.currentAnalysis.sortedQueries : this.currentAnalysis.originalQueries;
            this.generateQueriesTable(queriesToDisplay, this.currentAnalysis);
        }
    }

    toggleSortByTime() {
        // Re-render the table with current analysis if available
        if (this.currentAnalysis) {
            const queriesToDisplay = this.sortByTimeToggle.checked ? this.currentAnalysis.sortedQueries : this.currentAnalysis.originalQueries;
            this.generateQueriesTable(queriesToDisplay, this.currentAnalysis);
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
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'copy-notification';
        notification.textContent = message;

        // Add to page
        document.body.appendChild(notification);

        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
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

// Initialize QueryLog Analyzer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new QueryLogAnalyzer();
});