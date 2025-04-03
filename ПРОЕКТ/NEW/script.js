function isTelegramWebApp() {
    if (!window.Telegram?.WebApp) return false;
    
    console.log("Telegram.WebApp:", Telegram.WebApp);
    console.log("initData:", Telegram.WebApp.initData); // Raw данные
    console.log("initDataUnsafe:", Telegram.WebApp.initDataUnsafe);
    
    return true;
}

function getUserId() {
    if (!isTelegramWebApp()) {
        console.log("Не в Telegram Web App");
        return null;
    }
    
    if (!Telegram.WebApp.initData) {
        console.error("initData отсутствует");
        return null;
    }
    
    const initDataUnsafe = Telegram.WebApp.initDataUnsafe;
    if (initDataUnsafe?.user?.id) {
        console.log("User ID из initDataUnsafe:", initDataUnsafe.user.id);
        return initDataUnsafe.user.id;
    }
    
    try {
        const params = new URLSearchParams(Telegram.WebApp.initData);
        const userData = params.get('user');
        if (userData) {
            const user = JSON.parse(decodeURIComponent(userData));
            if (user?.id) {
                console.log("User ID из initData:", user.id);
                return user.id;
            }
        }
    } catch (e) {
        console.error("Ошибка парсинга initData:", e);
    }
    
    const queryId = initDataUnsafe?.query_id;
    if (queryId) {
        console.warn("Используется query_id:", queryId);
        return queryId;
    }
    
    console.error("Не удалось определить userId");
    return null;
}

function getLevelConfig(level) {
    if (level <= 26) {
        return LEVEL_WORDS[level];
    } else {
        return LEVEL_WORDS[26]; // Для уровней выше 26 используем параметры 26 уровня
    }
}

function parseInitData() {
    if (!Telegram.WebApp.initData) return null;
    
    const params = new URLSearchParams(Telegram.WebApp.initData);
    const userStr = params.get('user');
    if (!userStr) return null;
    
    try {
        return JSON.parse(decodeURIComponent(userStr));
    } catch (e) {
        console.error("Error parsing user data:", e);
        return null;
    }
}

async function loadSavedLevel() {
    let userId = null;
    
    if (isTelegramWebApp()) {
        userId = getUserId();
        console.log("Detected User ID:", userId);
        
        if (!userId) {
            console.warn("User ID не найден, сохранение в CloudStorage невозможно");
            Telegram.WebApp.showAlert("Не удалось определить ваш ID. Прогресс будет сохранён локально.");
        } else if (userId) {
            const key = `user_level_${userId}`;
            try {
                const value = await new Promise(resolve => {
                    Telegram.WebApp.CloudStorage.getItem(key, (err, val) => {
                        if (err) console.error("CloudStorage error:", err);
                        resolve(val);
                    });
                });
                if (value) return parseInt(value) || 1;
            } catch (e) {
                console.error("CloudStorage failed:", e);
            }
        }
    }
    
    // Fallback на localStorage
    const localValue = localStorage.getItem('crossword_user_level');
    return localValue ? parseInt(localValue) || 1 : 1;
}

async function saveCurrentLevel(level) {
    const levelStr = String(level);
    if (isTelegramWebApp()) {
        console.log("initDataUnsafe:", Telegram.WebApp.initDataUnsafe); // Отладка
        const userId = Telegram.WebApp.initDataUnsafe.user?.id;
        if (!userId) {
            console.error("Не удалось получить ID пользователя для сохранения уровня");
            localStorage.setItem('crossword_user_level', levelStr);
            return false;
        }
        const key = `user_level_${userId}`;
        return await new Promise((resolve) => {
            Telegram.WebApp.CloudStorage.setItem(key, levelStr, (error) => {
                if (error) {
                    console.error(`Ошибка сохранения уровня для user_${userId}:`, error);
                } else {
                    console.log(`Уровень ${level} сохранён для user_${userId}`);
                }
                resolve(!error);
            });
        });
    } else {
        localStorage.setItem('crossword_user_level', levelStr);
        return true;
    }
}

const RUSSIAN_LAYOUT = {
    'q': 'й', 'w': 'ц', 'e': 'у', 'r': 'к', 't': 'е', 'y': 'н', 
    'u': 'г', 'i': 'ш', 'o': 'щ', 'p': 'з', '[': 'х', ']': 'ъ',
    'a': 'ф', 's': 'ы', 'd': 'в', 'f': 'а', 'g': 'п', 'h': 'р',
    'j': 'о', 'k': 'л', 'l': 'д', ';': 'ж', "'": 'э', 
    'z': 'я', 'x': 'ч', 'c': 'с', 'v': 'м', 'b': 'и', 'n': 'т',
    'm': 'ь', ',': 'б', '.': 'ю', '/': '.', '`': 'ё'
};

const WORD_TYPES = {
    EASY: 'easy',
    HARD: 'hard'
};

const LEVEL_WORDS = {
    1: { total: 3, easy: 3, hard: 0, minLength: 3, maxLength: 5 },
    2: { total: 3, easy: 3, hard: 0, minLength: 3, maxLength: 5 },
    3: { total: 4, easy: 3, hard: 1, minLength: 3, maxLength: 5 },
    4: { total: 4, easy: 3, hard: 1, minLength: 3, maxLength: 5 },
    5: { total: 5, easy: 4, hard: 1, minLength: 3, maxLength: 5 },
    6: { total: 5, easy: 4, hard: 1, minLength: 3, maxLength: 5 },
    7: { total: 6, easy: 4, hard: 2, minLength: 6, maxLength: 7 },
    8: { total: 6, easy: 4, hard: 2, minLength: 6, maxLength: 7 },
    9: { total: 7, easy: 5, hard: 2, minLength: 6, maxLength: 7 },
    10: { total: 7, easy: 5, hard: 2, minLength: 6, maxLength: 7 },
    11: { total: 8, easy: 6, hard: 2, minLength: 6, maxLength: 7 },
    12: { total: 8, easy: 6, hard: 2, minLength: 6, maxLength: 7 },
    13: { total: 9, easy: 6, hard: 3, minLength: 8, maxLength: 9 },
    14: { total: 9, easy: 6, hard: 3, minLength: 8, maxLength: 9 },
    15: { total: 10, easy: 7, hard: 3, minLength: 8, maxLength: 9 },
    16: { total: 10, easy: 7, hard: 3, minLength: 8, maxLength: 9 },
    17: { total: 11, easy: 7, hard: 4, minLength: 8, maxLength: 9 },
    18: { total: 11, easy: 7, hard: 4, minLength: 8, maxLength: 9 },
    19: { total: 12, easy: 8, hard: 4, minLength: 10, maxLength: 11 },
    20: { total: 12, easy: 8, hard: 4, minLength: 10, maxLength: 11 },
    21: { total: 13, easy: 9, hard: 4, minLength: 10, maxLength: 11 },
    22: { total: 13, easy: 9, hard: 4, minLength: 10, maxLength: 11 },
    23: { total: 14, easy: 9, hard: 5, minLength: 10, maxLength: 11 },
    24: { total: 14, easy: 9, hard: 5, minLength: 10, maxLength: 11 },
    25: { total: 15, easy: 10, hard: 5, minLength: 10, maxLength: 11 },
    26: { total: 15, easy: 10, hard: 5, minLength: 12, maxLength: 15 }
};

let currentLevel = 1;
let wordDatabase = {
    easy: [],
    hard: []
};

let crossword = {
    words: [],
    grid: [],
    size: 0,
    selectedCell: null,
    definitions: [],
    hints: 0,
    usedWords: new Set(),
    wordsToFind: 0,
    wordsFound: 0,
    activeWordIndex: null
};

const usedLettersCache = {};

async function loadWords() {
    try {
        const [easyResponse, hardResponse] = await Promise.all([
            fetch('https://gist.githubusercontent.com/Ukinnne/7374dccab584f7903680e5a5bacb56a5/raw/easy_words.json'),
            fetch('https://gist.githubusercontent.com/Ukinnne/d8b156ad91831540f90236961c5095c9/raw/hard_words.json')
        ]);

        // Добавьте эти строки для проверки:
        console.log('Статус easyResponse:', easyResponse.status);
        console.log('Статус hardResponse:', hardResponse.status);

        if (!easyResponse.ok || !hardResponse.ok) {
            throw new Error(`Ошибка загрузки: ${easyResponse.status}, ${hardResponse.status}`);
        }

        const [easyData, hardData] = await Promise.all([
            easyResponse.json(),
            hardResponse.json()
        ]);

        if (!Array.isArray(easyData) || !Array.isArray(hardData)) {
            throw new Error("Данные должны быть массивом слов");
        }

        wordDatabase.easy = easyData;
        wordDatabase.hard = hardData;
        console.log(`Загружено: ${easyData.length} лёгких и ${hardData.length} сложных слов`);
    } catch (error) {
        console.error("Ошибка загрузки слов:", error);
        loadBackupWords(); // Используем резервные слова
    }
}

function loadBackupWords() {
    wordDatabase.easy = [
        { word: "КОМПЬЮТЕР", definition: "Электронное устройство для обработки информации" },
        { word: "ПРОГРАММА", definition: "Набор инструкций для компьютера" },
        { word: "АЛГОРИТМ", definition: "Последовательность действий для решения задачи" }
    ];
    
    wordDatabase.hard = [
        { word: "БАЗАДАННЫХ", definition: "Организованная совокупность данных" },
        { word: "ИНТЕРФЕЙС", definition: "Средство взаимодействия между системами" }
    ];
    
    alert('Используется резервный набор слов. Для полной версии проверьте подключение.');
}

function initEventListeners() {
    const hintButton = document.getElementById('hint-button');
    if (hintButton) {
        hintButton.addEventListener('click', giveHint);
    } else {
        console.warn('Элемент #hint-button не найден в DOM');
    }

    const toggleButton = document.querySelector('.solved-definitions-toggle');
    if (toggleButton) {
        toggleButton.addEventListener('click', toggleSolvedDefinitions);
    } else {
        console.warn('Элемент .solved-definitions-toggle не найден в DOM');
    }
}

// Запускаем после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    initGame().catch(error => {
        console.error("Ошибка инициализации игры:", error);
    });
});

function toggleSolvedDefinitions() {
    const panel = document.getElementById('solved-definitions');
    panel.classList.toggle('collapsed');
}

function handlePhysicalKeyPress(e) {
    if (!crossword.selectedCell) return;
    
    const { x, y } = crossword.selectedCell;
    const cellData = crossword.grid[y][x];
    if (!cellData) return;

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        
        let newX = x, newY = y;
        switch(e.key) {
            case 'ArrowUp': newY--; break;
            case 'ArrowDown': newY++; break;
            case 'ArrowLeft': newX--; break;
            case 'ArrowRight': newX++; break;
        }
        
        if (crossword.grid[newY] && crossword.grid[newY][newX]) {
            const currentCell = document.querySelector(`.crossword-cell[data-x="${x}"][data-y="${y}"]`);
            const newCell = document.querySelector(`.crossword-cell[data-x="${newX}"][data-y="${newY}"]`);
            
            if (currentCell && newCell) {
                const trail = document.createElement('div');
                trail.className = 'cell-trail';
                trail.style.left = `${currentCell.offsetLeft}px`;
                trail.style.top = `${currentCell.offsetTop}px`;
                document.getElementById('crossword-grid').appendChild(trail);
            }
            
            selectCell(newX, newY);
        }
        return;
    }
    
    if (e.key === 'Backspace') {
        const { x, y } = crossword.selectedCell;
        const cellData = crossword.grid[y][x];
        if (!cellData?.letter || cellData.letter === cellData.correctLetter) return;
        clearCell();
        return;
    }
    
    if (e.key === 'Enter') {
        showDefinitions();
        return;
    }
    
    if (e.key === ' ') {
        giveHint();
        return;
    }

    let letter = e.key.toLowerCase();
    if (RUSSIAN_LAYOUT[letter]) {
        letter = RUSSIAN_LAYOUT[letter];
    }

    if (/[а-яё]/.test(letter)) {
        handleKeyPress(letter.toUpperCase());
        e.preventDefault();
    }
}

async function startGame() {
    try {
        await loadWords();
        if (wordDatabase.easy.length + wordDatabase.hard.length < 3) {
            alert("Недостаточно слов для игры. Используются резервные слова.");
            loadBackupWords();
        }
        const savedLevel = await loadSavedLevel();
        currentLevel = savedLevel;
        console.log("Игра начинается с уровня:", currentLevel);
        loadLevel();
    } catch (error) {
        console.error("Ошибка при запуске игры:", error);
        currentLevel = 1; // Запасной вариант
        loadLevel();
    }
}

function showLevelCompleteDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'level-complete-dialog';
    dialog.innerHTML = `
        <div class="dialog-content">
            <h3>Уровень ${currentLevel} пройден!</h3>
            <div class="dialog-buttons">
                <button id="next-level-btn">Следующий уровень</button>
                <button id="menu-btn">В меню</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    document.getElementById('next-level-btn').addEventListener('click', async () => {
        dialog.remove();
        await completeLevel();
    });
    
    document.getElementById('menu-btn').addEventListener('click', async () => {
        await saveCurrentLevel(currentLevel + 1); // Сохраняем следующий уровень
        saveUserRecord(currentLevel + 1);
        location.href = '../MAIN/index.html';
    });
}


async function completeLevel() {
    try {
        currentLevel++; // Увеличиваем уровень только после завершения
        const saved = await saveCurrentLevel(currentLevel);
        if (!saved) {
            console.error("Не удалось сохранить уровень в CloudStorage");
            alert("Не удалось сохранить прогресс. Проверьте подключение.");
            return;
        }
        loadLevel(); // Загружаем новый уровень
    } catch (error) {
        console.error("Ошибка при завершении уровня:", error);
        alert("Произошла ошибка при сохранении прогресса.");
    }
}

async function initGame() {
    try {
        await loadWords();
        initEventListeners();
        await startGame();
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        loadBackupWords();
        initEventListeners();
        await startGame();
    }
}

function getWordCountForLevel(level) {
    return LEVEL_WORDS[level]?.total || LEVEL_WORDS[26].total;
}

function loadLevel() {
    const wordCount = getWordCountForLevel(currentLevel);
    document.getElementById('level-number').textContent = currentLevel;
    document.getElementById('crossword-grid').innerHTML = `<div class="loading">Генерация уровня ${currentLevel}...</div>`;
    document.getElementById('keyboard').innerHTML = '';
    document.getElementById('definitions-list').innerHTML = '';
    document.getElementById('solved-definitions-list').innerHTML = '';
    document.getElementById('solved-definitions').classList.add('collapsed');

    setTimeout(() => {
        try {
            if (generateCrossword()) {
                renderCrossword(true); // Добавлен принудительный рендеринг
                generateKeyboard();
                showDefinitions();
            } else {
                showError('Не удалось сгенерировать кроссворд');
            }
        } catch (error) {
            console.error('Ошибка генерации:', error);
            showError('Ошибка при создании кроссворда');
        }
    }, 50);
}

function showError(message) {
    alert(message);
}

function generateCrossword() {
    const levelConfig = getLevelConfig(currentLevel);
    crossword.size = Math.max(18, levelConfig.maxLength + 5);
    
    crossword.hints = levelConfig.total;
    crossword.wordsToFind = levelConfig.total;
    crossword.wordsFound = 0;
    crossword.words = [];
    crossword.grid = Array(crossword.size).fill().map(() => Array(crossword.size).fill(null));
    crossword.definitions = [];
    crossword.usedWords.clear();
    crossword.activeWordIndex = null;

    if (wordDatabase.easy.length + wordDatabase.hard.length < levelConfig.total) {
        console.error("Недостаточно слов для генерации");
        loadBackupWords();
    }

    // Первое слово
    const firstWordType = levelConfig.easy > 0 ? WORD_TYPES.EASY : WORD_TYPES.HARD;
    const firstWord = getRandomWord(firstWordType, levelConfig.minLength, levelConfig.maxLength);
    if (!firstWord) {
        console.error("Не удалось получить первое слово");
        return false;
    }
    
    const centerY = Math.floor(crossword.size / 2);
    const centerX = Math.floor((crossword.size - firstWord.word.length) / 2);
    
    if (!canPlaceWord(firstWord.word, {x: centerX, y: centerY}, 'horizontal')) {
        console.error("Не удалось разместить первое слово");
        return false;
    }
    
    addWordToGrid(firstWord, {x: centerX, y: centerY}, 'horizontal', 1);

    // Остальные слова
    let wordsAdded = 1;
    let attempts = 0;
    const maxAttempts = 1000;

    while (wordsAdded < levelConfig.total && attempts < maxAttempts) {
        const needEasy = wordsAdded < levelConfig.easy;
        const type = needEasy ? WORD_TYPES.EASY : WORD_TYPES.HARD;
        const wordObj = getRandomWord(type, levelConfig.minLength, levelConfig.maxLength);
        
        if (!wordObj) {
            console.error("Не удалось получить слово для уровня");
            break;
        }
        
        if (tryAddConnectedWord(wordObj)) {
            wordsAdded++;
        }
        attempts++;
    }

    console.log(`Добавлено слов: ${wordsAdded}/${levelConfig.total}, попыток: ${attempts}`);
    
    if (wordsAdded < Math.max(3, levelConfig.total * 0.7)) {
        console.error("Не удалось разместить достаточное количество слов");
        return false;
    }

    crossword.wordsToFind = wordsAdded;
    return true;
}

function getRandomWord(type, minLength, maxLength, recursionCount = 0) {
    const MAX_RECURSION = 1; // Ограничиваем количество рекурсий
    
    const availableWords = wordDatabase[type].filter(w => 
        !crossword.usedWords.has(w.word) && 
        w.word.length >= minLength && 
        w.word.length <= maxLength
    );
    
    if (availableWords.length > 0) {
        return availableWords[Math.floor(Math.random() * availableWords.length)];
    }

    // Пробуем другой тип слов
    const fallbackType = type === WORD_TYPES.EASY ? WORD_TYPES.HARD : WORD_TYPES.EASY;
    const fallbackWords = wordDatabase[fallbackType].filter(w => 
        !crossword.usedWords.has(w.word) && 
        w.word.length >= minLength && 
        w.word.length <= maxLength
    );
    
    if (fallbackWords.length > 0) {
        return fallbackWords[Math.floor(Math.random() * fallbackWords.length)];
    }

    // Расширяем диапазон длин слов
    const extendedMin = Math.max(3, minLength - 1);
    const extendedMax = maxLength + 1;
    const extendedWords = wordDatabase[type].filter(w => 
        !crossword.usedWords.has(w.word) && 
        w.word.length >= extendedMin && 
        w.word.length <= extendedMax
    );
    
    if (extendedWords.length > 0) {
        return extendedWords[Math.floor(Math.random() * extendedWords.length)];
    }

    // Если слов нет, очищаем usedWords и пробуем ещё раз, но с ограничением рекурсии
    if (recursionCount < MAX_RECURSION) {
        if (wordDatabase[type].length === 0 && wordDatabase[fallbackType].length === 0) {
            console.error("База слов пуста!");
            loadBackupWords();
            return getRandomWord(type, minLength, maxLength, recursionCount + 1);
        }
        crossword.usedWords.clear();
        console.warn("Очищены использованные слова, повторная попытка...");
        return getRandomWord(type, minLength, maxLength, recursionCount + 1);
    }

    // Если ничего не помогло, возвращаем null и обрабатываем это в вызывающей функции
    console.error("Не удалось найти подходящее слово!");
    return null;
}

function tryAddConnectedWord(wordObj) {
    for (const baseWord of crossword.words) {
        for (let i = 0; i < baseWord.word.length; i++) {
            const letter = baseWord.word[i];
            if (wordObj.word.includes(letter)) {
                const connectionIndex = wordObj.word.indexOf(letter);
                const direction = baseWord.direction === 'horizontal' ? 'vertical' : 'horizontal';
                
                const x = direction === 'horizontal' 
                    ? baseWord.x - connectionIndex 
                    : baseWord.x + i;
                const y = direction === 'horizontal' 
                    ? baseWord.y + i 
                    : baseWord.y - connectionIndex;
                
                if (canPlaceWord(wordObj.word, { x, y }, direction)) {
                    addWordToGrid(
                        wordObj, 
                        { x, y }, 
                        direction, 
                        crossword.words.length + 1
                    );
                    return true;
                }
            }
        }
    }
    return false;
}

function addWordToGrid(wordObj, position, direction, wordNumber) {
    const { word, definition } = wordObj;
    const { x, y } = position;
    
    crossword.usedWords.add(word);
    const wordInfo = {
        word, 
        x, 
        y, 
        direction,
        letters: [],
        definition,
        completed: false,
        countedAsFound: false,
        number: wordNumber
    };
    
    const wordIndex = crossword.words.length;
    crossword.words.push(wordInfo);
    
    for (let i = 0; i < word.length; i++) {
        const cellX = direction === 'horizontal' ? x + i : x;
        const cellY = direction === 'horizontal' ? y : y + i;
        
        if (!crossword.grid[cellY][cellX]) {
            crossword.grid[cellY][cellX] = {
                wordIndices: [],
                letter: null,
                correctLetter: word[i]
            };
        }
        
        crossword.grid[cellY][cellX].wordIndices.push(wordIndex);
        wordInfo.letters.push({ x: cellX, y: cellY });
    }
    
    crossword.definitions.push({
        number: wordNumber,
        direction: direction === 'horizontal' ? 'по горизонтали' : 'по вертикали',
        length: word.length,
        definition
    });
}

function canPlaceWord(word, position, direction) {
    const { x, y } = position;
    const length = word.length;
    
    // Проверка выхода за границы сетки
    if (x < 0 || y < 0) return false;
    if (direction === 'horizontal' && x + length > crossword.size) return false;
    if (direction === 'vertical' && y + length > crossword.size) return false;
    
    // Проверка каждой клетки слова
    for (let i = 0; i < length; i++) {
        const cellX = direction === 'horizontal' ? x + i : x;
        const cellY = direction === 'horizontal' ? y : y + i;
        const cell = crossword.grid[cellY]?.[cellX];
        
        // Если клетка занята и буква не совпадает, размещение невозможно
        if (cell && cell.correctLetter !== word[i]) return false;
    }
    
    // Проверка расстояния до других слов (нужен зазор в 1 клетку для непересекающихся слов)
    for (let i = 0; i < length; i++) {
        const cellX = direction === 'horizontal' ? x + i : x;
        const cellY = direction === 'horizontal' ? y : y + i;
        
        // Определяем соседние клетки (включая диагонали)
        const neighbors = [
            { dx: 0, dy: 1 },  // вниз
            { dx: 0, dy: -1 }, // вверх
            { dx: 1, dy: 0 },  // вправо
            { dx: -1, dy: 0 }, // влево
            { dx: 1, dy: 1 },  // вниз-вправо
            { dx: -1, dy: -1 }, // вверх-влево
            { dx: 1, dy: -1 }, // вверх-вправо
            { dx: -1, dy: 1 }  // вниз-влево
        ];
        
        for (const { dx, dy } of neighbors) {
            const nx = cellX + dx;
            const ny = cellY + dy;
            
            // Проверяем, что соседняя клетка в пределах сетки
            if (nx >= 0 && ny >= 0 && nx < crossword.size && ny < crossword.size) {
                const neighborCell = crossword.grid[ny][nx];
                
                // Если соседняя клетка занята
                if (neighborCell) {
                    // Проверяем, пересекается ли текущее слово с существующим
                    let intersects = false;
                    for (let j = 0; j < length; j++) {
                        const checkX = direction === 'horizontal' ? x + j : x;
                        const checkY = direction === 'horizontal' ? y : y + j;
                        if (crossword.grid[checkY][checkX]?.wordIndices?.length > 0) {
                            intersects = true;
                            break;
                        }
                    }
                    
                    // Если нет пересечения и соседняя клетка занята, возвращаем false
                    if (!intersects) {
                        return false;
                    }
                }
            }
        }
    }
    
    return true;
}

function renderCrossword(force = false) {
    if (!force && !document.getElementById('crossword-grid').children.length) {
        return;
    }
    
    const grid = document.getElementById('crossword-grid');
    grid.innerHTML = '';
    
    let minX = crossword.size, maxX = 0, minY = crossword.size, maxY = 0;
    for (let y = 0; y < crossword.size; y++) {
        for (let x = 0; x < crossword.size; x++) {
            if (crossword.grid[y][x]) {
                minX = Math.min(minX, x); maxX = Math.max(maxX, x);
                minY = Math.min(minY, y); maxY = Math.max(maxY, y);
            }
        }
    }
    
    minX = Math.max(0, minX - 1); maxX = Math.min(crossword.size - 1, maxX + 1);
    minY = Math.max(0, minY - 1); maxY = Math.min(crossword.size - 1, maxY + 1);
    
    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            const cell = document.createElement('div');
            cell.className = 'crossword-cell';
            cell.tabIndex = 0;
            
            if (crossword.grid[y][x]) {
                const cellData = crossword.grid[y][x];
                if (cellData.wordIndices.length > 1) {
                    cell.classList.add('multiple-words');
                }
                if (cellData.letter) {
                    cell.textContent = cellData.letter;
                    
                    if (cellData.letter === cellData.correctLetter) {
                        cell.classList.add('correct-letter');
                    } else {
                        cell.classList.add('incorrect-letter');
                    }
                    
                    const wordInfo = crossword.words[cellData.wordIndices[0]];
                    if (wordInfo.completed) {
                        cell.classList.add('completed-word');
                    }
                }
                cell.dataset.x = x;
                cell.dataset.y = y;
                cell.addEventListener('click', (e) => {
                    if (e.shiftKey && crossword.grid[y][x].wordIndices.length > 1) {
                        const currentIndex = crossword.grid[y][x].wordIndices.indexOf(crossword.activeWordIndex);
                        const nextIndex = (currentIndex + 1) % crossword.grid[y][x].wordIndices.length;
                        selectCell(x, y, crossword.grid[y][x].wordIndices[nextIndex]);
                    } else {
                        selectCell(x, y);
                    }
                });
            } else {
                cell.style.visibility = 'hidden';
            }
            grid.appendChild(cell);
        }
    }
    
    grid.style.gridTemplateColumns = `repeat(${maxX - minX + 1}, 30px)`;
    grid.style.gridTemplateRows = `repeat(${maxY - minY + 1}, 30px)`;
    
    if (crossword.selectedCell) {
        const { x, y } = crossword.selectedCell;
        selectCell(x, y, crossword.activeWordIndex);
    }
}

function selectCell(x, y, wordIndex = null) {
    document.querySelectorAll('.cell-trail').forEach(el => el.remove());
    document.querySelectorAll('.crossword-cell').forEach(cell => {
        cell.classList.remove('highlight', 'current-word');
    });
    
    const cellData = crossword.grid[y]?.[x];
    if (!cellData) return;
    
    const cell = document.querySelector(`.crossword-cell[data-x="${x}"][data-y="${y}"]`);
    if (!cell) return;
    
    if (wordIndex !== null) {
        crossword.activeWordIndex = wordIndex;
    } else if (cellData.wordIndices.length === 1) {
        crossword.activeWordIndex = cellData.wordIndices[0];
    } else if (crossword.activeWordIndex === null || !cellData.wordIndices.includes(crossword.activeWordIndex)) {
        crossword.activeWordIndex = cellData.wordIndices[0];
    }
    
    const trail = document.createElement('div');
    trail.className = 'cell-trail';
    trail.style.left = `${cell.offsetLeft}px`;
    trail.style.top = `${cell.offsetTop}px`;
    document.getElementById('crossword-grid').appendChild(trail);
    
    cell.classList.add('highlight');
    crossword.selectedCell = { x, y };
    
    const activeWord = crossword.words[crossword.activeWordIndex];
    for (const { x: wx, y: wy } of activeWord.letters) {
        const wCell = document.querySelector(`.crossword-cell[data-x="${wx}"][data-y="${wy}"]`);
        if (wCell) wCell.classList.add('current-word');
    }
}

function getUsedLetters() {
    const cacheKey = crossword.words.map(w => w.word).join('');
    if (usedLettersCache[cacheKey]) {
        return usedLettersCache[cacheKey];
    }
    
    const usedLetters = new Set();
    for (const wordInfo of crossword.words) {
        for (const letter of wordInfo.word) {
            usedLetters.add(letter);
        }
    }
    
    usedLettersCache[cacheKey] = usedLetters;
    return usedLetters;
}

function generateKeyboard() {
    const keyboard = document.getElementById('keyboard');
    keyboard.innerHTML = '';
    const russianLetters = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
    const usedLetters = getUsedLetters();
    
    for (const letter of russianLetters) {
        const key = document.createElement('button');
        key.className = 'keyboard-key';
        key.textContent = letter;
        
        if (usedLetters.has(letter)) {
            key.classList.add('keyboard-key-used');
            key.addEventListener('click', () => handleKeyPress(letter));
        } else {
            key.classList.add('keyboard-key-unused');
            key.disabled = true;
        }
        
        keyboard.appendChild(key);
    }
    
    const specialButtons = [
        { text: '⌫', action: clearCell, width: null },
        { text: '📖', action: showDefinitions, width: '60px' },
        { text: 'Подсказка', action: giveHint, width: '80px' }
    ];
    
    for (const btn of specialButtons) {
        const key = document.createElement('button');
        key.className = 'keyboard-key keyboard-key-used';
        key.textContent = btn.text;
        if (btn.width) key.style.width = btn.width;
        key.addEventListener('click', btn.action);
        keyboard.appendChild(key);
    }
}

function handleKeyPress(letter) {
    if (!crossword.selectedCell || crossword.activeWordIndex === null) return;
    const { x, y } = crossword.selectedCell;
    const cellData = crossword.grid[y][x];
    if (!cellData || (cellData.letter && cellData.letter === cellData.correctLetter)) return;
    
    const activeWord = crossword.words[crossword.activeWordIndex];
    cellData.letter = letter;
    
    renderCrossword();
    moveToNextCell(x, y, crossword.activeWordIndex);
    checkAllWordsCompletion();
}

function moveToNextCell(x, y, wordIndex) {
    const wordInfo = crossword.words[wordIndex];
    const direction = wordInfo.direction;
    let nextX = x, nextY = y;
    
    if (direction === 'horizontal') {
        nextX = x + 1;
        if (nextX >= wordInfo.x + wordInfo.word.length) {
            findNextWord(wordIndex, x, y);
            return;
        }
    } else {
        nextY = y + 1;
        if (nextY >= wordInfo.y + wordInfo.word.length) {
            findNextWord(wordIndex, x, y);
            return;
        }
    }
    
    const nextCell = crossword.grid[nextY]?.[nextX];
    if (nextCell && nextCell.wordIndices.includes(wordIndex)) {
        selectCell(nextX, nextY, wordIndex);
    } else {
        findNextWord(wordIndex, x, y);
    }
}

function findNextWord(currentWordIndex, x, y) {
    for (let i = 0; i < crossword.words.length; i++) {
        const idx = (currentWordIndex + i + 1) % crossword.words.length;
        const word = crossword.words[idx];
        if (!word.completed) {
            const firstCell = word.letters[0];
            selectCell(firstCell.x, firstCell.y, idx);
            return;
        }
    }
    selectCell(x, y);
}

function clearCell() {
    if (!crossword.selectedCell) return;
    const { x, y } = crossword.selectedCell;
    const cellData = crossword.grid[y][x];
    if (!cellData?.letter || cellData.letter === cellData.correctLetter) return;
    
    cellData.letter = null;
    if (crossword.activeWordIndex !== null) {
        crossword.words[crossword.activeWordIndex].completed = false;
    }
    renderCrossword();
    selectCell(x, y);
}

function checkAllWordsCompletion() {
    const newlyCompletedWords = [];
    
    for (let i = 0; i < crossword.words.length; i++) {
        const wordInfo = crossword.words[i];
        
        if (wordInfo.completed) continue;
        
        let allLettersCorrect = true;
        let allLettersFilled = true;
        
        for (const {x, y} of wordInfo.letters) {
            const cell = crossword.grid[y][x];
            
            if (!cell.letter) {
                allLettersFilled = false;
                break;
            }
            
            if (cell.letter !== cell.correctLetter) {
                allLettersCorrect = false;
            }
        }
        
        if (allLettersFilled) {
            wordInfo.completed = allLettersCorrect;
            
            if (allLettersCorrect && !wordInfo.countedAsFound) {
                wordInfo.countedAsFound = true;
                crossword.wordsFound++;
                newlyCompletedWords.push(wordInfo);
                
                highlightWord(i, 'completed-word');
                addSolvedDefinition(wordInfo.word, wordInfo.definition);
                
                setTimeout(() => {
                    highlightWord(i, 'dice-animation');
                    setTimeout(() => {
                        document.querySelectorAll('.dice-animation').forEach(el => {
                            el.classList.remove('dice-animation');
                        });
                    }, 800);
                }, 100);
            }
        }
    }
    
    if (newlyCompletedWords.length > 0) {
        renderCrossword();
        
        newlyCompletedWords.forEach((wordInfo, index) => {
            setTimeout(() => {
                alert(`Верно! Слово "${wordInfo.word}" угадано.`);
            }, 200 + (index * 300));
        });
        
        if (crossword.wordsFound === crossword.wordsToFind) {
            setTimeout(() => showLevelCompleteDialog(), 500 + (newlyCompletedWords.length * 300));
        }
    }
}

function checkSingleWordCompletion(wordIndex) {
    const wordInfo = crossword.words[wordIndex];
    let allLettersFilled = true;
    let allLettersCorrect = true;
    
    for (const { x, y } of wordInfo.letters) {
        const cell = crossword.grid[y][x];
        if (!cell.letter) {
            allLettersFilled = false;
            break;
        }
        if (cell.letter !== cell.correctLetter) {
            allLettersCorrect = false;
        }
    }
    
    if (allLettersFilled) {
        wordInfo.completed = allLettersCorrect;
        
        if (allLettersCorrect && !wordInfo.countedAsFound) {
            wordInfo.countedAsFound = true;
            crossword.wordsFound++;
            
            highlightWord(wordIndex, 'completed-word');
            addSolvedDefinition(wordInfo.word, wordInfo.definition);
            
            setTimeout(() => {
                highlightWord(wordIndex, 'dice-animation');
                setTimeout(() => {
                    document.querySelectorAll('.dice-animation').forEach(el => {
                        el.classList.remove('dice-animation');
                    });
                }, 800);
            }, 100);

            if (crossword.wordsFound === crossword.wordsToFind) {
                setTimeout(() => completeLevel(), 500);
            } else {
                setTimeout(() => alert(`Верно! Слово "${wordInfo.word}" угадано.`), 100);
            }
        }
    }
}

function highlightWord(wordIndex, className) {
    for (const { x, y } of crossword.words[wordIndex].letters) {
        const cell = document.querySelector(`.crossword-cell[data-x="${x}"][data-y="${y}"]`);
        if (cell) {
            cell.classList.add(className);
            if (className === 'dice-animation') {
                void cell.offsetWidth;
            }
        }
    }
}

function completeLevel() {
    currentLevel++;
    loadLevel();
}

function showDefinitions() {
    const box = document.getElementById('definitions-box');
    const list = document.getElementById('definitions-list');
    list.innerHTML = '';
    
    crossword.definitions.forEach(def => {
        const item = document.createElement('div');
        item.className = 'definition-item';
        item.innerHTML = `<strong>${def.number}. (${def.direction}, ${def.length} букв):</strong> ${def.definition}`;
        list.appendChild(item);
    });
    
    box.classList.remove('hidden');
    box.onclick = (e) => {
        if (e.target === box || e.target.tagName === 'H3') {
            box.classList.add('hidden');
        }
    };
}

function addSolvedDefinition(word, definition) {
    const panel = document.getElementById('solved-definitions');
    const list = document.getElementById('solved-definitions-list');
    
    if (panel.classList.contains('hidden')) {
        panel.classList.remove('hidden');
    }
    
    const item = document.createElement('div');
    item.className = 'solved-definition-item';
    item.innerHTML = `<strong>${word}:</strong> ${definition}`;
    list.appendChild(item);
    
    panel.scrollTop = panel.scrollHeight;
}

function giveHint() {
    if (crossword.hints <= 0) {
        alert('Подсказки закончились!');
        return;
    }
    
    if (!crossword.selectedCell) {
        alert('Выберите клетку для подсказки');
        return;
    }
    
    const { x, y } = crossword.selectedCell;
    const cell = crossword.grid[y][x];
    
    if (!cell || cell.letter) {
        alert('Выберите пустую клетку');
        return;
    }
    
    cell.letter = cell.correctLetter;
    crossword.hints--;
    document.getElementById('hint-count').textContent = crossword.hints;
    renderCrossword();
    selectCell(x, y);
    checkAllWordsCompletion();
}
async function completeLevel() {
    try {
        currentLevel++; // Увеличиваем уровень только после завершения
        const saved = await saveCurrentLevel(currentLevel);
        if (!saved) {
            console.error("Не удалось сохранить уровень в CloudStorage");
            alert("Не удалось сохранить прогресс. Проверьте подключение.");
            return;
        }
        await saveUserRecord(currentLevel); // Сохраняем рекорд, если он выше предыдущего
        loadLevel(); // Загружаем новый уровень
    } catch (error) {
        console.error("Ошибка при завершении уровня:", error);
        alert("Произошла ошибка при сохранении прогресса.");
    }
}

async function debugCloudStorage() {
    if (isTelegramWebApp()) {
        const userId = Telegram.WebApp.initDataUnsafe.user?.id;
        if (userId) {
            const key = `user_level_${userId}`;
            Telegram.WebApp.CloudStorage.getItem(key, (error, value) => {
                console.log(`Cloud Storage для ${key}:`, value || "Нет данных", error || "");
            });
        }
    }
}
// Вызовите где-нибудь, например, в initGame
initGame().then(() => debugCloudStorage());

document.addEventListener('DOMContentLoaded', () => {
    if (isTelegramWebApp()) {
        Telegram.WebApp.ready();
        Telegram.WebApp.expand(); // Рекомендуется для лучшего UX
    }
    initGame().catch(console.error);
});