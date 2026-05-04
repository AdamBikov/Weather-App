// Селектиране на елементи
const searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const weatherResult = document.getElementById('weather-result');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');

// Елементи за данни
const cityName = document.getElementById('city-name');
const temperature = document.getElementById('temperature');
const weatherCondition = document.getElementById('weather-condition');
const weatherIcon = document.getElementById('weather-icon');
const windSpeed = document.getElementById('wind-speed');

// Слушател за изпращане на формата
searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const city = cityInput.value.trim();
    if (city) {
        // Тук ще извикаме функцията за fetchWeather(city)
        console.log("Търсене за:", city);
    }
});
// Помощни функции за интерфейса
function showLoading() {
    loading.style.display = 'block';
    errorMessage.style.display = 'none';
    weatherResult.style.display = 'none';
}

function hideLoading() {
    loading.style.display = 'none';
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    weatherResult.style.display = 'none';
}
async function fetchWeather(city) {
    showLoading();
    try {
        // Стъпка 1: Геокодиране (Град -> Координати)
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`;
        const geoResponse = await fetch(geoUrl);
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error('Градът не е намерен. Моля, проверете изписването.');
        }

        const { latitude, longitude, name, country } = geoData.results[0];

        // Стъпка 2: Вземане на времето по координати
        // Използваме current_weather=true за базови данни
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();

        // Показваме данните в конзолата за тест
        console.log("Данни за времето:", weatherData);
        
        // Тук ще извикаме функцията за визуализация (displayWeather)
        displayWeather(weatherData.current_weather, name, country);

    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}
searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const city = cityInput.value.trim();
    if (city) {
        fetchWeather(city); // Извикваме логиката за API
    }
});