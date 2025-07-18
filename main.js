const flightTable = document.querySelector('.flight-table');

async function getLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve([pos.coords.latitude, pos.coords.longitude]),
      err => reject(new Error("Please enable location services and reload."))
    );
  });
}

async function getFlights(lat, lon) {
  const url = `https://opensky-network.org/api/states/all?lamin=${lat - 1}&lomin=${lon - 1}&lamax=${lat + 1}&lomax=${lon + 1}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Flight API request failed');
  const data = await res.json();
  return data.states || [];
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = x => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 0.539957; // km to NM
}

function createFlightRow(flight, dist) {
  const icao = (flight[1] || '').slice(0, 3).toUpperCase();
  const logoUrl = `https://content.airhex.com/content/logos/airlines_${icao}_100_100_s.png`;

  const row = document.createElement('div');
  row.className = 'flight-row';

  row.innerHTML = `
    <img src="${logoUrl}" alt="Logo" width="40" height="40" onerror="this.onerror=null;this.src='https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg'"/>
    <div class="flight-info">
      <div><strong>Flight:</strong> ${flight[1] || 'N/A'}</div>
      <div><strong>Altitude:</strong> ${flight[7] ? Math.round(flight[7]) + ' ft' : 'N/A'}</div>
      <div><strong>Speed:</strong> ${flight[9] ? Math.round(flight[9] * 1.94384) + ' kt' : 'N/A'}</div>
      <div><strong>Distance:</strong> ${dist.toFixed(1)} NM</div>
    </div>
  `;
  return row;
}

const airports = {
  cyyz: [43.6777, -79.6248],
  rksi: [37.4602, 126.4407],
  kjfk: [40.6413, -73.7781],
  rjtt: [35.5523, 139.7798],
  egll: [51.4700, -0.4543],
  eddm: [48.3538, 11.7861]
};

async function loadFlights() {
  flightTable.innerHTML = '<p>Loading flights...</p>';
  try {
    const select = document.getElementById('airport-select');
    const choice = select.value;

    let lat, lon;

    if (choice === 'user') {
      [lat, lon] = await getLocation();
    } else {
      [lat, lon] = airports[choice] || [0, 0];
    }

    const flights = await getFlights(lat, lon);

    flightTable.innerHTML = '';

    for (const flight of flights) {
      if (!flight[5] || !flight[6]) continue; // skip invalid coords

      const dist = haversineDistance(lat, lon, flight[6], flight[5]);

      if (dist <= 10) {
        const row = createFlightRow(flight, dist);
        flightTable.appendChild(row);
      }
    }

    if (!flightTable.children.length) {
      flightTable.innerHTML = '<p>No nearby flights within 10 NM.</p>';
    }
  } catch (e) {
    flightTable.innerHTML = `<p>Error: ${e.message}</p>`;
  }
}

window.onload = loadFlights;

document.getElementById('airport-select').addEventListener('change', loadFlights);
