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
