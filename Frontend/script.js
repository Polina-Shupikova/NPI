
// Переключение между страницами
document.getElementById('main-settings-button').addEventListener('click', () => {
    document.getElementById('main-page').classList.add('hidden');
    document.getElementById('settings-page').classList.remove('hidden');
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
});

document.getElementById('game-settings-button').addEventListener('click', () => {
    document.getElementById('game-page').classList.add('hidden');
    document.getElementById('settings-page').classList.remove('hidden');
});

// Настройки темы
document.getElementById('light-theme').addEventListener('click', () => {
    document.body.classList.remove('dark-theme');
});

document.getElementById('dark-theme').addEventListener('click', () => {
    document.body.classList.add('dark-theme');
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
    grid.innerHTML = '';
    
    // Пример простого кроссворда 10x10
    const crossword = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ];
    
    // Заполняем кроссворд
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
            const cell = document.createElement('div');
            cell.className = 'crossword-cell';
            
            if (crossword[i][j] === 1) {
                cell.classList.add('black');
            } else {
                // Пример заполнения некоторых ячеек
                if (i === 1 && j === 1) cell.textContent = 'К';
                if (i === 1 && j === 2) cell.textContent = 'О';
                if (i === 1 && j === 3) cell.textContent = 'Т';
            }
            
            grid.appendChild(cell);
        }
    }
}

// Генерация экранной клавиатуры
function generateKeyboard() {
    const keyboard = document.getElementById('keyboard');
    keyboard.innerHTML = '';
    
    const russianLetters = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
    
    for (let i = 0; i < russianLetters.length; i++) {
        const key = document.createElement('button');
        key.className = 'keyboard-key';
        key.textContent = russianLetters[i];
        
        // Пример отключения некоторых клавиш
        if (Math.random() > 0.7) {
            key.disabled = true;
        }
        
        keyboard.appendChild(key);
    }
}

// Обработка изменения размера шрифта
document.getElementById('font-size').addEventListener('change', (e) => {
    const size = e.target.value;
    if (size === 'small') {
        document.body.style.fontSize = '14px';
    } else if (size === 'medium') {
        document.body.style.fontSize = '16px';
    } else if (size === 'large') {
        document.body.style.fontSize = '18px';
    }
});