import { DOM, weatherIcons, weatherDescriptions, translations } from './ui.js';
import { getCoordinates, getWeather } from './api.js';
import { saveToHistory, getHistory } from './storage.js';

// Global variables
let currentTempCelsius = null; // Stores current temperature in Celsius
let isCelsius = true; // Temperature unit flag
let currentWeatherData = null; // Stores raw weather data for unit conversion
let currentLang = localStorage.getItem('app_lang') || null; // Current language
let map; // Leaflet map instance
let marker; // Map marker

// Apply language translations to all UI elements
function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('app_lang', lang);
    const t = translations[lang];

    // Update main UI text elements
    const headings = document.querySelectorAll('h1');
    if (headings.length > 0) headings[0].textContent = t.title;
    DOM.cityInput.placeholder = t.placeholder;
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.textContent = t.search;
    DOM.loading.textContent = t.loading;
    
    // Update metric widget labels
    const metricSpans = document.querySelectorAll('.metric-widget span:not(.forecast-date, .forecast-temp)');
    if (metricSpans.length >= 4) {
        metricSpans[0].textContent = t.feelsLike;
        metricSpans[1].textContent = t.uvIndex;
        metricSpans[2].textContent = t.rainChance;
        metricSpans[3].textContent = t.wind;
    }
    
    // Update language switch button
    const langCodes = { en: 'EN 🇬🇧', bg: 'БГ 🇧🇬', de: 'DE 🇩🇪', sk: 'SK 🇸🇰' };
    if (DOM.langSwitchBtn) DOM.langSwitchBtn.textContent = langCodes[lang] || 'EN 🇬🇧';
    
    // Update temperature toggle button text
    updateToggleButtonText();

    // Refresh weather display if data is already loaded
    if (currentWeatherData && DOM.weatherResult.style.display === 'block') {
        refreshWeatherDisplay();
    }
}

// Check if language is set and show modal on first visit
function checkLanguage() {
    const modal = document.getElementById('language-modal');
    if (!currentLang) {
        modal.style.display = 'flex'; // Show modal on first visit
    } else {
        applyLanguage(currentLang);
    }

    // Add click event listeners to language modal buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const selectedLang = e.currentTarget.getAttribute('data-lang');
            applyLanguage(selectedLang);
            modal.style.display = 'none';
            // Auto-trigger geolocation after language selection for better UX
            DOM.locationBtn.click();
        });
    });
}

// Update temperature toggle button text based on current language and unit
function updateToggleButtonText() {
    if (isCelsius) {
        DOM.unitToggle.textContent = currentLang === 'bg' ? 'Към °F' : currentLang === 'de' ? 'Zu °F' : currentLang === 'sk' ? 'Na °F' : 'To °F';
    } else {
        DOM.unitToggle.textContent = currentLang === 'bg' ? 'Към °C' : currentLang === 'de' ? 'Zu °C' : currentLang === 'sk' ? 'Na °C' : 'To °C';
    }
}

// Convert temperature between Celsius and Fahrenheit
function convertTemp(celsius) {
    return isCelsius ? Math.round(celsius) : Math.round((celsius * 9/5) + 32);
}

// Render search history as clickable items
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

// Display current weather information
function displayWeather(data, name, country, dailyData, hourlyData) {
    currentTempCelsius = data.temperature;
    const unit = isCelsius ? '°C' : '°F';
    const t = translations[currentLang] || translations.en;
    
    DOM.cityName.textContent = `${name}, ${country}`;
    DOM.temperature.textContent = `${convertTemp(currentTempCelsius)}${unit}`;
    DOM.windSpeed.textContent = `${data.windspeed} km/h`;

    const currentHourIndex = new Date().getHours();

    // Display feels-like temperature
    if (hourlyData && hourlyData.apparent_temperature) {
        const feelsLike = hourlyData.apparent_temperature[currentHourIndex];
        DOM.apparentTemp.textContent = `${convertTemp(feelsLike)}${unit}`;
    } else {
        DOM.apparentTemp.textContent = `--${unit}`;
    }

    // Display UV index with risk level
    if (dailyData && dailyData.uv_index_max) {
        const uv = dailyData.uv_index_max[0];
        let risk = t.riskLow;
        if (uv >= 3 && uv < 6) risk = t.riskMed;
        if (uv >= 6) risk = t.riskHigh;
        DOM.uvIndex.textContent = `${uv} (${risk})`;
    } else {
        DOM.uvIndex.textContent = `--`;
    }

    // Display rain chance percentage
    if (hourlyData && hourlyData.precipitation_probability) {
        const rainChance = hourlyData.precipitation_probability[currentHourIndex];
        DOM.rainChance.textContent = `${rainChance}%`;
    } else {
        DOM.rainChance.textContent = `--%`;
    }

    // Display sunrise and sunset times
    if (dailyData && dailyData.sunrise && dailyData.sunset) {
        const sunriseHTML = dailyData.sunrise[0].split('T')[1];
        const sunsetHTML = dailyData.sunset[0].split('T')[1];
        DOM.sunriseTime.innerHTML = `<i class="fas fa-sun"></i> ${t.sunrise}: ${sunriseHTML}`;
        DOM.sunsetTime.innerHTML = `<i class="fas fa-moon"></i> ${t.sunset}: ${sunsetHTML}`;
    } else {
        DOM.sunriseTime.innerHTML = `<i class="fas fa-sun"></i> ${t.sunrise}: --:--`;
        DOM.sunsetTime.innerHTML = `<i class="fas fa-moon"></i> ${t.sunset}: --:--`;
    }

    const description = weatherDescriptions[currentLang]?.[data.weathercode] || weatherDescriptions.en[data.weathercode] || "Unknown";
    DOM.weatherCondition.textContent = description;

    const iconClass = weatherIcons[data.weathercode] || "fa-cloud";
    DOM.weatherIcon.className = `fas ${iconClass} fa-3x`;

    const now = new Date();
    const formatter = new Intl.DateTimeFormat(
        currentLang === 'bg' ? 'bg-BG' : currentLang === 'de' ? 'de-DE' : currentLang === 'sk' ? 'sk-SK' : 'en-US',
        { hour: '2-digit', minute: '2-digit', second: '2-digit' }
    );
    DOM.lastUpdated.textContent = `${t.updated}: ${formatter.format(now)}`;
    
    DOM.weatherResult.style.display = 'block';
}

// Display hourly weather forecast for the next 10 hours
function displayHourly(hourlyData) {
    DOM.hourlyContainer.innerHTML = '';
    DOM.hourlyContainer.style.display = 'flex';
    const currentHour = new Date().getHours();
    const unit = isCelsius ? '°' : '°F';

    for (let i = currentHour; i < currentHour + 10; i++) {
        if (i >= hourlyData.time.length) break;
        const rawTime = new Date(hourlyData.time[i]);
        const locale = currentLang === 'bg' ? 'bg-BG' : currentLang === 'de' ? 'de-DE' : currentLang === 'sk' ? 'sk-SK' : 'en-US';
        const formattedHour = rawTime.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
        
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

// Display 5-day weather forecast
function displayForecast(dailyData) {
    const container = document.getElementById('forecast-container');
    container.innerHTML = '';
    container.style.display = 'grid';
    const unit = isCelsius ? '°' : '°F';

    for (let i = 1; i <= 5; i++) {
        const timestamp = dailyData.time[i];
        const locale = currentLang === 'bg' ? 'bg-BG' : currentLang === 'de' ? 'de-DE' : currentLang === 'sk' ? 'sk-SK' : 'en-US';
        const date = new Date(timestamp).toLocaleDateString(locale, { weekday: 'short' });
        
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

// Refresh weather display when language or temperature unit changes
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

// Fetch weather data by city name
async function fetchWeather(city) {
    DOM.loading.style.display = 'block';
    DOM.errorMessage.style.display = 'none';
    DOM.weatherResult.style.display = 'none';

    try {
        const geoData = await getCoordinates(city);
        const weatherData = await getWeather(geoData.latitude, geoData.longitude);
        
        currentWeatherData = weatherData; // Store for unit conversion
        
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

// Initialize Leaflet map
function initMap() {
    const defaultLat = 42.6977;
    const defaultLon = 23.3219;
    map = L.map('map').setView([defaultLat, defaultLon], 6);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(map);

    marker = L.marker([defaultLat, defaultLon]).addTo(map);

    // Handle map click to fetch weather for clicked location
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
            currentWeatherData = weatherData; // Store for unit conversion

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

// Event listeners
DOM.searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const city = DOM.cityInput.value.trim();
    if (city) fetchWeather(city);
});

// Handle geolocation button click
DOM.locationBtn.addEventListener('click', () => {
    const t = translations[currentLang] || translations.en;
    if (!navigator.geolocation) {
        alert(t.geoNotSupported);
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
            currentWeatherData = weatherData; // Store for unit conversion

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
        const t = translations[currentLang] || translations.en;
        DOM.errorMessage.textContent = t.locationDenied;
        DOM.errorMessage.style.display = 'block';
    });
});

// Handle temperature unit toggle (Celsius/Fahrenheit)
DOM.unitToggle.addEventListener('click', () => {
    if (!currentWeatherData) return;
    
    isCelsius = !isCelsius; // Toggle temperature unit
    updateToggleButtonText(); // Update button text
    refreshWeatherDisplay(); // Recalculate and refresh display
});

// Handle language switch button
if (DOM.langSwitchBtn) {
    DOM.langSwitchBtn.addEventListener('click', () => {
        const modal = document.getElementById('language-modal');
        modal.style.display = 'flex'; // Show language selection modal
    });
}

// Initialize app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    checkLanguage();
    renderHistory();
    initMap();
});