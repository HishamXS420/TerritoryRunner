// Get token from localStorage
function getToken() {
  return localStorage.getItem('token');
}

// Logout function
function logout() {
  localStorage.removeItem('token');
  window.location.href = '/login';
}

// Fetch user profile and statistics
async function loadUserProfile() {
  try {
    const response = await axios.get('/api/auth/profile', {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    
    const { stats } = response.data;
    document.getElementById('total-distance').textContent = (stats.total_distance / 1000).toFixed(2);
    document.getElementById('total-area').textContent = stats.total_territory_area.toFixed(0);
    document.getElementById('total-calories').textContent = stats.total_calories;
  } catch (error) {
    console.error('Error loading profile:', error);
  }
}

// Fetch running history
async function loadRunHistory() {
  try {
    const response = await axios.get('/api/run/history/all', {
      headers: { Authorization: `Bearer ${getToken()}` }
    });

    const sessions = response.data.sessions;
    const historyList = document.getElementById('history-list');
    
    historyList.innerHTML = sessions.map(session => `
      <div class="history-item">
        <p><strong>Date:</strong> ${new Date(session.start_time).toLocaleString()}</p>
        <p><strong>Distance:</strong> ${session.total_distance.toFixed(2)} km</p>
        <p><strong>Time:</strong> ${formatTime(session.total_time)}</p>
        <p><strong>Calories:</strong> ${session.estimated_calories}</p>
        ${session.territory_id ? `<p><strong>Territory Captured:</strong> ${(session.area / 1000000).toFixed(2)} km²</p>` : ''}
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading run history:', error);
  }
}

// Format time (seconds to HH:MM:SS)
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Start running session
function startRunning() {
  window.location.href = '/run';
}

// Load data on page load
document.addEventListener('DOMContentLoaded', () => {
  // Check authentication
  if (!getToken()) {
    window.location.href = '/login';
    return;
  }

  loadUserProfile();
  loadRunHistory();
});
