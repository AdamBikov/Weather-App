/**
 * Storage module for managing local search history.
 */

// Save a city to search history (max 5 items)
export function saveToHistory(city) {
    let history = JSON.parse(localStorage.getItem('weatherHistory')) || [];
    if (!history.includes(city)) {
        history.push(city);
        if (history.length > 5) history.shift(); // Keep only last 5 searches
        localStorage.setItem('weatherHistory', JSON.stringify(history));
    }
}

// Retrieve search history from local storage
export function getHistory() {
    return JSON.parse(localStorage.getItem('weatherHistory')) || [];
}