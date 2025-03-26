
// Переключение между страницами
document.getElementById('main-settings-button').addEventListener('click', () => {
    document.getElementById('main-page').classList.add('hidden');
    document.getElementById('settings-page').classList.remove('hidden');
    document.getElementById('settings-page').style.display = "flex";

});

document.getElementById('play-button').addEventListener('click', () => {
    document.getElementById('main-page').classList.add('hidden');
    document.getElementById('game-page').classList.remove('hidden');
    generateCrossword();
    generateKeyboard();
});

document.getElementById('back-button').addEventListener('click', () => {
    document.getElementById('settings-page').classList.add('hidden');
    document.getElementById('main-page').classList.remove('hidden');
    document.getElementById('settings-page').style.display = "none";
});

document.getElementById('game-settings-button').addEventListener('click', () => {
    document.getElementById('game-page').classList.add('hidden');
    document.getElementById('settings-page').classList.remove('hidden');
});

// Загрузка цитаты дня (заглушка)
const quotes = [
    "Звук - это волна, которая распространяется в упругой среде.",
    "Фигура - это графическое представление данных.",
    "Клавиатура - это устройство ввода информации.",
    "Свобода - это возможность выбора.",
    "Работа - это целенаправленная деятельность."
];

document.getElementById('daily-quote').textContent = quotes[Math.floor(Math.random() * quotes.length)];

// Генерация кроссворда
function generateCrossword() {
    const grid = document.getElementById('crossword-grid');
    
}

// Генерация экранной клавиатуры
function generateKeyboard() {
    const keyboard = document.getElementById('keyboard');
    
}



// Обработка изменения размера шрифта
document.getElementById('font-size').addEventListener('change', (e) => {
    const size = e.target.value;
    if (size === 'small') {
        document.body.style.fontSize = '16px';
    } else if (size === 'medium') {
        document.body.style.fontSize = '18px';
    } else if (size === 'large') {
        document.body.style.fontSize = '20px';
    }
});

// Настройка темы
document.getElementById('theme_sw').addEventListener('click', () => {
    if (document.body.classList.contains('dark-theme')) {
        document.body.classList.remove('dark-theme');
    } else{
        document.body.classList.add('dark-theme');
    }
})

// Настройка звука
document.addEventListener("DOMContentLoaded", () => {
    const volumeSlider = document.getElementById("volume-slider");
    const volumeLabel = document.getElementById("volume-label");

    function setVolume(value) {
        const volume = value / 100;
        volumeLabel.textContent = value + "%";
        
        const audioElement = document.querySelector("audio");
        if (audioElement) {
            audioElement.volume = volume;
        }
    }

    volumeSlider.addEventListener("input", (event) => {
        setVolume(event.target.value);
    });

    setVolume(volumeSlider.value);
});
