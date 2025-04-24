/**
 * Main JavaScript file
 */

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize components
  initSidebar();
  initActiveLinks();

  // Initialize page-specific functionality
  const currentPage = getCurrentPage();

  switch (currentPage) {
    case 'login':
      initLoginPage();
      break;
    case 'dashboard':
      initDashboardPage();
      break;
    case 'image':
      initImagePage();
      break;
    case 'text':
      initTextPage();
      break;
    case 'code':
      initCodePage();
      break;
    default:
      // Home page or other pages
      break;
  }
});

/**
 * Get the current page based on the URL
 */
function getCurrentPage() {
  const path = window.location.pathname;

  if (path.includes('/login')) {
    return 'login';
  } else if (path.includes('/dashboard')) {
    return 'dashboard';
  } else if (path.includes('/image')) {
    return 'image';
  } else if (path.includes('/text')) {
    return 'text';
  } else if (path.includes('/code')) {
    return 'code';
  } else {
    return 'home';
  }
}

/**
 * Initialize the sidebar
 */
function initSidebar() {
  // Mobile sidebar toggle
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('active');
    });
  }
}

/**
 * Initialize active links in navigation
 */
function initActiveLinks() {
  const currentPage = getCurrentPage();

  // Set active class for sidebar links
  const sidebarLinks = document.querySelectorAll('.sidebar-menu-item');
  sidebarLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.includes(`/${currentPage}`)) {
      link.classList.add('active');
    }
  });

  // Set active class for header links
  const headerLinks = document.querySelectorAll('.header-nav-item');
  headerLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.includes(`/${currentPage}`)) {
      link.classList.add('active');
    }
  });
}

/**
 * Show an alert message
 */
function showAlert(message, type = 'error', duration = 5000) {
  // Create alert element
  const alertElement = document.createElement('div');
  alertElement.className = `alert alert-${type}`;
  alertElement.textContent = message;

  // Add to the DOM
  const alertContainer = document.querySelector('.alert-container');
  if (alertContainer) {
    alertContainer.appendChild(alertElement);

    // Remove after duration
    setTimeout(() => {
      alertElement.remove();
    }, duration);
  }
}

/**
 * Format date to a readable string
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString();
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy text:', error);
    return false;
  }
}

/**
 * Initialize tabs
 */
function initTabs(tabsContainerId) {
  const tabsContainer = document.getElementById(tabsContainerId);

  if (!tabsContainer) return;

  const tabs = tabsContainer.querySelectorAll('.tab');
  const tabContents = tabsContainer.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs and contents
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      // Add active class to clicked tab and corresponding content
      tab.classList.add('active');
      const tabId = tab.getAttribute('data-tab');
      const content = tabsContainer.querySelector(`.tab-content[data-tab="${tabId}"]`);
      if (content) {
        content.classList.add('active');
      }
    });
  });
}

/**
 * Make an API request
 */
async function apiRequest(endpoint, method = 'GET', data = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      // Important: Include credentials to send cookies with the request
      credentials: 'same-origin'
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`/api/${endpoint}`, options);

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const result = await response.json();
      return result;
    } else {
      console.error(`API response is not JSON: ${await response.text()}`);
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error(`API request error (${endpoint}):`, error);
    throw error;
  }
}

// Export functions for use in other modules
window.app = {
  getCurrentPage,
  showAlert,
  formatDate,
  copyToClipboard,
  initTabs,
  apiRequest
};
