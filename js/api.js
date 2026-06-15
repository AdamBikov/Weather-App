/**
 * API module for fetching weather and location data from external services.
 */

// Fetch city coordinates using Open-Meteo Geocoding API
export async function getCoordinates(city) {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`;
    const response = await fetch(geoUrl);
    const data = await response.json();
    if (!data.results || data.results.length === 0) {
        throw new Error('City not found.');
    }
    return data.results[0];
}

// Fetch weather data using Open-Meteo Weather API
export async function getWeather(lat, lon) {
    // Request current weather, daily and hourly data for comprehensive forecast
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=weathercode,temperature_2m_max,uv_index_max,sunrise,sunset&hourly=precipitation_probability,apparent_temperature&timezone=auto`;
    const response = await fetch(weatherUrl);
    if (!response.ok) throw new Error('Error fetching weather data');
    return await response.json();
}