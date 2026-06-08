export const DOM = {
    searchForm: document.getElementById('search-form'),
    cityInput: document.getElementById('city-input'),
    locationBtn: document.getElementById('location-btn'),
    historyContainer: document.getElementById('search-history'),
    loading: document.getElementById('loading'),
    errorMessage: document.getElementById('error-message'),
    weatherResult: document.getElementById('weather-result'),
    cityName: document.getElementById('city-name'),
    temperature: document.getElementById('temperature'),
    weatherCondition: document.getElementById('weather-condition'),
    weatherIcon: document.getElementById('weather-icon'),
    lastUpdated: document.getElementById('last-updated'),
    unitToggle: document.getElementById('unit-toggle'),
    hourlyContainer: document.getElementById('hourly-container'),
    
    // Новите 4 уиджета (свързани по ID с <strong> таговете от HTML)
    apparentTemp: document.getElementById('apparent-temp'),
    uvIndex: document.getElementById('uv-index'),
    rainChance: document.getElementById('rain-chance'),
    windSpeed: document.getElementById('wind-speed'),
    
    // Слънчеви метрики
    sunriseTime: document.getElementById('sunrise-time'),
    sunsetTime: document.getElementById('sunset-time'),
    map: document.getElementById('map')
};

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

export const weatherDescriptions = {
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
    73: 'Умерен sнеговалеж',
    75: 'Силен снеговалеж',
    80: 'Леки превалявания',
    81: 'Умерени превалявания',
    82: 'Силни превалявания',
    95: 'Гръмотевична буря'
};

export const translations = {
    bg: {
        title: "Прогноза за времето",
        placeholder: "Въведете град на английски...",
        search: "Търси",
        feelsLike: "Усеща се като",
        uvIndex: "UV Индекс",
        rainChance: "Шанс за дъжд",
        wind: "Вятър",
        sunrise: "Изгрев",
        sunset: "Залез",
        toggle: "Към °F",
        loading: "Зареждане...",
        riskLow: "Нисък", riskMed: "Умерен", riskHigh: "Висок",
        updated: "Последно обновяване"
    },
    en: {
        title: "Weather Forecast",
        placeholder: "Enter city in English...",
        search: "Search",
        feelsLike: "Feels like",
        uvIndex: "UV Index",
        rainChance: "Rain chance",
        wind: "Wind",
        sunrise: "Sunrise",
        sunset: "Sunset",
        toggle: "To °F",
        loading: "Loading...",
        riskLow: "Low", riskMed: "Moderate", riskHigh: "High",
        updated: "Last updated"
    },
    de: {
        title: "Wettervorhersage",
        placeholder: "Stadt auf Englisch eingeben...",
        search: "Suchen",
        feelsLike: "Gefühlt wie",
        uvIndex: "UV-Index",
        rainChance: "Regenwahrscheinlichkeit",
        wind: "Wind",
        sunrise: "Sonnenaufgang",
        sunset: "Sonnenuntergang",
        toggle: "Zu °F",
        loading: "Laden...",
        riskLow: "Niedrig", riskMed: "Mäßig", riskHigh: "Hoch",
        updated: "Zuletzt aktualisiert"
    },
    sk: {
        title: "Predpoveď počasia",
        placeholder: "Zadajte mesto v angličtine...",
        search: "Hľadať",
        feelsLike: "Pocitová teplota",
        uvIndex: "UV Index",
        rainChance: "Šanca na dážď",
        wind: "Vietor",
        sunrise: "Východ slnka",
        sunset: "Západ slnka",
        toggle: "Na °F",
        loading: "Načitavam...",
        riskLow: "Nízky", riskMed: "Mierny", riskHigh: "Vysoký",
        updated: "Posledná aktualizácia"
    }
};