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
let maxTempCelsius = null; // Daily high temperature
let minTempCelsius = null; // Daily low temperature

// Weather-specific background themes
const weatherThemes = {
    sunny: { bg: '#fbbf24', name: 'bg-sunny' },
    cloudy: { bg: '#9ca3af', name: 'bg-cloudy' },
    rainy: { bg: '#60a5fa', name: 'bg-rainy' },
    snowy: { bg: '#e0f2fe', name: 'bg-snowy' },
    stormy: { bg: '#7c3aed', name: 'bg-stormy' }
};

// Determine weather theme based on weather code
function getWeatherTheme(weatherCode) {
    if ([0, 1].includes(weatherCode)) return 'sunny';
    if ([2, 3, 45, 48].includes(weatherCode)) return 'cloudy';
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weatherCode)) return 'rainy';
    if ([71, 73, 75].includes(weatherCode)) return 'snowy';
    if ([95].includes(weatherCode)) return 'stormy';
    return 'cloudy';
}

// Update dynamic background based on weather
function updateBackgroundTheme(weatherCode) {
    const theme = getWeatherTheme(weatherCode);
    const bgLayer = document.getElementById('bg-layer');
    
    // Remove all theme classes
    Object.values(weatherThemes).forEach(t => bgLayer.classList.remove(t.name));
    
    // Add new theme class
    bgLayer.classList.add(weatherThemes[theme].name);
}

// Apply language translations to all UI elements
function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('app_lang', lang);
    const t = translations[lang];

    // Update main UI text elements
    const headings = document.querySelectorAll('.section-title');
    if (headings.length >= 1) headings[0].textContent = t.hourlyLabel || 'Hourly Forecast';
    if (headings.length >= 2) headings[1].textContent = t.detailsLabel || 'Weather Details';
    if (headings.length >= 3) headings[2].textContent = t.forecastLabel || '7-Day Forecast';

    DOM.cityInput.placeholder = t.placeholder;
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.textContent = t.search;
    DOM.loading.textContent = t.loading;
    
    // Update insight card labels
    const labels = document.querySelectorAll('.insight-label');
    const labelTexts = [t.wind, t.rainChance, t.uvIndex, t.feelsLike, t.sunrise, t.sunset];
    labels.forEach((label, idx) => {
        if (labelTexts[idx]) label.textContent = labelTexts[idx];
    });
    
    // Update language switch button
    const langCodes = { en: '🌍', bg: '🌍', de: '🌍', sk: '🌍' };
    if (DOM.langSwitchBtn) DOM.langSwitchBtn.innerHTML = `<i class="fas fa-globe"></i>`;
    
    // Update temperature toggle button text
    updateToggleButtonText();

    // Refresh weather display if data is already loaded
    if (currentWeatherData && document.getElementById('weather-content').style.display !== 'none') {
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
    maxTempCelsius = dailyData?.temperature_2m_max?.[0] || data.temperature;
    minTempCelsius = dailyData?.temperature_2m_min?.[0] || data.temperature;
    
    const unit = isCelsius ? '°C' : '°F';
    const shortUnit = isCelsius ? '°' : '°F';
    const t = translations[currentLang] || translations.en;
    
    // Update hero section
    DOM.cityName.textContent = `${name}, ${country}`;
    DOM.temperature.textContent = `${convertTemp(currentTempCelsius)}°`;
    
    // Update temperature range
    document.getElementById('temp-high').textContent = `H: ${convertTemp(maxTempCelsius)}${shortUnit}`;
    document.getElementById('temp-low').textContent = `L: ${convertTemp(minTempCelsius)}${shortUnit}`;
    
    const currentHourIndex = new Date().getHours();

    // Display feels-like temperature
    if (hourlyData && hourlyData.apparent_temperature) {
        const feelsLike = hourlyData.apparent_temperature[currentHourIndex];
        document.getElementById('feels-like-text').textContent = `${t.feelsLike} ${convertTemp(feelsLike)}${shortUnit}`;
        document.getElementById('apparent-temp').textContent = `${convertTemp(feelsLike)}${shortUnit}`;
    } else {
        document.getElementById('feels-like-text').textContent = `${t.feelsLike} --${shortUnit}`;
        document.getElementById('apparent-temp').textContent = `--${shortUnit}`;
    }

    // Display UV index with risk level
    if (dailyData && dailyData.uv_index_max) {
        const uv = dailyData.uv_index_max[0];
        let risk = t.riskLow;
        if (uv >= 3 && uv < 6) risk = t.riskMed;
        if (uv >= 6) risk = t.riskHigh;
        document.getElementById('uv-index').textContent = `${uv} (${risk})`;
    } else {
        document.getElementById('uv-index').textContent = `--`;
    }

    // Display rain chance percentage
    if (hourlyData && hourlyData.precipitation_probability) {
        const rainChance = hourlyData.precipitation_probability[currentHourIndex];
        DOM.rainChance.textContent = `${rainChance}%`;
    } else {
        DOM.rainChance.textContent = `--%`;
    }

    // Display wind speed
    DOM.windSpeed.textContent = `${data.windspeed} km/h`;

    // Display sunrise and sunset times
    if (dailyData && dailyData.sunrise && dailyData.sunset) {
        const sunriseTime = dailyData.sunrise[0].split('T')[1];
        const sunsetTime = dailyData.sunset[0].split('T')[1];
        document.getElementById('sunrise-time').textContent = sunriseTime;
        document.getElementById('sunset-time').textContent = sunsetTime;
    } else {
        document.getElementById('sunrise-time').textContent = '--:--';
        document.getElementById('sunset-time').textContent = '--:--';
    }

    const description = weatherDescriptions[currentLang]?.[data.weathercode] || weatherDescriptions.en[data.weathercode] || "Unknown";
    DOM.weatherCondition.textContent = description;

    const iconClass = weatherIcons[data.weathercode] || "fa-cloud";
    DOM.weatherIcon.className = `fas ${iconClass} fa-4x`;

    const now = new Date();
    const formatter = new Intl.DateTimeFormat(
        currentLang === 'bg' ? 'bg-BG' : currentLang === 'de' ? 'de-DE' : currentLang === 'sk' ? 'sk-SK' : 'en-US',
        { hour: '2-digit', minute: '2-digit', second: '2-digit' }
    );
    DOM.lastUpdated.textContent = `${t.updated}: ${formatter.format(now)}`;
    
    // Update background theme
    updateBackgroundTheme(data.weathercode);
    
    // Show weather content
    document.getElementById('weather-content').style.display = 'block';
}

// Display hourly weather forecast for the next 10 hours
function displayHourly(hourlyData) {
    const container = document.getElementById('hourly-container');
    container.innerHTML = '';
    const currentHour = new Date().getHours();
    const unit = isCelsius ? '°' : '°F';

    for (let i = currentHour; i < currentHour + 10 && i < hourlyData.time.length; i++) {
        const rawTime = new Date(hourlyData.time[i]);
        const locale = currentLang === 'bg' ? 'bg-BG' : currentLang === 'de' ? 'de-DE' : currentLang === 'sk' ? 'sk-SK' : 'en-US';
        const formattedHour = rawTime.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
        
        const temp = convertTemp(hourlyData.apparent_temperature[i]);
        const code = hourlyData.precipitation_probability[i];
        const iconClass = weatherIcons[code] || (code > 30 ? 'fa-cloud-showers-heavy' : 'fa-cloud');

        const hourBox = document.createElement('div');
        hourBox.className = 'hourly-item';
        hourBox.innerHTML = `
            <span class="hourly-time">${formattedHour}</span>
            <i class="fas ${iconClass} hourly-icon"></i>
            <span class="hourly-temp">${temp}${unit}</span>
        `;
        container.appendChild(hourBox);
    }
}

// Display 5-day weather forecast
function displayForecast(dailyData) {
    const container = document.getElementById('forecast-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Defensive checks for dailyData
    if (!dailyData || !dailyData.time || !Array.isArray(dailyData.time)) {
        console.warn('Invalid dailyData structure for forecast');
        return;
    }
    
    const unit = isCelsius ? '°' : '°F';

    for (let i = 1; i <= 5 && i < dailyData.time.length; i++) {
        try {
            const timestamp = dailyData.time[i];
            if (!timestamp) break;
            
            const locale = currentLang === 'bg' ? 'bg-BG' : currentLang === 'de' ? 'de-DE' : currentLang === 'sk' ? 'sk-SK' : 'en-US';
            const date = new Date(timestamp);
            const dayName = date.toLocaleDateString(locale, { weekday: 'short' });
            const fullDate = date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
            
            const maxTemp = convertTemp((dailyData.temperature_2m_max?.[i]) || dailyData.temperature_2m_max?.[0] || 0);
            const minTemp = dailyData.temperature_2m_min?.[i] !== undefined && dailyData.temperature_2m_min?.[i] !== 0 
                ? convertTemp(dailyData.temperature_2m_min[i])
                : '';
            const weatherCode = dailyData.weathercode?.[i] || 0;
            
            const condition = weatherDescriptions[currentLang]?.[weatherCode] || weatherDescriptions.en[weatherCode] || "Unknown";
            const iconClass = weatherIcons[weatherCode] || 'fa-cloud';
            
            const forecastItem = document.createElement('div');
            forecastItem.className = 'forecast-item';
            forecastItem.innerHTML = `
                <div class="forecast-day-info">
                    <div class="forecast-day-name">
                        <span class="forecast-day-label">${dayName}</span>
                        <span class="forecast-date">${fullDate}</span>
                    </div>
                    <i class="fas ${iconClass} forecast-icon"></i>
                    <span class="forecast-condition">${condition}</span>
                </div>
                <div class="forecast-temps">
                    <span class="forecast-high">${maxTemp}${unit}</span>
                    ${minTemp ? `<span class="forecast-low">${minTemp}${unit}</span>` : ''}
                </div>
            `;
            container.appendChild(forecastItem);
        } catch (error) {
            console.error('Error creating forecast item:', error);
        }
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
    DOM.weatherContent.style.display = 'none';

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

// Initialize Leaflet map with click-to-search functionality
function initMap() {
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) return; // Exit if map container doesn't exist
    
    const defaultLat = 42.6977;
    const defaultLon = 23.3219;
    
    if (map) {
        map.remove();
    }
    
    map = L.map(mapContainer).setView([defaultLat, defaultLon], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    marker = L.marker([defaultLat, defaultLon]).addTo(map);

    // Handle map click to fetch weather for clicked location
    map.on('click', async function(e) {
        const lat = e.latlng.lat;
        const lon = e.latlng.lng;
        marker.setLatLng([lat, lon]);

        DOM.loading.style.display = 'block';
        DOM.errorMessage.style.display = 'none';
        DOM.weatherContent.style.display = 'none';

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
    DOM.weatherContent.style.display = 'none';

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