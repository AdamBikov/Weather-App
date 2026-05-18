import { DOM, weatherIcons, weatherDescriptions } from './ui.js';
import { getCoordinates, getWeather } from './api.js';
import { saveToHistory, getHistory } from './storage.js';

let currentTempCelsius = null;
let isCelsius = true;

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

function displayWeather(data, name, country, dailyData, hourlyData) {
    currentTempCelsius = data.temperature;
    isCelsius = true;
    DOM.unitToggle.textContent = 'Към °F';
    DOM.cityName.textContent = `${name}, ${country}`;
    DOM.temperature.textContent = `${Math.round(currentTempCelsius)}°C`;
    
    // Вкарваме вятъра директно в новия му уиджет с мерна единица
    DOM.windSpeed.textContent = `${data.windspeed} км/ч`;

    const currentHourIndex = new Date().getHours();

    // ДОПЪЛНИТЕЛНА ФУНКЦИЯ 1: Усеща се като (от hourly)
    if (hourlyData && hourlyData.apparent_temperature) {
        const feelsLike = hourlyData.apparent_temperature[currentHourIndex];
        DOM.apparentTemp.textContent = `${Math.round(feelsLike)}°C`;
    } else {
        DOM.apparentTemp.textContent = `--°C`;
    }

    // ДОПЪЛНИТЕЛНА ФУНКЦИЯ 2: UV Индекс (от daily)
    if (dailyData && dailyData.uv_index_max) {
        const uv = dailyData.uv_index_max[0];
        let risk = "Нисък";
        if (uv >= 3 && uv < 6) risk = "Умерен";
        if (uv >= 6) risk = "Висок";
        DOM.uvIndex.textContent = `${uv} (${risk})`;
    } else {
        DOM.uvIndex.textContent = `--`;
    }

    // ДОПЪЛНИТЕЛНА ФУНКЦИЯ 3: Вероятност за валежи (от hourly)
    if (hourlyData && hourlyData.precipitation_probability) {
        const rainChance = hourlyData.precipitation_probability[currentHourIndex];
        DOM.rainChance.textContent = `${rainChance}%`;
    } else {
        DOM.rainChance.textContent = `--%`;
    }

    // ДОПЪЛНИТЕЛНА ФУНКЦИЯ 5: Изгрев и Залез (от daily)
    if (dailyData && dailyData.sunrise && dailyData.sunset) {
        const sunriseHTML = dailyData.sunrise[0].split('T')[1];
        const sunsetHTML = dailyData.sunset[0].split('T')[1];
        DOM.sunriseTime.innerHTML = `<i class="fas fa-sun"></i> Изгрев: ${sunriseHTML}`;
        DOM.sunsetTime.innerHTML = `<i class="fas fa-moon"></i> Залез: ${sunsetHTML}`;
    } else {
        DOM.sunriseTime.innerHTML = `<i class="fas fa-sun"></i> Изгрев: --:--`;
        DOM.sunsetTime.innerHTML = `<i class="fas fa-moon"></i> Залез: --:--`;
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

function displayHourly(hourlyData) {
    DOM.hourlyContainer.innerHTML = '';
    DOM.hourlyContainer.style.display = 'flex';

    const currentHour = new Date().getHours();

    for (let i = currentHour; i < currentHour + 10; i++) {
        if (i >= hourlyData.time.length) break;

        const rawTime = new Date(hourlyData.time[i]);
        const formattedHour = rawTime.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });
        const temp = Math.round(hourlyData.apparent_temperature[i]);
        const code = hourlyData.precipitation_probability[i];
        
        const iconClass = code > 30 ? 'fa-cloud-showers-heavy' : 'fa-clock';

        const hourBox = document.createElement('div');
        hourBox.className = 'hourly-item-box';
        hourBox.innerHTML = `
            <span>${formattedHour}</span>
            <i class="fas ${iconClass}"></i>
            <span>${temp}°</span>
        `;
        DOM.hourlyContainer.appendChild(hourBox);
    }
}

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

async function fetchWeather(city) {
    DOM.loading.style.display = 'block';
    DOM.errorMessage.style.display = 'none';
    DOM.weatherResult.style.display = 'none';

    try {
        const geoData = await getCoordinates(city);
        const weatherData = await getWeather(geoData.latitude, geoData.longitude);
        
        displayWeather(
            weatherData.current_weather, 
            geoData.name, 
            geoData.country, 
            weatherData.daily, 
            weatherData.hourly
        );
        
        displayHourly(weatherData.hourly);
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