/**
 * Storage module - Manages search history and last city in localStorage.
 * This saves data in the user's browser so it persists after page reload.
 */

/**
 * Saves a city to the search history (max 5 cities).
 * Duplicates are ignored - no city appears twice.
 */
export function saveToHistory(city) {
    let history = JSON.parse(localStorage.getItem('weatherHistory')) || [];
    if (!history.includes(city)) {
        history.push(city);
        if (history.length > 5) history.shift();
        localStorage.setItem('weatherHistory', JSON.stringify(history));
    }
}

/** Returns the list of previously searched cities. */
export function getHistory() {
    return JSON.parse(localStorage.getItem('weatherHistory')) || [];
}

/** Saves the last searched city so the app can load it automatically on next visit. */
export function saveLastCity(city) {
    localStorage.setItem('lastCity', city);
}

/** Returns the name of the last searched city, or null if there is none. */
export function getLastCity() {
    return localStorage.getItem('lastCity');
}