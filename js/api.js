/**
 * Модул за работа с външни API услуги.
 */
export async function getCoordinates(city) {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`;
    const response = await fetch(geoUrl);
    const data = await response.json();
    if (!data.results || data.results.length === 0) {
        throw new Error('Градът не е намерен.');
    }
    return data.results[0];
}

export async function getWeather(lat, lon) {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
    const response = await fetch(weatherUrl);
    return await response.json();
}