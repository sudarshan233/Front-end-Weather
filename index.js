// Weather API configuration with CORS proxy
const CORS_PROXY = "https://cors-anywhere.herokuapp.com/";
const GEO_API_URL = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast";

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
      showError(error.message || 'Failed to fetch weather data');
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

async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 8000 } = options;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const response = await fetch(resource, {
    ...options,
    signal: controller.signal  
  });
  clearTimeout(id);

  return response;
}

async function fetchWeather(city = 'Chennai') {
  try {
    // Step 1: Get coordinates with CORS proxy
    const geoResponse = await fetchWithTimeout(
      `${CORS_PROXY}${GEO_API_URL}?name=${encodeURIComponent(city)}&count=1&format=json`
    );
    
    if (!geoResponse.ok) {
      throw new Error(`Geocoding API error: ${geoResponse.status}`);
    }
    
    const geoData = await geoResponse.json();
    
    if (!geoData.results || !geoData.results.length) {
      throw new Error(`City '${city}' not found`);
    }
    
    const lat = geoData.results[0].latitude;
    const lon = geoData.results[0].longitude;
    
    // Step 2: Fetch weather data with CORS proxy
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      current_weather: 'true',
      daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max,sunrise,sunset',
      hourly: 'relative_humidity_2m',
      timezone: 'auto'
    });
    
    const weatherResponse = await fetchWithTimeout(
      `${CORS_PROXY}${WEATHER_API_URL}?${params}`
    );
    
    if (!weatherResponse.ok) {
      throw new Error(`Weather API error: ${weatherResponse.status}`);
    }
    
    const weatherData = await weatherResponse.json();
    
    if (!weatherData.current_weather || !weatherData.daily) {
      throw new Error('Invalid weather data received');
    }
    
    // Process data
    const processedData = processWeatherData(city, weatherData);
    updateUI(processedData);
    
  } catch (error) {
    console.error('Weather fetch error:', error);
    showError(error.message.includes('aborted') ? 
      'Request timed out. Please try again.' : 
      error.message);
  }
}

// ... rest of your code remains the same (processWeatherData, updateUI, getWeatherCondition) ...

// Initial load
fetchWeather();
