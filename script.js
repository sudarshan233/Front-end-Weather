// Add search functionality
const searchForm = document.getElementById('searchForm');
const cityInput = document.getElementById('cityInput');
const errorMessage = document.getElementById('errorMessage');

searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (city) {
    try {
      errorMessage.style.display = 'none';
      await fetchWeather(city);
      cityInput.value = '';
    } catch (error) {
      showError('Failed to fetch weather data');
    }
  }
});

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
  setTimeout(() => {
    errorMessage.style.display = 'none';
  }, 3000);
}

async function fetchWeather(city = 'Chennai') {
  try {
    const response = await fetch(`http://localhost:5002/weather?city=${city}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'City not found');
    }
    const data = await response.json();
    updateUI(data);
  } catch (error) {
    showError(error.message);
  }
}

function updateUI(data) {
  const current = data.current;
  const forecast = data.forecast;

  document.getElementById('city').textContent = data.city;
  document.getElementById('current-temp').textContent = `${current.temperature}°C`;
  document.getElementById('wind').textContent = `${current.windspeed} kmph`;
  document.getElementById('humidity').textContent = `${current.humidity}%`;
  document.getElementById('pressure').textContent = `${current.pressure || 'N/A'} hPa`; // fallback
  document.getElementById('air-quality').textContent = data.air_quality || 'Good';
  document.getElementById('condition').textContent = getWeatherCondition(current.weathercode);

  const time = new Date(current.time);
  document.getElementById('current-time').textContent = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const sunriseTime = new Date(forecast[0].sunrise);
  const sunsetTime = new Date(forecast[0].sunset);
  document.getElementById('sunrise').textContent = sunriseTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  document.getElementById('sunset').textContent = sunsetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // 7-day forecast
  const weeklyContainer = document.getElementById('weekly-forecast');
  weeklyContainer.innerHTML = forecast.map(day => `
    <div class="day-row">
      <div>${new Date(day.date).toLocaleDateString('en', { day:"2-digit", weekday: 'short' })}</div>
      <div>${Math.round(day.min_temp)}° / ${Math.round(day.max_temp)}°</div>
      <div style="font-size: 0.8rem;">UV: ${day.uv_index.toFixed(1)}</div>
    </div>
  `).join('');
}

// Optionally map weather codes to text
function getWeatherCondition(code) {
  const codes = {
    0: "Clear",
    1: "Mainly Clear",
    2: "Partly Cloudy",
    3: "Overcast",
    // Add more mappings if needed
  };
  return codes[code] || "Unknown";
}

// Initial load
fetchWeather();
