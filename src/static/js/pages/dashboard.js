/**
 * Dashboard page JavaScript
 */

function initDashboardPage() {
  // Fetch stats data
  fetchStats();
  
  // Initialize reset stats button
  const resetStatsButton = document.getElementById('reset-stats');
  if (resetStatsButton) {
    resetStatsButton.addEventListener('click', resetStats);
  }
}

/**
 * Fetch statistics data from the API
 */
async function fetchStats() {
  try {
    const response = await app.apiRequest('stats');
    
    if (response.success && response.data) {
      updateStatsUI(response.data);
    } else {
      app.showAlert('Failed to load statistics', 'error');
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
    app.showAlert('An error occurred while loading statistics', 'error');
  }
}

/**
 * Update the UI with stats data
 */
function updateStatsUI(stats) {
  // Update stat cards
  updateStatValue('total-requests', stats.totalRequests);
  updateStatValue('text-requests', stats.textRequests);
  updateStatValue('image-requests', stats.imageRequests);
  updateStatValue('code-requests', stats.codeRequests);
  
  // Update last updated time
  const lastUpdatedElement = document.getElementById('last-updated');
  if (lastUpdatedElement && stats.lastUpdated) {
    lastUpdatedElement.textContent = `Last updated: ${app.formatDate(stats.lastUpdated)}`;
  }
  
  // If we had a chart, we would update it here
  // updateStatsChart(stats);
}

/**
 * Update a stat card value
 */
function updateStatValue(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value.toLocaleString();
  }
}

/**
 * Reset statistics
 */
async function resetStats() {
  if (!confirm('Are you sure you want to reset all statistics? This action cannot be undone.')) {
    return;
  }
  
  try {
    const response = await app.apiRequest('stats/reset', 'POST');
    
    if (response.success) {
      app.showAlert('Statistics reset successfully', 'success');
      
      // Update UI with reset stats
      if (response.data && response.data.stats) {
        updateStatsUI(response.data.stats);
      } else {
        // Refetch stats if not returned in response
        fetchStats();
      }
    } else {
      app.showAlert(response.error || 'Failed to reset statistics', 'error');
    }
  } catch (error) {
    console.error('Error resetting stats:', error);
    app.showAlert('An error occurred while resetting statistics', 'error');
  }
}

// Add to window.app for initialization from main.js
if (window.app) {
  window.app.initDashboardPage = initDashboardPage;
}
