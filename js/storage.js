/**
 * Модул за управление на локалното хранилище.
 */
export function saveToHistory(city) {
    let history = JSON.parse(localStorage.getItem('weatherHistory')) || [];
    if (!history.includes(city)) {
        history.push(city);
        if (history.length > 5) history.shift();
        localStorage.setItem('weatherHistory', JSON.stringify(history));
    }
}

export function getHistory() {
    return JSON.parse(localStorage.getItem('weatherHistory')) || [];
}