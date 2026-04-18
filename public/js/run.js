let map;
let polyline;
let sessionId;
let isRunning = true;
let isPaused = false;
let startTime;
let totalPausedTime = 0;
let pauseStartTime = null;
let coordinates = [];
let distance = 0;
let polylineLayer;
let marker = null;  // Current location marker
let routeSegments = []; // Array of arrays for multiple path segments (separated by pauses)
let currentSegment = []; // The current active path segment
routeSegments.push(currentSegment);
let completionLayer;
let timerIntervalId;

function initializeMap() {
  map = L.map('map').setView([40.7128, -74.0060], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map);

  polylineLayer = L.polyline(routeSegments, { color: 'blue', weight: 3 }).addTo(map);

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        map.setView([lat, lon], 15);
        
        if (!marker) {
          marker = L.marker([lat, lon], {
            title: 'Your Location',
            icon: L.icon({
              iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
              shadowSize: [41, 41]
            })
          }).addTo(map).bindPopup('Start Location');
        }
      },
      (error) => {
        console.error('Error getting location:', error);
      }
    );
  }
}

function startTracking() {
  startTime = Date.now();
  
  const watchId = navigator.geolocation.watchPosition(
    async (position) => {
      if (isPaused || !isRunning) return;

      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      coordinates.push([lat, lon]);
      currentSegment.push([lat, lon]);

      polylineLayer.setLatLngs(routeSegments);

      if (marker) {
        marker.setLatLng([lat, lon]);
      } else {
        marker = L.marker([lat, lon], {
          title: 'Current Location',
          icon: L.icon({
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            shadowSize: [41, 41]
          })
        }).addTo(map).bindPopup('Current Location');
      }

      map.setView([lat, lon], 15);

      try {
        await axios.post(`/api/run/${sessionId}/coordinate`, 
          { latitude: lat, longitude: lon },
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );
      } catch (error) {
        console.error('Error sending coordinate:', error);
      }

      updateDisplay();
    },
    (error) => {
      console.error('Error getting location:', error);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );

  window.watchId = watchId;
}

function updateDisplay() {
  let effectivePause = totalPausedTime;
  if (isPaused && pauseStartTime) {
    effectivePause += (Date.now() - pauseStartTime);
  }
  const elapsedTime = Math.floor((Date.now() - startTime - effectivePause) / 1000);
  document.getElementById('time').textContent = formatTime(elapsedTime);

  distance = calculateDistance(coordinates);
  document.getElementById('distance').textContent = distance.toFixed(2) + ' km';

  const calories = Math.round(distance * 1000 * 70 * 0.00063);
  document.getElementById('calories').textContent = calories;
}

function calculateDistance(coords) {
  let totalDistance = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    if (coords[i][0] === 999 || coords[i + 1][0] === 999) continue;
    totalDistance += getDistance(coords[i], coords[i + 1]);
  }
  return totalDistance;
}

function getDistance(point1, point2) {
  const R = 6371; // Radius of Earth in kilometers
  const lat1 = point1[0] * Math.PI / 180;
  const lat2 = point2[0] * Math.PI / 180;
  const deltaLat = (point2[0] - point1[0]) * Math.PI / 180;
  const deltaLon = (point2[1] - point1[1]) * Math.PI / 180;

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

async function pauseRun() {
  isPaused = !isPaused;
  const pauseBtn = document.getElementById('pause-btn');
  pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';

  if (isPaused) {
    pauseStartTime = Date.now();
    currentSegment = [];
    routeSegments.push(currentSegment);

    coordinates.push([999, 999]);

    if (sessionId) {
      try {
        await axios.post(`/api/run/${sessionId}/coordinate`, 
          { latitude: 999, longitude: 999 },
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );
      } catch (error) {
        console.error('Error sending break coordinate:', error);
      }
    }
  } else {
    if (pauseStartTime) {
      totalPausedTime += (Date.now() - pauseStartTime);
      pauseStartTime = null;
    }
  }
}

function renderCompletedRunOnMap(isClosedLoop) {
  const flattenedRoute = [];
  routeSegments.forEach(seg => {
    seg.forEach(pt => flattenedRoute.push(pt));
  });

  if (!flattenedRoute.length) {
    return;
  }

  if (polylineLayer) {
    polylineLayer.setStyle({
      color: '#2563eb',
      weight: 4,
      opacity: 0.95,
    });
  }

  if (completionLayer) {
    map.removeLayer(completionLayer);
  }

  if (isClosedLoop && flattenedRoute.length >= 3) {
    completionLayer = L.polygon(flattenedRoute, {
      color: '#16a34a',
      fillColor: '#22c55e',
      fillOpacity: 0.25,
      weight: 3,
    }).addTo(map);
  }

  const bounds = L.latLngBounds(flattenedRoute);
  if (bounds.isValid()) {
    map.fitBounds(bounds.pad(0.2));
  }
}

function showCompletionSummary(runData) {
  const feedback = document.getElementById('session-feedback');
  const finalDistance = Number(runData?.stats?.distance || 0).toFixed(2);
  const finalArea = Number(runData?.territoryArea || 0).toFixed(2);

  if (runData.isClosedLoop) {
    feedback.innerHTML = `
      <div class="success">
        <p><strong>✓ Territory Captured!</strong></p>
        <p>Covered Area: ${finalArea} m²</p>
        <p>Your captured shape is now highlighted on the map.</p>
      </div>
    `;
    return;
  }

  feedback.innerHTML = `
    <div class="info">
      <p><strong>✓ Route Saved</strong></p>
      <p>Walked Distance: ${finalDistance} km</p>
      <p>Your completed route is highlighted on the map.</p>
    </div>
  `;
}

function setFinalMeasurements(runData) {
  const finalTime = Number(runData?.session?.total_time || 0);
  const finalDistance = Number(runData?.stats?.distance || 0);
  const finalCalories = Number(runData?.stats?.calories || 0);

  document.getElementById('time').textContent = formatTime(finalTime);
  document.getElementById('distance').textContent = `${finalDistance.toFixed(2)} km`;
  document.getElementById('calories').textContent = String(finalCalories);
}

async function finishRun() {
  isRunning = false;
  navigator.geolocation.clearWatch(window.watchId);

  try {
    const response = await axios.post(`/api/run/${sessionId}/finish`, {}, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });

    if (timerIntervalId) {
      clearInterval(timerIntervalId);
    }

    setFinalMeasurements(response.data);
    showCompletionSummary(response.data);
    renderCompletedRunOnMap(response.data.isClosedLoop);

    document.getElementById('pause-btn').disabled = true;
    document.getElementById('finish-btn').disabled = true;
  } catch (error) {
    console.error('Error finishing run:', error);
    alert('Error finishing run: ' + (error.response?.data?.message || error.message));
  }
}

function getToken() {
  return localStorage.getItem('token');
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!getToken()) {
    window.location.href = '/login';
    return;
  }

  initializeMap();

  try {
    const response = await axios.post('/api/run/start', {}, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    sessionId = response.data.sessionId;

    startTracking();

    timerIntervalId = setInterval(updateDisplay, 1000);
  } catch (error) {
    console.error('Error starting session:', error);
    const status = error.response?.status;
    const message = error.response?.data?.message || 'Error starting running session. Please try again.';

    if (status === 401) {
      localStorage.removeItem('token');
      alert('Session expired. Please login again.');
      window.location.href = '/login';
      return;
    }

    alert(message);
    window.location.href = '/';
  }
});
