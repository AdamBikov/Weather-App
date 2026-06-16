/**
 * DOM object - collects all important HTML elements by their IDs.
 * Querying the DOM once at startup is more efficient than searching
 * for elements every time we need them.
 */
export const DOM = {
    searchForm: document.getElementById('search-form'),
    cityInput: document.getElementById('city-input'),
    locationBtn: document.getElementById('location-btn'),
    langSwitchBtn: document.getElementById('lang-switch-btn'),
    historyContainer: document.getElementById('search-history'),
    loading: document.getElementById('loading'),
    errorMessage: document.getElementById('error-message'),
    weatherContent: document.getElementById('weather-content'),
    cityName: document.getElementById('city-name'),
    temperature: document.getElementById('temperature'),
    weatherCondition: document.getElementById('weather-condition'),
    weatherIcon: document.getElementById('weather-icon'),
    lastUpdated: document.getElementById('last-updated'),
    unitToggle: document.getElementById('unit-toggle'),
    unitText: document.getElementById('unit-text'),

    // Weather details
    tempHigh: document.getElementById('temp-high'),
    tempLow: document.getElementById('temp-low'),
    feelsLikeText: document.getElementById('feels-like-text'),
    apparentTemp: document.getElementById('apparent-temp'),
    uvIndex: document.getElementById('uv-index'),
    sunriseTime: document.getElementById('sunrise-time'),
    sunsetTime: document.getElementById('sunset-time'),

    // Containers
    hourlyContainer: document.getElementById('hourly-container'),
    forecastContainer: document.getElementById('forecast-container'),
    bgLayer: document.getElementById('bg-layer'),

    // Weather metrics/insights
    rainChance: document.getElementById('rain-chance'),
    windSpeed: document.getElementById('wind-speed')
};

/**
 * Maps WMO weather codes to Font Awesome icon classes.
 * Each code represents a specific condition (clear, cloudy, rain, etc.).
 * Used by both the current weather display and the forecast.
 */
export const weatherIcons = {
    0: 'fa-sun',
    1: 'fa-cloud-sun',
    2: 'fa-cloud-sun',
    3: 'fa-cloud',
    45: 'fa-smog',
    48: 'fa-smog',
    51: 'fa-cloud-rain',
    53: 'fa-cloud-rain',
    55: 'fa-cloud-rain',
    61: 'fa-cloud-showers-heavy',
    63: 'fa-cloud-showers-heavy',
    65: 'fa-cloud-showers-heavy',
    71: 'fa-snowflake',
    73: 'fa-snowflake',
    75: 'fa-snowflake',
    80: 'fa-cloud-showers-heavy',
    81: 'fa-cloud-showers-heavy',
    82: 'fa-cloud-showers-heavy',
    95: 'fa-cloud-bolt'
};

/**
 * Weather descriptions translated into all 4 supported languages.
 * Keys are WMO weather codes, values are the human-readable condition names.
 */
export const weatherDescriptions = {
    bg: {
        0: 'Ясно небе',
        1: 'Предимно ясно',
        2: 'Частична облачност',
        3: 'Облачно',
        45: 'Мъгла',
        48: 'Скреж на мъгла',
        51: 'Лек ръмеж',
        53: 'Умерен ръмеж',
        55: 'Интензивен ръмеж',
        61: 'Лек дъжд',
        63: 'Умерен дъжд',
        65: 'Силен дъжд',
        71: 'Лек снеговалеж',
        73: 'Умерен снеговалеж',
        75: 'Силен снеговалеж',
        80: 'Леки превалявания',
        81: 'Умерени превалявания',
        82: 'Силни превалявания',
        95: 'Гръмотевична буря'
    },
    en: {
        0: 'Clear sky',
        1: 'Mostly clear',
        2: 'Partly cloudy',
        3: 'Cloudy',
        45: 'Fog',
        48: 'Fog with rime',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Heavy drizzle',
        61: 'Light rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        71: 'Light snow',
        73: 'Moderate snow',
        75: 'Heavy snow',
        80: 'Light showers',
        81: 'Moderate showers',
        82: 'Heavy showers',
        95: 'Thunderstorm'
    },
    de: {
        0: 'Klarer Himmel',
        1: 'Überwiegend klar',
        2: 'Teilweise bewölkt',
        3: 'Bewölkt',
        45: 'Nebel',
        48: 'Nebel mit Reif',
        51: 'Leichter Niesel',
        53: 'Mäßiger Niesel',
        55: 'Intensiver Niesel',
        61: 'Leichter Regen',
        63: 'Mäßiger Regen',
        65: 'Intensiver Regen',
        71: 'Leichte Schneefälle',
        73: 'Mäßige Schneefälle',
        75: 'Intensive Schneefälle',
        80: 'Leichte Schauer',
        81: 'Mäßige Schauer',
        82: 'Intensive Schauer',
        95: 'Gewitter'
    },
    sk: {
        0: 'Čisté nebo',
        1: 'Väčšinou jasno',
        2: 'Čiastočne zamračené',
        3: 'Zamračené',
        45: 'Hmla',
        48: 'Hmla s ľadom',
        51: 'Slabá rosa',
        53: 'Mierna rosa',
        55: 'Silná rosa',
        61: 'Slabý dážď',
        63: 'Mierny dážď',
        65: 'Silný dážď',
        71: 'Slabý sneh',
        73: 'Mierny sneh',
        75: 'Silný sneh',
        80: 'Slabé prehánky',
        81: 'Mierné prehánky',
        82: 'Silné prehánky',
        95: 'Búrka'
    }
};

/**
 * All UI text labels in 4 languages (English, Bulgarian, German, Slovak).
 * The app defaults to English if a translation key is not found.
 */
export const translations = {
    bg: {
        title: "Прогноза за времето",
        placeholder: "Търсене на град...",
        search: "Търси",
        hourlyLabel: "Почасова прогноза",
        detailsLabel: "Детайли за времето",
        forecastLabel: "7-дневна прогноза",
        feelsLike: "Усеща се като",
        uvIndex: "UV Индекс",
        rainChance: "Шанс за дъжд",
        wind: "Вятър",
        sunrise: "Изгрев",
        sunset: "Залез",
        toggle: "Към °F",
        loading: "Зареждане...",
        riskLow: "Нисък", riskMed: "Умерен", riskHigh: "Висок",
        updated: "Последно обновяване",
        cityNotFound: "Городът не е намерен.",
        fetchError: "Грешка при извличане на данни за времето",
        locationDenied: "Достъпът до локация бе отказан.",
        geoNotSupported: "Геолокацията не се поддържа от вашия браузър."
    },
    en: {
        title: "Weather Forecast",
        placeholder: "Search for a city...",
        search: "Search",
        hourlyLabel: "Hourly Forecast",
        detailsLabel: "Weather Details",
        forecastLabel: "7-Day Forecast",
        feelsLike: "Feels like",
        uvIndex: "UV Index",
        rainChance: "Rain chance",
        wind: "Wind",
        sunrise: "Sunrise",
        sunset: "Sunset",
        toggle: "To °F",
        loading: "Loading...",
        riskLow: "Low", riskMed: "Moderate", riskHigh: "High",
        updated: "Last updated",
        cityNotFound: "City not found.",
        fetchError: "Error fetching weather data",
        locationDenied: "Location access denied.",
        geoNotSupported: "Geolocation is not supported by your browser."
    },
    de: {
        title: "Wettervorhersage",
        placeholder: "Stadt suchen...",
        search: "Suchen",
        hourlyLabel: "Stündliche Vorhersage",
        detailsLabel: "Wetterdetails",
        forecastLabel: "7-Tage-Vorhersage",
        feelsLike: "Gefühlt wie",
        uvIndex: "UV-Index",
        rainChance: "Regenwahrscheinlichkeit",
        wind: "Wind",
        sunrise: "Sonnenaufgang",
        sunset: "Sonnenuntergang",
        toggle: "Zu °F",
        loading: "Laden...",
        riskLow: "Niedrig", riskMed: "Mäßig", riskHigh: "Hoch",
        updated: "Zuletzt aktualisiert",
        cityNotFound: "Stadt nicht gefunden.",
        fetchError: "Fehler beim Abrufen von Wetterdaten",
        locationDenied: "Standortzugriff verweigert.",
        geoNotSupported: "Geolokalisierung wird von Ihrem Browser nicht unterstützt."
    },
    sk: {
        title: "Predpoveď počasia",
        placeholder: "Vyhľadať mesto...",
        search: "Hľadať",
        hourlyLabel: "Hodinová predpoveď",
        detailsLabel: "Detaily počasia",
        forecastLabel: "7-dňová predpoveď",
        feelsLike: "Pocitová teplota",
        uvIndex: "UV Index",
        rainChance: "Šanca na dážď",
        wind: "Vietor",
        sunrise: "Východ slnka",
        sunset: "Západ slnka",
        toggle: "Na °F",
        loading: "Načítavam...",
        riskLow: "Nízky", riskMed: "Mierny", riskHigh: "Vysoký",
        updated: "Posledná aktualizácia",
        cityNotFound: "Mesto sa nenašlo.",
        fetchError: "Chyba pri získavaní údajov o počasí",
        locationDenied: "Prístup k polohe bol zamietnutý.",
        geoNotSupported: "Geolokácia nie je podporovaná vašim prehliadačom."
    }
};