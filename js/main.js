/**
 * Main application logic - connects the UI, API, and Storage modules.
 * Handles user input, fetches weather data, and updates the display.
 */

import { DOM, weatherIcons, weatherDescriptions, translations } from './ui.js';
import { getCoordinates, getWeather } from './api.js';
import { saveToHistory, getHistory, saveLastCity, getLastCity } from './storage.js';

// Global state - these variables track the app's current data and settings
let currentTempCelsius = null;
let isCelsius = true;
let currentWeatherData = null;
let currentLang = localStorage.getItem('app_lang') || null;
let map;
let marker;
let maxTempCelsius = null;
let minTempCelsius = null;

// Maps weather types to CSS classes for the dynamic background
const weatherThemes = {
    sunny: { name: 'bg-sunny' },
    cloudy: { name: 'bg-cloudy' },
    rainy: { name: 'bg-rainy' },
    snowy: { name: 'bg-snowy' },
    stormy: { name: 'bg-stormy' }
};

/**
 * Converts a WMO weather code into a theme name for the background.
 * Groups similar codes together (e.g., all rain codes → 'rainy').
 */
function getWeatherTheme(weatherCode) {
    if ([0, 1].includes(weatherCode)) return 'sunny';
    if ([2, 3, 45, 48].includes(weatherCode)) return 'cloudy';
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weatherCode)) return 'rainy';
    if ([71, 73, 75].includes(weatherCode)) return 'snowy';
    if ([95].includes(weatherCode)) return 'stormy';
    return 'cloudy';
}

/** Switches the page background to match the current weather. */
function updateBackgroundTheme(weatherCode) {
    const theme = getWeatherTheme(weatherCode);
    Object.values(weatherThemes).forEach(t => DOM.bgLayer.classList.remove(t.name));
    DOM.bgLayer.classList.add(weatherThemes[theme].name);
}

/** Applies a language to all UI text labels and saves the preference. */
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
    DOM.loading.textContent = t.loading;
    
    // Update insight card labels
    const labels = document.querySelectorAll('.insight-label');
    const labelTexts = [t.wind, t.rainChance, t.uvIndex, t.feelsLike, t.sunrise, t.sunset];
    labels.forEach((label, idx) => {
        if (labelTexts[idx]) label.textContent = labelTexts[idx];
    });
    
    // Update language switch button
    if (DOM.langSwitchBtn) DOM.langSwitchBtn.innerHTML = `<i class="fas fa-globe"></i>`;
    
    // Update temperature toggle button text
    updateToggleButtonText();

    // Refresh weather display if data is already loaded
    if (currentWeatherData && DOM.weatherContent.style.display !== 'none') {
        refreshWeatherDisplay();
    }
}

/** Shows the language selection modal on first visit, otherwise applies saved language. */
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

/** Updates the toggle button text when language or unit changes. */
function updateToggleButtonText() {
    const unitText = DOM.unitText;
    if (isCelsius) {
        unitText.textContent = currentLang === 'bg' ? 'Към °F' : currentLang === 'de' ? 'Zu °F' : currentLang === 'sk' ? 'Na °F' : 'To °F';
    } else {
        unitText.textContent = currentLang === 'bg' ? 'Към °C' : currentLang === 'de' ? 'Zu °C' : currentLang === 'sk' ? 'Na °C' : 'To °C';
    }
}

/** Converts Celsius to Fahrenheit if needed, always returns a rounded whole number. */
function convertTemp(celsius) {
    return isCelsius ? Math.round(celsius) : Math.round((celsius * 9/5) + 32);
}

/** Renders the search history as clickable buttons below the search bar. */
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

/** Updates the hero section with current weather data (temp, condition, wind, sunrise, etc.). */
function displayWeather(data, name, country, dailyData, hourlyData) {
    currentTempCelsius = data.temperature;
    maxTempCelsius = dailyData?.temperature_2m_max?.[0] || data.temperature;
    minTempCelsius = dailyData?.temperature_2m_min?.[0] || data.temperature;
    
    const shortUnit = isCelsius ? '°' : '°F';
    const t = translations[currentLang] || translations.en;
    
    // Update hero section
    DOM.cityName.textContent = `${name}, ${country}`;
    DOM.temperature.textContent = `${convertTemp(currentTempCelsius)}°`;
    
    // Update temperature range
    DOM.tempHigh.textContent = `H: ${convertTemp(maxTempCelsius)}${shortUnit}`;
    DOM.tempLow.textContent = `L: ${convertTemp(minTempCelsius)}${shortUnit}`;
    
    // Current hour index is used to pick the right data from the hourly array
    const currentHourIndex = new Date().getHours();

    if (hourlyData && hourlyData.apparent_temperature) {
        const feelsLike = hourlyData.apparent_temperature[currentHourIndex];
        DOM.feelsLikeText.textContent = `${t.feelsLike} ${convertTemp(feelsLike)}${shortUnit}`;
        DOM.apparentTemp.textContent = `${convertTemp(feelsLike)}${shortUnit}`;
    } else {
        DOM.feelsLikeText.textContent = `${t.feelsLike} --${shortUnit}`;
        DOM.apparentTemp.textContent = `--${shortUnit}`;
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

    // Display wind speed
    DOM.windSpeed.textContent = `${data.windspeed} km/h`;

    // Display sunrise and sunset times
    if (dailyData && dailyData.sunrise && dailyData.sunset) {
        const sunriseValue = dailyData.sunrise[0].split('T')[1];
        const sunsetValue = dailyData.sunset[0].split('T')[1];
        DOM.sunriseTime.textContent = sunriseValue;
        DOM.sunsetTime.textContent = sunsetValue;
    } else {
        DOM.sunriseTime.textContent = '--:--';
        DOM.sunsetTime.textContent = '--:--';
    }

    const description = weatherDescriptions[currentLang]?.[data.weathercode] || weatherDescriptions.en[data.weathercode] || "Unknown";
    DOM.weatherCondition.textContent = description;

    const iconClass = weatherIcons[data.weathercode] || "fa-cloud";
    DOM.weatherIcon.className = `fas ${iconClass} fa-4x`;

    // Format the current time using the user's language locale (e.g., 14:30:00 vs 2:30:00 PM)
    const now = new Date();
    const formatter = new Intl.DateTimeFormat(
        currentLang === 'bg' ? 'bg-BG' : currentLang === 'de' ? 'de-DE' : currentLang === 'sk' ? 'sk-SK' : 'en-US',
        { hour: '2-digit', minute: '2-digit', second: '2-digit' }
    );
    DOM.lastUpdated.textContent = `${t.updated}: ${formatter.format(now)}`;
    
    // Update background theme
    updateBackgroundTheme(data.weathercode);
    
    // Show weather content and fix map size after layout shift
    DOM.weatherContent.style.display = 'block';
    if (map) setTimeout(() => map.invalidateSize(), 100);
}

/** Renders an horizontally scrollable timeline of the next 10 hours of weather. */
function displayHourly(hourlyData) {
    DOM.hourlyContainer.innerHTML = '';
    const currentHour = new Date().getHours();
    const unit = isCelsius ? '°' : '°F';

    for (let i = currentHour; i < currentHour + 10 && i < hourlyData.time.length; i++) {
        const rawTime = new Date(hourlyData.time[i]);
        const locale = currentLang === 'bg' ? 'bg-BG' : currentLang === 'de' ? 'de-DE' : currentLang === 'sk' ? 'sk-SK' : 'en-US';
        const formattedHour = rawTime.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
        
        const temp = convertTemp(hourlyData.apparent_temperature[i]);
        const code = hourlyData.weathercode?.[i] || 0;
        const iconClass = weatherIcons[code] || 'fa-cloud';

        const hourBox = document.createElement('div');
        hourBox.className = 'hourly-item';
        hourBox.innerHTML = `
            <span class="hourly-time">${formattedHour}</span>
            <i class="fas ${iconClass} hourly-icon"></i>
            <span class="hourly-temp">${temp}${unit}</span>
        `;
        DOM.hourlyContainer.appendChild(hourBox);
    }
}

/** Renders the 7-day forecast list with day name, icon, condition, and temps. */
function displayForecast(dailyData) {
    if (!DOM.forecastContainer) return;
    
    DOM.forecastContainer.innerHTML = '';
    
    // Defensive checks for dailyData
    if (!dailyData || !dailyData.time || !Array.isArray(dailyData.time)) {
        console.warn('Invalid dailyData structure for forecast');
        return;
    }
    
    const unit = isCelsius ? '°' : '°F';

    for (let i = 1; i <= 7 && i < dailyData.time.length; i++) {
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
            DOM.forecastContainer.appendChild(forecastItem);
        } catch (error) {
            console.error('Error creating forecast item:', error);
        }
    }
}

/** Re-renders all weather sections after a language or unit change without re-fetching data. */
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

/** Fetches weather for a city and updates all sections of the page. */
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
        saveLastCity(geoData.name);
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

/** Initializes the Leaflet map. Clicking anywhere on the map fetches weather for that location. */
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

// ============= Event listeners =============

/** Search form submission - triggers weather fetch for the entered city. */
DOM.searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const city = DOM.cityInput.value.trim();
    if (city) fetchWeather(city);
});

/** Geolocation button - gets the user's current position and fetches weather for it. */
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

/** Unit toggle - switches between Celsius and Fahrenheit. */
DOM.unitToggle.addEventListener('click', () => {
    if (!currentWeatherData) return;
    
    isCelsius = !isCelsius; // Toggle temperature unit
    updateToggleButtonText(); // Update button text
    refreshWeatherDisplay(); // Recalculate and refresh display
});

/** Language switch button opens the language selection modal. */
if (DOM.langSwitchBtn) {
    DOM.langSwitchBtn.addEventListener('click', () => {
        const modal = document.getElementById('language-modal');
        modal.style.display = 'flex'; // Show language selection modal
    });
}

/** App entry point - runs when the page finishes loading. */
document.addEventListener('DOMContentLoaded', () => {
    checkLanguage();
    renderHistory();
    initMap();

    // Load last searched city on startup
    const lastCity = getLastCity();
    if (lastCity) {
        fetchWeather(lastCity);
    }
});