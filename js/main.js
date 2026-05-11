import { DOM, weatherIcons, weatherDescriptions } from './ui.js';
import { getCoordinates, getWeather } from './api.js';
import { saveToHistory, getHistory } from './storage.js';

let currentTempCelsius = null;
let isCelsius = true;

/**
 * Рендира историята на търсенията.
 */
function renderHistory() {
    const history = getHistory();
    DOM.historyContainer.innerHTML = '';
    history.forEach(city => {
        const btn = document.createElement('span');
        btn.className = 'history-item';
        btn.textContent = city;
        btn.onclick = () => fetchWeather(city);
        DOM.historyContainer.appendChild(btn);
    });
}

/**
 * Основна функция за визуализация.
 */
function displayWeather(data, name, country) {
    currentTempCelsius = data.temperature;
    isCelsius = true;
    DOM.unitToggle.textContent = 'Към °F';
    DOM.cityName.textContent = `${name}, ${country}`;
    DOM.temperature.textContent = `${Math.round(currentTempCelsius)}°C`;
    DOM.windSpeed.textContent = data.windspeed;

    const description = weatherDescriptions[data.weathercode] || "Неизвестно";
    DOM.weatherCondition.textContent = description;

    const iconClass = weatherIcons[data.weathercode] || "fa-cloud";
    DOM.weatherIcon.className = `fas ${iconClass} fa-3x`;

    const now = new Date();
    const formatter = new Intl.DateTimeFormat('bg-BG', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    DOM.lastUpdated.textContent = `Последно обновяване: ${formatter.format(now)} ч.`;
    
    DOM.weatherResult.style.display = 'block';
}

function displayForecast(dailyData) {
    const container = document.getElementById('forecast-container');
    container.innerHTML = ''; // Изчистваме старите данни
    container.style.display = 'grid';

    // Вземаме данните за следващите 5 дни (започваме от индекс 1, защото 0 е днес)
    for (let i = 1; i <= 5; i++) {
        const timestamp = dailyData.time[i];
        const date = new Date(timestamp).toLocaleDateString('bg-BG', { weekday: 'short' });
        const maxTemp = Math.round(dailyData.temperature_2m_max[i]);
        const weatherCode = dailyData.weathercode[i];
        
        const dayElement = document.createElement('div');
        dayElement.className = 'forecast-day';
        
        // Използваме твоя обект с икони от ui.js
        const iconClass = weatherIcons[weatherCode] || 'fa-cloud';
        
        dayElement.innerHTML = `
            <span class="forecast-date">${date}</span>
            <i class="fas ${iconClass}"></i>
            <span class="forecast-temp">${maxTemp}°</span>
        `;
        
        container.appendChild(dayElement);
    }
}

/**
 * Логика за fetch.
 */
async function fetchWeather(city) {
    DOM.loading.style.display = 'block';
    DOM.errorMessage.style.display = 'none';
    DOM.weatherResult.style.display = 'none';

    try {
        const geoData = await getCoordinates(city);
        const weatherData = await getWeather(geoData.latitude, geoData.longitude);
        
        displayWeather(weatherData.current_weather, geoData.name, geoData.country);
        displayForecast(weatherData.daily);
        saveToHistory(geoData.name);
        renderHistory();
    } catch (error) {
        DOM.errorMessage.textContent = error.message;
        DOM.errorMessage.style.display = 'block';
    } finally {
        DOM.loading.style.display = 'none';
    }
}

// Слушатели
DOM.searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const city = DOM.cityInput.value.trim();
    if (city) fetchWeather(city);
});

DOM.unitToggle.addEventListener('click', () => {
    if (currentTempCelsius === null) return;
    if (isCelsius) {
        const fahrenheit = (currentTempCelsius * 9/5) + 32;
        DOM.temperature.textContent = `${Math.round(fahrenheit)}°F`;
        DOM.unitToggle.textContent = 'Към °C';
    } else {
        DOM.temperature.textContent = `${Math.round(currentTempCelsius)}°C`;
        DOM.unitToggle.textContent = 'Към °F';
    }
    isCelsius = !isCelsius;
});

// Първоначално зареждане
renderHistory();