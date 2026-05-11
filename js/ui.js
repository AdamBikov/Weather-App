export const DOM = {
    searchForm: document.getElementById('search-form'),
    cityInput: document.getElementById('city-input'),
    weatherResult: document.getElementById('weather-result'),
    loading: document.getElementById('loading'),
    errorMessage: document.getElementById('error-message'),
    cityName: document.getElementById('city-name'),
    temperature: document.getElementById('temperature'),
    weatherCondition: document.getElementById('weather-condition'),
    weatherIcon: document.getElementById('weather-icon'),
    windSpeed: document.getElementById('wind-speed'),
    unitToggle: document.getElementById('unit-toggle'),
    historyContainer: document.getElementById('search-history'),
    lastUpdated: document.getElementById('last-updated')
};

export const weatherIcons = {
    0: "fa-sun", 1: "fa-cloud-sun", 2: "fa-cloud-sun", 3: "fa-cloud",
    45: "fa-smog", 48: "fa-smog", 51: "fa-cloud-rain", 61: "fa-cloud-showers-heavy",
    71: "fa-snowflake", 95: "fa-bolt-lightning"
};

export const weatherDescriptions = {
    0: "Ясно небе", 1: "Предимно ясно", 2: "Частична облачност", 3: "Облачно",
    45: "Мъгла", 61: "Слаб дъжд", 95: "Гръмотевична буря" // Можеш да си добавиш останалите
};