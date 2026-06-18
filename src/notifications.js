/**
 * Terratrace Notification Service
 * Renders non-intrusive floating toasts for levels, achievements, and system feedback.
 */

class NotificationService {
  constructor() {
    this.container = null;
    this.initContainer();
  }

  initContainer() {
    // Check if container already exists
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      document.body.appendChild(this.container);
    }
  }

  /**
   * Displays a toast notification
   * @param {string} title Toast header
   * @param {string} message Toast body text
   * @param {string} icon HTML or character icon representation
   * @param {number} duration Expiry time in milliseconds
   */
  show(title, message, icon = '⭐', duration = 4000) {
    if (!this.container) this.initContainer();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');

    const cleanTitle = escapeHTML(title);
    const cleanMsg = escapeHTML(message);

    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        <div class="toast-title">${cleanTitle}</div>
        <div class="toast-desc">${cleanMsg}</div>
      </div>
    `;

    this.container.appendChild(toast);

    // Force reflow to trigger slide-in transition
    toast.offsetHeight;
    toast.classList.add('show');

    // Auto-dismiss timers
    const dismissTimeout = setTimeout(() => {
      this.dismiss(toast);
    }, duration);

    // Manual click dismiss
    toast.addEventListener('click', () => {
      clearTimeout(dismissTimeout);
      this.dismiss(toast);
    });
  }

  dismiss(toast) {
    toast.classList.remove('show');
    // Remove element after transition finishes
    toast.addEventListener('transitionend', () => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    });
  }
}

export const notifications = new NotificationService();
export default notifications;

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
