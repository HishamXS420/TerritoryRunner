// Get token from localStorage
function getToken() {
  return localStorage.getItem('token');
}

let territoryMap;
let territoryLayerGroup;
let currentUserId = null;

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
    
    const { user, stats } = response.data;
    currentUserId = user?.id || null;
    document.getElementById('total-distance').textContent = (stats.total_distance / 1000).toFixed(3);
    document.getElementById('total-area').textContent = stats.total_territory_area.toFixed(3);
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

function initializeTerritoryMap() {
  territoryMap = L.map('territory-map').setView([23.8103, 90.4125], 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(territoryMap);

  territoryLayerGroup = L.layerGroup().addTo(territoryMap);
}

function getTerritoryStyle(ownerId) {
  const isOwnTerritory = currentUserId !== null && ownerId === currentUserId;

  return {
    color: isOwnTerritory ? '#2ecc71' : '#e74c3c',
    fillColor: isOwnTerritory ? '#2ecc71' : '#e74c3c',
    fillOpacity: 0.35,
    weight: 2,
  };
}

async function loadTerritories() {
  try {
    const response = await axios.get('/api/territory/all');
    const territories = response.data.territories || [];

    territoryLayerGroup.clearLayers();

    if (territories.length === 0) {
      return;
    }

    const bounds = L.latLngBounds([]);

    territories.forEach((territory) => {
      if (!Array.isArray(territory.polygon_coords) || territory.polygon_coords.length < 3) {
        return;
      }

      const polygon = L.polygon(territory.polygon_coords, getTerritoryStyle(territory.user_id))
        .bindPopup(`
          <div>
            <p><strong>Owner:</strong> ${territory.username || 'Unknown'}</p>
            <p><strong>Area:</strong> ${Number(territory.area || 0).toFixed(2)} m²</p>
          </div>
        `);

      polygon.addTo(territoryLayerGroup);
      bounds.extend(polygon.getBounds());
    });

    if (bounds.isValid()) {
      territoryMap.fitBounds(bounds.pad(0.15));
    }
  } catch (error) {
    console.error('Error loading territories:', error);
  }
}

// Load data on page load
document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication
  if (!getToken()) {
    window.location.href = '/login';
    return;
  }

  initializeTerritoryMap();
  await loadUserProfile();
  await Promise.all([loadRunHistory(), loadTerritories()]);
});
