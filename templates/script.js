require('dotenv').config();
const apiKey = process.env.OPENWEATHERMAP_KEY;
API_KEY = os.getenv("OPENWEATHERMAP_KEY")

const weatherUrl = 'https://api.openweathermap.org/data/2.5/weather';

let map = L.map('map').setView([40.6892, -74.0445], 7); // Statue of Liberty, New York

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let routeLayer;

// Function to fetch weather data for a given lat/lng
async function fetchWeather(lat, lng) {
  const url = `${weatherUrl}?lat=${lat}&lon=${lng}&appid=${weatherApiKey}&units=metric`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error("Failed to fetch weather data");
      return;
    }

    const weatherData = await response.json();
    console.log("Weather Data for ", lat, lng, ": ", weatherData);

    const temperature = weatherData.main.temp;
    const weatherDescription = weatherData.weather[0].description;
    const weatherInfo = `Temp: ${temperature}°C, ${weatherDescription}`;

    // Add marker with popup to map
    L.marker([lat, lng])
      .addTo(map)
      .bindPopup(`Weather: ${weatherInfo}`)
      .openPopup();

  } catch (error) {
    console.error("Error fetching weather data:", error);
  }
}

// Main function to get route and call weather
async function showRoute() {
  const startLat = document.getElementById("startLat").value;
  const startLng = document.getElementById("startLng").value;
  const endLat = document.getElementById("endLat").value;
  const endLng = document.getElementById("endLng").value;

  console.log("Start Lat:", startLat, "Start Lng:", startLng);
  console.log("End Lat:", endLat, "End Lng:", endLng);

  const apiKey = '5b3ce3597851110001cf62488b10c6a5af6841dd99de84c31cedd20c';
  const url = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';

  const body = {
    coordinates: [
      [parseFloat(startLng), parseFloat(startLat)],
      [parseFloat(endLng), parseFloat(endLat)]
    ]
  };

  console.log("Request Body:", body);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    console.log("Response Status:", response.status);

    if (!response.ok) {
      const error = await response.json();
      console.log("Error:", error);
      alert("Failed to fetch route");
      return;
    }

    const data = await response.json();
    console.log("API Data:", data);

    if (data.features && data.features.length > 0) {
      const coords = data.features[0].geometry.coordinates;
      console.log("Coordinates:", coords);

      const latlngs = coords.map(coord => [coord[1], coord[0]]);
      console.log("LatLngs:", latlngs);

      if (routeLayer) {
        map.removeLayer(routeLayer);
      }

      routeLayer = L.polyline(latlngs, { color: 'blue', weight: 5 }).addTo(map);
      map.fitBounds(routeLayer.getBounds());

      // OPTIONAL: You can limit this if it's too many points
      for (let i = 0; i < latlngs.length; i += Math.ceil(latlngs.length / 5)) {
        const [lat, lng] = latlngs[i];
        console.log(`Fetching weather for point ${i + 1} at ${lat}, ${lng}`);
        await fetchWeather(lat, lng);
      }

    } else {
      alert("No route found.");
    }

  } catch (error) {
    console.log("Error:", error);
    alert("An error occurred while fetching the route.");
  }
}
