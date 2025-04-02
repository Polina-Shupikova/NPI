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
    26: { total: 15, easy: 10, hard: 5, minLength: 21, maxLength: 15 },
    27: { total: 15, easy: 0, hard: 15, minLength: 15, maxLength: 15 }
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

function isTelegramWebApp() {
    return window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe;
}

function getLevelConfig(level) {
    if (level <= 27) {
        return LEVEL_WORDS[level];
    } else {
        return LEVEL_WORDS[27]; // Для уровней выше 27 используем параметры 27 уровня
    }
}

async function saveCurrentLevel(level) {
    const levelStr = String(level);
    console.log("Попытка сохранения уровня:", levelStr);
    
    if (isTelegramWebApp()) {
        try {
            const saved = await new Promise(resolve => {
                Telegram.WebApp.CloudStorage.setItem('user_level', levelStr, error => {
                    if (error) {
                        console.error("Ошибка CloudStorage:", error);
                        resolve(false);
                    } else {
                        console.log("Уровень сохранён в CloudStorage");
                        resolve(true);
                    }
                });
            });
            
            if (saved) return true;
        } catch (e) {
            console.error("Ошибка CloudStorage:", e);
        }
    }
    
    localStorage.setItem('crossword_user_level', levelStr);
    console.log("Уровень сохранён в localStorage");
    return true;
}

async function loadSavedLevel() {
    if (isTelegramWebApp()) {
        try {
            const value = await new Promise(resolve => {
                Telegram.WebApp.CloudStorage.getItem('user_level', (error, value) => {
                    if (error) {
                        console.error("Ошибка загрузки из CloudStorage:", error);
                        resolve(null);
                    } else {
                        resolve(value);
                    }
                });
            });
            
            if (value) {
                const level = parseInt(value) || 1;
                console.log("Уровень загружен из CloudStorage:", level);
                return level;
            }
        } catch (e) {
            console.error("Ошибка CloudStorage:", e);
        }
    }
    
    const localValue = localStorage.getItem('crossword_user_level');
    const level = localValue ? parseInt(localValue) : 1;
    console.log("Уровень загружен из localStorage:", level);
    return level;
}

async function saveUserRecord(level) {
    if (!isTelegramWebApp()) return;
    
    const userId = Telegram.WebApp.initDataUnsafe.user?.id;
    if (!userId) return;
    
    try {
        await new Promise(resolve => {
            Telegram.WebApp.CloudStorage.setItem(
                `user_${userId}_record`,
                String(level),
                (error) => {
                    if (error) {
                        console.error("Ошибка сохранения рекорда:", error);
                    } else {
                        console.log("Рекорд сохранён:", level);
                    }
                    resolve();
                }
            );
        });
    } catch (e) {
        console.error("Ошибка сохранения рекорда:", e);
    }
}

async function initGame() {
    console.log("Инициализация игры...");
    
    if (isTelegramWebApp()) {
        console.log("Telegram WebApp detected");
        Telegram.WebApp.expand();
        Telegram.WebApp.enableClosingConfirmation();
    }
    
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

async function loadWords() {
    try {
        const easyResponse = await fetch('easy_words.json');
        if (!easyResponse.ok) throw new Error(`Ошибка HTTP при загрузке easy_words.json! Статус: ${easyResponse.status}`);
        
        const easyData = await easyResponse.json();
        if (!Array.isArray(easyData)) throw new Error("easy_words.json не содержит массив слов");
        
        const hardResponse = await fetch('hard_words.json');
        if (!hardResponse.ok) throw new Error(`Ошибка HTTP при загрузке hard_words.json! Статус: ${hardResponse.status}`);
        
        const hardData = await hardResponse.json();
        if (!Array.isArray(hardData)) throw new Error("hard_words.json не содержит массив слов");
        
        wordDatabase.easy = easyData;
        wordDatabase.hard = hardData;
        
        console.log(`Успешно загружено: ${wordDatabase.easy.length} простых и ${wordDatabase.hard.length} сложных слов`);
    } catch (error) {
        console.error("Ошибка загрузки слов:", error.message);
        throw error;
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
    
    console.log('Используется резервный набор слов');
}

function initEventListeners() {
    document.getElementById('hint-button').addEventListener('click', giveHint);
    document.querySelector('.solved-definitions-toggle').addEventListener('click', toggleSolvedDefinitions);
    document.addEventListener('keydown', handlePhysicalKeyPress);
}

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
    if (wordDatabase.easy.length + wordDatabase.hard.length < 3) {
        alert('Недостаточно слов для начала игры. Минимум 3 слова.');
        return;
    }
    
    currentLevel = await loadSavedLevel();
    console.log("Начинаем игру с уровня:", currentLevel);
    loadLevel();
}

async function completeLevel() {
    const newLevel = currentLevel + 1;
    
    try {
        const saved = await saveCurrentLevel(newLevel);
        if (saved) {
            await saveUserRecord(newLevel);
            currentLevel = newLevel;
            loadLevel();
        } else {
            alert("Не удалось сохранить прогресс");
        }
    } catch (e) {
        console.error("Ошибка сохранения:", e);
        alert("Ошибка сохранения прогресса");
    }
}

function loadLevel() {
    const levelConfig = getLevelConfig(currentLevel);
    document.getElementById('level-number').textContent = currentLevel;
    document.getElementById('crossword-grid').innerHTML = `<div class="loading">Генерация уровня ${currentLevel}...</div>`;
    document.getElementById('keyboard').innerHTML = '';
    document.getElementById('definitions-list').innerHTML = '';
    document.getElementById('solved-definitions-list').innerHTML = '';
    document.getElementById('solved-definitions').classList.add('collapsed');

    // Удален вывод сообщения об ошибке и добавлен автоматический рестарт
    const tryGenerate = () => {
        try {
            if (generateCrossword(levelConfig)) {
                generateKeyboard();
                showDefinitions();
            } else {
                // Если не получилось - пробуем снова через 50мс
                setTimeout(tryGenerate, 50);
            }
        } catch (error) {
            console.error('Ошибка генерации:', error);
            // При ошибке тоже пробуем снова
            setTimeout(tryGenerate, 50);
        }
    };

    // Первая попытка генерации
    setTimeout(tryGenerate, 50);
}

function showError(message) {
    alert(message);
}

function generateCrossword(levelConfig) {
    // Увеличиваем размер сетки для больших уровней
    crossword.size = Math.max(
        15,
        levelConfig.maxLength + Math.floor(levelConfig.total / 2) + 3
    );
    
    // Остальная инициализация...
    
    let attempts = 0;
    const maxAttempts = 200; // Увеличили количество попыток
    
    while (attempts < maxAttempts) {
        // ... существующая логика ...
        
        // После размещения первого слова добавляем проверку
        if (crossword.words.length === 1) {
            // Сдвигаем все слово на 1 клетку от края если нужно
            const firstWord = crossword.words[0];
            if (firstWord.x === 0 || firstWord.y === 0) {
                const newX = firstWord.x === 0 ? 1 : firstWord.x;
                const newY = firstWord.y === 0 ? 1 : firstWord.y;
                
                if (canPlaceWord(firstWord.word, {x: newX, y: newY}, firstWord.direction)) {
                    // Перемещаем слово
                    removeWordFromGrid(firstWord);
                    addWordToGrid(
                        {word: firstWord.word, definition: firstWord.definition},
                        {x: newX, y: newY},
                        firstWord.direction,
                        1
                    );
                }
            }
        }
        
        // ... остальная логика генерации ...
    }
}

function removeWordFromGrid(wordInfo) {
    for (const {x, y} of wordInfo.letters) {
        const cell = crossword.grid[y][x];
        if (cell) {
            cell.wordIndices = cell.wordIndices.filter(idx => idx !== crossword.words.indexOf(wordInfo));
            if (cell.wordIndices.length === 0) {
                crossword.grid[y][x] = null;
            }
        }
    }
    crossword.words = crossword.words.filter(w => w !== wordInfo);
}

function getRandomWord(type, minLength, maxLength) {
    const availableWords = wordDatabase[type].filter(w => 
        !crossword.usedWords.has(w.word) && 
        w.word.length >= minLength && 
        w.word.length <= maxLength
    );
    
    if (availableWords.length === 0) {
        const fallbackType = type === WORD_TYPES.EASY ? WORD_TYPES.HARD : WORD_TYPES.EASY;
        const fallbackWords = wordDatabase[fallbackType].filter(w => 
            !crossword.usedWords.has(w.word) && 
            w.word.length >= minLength && 
            w.word.length <= maxLength
        );
        
        if (fallbackWords.length === 0) {
            const extendedMin = Math.max(3, minLength - 1);
            const extendedMax = maxLength + 1;
            const extendedWords = wordDatabase[type].filter(w => 
                !crossword.usedWords.has(w.word) && 
                w.word.length >= extendedMin && 
                w.word.length <= extendedMax
            );
            
            if (extendedWords.length === 0) {
                crossword.usedWords.clear();
                return getRandomWord(type, minLength, maxLength);
            }
            return extendedWords[Math.floor(Math.random() * extendedWords.length)];
        }
        return fallbackWords[Math.floor(Math.random() * fallbackWords.length)];
    }
    
    return availableWords[Math.floor(Math.random() * availableWords.length)];
}

function tryAddConnectedWord(wordObj) {
    // 1. Собираем все возможные точки соединения
    const connectionPoints = [];
    for (const baseWord of crossword.words) {
        for (let i = 0; i < baseWord.word.length; i++) {
            const baseLetter = baseWord.word[i];
            const letterIndices = getAllIndices(wordObj.word, baseLetter);
            
            for (const j of letterIndices) {
                connectionPoints.push({
                    baseWord,
                    baseLetterIndex: i,
                    newLetterIndex: j
                });
            }
        }
    }
    
    // 2. Сортируем точки соединения по "качеству"
    connectionPoints.sort((a, b) => {
        // Предпочитаем соединения ближе к центру слова
        const aDistToCenter = Math.abs(a.baseLetterIndex - a.baseWord.word.length/2);
        const bDistToCenter = Math.abs(b.baseLetterIndex - b.baseWord.word.length/2);
        return aDistToCenter - bDistToCenter;
    });
    
    // 3. Пробуем разместить слово в каждой точке
    for (const {baseWord, baseLetterIndex, newLetterIndex} of connectionPoints) {
        const direction = baseWord.direction === 'horizontal' ? 'vertical' : 'horizontal';
        
        const x = direction === 'horizontal' 
            ? baseWord.x + baseLetterIndex - newLetterIndex
            : baseWord.x + baseLetterIndex;
            
        const y = direction === 'horizontal' 
            ? baseWord.y
            : baseWord.y + baseLetterIndex - newLetterIndex;
        
        if (canPlaceWord(wordObj.word, {x, y}, direction)) {
            addWordToGrid(wordObj, {x, y}, direction, crossword.words.length + 1);
            return true;
        }
    }
    
    return false;
}

// Вспомогательная функция для поиска всех вхождений буквы
function getAllIndices(word, letter) {
    const indices = [];
    for (let i = 0; i < word.length; i++) {
        if (word[i] === letter) indices.push(i);
    }
    return indices;
}

function placeFirstWord(wordObj) {
    // Размещаем первое слово ближе к центру
    const center = Math.floor(crossword.size / 2) - Math.floor(wordObj.word.length / 2);
    const startPos = { 
        x: Math.max(1, center), // Отступаем от края
        y: Math.max(1, center)  // Отступаем от края
    };
    
    if (canPlaceWord(wordObj.word, startPos, 'horizontal')) {
        addWordToGrid(wordObj, startPos, 'horizontal', 1);
        return true;
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
    
    // 1. Проверка выхода за границы сетки
    if (x < 0 || y < 0) return false;
    if (direction === 'horizontal' && x + length > crossword.size) return false;
    if (direction === 'vertical' && y + length > crossword.size) return false;
    
    // 2. Проверка всех клеток, которые займет слово
    for (let i = 0; i < length; i++) {
        const cellX = direction === 'horizontal' ? x + i : x;
        const cellY = direction === 'horizontal' ? y : y + i;
        
        // Проверка самой клетки
        const cell = crossword.grid[cellY]?.[cellX];
        if (cell && cell.correctLetter !== word[i]) {
            return false;
        }
        
        // 3. Проверка соседних клеток (в радиусе 1 клетки)
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue; // Пропускаем текущую клетку
                
                const nx = cellX + dx;
                const ny = cellY + dy;
                
                if (nx >= 0 && ny >= 0 && nx < crossword.size && ny < crossword.size) {
                    const neighborCell = crossword.grid[ny][nx];
                    if (neighborCell) {
                        // 4. Получаем все слова в соседней клетке
                        const neighborWords = neighborCell.wordIndices.map(idx => crossword.words[idx]);
                        
                        for (const neighborWord of neighborWords) {
                            // 5. Если ориентация совпадает - запрещаем размещение
                            if (neighborWord.direction === direction) {
                                return false;
                            }
                            
                            // 6. Если слова разной ориентации, проверяем расстояние
                            const isConnected = wordsShareLetters(word, neighborWord.word);
                            if (!isConnected) {
                                // Проверяем минимальное расстояние между словами
                                if (Math.abs(dx) + Math.abs(dy) === 1) {
                                    // Соседняя клетка непосредственно рядом
                                    return false;
                                }
                                
                                // Дополнительная проверка угловых соседей для слов без общих букв
                                if ((dx !== 0 && dy !== 0) && 
                                    (crossword.grid[ny]?.[cellX] || crossword.grid[cellY]?.[nx])) {
                                    return false;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    // 7. Дополнительная проверка для слов без общих букв - они не должны быть рядом
    if (!crossword.words.some(w => wordsShareLetters(word, w.word))) {
        // Проверяем буферную зону в 1 клетку вокруг всего слова
        const bufferStartX = Math.max(0, x - 1);
        const bufferEndX = direction === 'horizontal' ? Math.min(crossword.size - 1, x + length) : Math.min(crossword.size - 1, x + 1);
        const bufferStartY = Math.max(0, y - 1);
        const bufferEndY = direction === 'vertical' ? Math.min(crossword.size - 1, y + length) : Math.min(crossword.size - 1, y + 1);
        
        for (let by = bufferStartY; by <= bufferEndY; by++) {
            for (let bx = bufferStartX; bx <= bufferEndX; bx++) {
                if (crossword.grid[by]?.[bx]) {
                    // Нашли занятую клетку в буферной зоне
                    return false;
                }
            }
        }
    }
    
    return true;
}

// Вспомогательная функция для проверки общих букв
function wordsShareLetters(word1, word2) {
    const letters1 = new Set(word1.split(''));
    const letters2 = new Set(word2.split(''));
    
    for (const letter of letters1) {
        if (letters2.has(letter)) {
            return true;
        }
    }
    return false;
}

function renderCrossword(force = false) {
    if (!force && !document.getElementById('crossword-grid').children.length) {
        return;
    }

    const grid = document.getElementById('crossword-grid');
    grid.innerHTML = '';

    // Находим границы кроссворда с запасом
    let minX = crossword.size, maxX = 0, minY = crossword.size, maxY = 0;
    for (let y = 0; y < crossword.size; y++) {
        for (let x = 0; x < crossword.size; x++) {
            if (crossword.grid[y][x]) {
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            }
        }
    }

    // Добавляем отступы от границ
    minX = Math.max(0, minX - 1);
    maxX = Math.min(crossword.size - 1, maxX + 1);
    minY = Math.max(0, minY - 1);
    maxY = Math.min(crossword.size - 1, maxY + 1);

    const gridWidth = maxX - minX + 1;
    const gridHeight = maxY - minY + 1;

    // Рассчитываем размер ячейки
    const cellSize = calculateMaxCellSize(gridWidth, gridHeight);

    // Создаем ячейки кроссворда
    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            const cell = document.createElement('div');
            cell.className = 'crossword-cell';
            cell.style.width = `${cellSize}px`;
            cell.style.height = `${cellSize}px`;
            cell.style.fontSize = `${Math.max(12, cellSize * 0.5)}px`;
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

    // Устанавливаем размеры сетки
    grid.style.gridTemplateColumns = `repeat(${gridWidth}, ${cellSize}px)`;
    grid.style.gridTemplateRows = `repeat(${gridHeight}, ${cellSize}px)`;
    grid.style.maxWidth = `${gridWidth * cellSize}px`;
    grid.style.maxHeight = `${gridHeight * cellSize}px`;
    grid.style.overflow = 'auto';

    // Восстанавливаем выделенную ячейку
    if (crossword.selectedCell) {
        const { x, y } = crossword.selectedCell;
        selectCell(x, y, crossword.activeWordIndex);
    }
}

function calculateMaxCellSize(gridWidth, gridHeight) {
    // Получаем размеры области просмотра с учетом безопасных зон
    const viewportWidth = Math.min(window.innerWidth, document.documentElement.clientWidth);
    const viewportHeight = Math.min(window.innerHeight, document.documentElement.clientHeight);
    
    // Оставляем место для других элементов интерфейса (заголовок, клавиатура и т.д.)
    const headerHeight = 100; // Примерная высота заголовка
    const keyboardHeight = 150; // Примерная высота клавиатуры
    const padding = 20; // Отступы
    
    const availableWidth = viewportWidth - 2 * padding;
    const availableHeight = viewportHeight - headerHeight - keyboardHeight - 2 * padding;
    
    // Рассчитываем максимальный размер ячейки
    const maxWidth = Math.floor(availableWidth / gridWidth);
    const maxHeight = Math.floor(availableHeight / gridHeight);
    
    // Ограничиваем минимальный размер ячейки для удобства нажатия
    const minCellSize = 20;
    
    return Math.max(minCellSize, Math.min(maxWidth, maxHeight, 30));
}

// Добавляем обработчик изменения размера окна
window.addEventListener('resize', () => {
    if (crossword.grid.length > 0) {
        renderCrossword(true);
    }
});

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
    if (!cellData) return;
    
    const activeWord = crossword.words[crossword.activeWordIndex];
    cellData.letter = letter;
    
    renderCrossword();
    
    if (letter === cellData.correctLetter) {
        moveToNextCell(x, y, crossword.activeWordIndex);
    }
    
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
    if (!cellData?.letter) return;
    
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
        await saveCurrentLevel(currentLevel);
        await saveUserRecord(currentLevel);
        location.href = '../MAIN/index.html';
    });
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

document.addEventListener('DOMContentLoaded', () => {
    if (isTelegramWebApp()) {
        Telegram.WebApp.ready();
        Telegram.WebApp.enableClosingConfirmation();
    }
    initGame();
});