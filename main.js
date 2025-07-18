const flightTable = document.querySelector('.flight-table');

async function getLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve([pos.coords.latitude, pos.coords.longitude]),
      err => reject(new Error("Unable to get your location. Please enable location access."))
    );
  });
}

async function getFlights(lat, lon) {
  const url = `https://opensky-network.org/api/states/all?lamin=${lat - 1}&lomin=${lon - 1}&lamax=${lat + 1}&lomax=${lon + 1}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch flight data');
  const data = await response.json();
  return data.states || [];
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = x => x * Math.PI / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 0.539957; // Convert km to NM
}

function createFlightRow(flight, distance) {
  const row = document.createElement('div');
  row.className = 'flight-row';

  const logo = document.createElement('img');
  logo.src = `https://content.airhex.com/content/logos/airlines_${flight[1]?.slice(0, 3) || 'default'}_100_100_s.png?fallback=default.png`;
  logo.alt = 'Airline Logo';
  logo.width = 40;
  logo.height = 40;

  row.innerHTML = `
    <div class="flight-cell">${flight[1] || 'Unknown'}</div>
    <div class="flight-cell">${flight[0] || 'N/A'}</div>
    <div class="flight-cell">${Math.round(flight[7] || 0)} ft</div>
    <div class="flight-cell">${Math.round(flight[9] || 0)} kn</div>
    <div class="flight-cell">${distance.toFixed(1)} NM</div>
  `;
  row.prepend(logo);
  return row;
}

async function initBoard() {
  try {
    let lat, lon;

    const dropdown = document.getElementById('airport-select');
    const selected = dropdown?.value || 'user';

    const coordsMap = {
      'cyyz': [43.6777, -79.6248],
      'rksi': [37.4602, 126.4407],
      'kjfk': [40.6413, -73.7781],
      'rjtt': [35.5523, 139.7798],
      'egll': [51.4700, -0.4543],
      'eddm': [48.3538, 11.7861]
    };

    if (selected === 'user') {
      [lat, lon] = await getLocation();
    } else {
      [lat, lon] = coordsMap[selected];
    }

    const flights = await getFlights(lat, lon);
    flightTable.innerHTML = '';

    for (const flight of flights) {
      const dist = haversineDistance(lat, lon, flight[6], flight[5]);
      if (dist <= 10) {
        const row = createFlightRow(flight, dist);
        flightTable.appendChild(row);
      }
    }

    if (!flightTable.children.length) {
      flightTable.innerHTML = '<p>No nearby flights found within 10 NM.</p>';
    }
  } catch (err) {
    flightTable.innerHTML = `<p>Error: ${err.message}</p>`;
  }
}

// On load
window.onload = initBoard;

// Refresh on dropdown change
document.getElementById('airport-select').addEventListener('change', initBoard);
