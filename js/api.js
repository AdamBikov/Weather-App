/**
 * API module - Fetches weather and location data from Open-Meteo (free, no API key needed).
 */

/**
 * Gets coordinates (latitude/longitude) for a city name using the Open-Meteo Geocoding API.
 * Throws an error if the city is not found.
 */
export async function getCoordinates(city) {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`;
    const response = await fetch(geoUrl);
    const data = await response.json();
    if (!data.results || data.results.length === 0) {
        throw new Error('City not found.');
    }
    return data.results[0];
}

/**
 * Fetches complete weather data (current, daily, hourly) for given coordinates.
 * Daily: weather codes, min/max temp, UV index, sunrise/sunset
 * Hourly: rain probability, feels-like temp, weather codes
 * forecast_days=8 gives us today + 7 future days for the 7-day forecast.
 */
export async function getWeather(lat, lon) {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min,uv_index_max,sunrise,sunset&hourly=precipitation_probability,apparent_temperature,weathercode&timezone=auto&forecast_days=8`;
    const response = await fetch(weatherUrl);
    if (!response.ok) throw new Error('Error fetching weather data');
    return await response.json();
}