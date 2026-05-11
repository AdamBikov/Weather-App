let currentTempCelsius = null;
let isCelsius = true;
/**
 * Обект, съдържащ референции към всички важни DOM елементи.
 */
const DOM = {
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
    lastUpdated: document.getElementById('last-updated'),
};

const weatherIcons = {
    0: "fa-sun",                          // Ясно небе
    1: "fa-cloud-sun", 2: "fa-cloud-sun",  // Предимно ясно
    3: "fa-cloud",                        // Облачно
    45: "fa-smog", 48: "fa-smog",         // Мъгла
    51: "fa-cloud-rain", 61: "fa-cloud-showers-heavy", // Дъжд
    71: "fa-snowflake",                   // Сняг
    95: "fa-bolt-lightning"               // Буря
};

// Речник за кодовете на времето (за по-добра визуализация)
const weatherDescriptions = {
    0: "Ясно небе",
    1: "Предимно ясно", 2: "Частична облачност", 3: "Облачно",
    45: "Мъгла", 48: "Скреж",
    51: "Слаб ръмеж", 53: "Умерен ръмеж", 55: "Силен ръмеж",
    61: "Слаб дъжд", 63: "Умерен дъжд", 65: "Силен дъжд",
    71: "Слаб снеговалеж", 73: "Умерен снеговалеж", 75: "Силен снеговалеж",
    95: "Гръмотевична буря"
};

/**
 * Показва индикатора за зареждане.
 */
function showLoading() {
    DOM.loading.style.display = 'block';
    DOM.errorMessage.style.display = 'none';
    DOM.weatherResult.style.display = 'none';
}

/**
 * Скрива индикатора за зареждане.
 */
function hideLoading() {
    DOM.loading.style.display = 'none';
}

/**
 * Показва съобщение за грешка.
 */
function showError(message) {
    DOM.errorMessage.textContent = message;
    DOM.errorMessage.style.display = 'block';
    DOM.weatherResult.style.display = 'none';
}

/**
 * Визуализира данните за времето в интерфейса.
 */
function displayWeather(data, name, country) {
    currentTempCelsius = data.temperature; 
    isCelsius = true; 
    DOM.unitToggle.textContent = 'Към °F';
    DOM.cityName.textContent = `${name}, ${country}`;
    DOM.windSpeed.textContent = data.windspeed;
    DOM.temperature.textContent = `${Math.round(currentTempCelsius)}°C`;

    const description = weatherDescriptions[data.weathercode] || "Неизвестно";
    DOM.weatherCondition.textContent = description;

    const iconClass = weatherIcons[data.weathercode] || "fa-cloud";
    DOM.weatherIcon.className = `fas ${iconClass} fa-3x`; 

    DOM.weatherResult.style.display = 'block';

    const now = new Date();
    const formatter = new Intl.DateTimeFormat('bg-BG', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
});

DOM.lastUpdated.textContent = `Последно обновяване: ${formatter.format(now)} ч.`;
}

/**
 * Записва град в LocalStorage и обновява интерфейса.
 */
function addToHistory(city) {
    let history = JSON.parse(localStorage.getItem('weatherHistory')) || [];
    
    // Проверка дали градът вече го има (за да няма дубликати)
    if (!history.includes(city)) {
        history.push(city);
        // Пазим само последните 5 търсения
        if (history.length > 5) history.shift();
        
        localStorage.setItem('weatherHistory', JSON.stringify(history));
        renderHistory();
    }
}

/**
 * Изчертава историята в HTML.
 */
function renderHistory() {
    const history = JSON.parse(localStorage.getItem('weatherHistory')) || [];
    DOM.historyContainer.innerHTML = ''; // Чистим старите
    
    history.forEach(city => {
        const btn = document.createElement('span');
        btn.className = 'history-item';
        btn.textContent = city;
        btn.onclick = () => fetchWeather(city); // При клик търси града отново
        DOM.historyContainer.appendChild(btn);
    });
}

/**
 * Основна функция за извличане на данни от API.
 * @param {string} city - Името на града.
 */
async function fetchWeather(city) {
    showLoading();
    try {
        // 1. Геокодиране
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`;
        const geoResponse = await fetch(geoUrl);
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error('Градът не е намерен. Моля, проверете изписването.');
        }

        const { latitude, longitude, name, country } = geoData.results[0];

        // 2. Вземане на времето
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();

        displayWeather(weatherData.current_weather, name, country);
        addToHistory(name);

    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

// Слушател за формата
DOM.searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const city = DOM.cityInput.value.trim();
    if (city) {
        fetchWeather(city);
    }
});
DOM.unitToggle.addEventListener('click', () => {
    if (currentTempCelsius === null) return; // Ако още няма данни, не прави нищо

    if (isCelsius) {
        // Превръщаме в Fahrenheit
        const fahrenheit = (currentTempCelsius * 9/5) + 32;
        DOM.temperature.textContent = `${Math.round(fahrenheit)}°F`;
        DOM.unitToggle.textContent = 'Към °C';
    } else {
        // Връщаме в Celsius
        DOM.temperature.textContent = `${Math.round(currentTempCelsius)}°C`;
        DOM.unitToggle.textContent = 'Към °F';
    }
    
    isCelsius = !isCelsius; // Обръщаме състоянието (true -> false или false -> true)
});
renderHistory(); // Зарежда историята веднага щом се отвори приложението