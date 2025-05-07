const axios = require('axios');

module.exports = async function (context, req) {
    const city = req.query.city || 'Chennai';
    
    try {
        // Step 1: Get coordinates
        const geoResponse = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
            params: {
                name: city,
                count: 1,
                format: 'json'
            }
        });
        
        if (!geoResponse.data.results || !geoResponse.data.results.length) {
            context.res = {
                status: 404,
                body: { error: `City '${city}' not found` }
            };
            return;
        }
        
        const lat = geoResponse.data.results[0].latitude;
        const lon = geoResponse.data.results[0].longitude;
        
        // Step 2: Fetch weather data
        const weatherResponse = await axios.get('https://api.open-meteo.com/v1/forecast', {
            params: {
                latitude: lat,
                longitude: lon,
                current_weather: true,
                daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max,sunrise,sunset',
                hourly: 'relative_humidity_2m',
                timezone: 'auto'
            }
        });
        
        const weatherData = weatherResponse.data;
        
        if (!weatherData.current_weather || !weatherData.daily) {
            context.res = {
                status: 500,
                body: { error: 'Invalid weather data received' }
            };
            return;
        }
        
        // Process data
        const processedData = {
            city: city,
            current: {
                temperature: weatherData.current_weather.temperature || 'N/A',
                windspeed: weatherData.current_weather.windspeed || 'N/A',
                weathercode: weatherData.current_weather.weathercode || 'N/A',
                time: weatherData.current_weather.time || 'N/A',
                humidity: weatherData.hourly?.relative_humidity_2m?.[0] ?? 'Data not available',
                pressure: 'N/A'
            },
            forecast: weatherData.daily.time.map((time, i) => ({
                date: time,
                max_temp: weatherData.daily.temperature_2m_max[i],
                min_temp: weatherData.daily.temperature_2m_min[i],
                precipitation: weatherData.daily.precipitation_sum[i],
                uv_index: weatherData.daily.uv_index_max[i],
                sunrise: weatherData.daily.sunrise[i],
                sunset: weatherData.daily.sunset[i]
            }))
        };
        
        context.res = {
            status: 200,
            body: processedData,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
    } catch (error) {
        context.res = {
            status: 500,
            body: { error: error.message || 'Failed to fetch weather data' }
        };
    }
};
