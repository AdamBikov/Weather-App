import { DOM, weatherIcons, weatherDescriptions, translations } from './ui.js';
import { getCoordinates, getWeather } from './api.js';
import { saveToHistory, getHistory } from './storage.js';

let currentTempCelsius = null;
let isCelsius = true;
let currentWeatherData = null; // Пази суровите данни от API-то за преизчисляване при смяна на °C/°F
let currentLang = localStorage.getItem('app_lang') || null;
let map;
let marker;

// --- ИНТЕРНАЦИОНАЛИЗАЦИЯ (ЕЗИЦИ) ---
function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('app_lang', lang);
    const t = translations[lang];

    // Смяна на статичните текстове в главния интерфейс
    document.querySelector('h1').textContent = t.title;
    DOM.cityInput.placeholder = t.placeholder;
    document.querySelector('button[type="submit"]').textContent = t.search;
    DOM.loading.textContent = t.loading;
    
    // Смяна на етикетите вътре в самите уиджети чрез съседните им елементи
    if (DOM.apparentTemp) DOM.apparentTemp.previousElementSibling.textContent = t.feelsLike;
    if (DOM.uvIndex) DOM.uvIndex.previousElementSibling.textContent = t.uvIndex;
    if (DOM.rainChance) DOM.rainChance.previousElementSibling.textContent = t.rainChance;
    if (DOM.windSpeed) DOM.windSpeed.previousElementSibling.textContent = t.wind;
    
    // Обновяване на бутона за мерни единици спрямо езика
    updateToggleButtonText();

    // Ако вече има заредено време на екрана, преначертаваме текстовете му веднага
    if (currentWeatherData && DOM.weatherResult.style.display === 'block') {
        refreshWeatherDisplay();
    }
}

function checkLanguage() {
    const modal = document.getElementById('language-modal');
    if (!currentLang) {
        modal.style.display = 'flex'; // Показваме попъпа при първо влизане
    } else {
        applyLanguage(currentLang);
    }

    // Закачане на събития за езиковите бутони в попъпа
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const selectedLang = e.currentTarget.getAttribute('data-lang');
            applyLanguage(selectedLang);
            modal.style.display = 'none';
            // След избор на език, автоматично пускаме геолокацията за по-добро изживяване
            DOM.locationBtn.click();
        });
    });
}

function updateToggleButtonText() {
    const isBg = currentLang === 'bg';
    if (isCelsius) {
        DOM.unitToggle.textContent = isBg ? 'Към °F' : 'To °F';
    } else {
        DOM.unitToggle.textContent = isBg ? 'Към °C' : 'To °C';
    }
}

// --- МАТЕМАТИЧЕСКО КОНВЕРТИРАНЕ НА ГРАДУСИ ---
function convertTemp(celsius) {
    return isCelsius ? Math.round(celsius) : Math.round((celsius * 9/5) + 32);
}

// --- РЕНДИРАНЕ НА ИСТОРИЯТА ---
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

// --- РЕНДИРАНЕ НА ВРЕМЕТО (ОБНОВЕНА) ---
function displayWeather(data, name, country, dailyData, hourlyData) {
    currentTempCelsius = data.temperature;
    const unit = isCelsius ? '°C' : '°F';
    const t = translations[currentLang] || translations.en;
    
    DOM.cityName.textContent = `${name}, ${country}`;
    DOM.temperature.textContent = `${convertTemp(currentTempCelsius)}${unit}`;
    DOM.windSpeed.textContent = `${data.windspeed} км/ч`;

    const currentHourIndex = new Date().getHours();

    // 1. Усеща се като (Конвертиран)
    if (hourlyData && hourlyData.apparent_temperature) {
        const feelsLike = hourlyData.apparent_temperature[currentHourIndex];
        DOM.apparentTemp.textContent = `${convertTemp(feelsLike)}${unit}`;
    } else {
        DOM.apparentTemp.textContent = `--${unit}`;
    }

    // 2. UV Индекс
    if (dailyData && dailyData.uv_index_max) {
        const uv = dailyData.uv_index_max[0];
        let risk = t.riskLow;
        if (uv >= 3 && uv < 6) risk = t.riskMed;
        if (uv >= 6) risk = t.riskHigh;
        DOM.uvIndex.textContent = `${uv} (${risk})`;
    } else {
        DOM.uvIndex.textContent = `--`;
    }

    // 3. Шанс за дъжд
    if (hourlyData && hourlyData.precipitation_probability) {
        const rainChance = hourlyData.precipitation_probability[currentHourIndex];
        DOM.rainChance.textContent = `${rainChance}%`;
    } else {
        DOM.rainChance.textContent = `--%`;
    }

    // 4. Изгрев и Залез
    if (dailyData && dailyData.sunrise && dailyData.sunset) {
        const sunriseHTML = dailyData.sunrise[0].split('T')[1];
        const sunsetHTML = dailyData.sunset[0].split('T')[1];
        DOM.sunriseTime.innerHTML = `<i class="fas fa-sun"></i> ${t.sunrise}: ${sunriseHTML}`;
        DOM.sunsetTime.innerHTML = `<i class="fas fa-moon"></i> ${t.sunset}: ${sunsetHTML}`;
    } else {
        DOM.sunriseTime.innerHTML = `<i class="fas fa-sun"></i> ${t.sunrise}: --:--`;
        DOM.sunsetTime.innerHTML = `<i class="fas fa-moon"></i> ${t.sunset}: --:--`;
    }

    const description = weatherDescriptions[data.weathercode] || "Неизвестно";
    DOM.weatherCondition.textContent = description;

    const iconClass = weatherIcons[data.weathercode] || "fa-cloud";
    DOM.weatherIcon.className = `fas ${iconClass} fa-3x`;

    const now = new Date();
    const formatter = new Intl.DateTimeFormat(currentLang === 'bg' ? 'bg-BG' : 'en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    DOM.lastUpdated.textContent = `${t.updated}: ${formatter.format(now)} ч.`;
    
    DOM.weatherResult.style.display = 'block';
}

// --- ПОЧАСОВА ПРОГНОЗА (ОБНОВЕНА НАВСЯКЪДЕ) ---
function displayHourly(hourlyData) {
    DOM.hourlyContainer.innerHTML = '';
    DOM.hourlyContainer.style.display = 'flex';
    const currentHour = new Date().getHours();
    const unit = isCelsius ? '°' : '°F';

    for (let i = currentHour; i < currentHour + 10; i++) {
        if (i >= hourlyData.time.length) break;
        const rawTime = new Date(hourlyData.time[i]);
        const formattedHour = rawTime.toLocaleTimeString(currentLang === 'bg' ? 'bg-BG' : 'en-US', { hour: '2-digit', minute: '2-digit' });
        
        const temp = convertTemp(hourlyData.apparent_temperature[i]);
        const code = hourlyData.precipitation_probability[i];
        const iconClass = code > 30 ? 'fa-cloud-showers-heavy' : 'fa-clock';

        const hourBox = document.createElement('div');
        hourBox.className = 'hourly-item-box';
        hourBox.innerHTML = `
            <span>${formattedHour}</span>
            <i class="fas ${iconClass}"></i>
            <span>${temp}${unit}</span>
        `;
        DOM.hourlyContainer.appendChild(hourBox);
    }
}

// --- 5-ДНЕВНА ПРОГНОЗА (ОБНОВЕНА НАВСЯКЪДЕ) ---
function displayForecast(dailyData) {
    const container = document.getElementById('forecast-container');
    container.innerHTML = '';
    container.style.display = 'grid';
    const unit = isCelsius ? '°' : '°F';

    for (let i = 1; i <= 5; i++) {
        const timestamp = dailyData.time[i];
        const date = new Date(timestamp).toLocaleDateString(currentLang === 'bg' ? 'bg-BG' : 'en-US', { weekday: 'short' });
        
        const maxTemp = convertTemp(dailyData.temperature_2m_max[i]);
        const weatherCode = dailyData.weathercode[i];
        const dayElement = document.createElement('div');
        dayElement.className = 'forecast-day';
        const iconClass = weatherIcons[weatherCode] || 'fa-cloud';
        
        dayElement.innerHTML = `
            <span class="forecast-date">${date}</span>
            <i class="fas ${iconClass}"></i>
            <span class="forecast-temp">${maxTemp}${unit}</span>
        `;
        container.appendChild(dayElement);
    }
}

// Помощна функция за бързо преначертаване при суичване на език/мерни единици
function refreshWeatherDisplay() {
    const namePart = DOM.cityName.textContent.split(',')[0].trim();
    const countryPart = DOM.cityName.textContent.split(',')[1]?.trim() || '';
    
    displayWeather(
        currentWeatherData.current_weather, 
        namePart, 
        countryPart, 
        currentWeatherData.daily, 
        currentWeatherData.hourly
    );
    displayHourly(currentWeatherData.hourly);
    displayForecast(currentWeatherData.daily);
}

// --- ИЗВЛИЧАНЕ ПО ИМЕ НА ГРАД ---
async function fetchWeather(city) {
    DOM.loading.style.display = 'block';
    DOM.errorMessage.style.display = 'none';
    DOM.weatherResult.style.display = 'none';

    try {
        const geoData = await getCoordinates(city);
        const weatherData = await getWeather(geoData.latitude, geoData.longitude);
        
        currentWeatherData = weatherData; // Записваме в глобалната променлива
        
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

        if (map && marker) {
            map.flyTo([geoData.latitude, geoData.longitude], 8);
            marker.setLatLng([geoData.latitude, geoData.longitude]);
        }
    } catch (error) {
        DOM.errorMessage.textContent = error.message;
        DOM.errorMessage.style.display = 'block';
    } finally {
        DOM.loading.style.display = 'none';
    }
}

// --- ИНИЦИАЛИЗАЦИЯ НА ИНТЕРАКТИВНА КАРТА ---
function initMap() {
    const defaultLat = 42.6977;
    const defaultLon = 23.3219;
    map = L.map('map').setView([defaultLat, defaultLon], 6);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(map);

    marker = L.marker([defaultLat, defaultLon]).addTo(map);

    map.on('click', async function(e) {
        const lat = e.latlng.lat;
        const lon = e.latlng.lng;
        marker.setLatLng([lat, lon]);

        DOM.loading.style.display = 'block';
        DOM.errorMessage.style.display = 'none';
        DOM.weatherResult.style.display = 'none';

        try {
            const reverseGeoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=${currentLang || 'en'}`;
            const geoResponse = await fetch(reverseGeoUrl);
            const geoData = await geoResponse.json();
            
            const address = geoData.address || {};
            const cityName = address.city || address.town || address.village || address.municipality || "Selected Location";
            const countryName = address.country || "";

            const weatherData = await getWeather(lat, lon);
            currentWeatherData = weatherData; // Записваме в глобалната променлива

            displayWeather(
                weatherData.current_weather, 
                cityName, 
                countryName, 
                weatherData.daily, 
                weatherData.hourly
            );
            
            displayHourly(weatherData.hourly);
            displayForecast(weatherData.daily);
        } catch (error) {
            DOM.errorMessage.textContent = error.message;
            DOM.errorMessage.style.display = 'block';
        } finally {
            DOM.loading.style.display = 'none';
        }
    });
}

// --- СЛУШАТЕЛИ ЗА СЪБИТИЯ (EVENT LISTENERS) ---
DOM.searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const city = DOM.cityInput.value.trim();
    if (city) fetchWeather(city);
});

DOM.locationBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
        alert('Геолокацията не се поддържа от вашия браузър.');
        return;
    }
    DOM.loading.style.display = 'block';
    DOM.errorMessage.style.display = 'none';
    DOM.weatherResult.style.display = 'none';

    navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        if (map && marker) {
            map.flyTo([lat, lon], 10);
            marker.setLatLng([lat, lon]);
        }

        try {
            const reverseGeoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=${currentLang || 'en'}`;
            const geoResponse = await fetch(reverseGeoUrl);
            const geoData = await geoResponse.json();
            
            const address = geoData.address || {};
            const cityName = address.city || address.town || address.village || "Current Location";
            const countryName = address.country || "";

            const weatherData = await getWeather(lat, lon);
            currentWeatherData = weatherData; // Записваме в глобалната променлива

            displayWeather(
                weatherData.current_weather, 
                cityName, 
                countryName, 
                weatherData.daily, 
                weatherData.hourly
            );
            
            displayHourly(weatherData.hourly);
            displayForecast(weatherData.daily);
        } catch (error) {
            DOM.errorMessage.textContent = error.message;
            DOM.errorMessage.style.display = 'block';
        } finally {
            DOM.loading.style.display = 'none';
        }
    }, (error) => {
        DOM.loading.style.display = 'none';
        const isBg = currentLang === 'bg';
        DOM.errorMessage.textContent = isBg ? "Достъпът до локация бе отказан." : "Location access denied.";
        DOM.errorMessage.style.display = 'block';
    });
});

// МОДЕРЕН СУИЧ ЗА МЕРНИ ЕДИНИЦИ (СМЕНЯ НАВСЯКЪДЕ НАВЕДНЪЖ)
DOM.unitToggle.addEventListener('click', () => {
    if (!currentWeatherData) return;
    
    isCelsius = !isCelsius; // Обръщаме флага
    updateToggleButtonText(); // Сменяме текста на бутона
    refreshWeatherDisplay(); // Магическо преизчисляване и прерисуване
});

// --- СТАРТИРАНЕ СЛЕД ЗАРЕЖДАНЕ НА КАРТАТА И DOM СТРУКТУРАТА ---
document.addEventListener('DOMContentLoaded', () => {
    checkLanguage();
    renderHistory();
    initMap();
});