# Weather App

A premium weather forecast application built for a 9th-grade school project. Shows current weather, hourly forecast, 7-day forecast, and an interactive map.

## Features

- **Current weather** — Temperature, condition, feels-like, wind, UV index, sunrise/sunset
- **Hourly timeline** — Scrollable preview of the next 10 hours
- **7-day forecast** — Daily high/low temperatures with weather icons
- **Interactive map** — Click anywhere to get weather for that location (Leaflet + OpenStreetMap)
- **Search by city** — Type any city name to look up weather
- **Geolocation** — Auto-detect your location with one click
- **Language support** — English, Bulgarian, German, Slovak
- **°C / °F toggle** — Switch between Celsius and Fahrenheit
- **Dynamic backgrounds** — Page colors change to match the weather
- **Search history** — Last 5 searched cities saved as quick-access buttons
- **Auto-load** — Opens the last searched city automatically on page load

## How It Works

```
User types city → Geocoding API finds coordinates → Weather API fetches data → UI updates
```

The app uses two free APIs from **Open-Meteo** (no API key required):

1. **Geocoding API** — Converts city names to latitude/longitude
2. **Weather API** — Returns current conditions, hourly data, and 7-day forecast

## Project Structure

```
Weather-App/
├── index.html          Main HTML page with all UI sections
├── styles.css          All styling (dark theme, responsive, animations)
├── README.md           This file
└── js/
    ├── main.js         App logic: connects API, storage, and UI
    ├── api.js          Fetches data from Open-Meteo APIs
    ├── ui.js           DOM references, icon mappings, translations
    └── storage.js      Saves search history and last city to localStorage
```

## Code Overview

### `main.js` — The Brain
- `fetchWeather(city)` — Gets coordinates then weather, updates everything
- `displayWeather(...)` — Fills the hero section with current conditions
- `displayHourly(...)` — Creates the hourly scrollable timeline
- `displayForecast(...)` — Builds the 7-day forecast list
- `initMap()` — Sets up the Leaflet map with click-to-search
- Event listeners for search, geolocation, unit toggle, language switch

### `api.js` — The Connection
- `getCoordinates(city)` — Calls Open-Meteo Geocoding API
- `getWeather(lat, lon)` — Calls Open-Meteo Weather API with all needed parameters

### `ui.js` — The Visuals
- `DOM` object — References to all HTML elements (avoids repeated `getElementById`)
- `weatherIcons` — Maps WMO weather codes to Font Awesome icon classes
- `weatherDescriptions` — Weather condition names in 4 languages
- `translations` — All UI button/label text in 4 languages

### `storage.js` — The Memory
- `saveToHistory()` / `getHistory()` — Manages search history (max 5 cities)
- `saveLastCity()` / `getLastCity()` — Remembers the last city for auto-load

## APIs Used

| API | URL | Purpose |
|-----|-----|---------|
| Open-Meteo Geocoding | `geocoding-api.open-meteo.com` | City → coordinates |
| Open-Meteo Weather | `api.open-meteo.com` | Weather data |
| OpenStreetMap (Nominatim) | `nominatim.openstreetmap.org` | Coordinates → city name (reverse geocoding) |
| OpenStreetMap tiles | `{s}.tile.openstreetmap.org` | Map display via Leaflet |

No API keys are needed — all services are free and open.

## Setup

No build tools or installations required:

1. Clone or download this repository
2. Open `index.html` in any modern browser (or visit [vremetosega.free.bg](https://vremetosega.free.bg))
3. Choose your language and allow location (or search for a city)

> **Note:** The app uses ES Modules (`type="module"`), so it needs to be served from a local server or opened via a localhost. You can use VS Code's Live Server extension or Python's `http.server`.

## What I Learned

- Fetching data from APIs with `async/await`
- Working with the DOM and event listeners in JavaScript
- Using localStorage to persist data between sessions
- Multi-language support with translation objects
- Responsive CSS design with CSS variables and animations
- Integrating third-party libraries (Font Awesome, Leaflet)

## Browser Support

Works in Chrome, Firefox, Safari, and Edge (latest versions). Requires JavaScript and an internet connection.
