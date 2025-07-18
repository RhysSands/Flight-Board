const flightTable = document.querySelector('.flight-table');
const locationSelect = document.getElementById('location-select');

const airports = {
  cyyz: { lat: 43.6777, lon: -79.6248 },
  rksi: { lat: 37.4602, lon: 126.4407 },
  kjfk: { lat: 40.6413, lon: -73.7781 },
  haneda: { lat: 35.5494, lon: 139.7798 },
  heathrow: { lat: 51.4700, lon: -0.4543 },
  munich: { lat: 48.3538, lon: 11.7861 }
};

const OPENSKY_USERNAME = ''; // Leave blank if not using API login
const OPENSKY_PASSWORD = '';

async function getLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve([pos.coords.latitude, pos.coords.longitude]),
      err => reject(err)
    );
  });
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))) * 0.539957; // convert km to NM
}

async function getFlights(lat, lon) {
  const url = `https://opensky-network.org/api/states/all?lamin=${lat - 0.2}&lomin=${lon - 0.2}&lamax=${lat + 0.2}&lomax=${lon + 0.2}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.states || [];
}

function getAirlineIcao(flight) {
  return (flight[1] || '').slice(0, 3).toUpperCase();
}

function getLogoUrl(icao) {
  return `https://content.airhex.com/content/logos/airlines_${icao}_100_100_s.png`;
}

function createFlightRow(flight, distance) {
  const flightNumber = flight[1] || 'N/A';
  const altitude = flight[7] ? Math.round(flight[7]) + ' ft' : 'N/A';
  const speed = flight[9] ? Math.round(flight[9] * 1.94384) + ' kt' : 'N/A';
  const dist = distance.toFixed(1) + ' NM';
  const icao = getAirlineIcao(flight);
  const logo = getLogoUrl(icao);

  const row = document.createElement('div');
  row.className = 'flight-row';

  row.innerHTML = `
    <img src="${logo}" class="flight-logo" onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg'">
    <div class="flight-info">
      <span><strong>Flight:</strong> ${flightNumber}</span>
      <span><strong>Altitude:</strong> ${altitude}</span>
      <span><strong>Speed:</strong> ${speed}</span>
      <span><strong>Distance:</strong> ${dist}</span>
    </div>
  `;
  return row;
}

async function updateBoard() {
  try {
    let lat, lon;
    const selected = locationSelect.value;

    if (selected === 'your-location') {
      [lat, lon] = await getLocation();
    } else {
      lat = airports[selected].lat;
      lon = airports[selected].lon;
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

// Run on page load
window.onload = () => {
  updateBoard();
  // Listen for dropdown changes
  locationSelect.addEventListener('change', updateBoard);
};
