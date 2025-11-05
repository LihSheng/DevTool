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

        // Stats elements
        this.totalQueriesEl = document.getElementById('total-queries');
        this.totalTimeEl = document.getElementById('total-time');
        this.avgTimeEl = document.getElementById('avg-time');
        this.slowestTimeEl = document.getElementById('slowest-time');
        this.queriesTableEl = document.getElementById('queries-table');
    }

    bindEvents() {
        this.analyzeBtn.addEventListener('click', () => this.analyzeQueries());
        this.clearBtn.addEventListener('click', () => this.clearAll());
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

        // Enhanced regex patterns to handle the complex format
        // Match each array element: 0 => array ('query' => '...', 'bindings' => array(...), 'time' => 2.44,)
        const arrayElementRegex = /(\d+)\s*=>\s*array\s*\(\s*'query'\s*=>\s*'([^']*(?:\\'[^']*)*)'\s*,\s*'bindings'\s*=>\s*array\s*\([^)]*\)\s*,\s*'time'\s*=>\s*([\d.]+)\s*,\s*\)/g;

        let match;
        while ((match = arrayElementRegex.exec(input)) !== null) {
            const [, index, query, time] = match;

            queries.push({
                query: query.replace(/\\'/g, "'"), // Unescape single quotes
                time: parseFloat(time),
                bindings: [], // We'll extract bindings separately if needed
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

            // Extract bindings (optional)
            const bindingsMatch = line.match(/['"]bindings['"] *=> *(\[.*?\])/);
            if (bindingsMatch) {
                try {
                    currentQuery.bindings = JSON.parse(bindingsMatch[1].replace(/'/g, '"'));
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

        // Sort queries by time (slowest first)
        const sortedQueries = queries
            .map((query, index) => ({
                ...query,
                originalIndex: index + 1,
                time: parseFloat(query.time) || 0
            }))
            .sort((a, b) => b.time - a.time);

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
            sortedQueries,
            slowQueries,
            mediumQueries,
            fastQueries
        };
    }

    displayResults(analysis) {
        // Update stats cards
        this.totalQueriesEl.textContent = analysis.totalQueries;
        this.totalTimeEl.textContent = `${analysis.totalTime.toFixed(2)}ms`;
        this.avgTimeEl.textContent = `${analysis.avgTime.toFixed(2)}ms`;
        this.slowestTimeEl.textContent = `${analysis.slowestTime.toFixed(2)}ms`;

        // Generate queries table with enhanced information
        this.generateQueriesTable(analysis.sortedQueries, analysis);
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
                    <div class="header-cell">Rank</div>
                    <div class="header-cell">Original #</div>
                    <div class="header-cell">SQL Query</div>
                    <div class="header-cell">Time</div>
                    <div class="header-cell">% of Total</div>
                </div>
                ${queries.map((query, index) => {
            const percentage = ((query.time / analysis.totalTime) * 100).toFixed(1);
            const isSlowiest = index === 0;
            return `
                        <div class="query-row ${isSlowiest ? 'slowest-query' : ''}">
                            <div class="query-rank">${index + 1}</div>
                            <div class="query-index">#${query.originalIndex || query.index + 1}</div>
                            <div class="query-sql">${this.formatSQL(query.query)}</div>
                            <div class="query-time ${this.getTimeClass(query.time)}">${query.time.toFixed(2)}ms</div>
                            <div class="query-percentage">${percentage}%</div>
                        </div>
                    `;
        }).join('')}
            </div>
        `;

        this.queriesTableEl.innerHTML = summaryHTML + tableHTML;
    }

    formatSQL(sql) {
        // Basic SQL formatting for better readability
        return sql
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/\b(SELECT|FROM|WHERE|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|ORDER BY|GROUP BY|HAVING|LIMIT)\b/gi, '<strong>$1</strong>')
            .trim();
    }

    getTimeClass(time) {
        if (time > 100) return 'slow';
        if (time > 10) return 'medium';
        return 'fast';
    }

    clearAll() {
        this.querylogInput.value = '';
        this.totalQueriesEl.textContent = '0';
        this.totalTimeEl.textContent = '0ms';
        this.avgTimeEl.textContent = '0ms';
        this.slowestTimeEl.textContent = '0ms';
        this.queriesTableEl.innerHTML = '';
        this.hideStatus();
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