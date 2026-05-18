import { DOM, weatherIcons, weatherDescriptions } from './ui.js';
import { getCoordinates, getWeather } from './api.js';
import { saveToHistory, getHistory } from './storage.js';

let currentTempCelsius = null;
let isCelsius = true;

/**
 * Рендира историята на търсенията от LocalStorage.
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
 * Основна функция за визуализация на текущото време.
 * ЗАБЕЛЕЖКА: Вече приема и пети параметър "hourlyData" за вероятността за валежи.
 */
function displayWeather(data, name, country, dailyData, hourlyData) {
    currentTempCelsius = data.temperature;
    isCelsius = true;
    DOM.unitToggle.textContent = 'Към °F';
    DOM.cityName.textContent = `${name}, ${country}`;
    DOM.temperature.textContent = `${Math.round(currentTempCelsius)}°C`;
    DOM.windSpeed.textContent = data.windspeed;

    // Намираме индекса на текущия час в почасовите данни (по подразбиране Open-Meteo връща текущия ден)
    const currentHourIndex = new Date().getHours();

    // ДОПЪЛНИТЕЛНА ФУНКЦИЯ 1: Усеща се като (Реално време от hourly)
    if (hourlyData && hourlyData.apparent_temperature) {
        const feelsLike = hourlyData.apparent_temperature[currentHourIndex];
        DOM.apparentTemp.textContent = `Усеща се като: ${Math.round(feelsLike)}°C`;
    } else {
        DOM.apparentTemp.textContent = `Усеща се като: --°C`;
    }

    // ДОПЪЛНИТЕЛНА ФУНКЦИЯ 2: UV Индекс (Максимален за деня)
    if (dailyData && dailyData.uv_index_max) {
        const uv = dailyData.uv_index_max[0];
        let risk = "Нисък";
        if (uv >= 3 && uv < 6) risk = "Умерен";
        if (uv >= 6) risk = "Висок";
        DOM.uvIndex.textContent = `UV Индекс: ${uv} (${risk})`;
    } else {
        DOM.uvIndex.textContent = `UV Индекс: --`;
    }

    // ДОПЪЛНИТЕЛНА ФУНКЦИЯ 3: Вероятност за валежи (Вземаме текущия час)
    if (hourlyData && hourlyData.precipitation_probability) {
        const rainChance = hourlyData.precipitation_probability[currentHourIndex];
        DOM.rainChance.textContent = `Шанс за дъжд: ${rainChance}%`;
    } else {
        DOM.rainChance.textContent = `Шанс за дъжд: --%`;
    }

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

/**
 * Визуализира 5-дневната прогноза в Grid структура.
 */
function displayForecast(dailyData) {
    const container = document.getElementById('forecast-container');
    container.innerHTML = '';
    container.style.display = 'grid';

    for (let i = 1; i <= 5; i++) {
        const timestamp = dailyData.time[i];
        const date = new Date(timestamp).toLocaleDateString('bg-BG', { weekday: 'short' });
        const maxTemp = Math.round(dailyData.temperature_2m_max[i]);
        const weatherCode = dailyData.weathercode[i];
        
        const dayElement = document.createElement('div');
        dayElement.className = 'forecast-day';
        
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
 * Основна асинхронна функция за извличане на данните.
 */
async function fetchWeather(city) {
    DOM.loading.style.display = 'block';
    DOM.errorMessage.style.display = 'none';
    DOM.weatherResult.style.display = 'none';

    try {
        const geoData = await getCoordinates(city);
        const weatherData = await getWeather(geoData.latitude, geoData.longitude);
        
        // КЛЮЧОВА ПРОМЯНА: Подаваме и weatherData.hourly като 5-ти параметър
        displayWeather(
            weatherData.current_weather, 
            geoData.name, 
            geoData.country, 
            weatherData.daily, 
            weatherData.hourly
        );
        
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

renderHistory();