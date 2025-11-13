// Dashboard functionality
class Dashboard {
    constructor() {
        this.stats = this.loadStats();
        this.initializeEventListeners();
        this.updateDashboard();
    }

    loadStats() {
        const defaultStats = {
            totalUses: 0,
            lastUsed: null,
            tools: {
                'json-formatter': 0,
                'querylog-analyzer': 0,
                'vm-connector': 0,
                'json-to-php': 0,
                'markdown-editor': 0
            }
        };

        try {
            const saved = localStorage.getItem('devtools-stats');
            return saved ? { ...defaultStats, ...JSON.parse(saved) } : defaultStats;
        } catch (e) {
            return defaultStats;
        }
    }

    saveStats() {
        try {
            localStorage.setItem('devtools-stats', JSON.stringify(this.stats));
        } catch (e) {
            console.error('Failed to save stats:', e);
        }
    }

    trackToolUsage(toolName) {
        if (toolName === 'dashboard') return;

        this.stats.totalUses++;
        this.stats.lastUsed = new Date().toISOString();
        
        if (this.stats.tools[toolName] !== undefined) {
            this.stats.tools[toolName]++;
        }

        this.saveStats();
        this.updateDashboard();
    }

    getMostUsedTool() {
        let maxUses = 0;
        let mostUsed = '-';

        for (const [tool, uses] of Object.entries(this.stats.tools)) {
            if (uses > maxUses) {
                maxUses = uses;
                mostUsed = this.getToolDisplayName(tool);
            }
        }

        return mostUsed;
    }

    getToolDisplayName(toolId) {
        const names = {
            'json-formatter': 'JSON Formatter',
            'querylog-analyzer': 'QueryLog Analyzer',
            'vm-connector': 'VM Connector',
            'json-to-php': 'JSON ⇄ PHP',
            'markdown-editor': 'Markdown Editor'
        };
        return names[toolId] || toolId;
    }

    getLastUsedTime() {
        if (!this.stats.lastUsed) return 'Never';

        const lastUsed = new Date(this.stats.lastUsed);
        const now = new Date();
        const diffMs = now - lastUsed;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return lastUsed.toLocaleDateString();
    }

    updateDashboard() {
        // Update main stats
        const totalUsesEl = document.getElementById('dash-total-uses');
        const mostUsedEl = document.getElementById('dash-most-used');
        const lastUsedEl = document.getElementById('dash-last-used');

        if (totalUsesEl) totalUsesEl.textContent = this.stats.totalUses;
        if (mostUsedEl) mostUsedEl.textContent = this.getMostUsedTool();
        if (lastUsedEl) lastUsedEl.textContent = this.getLastUsedTime();

        // Update individual tool usage counts
        for (const [tool, uses] of Object.entries(this.stats.tools)) {
            const usageEl = document.getElementById(`usage-${tool}`);
            if (usageEl) {
                usageEl.textContent = `${uses} use${uses !== 1 ? 's' : ''}`;
            }
        }
    }

    initializeEventListeners() {
        // Tool card click handlers
        document.querySelectorAll('.tool-card').forEach(card => {
            card.addEventListener('click', () => {
                const toolName = card.dataset.tool;
                const navBtn = document.querySelector(`.nav-btn[data-tool="${toolName}"]`);
                if (navBtn) {
                    navBtn.click();
                }
            });
        });

        // Intercept navigation to track usage
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const toolName = btn.dataset.tool;
                this.trackToolUsage(toolName);
            });
        });
    }

    resetStats() {
        if (confirm('Are you sure you want to reset all usage statistics?')) {
            this.stats = {
                totalUses: 0,
                lastUsed: null,
                tools: {
                    'json-formatter': 0,
                    'querylog-analyzer': 0,
                    'vm-connector': 0,
                    'json-to-php': 0
                }
            };
            this.saveStats();
            this.updateDashboard();
            window.notify?.success('Statistics reset successfully');
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
    
    // Update dashboard stats every minute
    setInterval(() => {
        if (window.dashboard) {
            window.dashboard.updateDashboard();
        }
    }, 60000);
});
