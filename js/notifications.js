// Global Notification System
class NotificationManager {
    constructor() {
        this.container = document.getElementById('notification-container');
        this.notifications = new Map();
        this.notificationId = 0;
    }

    show(message, type = 'info', duration = 5000, options = {}) {
        const id = ++this.notificationId;

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.setAttribute('data-id', id);

        // Icon mapping
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            loading: '⏳'
        };

        const icon = options.icon || icons[type] || icons.info;

        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${icon}</span>
                <span class="notification-message">${message}</span>
                ${options.closable !== false ? '<button class="notification-close" aria-label="Close">×</button>' : ''}
            </div>
            ${options.progress !== false && duration > 0 ? '<div class="notification-progress"></div>' : ''}
        `;

        // Add to container
        this.container.appendChild(notification);
        this.notifications.set(id, notification);

        // Trigger animation
        requestAnimationFrame(() => {
            notification.classList.add('notification-show');
        });

        // Add close button listener
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide(id));
        }

        // Auto-hide after duration
        if (duration > 0) {
            const progressBar = notification.querySelector('.notification-progress');
            if (progressBar) {
                progressBar.style.animationDuration = `${duration}ms`;
            }

            setTimeout(() => {
                this.hide(id);
            }, duration);
        }

        return id;
    }

    hide(id) {
        const notification = this.notifications.get(id);
        if (!notification) return;

        notification.classList.add('notification-hide');

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            this.notifications.delete(id);
        }, 300);
    }

    hideAll() {
        this.notifications.forEach((notification, id) => {
            this.hide(id);
        });
    }

    // Convenience methods
    success(message, duration = 4000, options = {}) {
        return this.show(message, 'success', duration, options);
    }

    error(message, duration = 6000, options = {}) {
        return this.show(message, 'error', duration, options);
    }

    warning(message, duration = 5000, options = {}) {
        return this.show(message, 'warning', duration, options);
    }

    info(message, duration = 4000, options = {}) {
        return this.show(message, 'info', duration, options);
    }

    loading(message, options = {}) {
        return this.show(message, 'loading', 0, { closable: false, progress: false, ...options });
    }
}

// Global instance
window.notify = new NotificationManager();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationManager;
}