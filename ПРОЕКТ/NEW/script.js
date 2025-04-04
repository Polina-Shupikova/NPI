function getLevelConfig(level) {
    if (level <= 26) {
        return LEVEL_WORDS[level];
    } else {
        return LEVEL_WORDS[26];
    }
}

// Заменяем существующие функции на эти:

async function loadSavedLevel() {
    try {
        // Пытаемся получить прогресс из localStorage главной страницы
        const progress = localStorage.getItem('crossword_user_progress');
        
        if (!progress) {
            console.warn("Прогресс не найден, начинаем с 1 уровня");
            return 1;
        }

        const { userId, level } = JSON.parse(progress);
        if (!level) {
            console.warn("Некорректные данные прогресса, начинаем с 1 уровня");
            return 1;
        }

        console.log(`Загружен уровень ${level} для userId: ${userId || 'local'}`);
        return level;
    } catch (error) {
        console.error("Ошибка при загрузке прогресса:", error);
        return 1;
    }
}

async function saveCurrentLevel(level) {
    try {
        // Сохраняем в localStorage главной страницы
        const progress = localStorage.getItem('crossword_user_progress');
        const userId = progress ? JSON.parse(progress).userId : null;
        
        const newProgress = { userId, level };
        localStorage.setItem('crossword_user_progress', JSON.stringify(newProgress));
        
        // Отправляем сообщение главной странице для сохранения в CloudStorage
        if (window.parent && window.parent.postMessage) {
            window.parent.postMessage({
                type: 'SAVE_PROGRESS',
                level
            }, '*');
        }
        
        console.log(`Уровень ${level} сохранен локально`);
        return true;
    } catch (error) {
        console.error("Ошибка при сохранении уровня:", error);
        return false;
    }
}

async function initGame() {
    console.log("Инициализация игры...");

    // 1. Инициализация Telegram WebApp (если доступно)
    await initTelegramWebApp();

    // 2. Загрузка слов с несколькими попытками и резервными вариантами
    try {
        await loadWordsWithRetry();
        
        // Проверка, что слова действительно загружены
        if (wordDatabase.easy.length === 0 || wordDatabase.hard.length === 0) {
            throw new Error("База слов пуста после загрузки");
        }
        console.log("Слова успешно загружены");
    } catch (error) {
        console.error("Ошибка загрузки слов:", error);
        console.log("Используем резервные слова...");
        loadBackupWords();
        
        // Дополнительная проверка на случай проблем с резервными словами
        if (wordDatabase.easy.length === 0 || wordDatabase.hard.length === 0) {
            console.error("Критическая ошибка: Нет слов для игры!");
            throw new Error("Не удалось загрузить слова для игры");
        }
    }

    // 3. Загрузка уровня
    try {
        const savedLevel = await loadSavedLevel();
        currentLevel = savedLevel;
        console.log("Игра начинается с уровня:", currentLevel);
        
        // Попытка загрузить уровень с несколькими повторениями при ошибках
        await loadLevelWithRetry();
    } catch (error) {
        console.error("Ошибка загрузки уровня:", error);
        // Сброс к первому уровню в случае ошибки
        currentLevel = 1;
        await loadLevelWithRetry();
    }

    // 4. Инициализация интерфейса
    try {
        initEventListeners();
        console.log("Слушатели событий инициализированы");
    } catch (error) {
        console.error("Ошибка в initEventListeners:", error);
        throw error; // Это критическая ошибка, прерываем работу
    }

    console.log("Игра успешно инициализирована");
}

// Вспомогательные функции:

async function initTelegramWebApp() {
    if (window.Telegram?.WebApp) {
        try {
            console.log("Обнаружен Telegram WebApp, инициализация...");
            
            // Готовность WebApp с таймаутом
            Telegram.WebApp.ready();
            await new Promise((resolve, reject) => {
                setTimeout(() => {
                    Telegram.WebApp.expand();
                    resolve();
                }, 100);
                
                // Добавляем обработчик на случай быстрого ответа
                Telegram.WebApp.onEvent('viewportChanged', resolve);
            });
            
            console.log("Telegram WebApp успешно инициализирован");
        } catch (error) {
            console.warn("Ошибка инициализации Telegram WebApp:", error);
            // Продолжаем работу в обычном режиме
        }
    } else {
        console.log("Telegram WebApp не обнаружен, работаем в обычном режиме");
    }
}

async function loadWordsWithRetry(maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await loadWords();
            
            // Проверяем, что загрузилось достаточно слов
            if (wordDatabase.easy.length >= 3 && wordDatabase.hard.length >= 2) {
                return; // Успех
            }
            
            throw new Error(`Недостаточно слов: ${wordDatabase.easy.length} лёгких, ${wordDatabase.hard.length} сложных`);
        } catch (error) {
            lastError = error;
            console.warn(`Попытка ${attempt} загрузки слов не удалась:`, error.message);
            
            if (attempt < maxRetries) {
                // Ждем перед повторной попыткой
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
    }
    
    // Все попытки исчерпаны
    throw lastError || new Error("Неизвестная ошибка загрузки слов");
}

async function loadLevelWithRetry(maxRetries = 5) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await loadLevel();
            return; // Успех
        } catch (error) {
            lastError = error;
            console.warn(`Попытка ${attempt} загрузки уровня не удалась:`, error.message);
            
            if (attempt < maxRetries) {
                // Очищаем использованные слова перед повторной попыткой
                crossword.usedWords.clear();
                await new Promise(resolve => setTimeout(resolve, 500 * attempt));
            }
        }
    }
    
    // Все попытки исчерпаны
    throw lastError || new Error("Неизвестная ошибка загрузки уровня");
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initGame();
    } catch (error) {
        console.error("Фатальная ошибка при запуске игры:", error);
        alert("Не удалось запустить игру. Пожалуйста, попробуйте перезагрузить страницу.");
    }
});

async function loadLevel() {
    try {
        console.log(`Загрузка уровня ${currentLevel}`);
        
        // Пытаемся сгенерировать кроссворд
        let generated = generateCrossword();
        
        if (!generated) {
            console.error("Не удалось сгенерировать кроссворд");
            
            // Попробуем сбросить использованные слова и попробовать еще раз
            crossword.usedWords.clear();
            generated = generateCrossword();
            
            if (!generated) {
                throw new Error("Ошибка генерации кроссворда после повторной попытки");
            }
        }
        
        renderCrossword(true);
        generateKeyboard();
        document.getElementById('hint-count').textContent = crossword.hints;
    } catch (error) {
        console.error("Ошибка загрузки уровня:", error);
        
        // Показать пользователю сообщение об ошибке
        showError("Не удалось загрузить уровень. Пробуем снова...");
    }
}

if (typeof RUSSIAN_LAYOUT === 'undefined') {
    var RUSSIAN_LAYOUT = { 'q': 'й', 'w': 'ц', 'e': 'у', 'r': 'к', 't': 'е', 'y': 'н', 
    'u': 'г', 'i': 'ш', 'o': 'щ', 'p': 'з', '[': 'х', ']': 'ъ',
    'a': 'ф', 's': 'ы', 'd': 'в', 'f': 'а', 'g': 'п', 'h': 'р',
    'j': 'о', 'k': 'л', 'l': 'д', ';': 'ж', "'": 'э', 
    'z': 'я', 'x': 'ч', 'c': 'с', 'v': 'м', 'b': 'и', 'n': 'т',
    'm': 'ь', ',': 'б', '.': 'ю', '/': '.', '`': 'ё' };
}

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
      // Add fallback URLs or use local words if remote loading fails
      const urls = [
        'https://gist.githubusercontent.com/Ukinnne/7374dccab584f7903680e5a5bacb56a5/raw/easy_words.json',
        'https://gist.githubusercontent.com/Ukinnne/d8b156ad91831540f90236961c5095c9/raw/hard_words.json',
        // Add backup URLs here
      ];
  
      // Try each URL until one succeeds
      for (const url of urls) {
        try {
          const response = await fetchWithTimeout(url);
          if (response.ok) {
            const data = await response.json();
            // Process data
            break; // Exit loop if successful
          }
        } catch (e) {
          console.warn(`Failed to load from ${url}, trying next`);
        }
      }
      
      // If all failed, use backup words
      if (wordDatabase.easy.length === 0) {
        loadBackupWords();
      }
    } catch (error) {
      console.error("Final fallback to backup words");
      loadBackupWords();
    }
  }

function generateCrossword() {
    const levelConfig = getLevelConfig(currentLevel);
    crossword.size = Math.max(20, levelConfig.maxLength + 7); // Увеличиваем размер сетки
    crossword.hints = levelConfig.total;
    crossword.wordsToFind = levelConfig.total;
    crossword.wordsFound = 0;
    crossword.words = [];
    crossword.grid = Array(crossword.size).fill().map(() => Array(crossword.size).fill(null));
    crossword.definitions = [];
    crossword.usedWords.clear();

    // Проверка доступности слов
    const availableWords = [
        ...wordDatabase.easy.filter(w => w.word.length >= levelConfig.minLength && w.word.length <= levelConfig.maxLength),
        ...wordDatabase.hard.filter(w => w.word.length >= levelConfig.minLength && w.word.length <= levelConfig.maxLength)
    ];
    
    if (availableWords.length < levelConfig.total) {
        console.warn("Недостаточно слов, загружаем резервные");
        loadBackupWords();
    }

    // Добавляем первое слово
    const firstWord = getRandomWord(WORD_TYPES.EASY, levelConfig.minLength, levelConfig.maxLength);
    if (!firstWord) {
        console.error("Не удалось выбрать первое слово");
        return false;
    }

    const centerY = Math.floor(crossword.size / 2);
    const centerX = Math.floor((crossword.size - firstWord.word.length) / 2);
    addWordToGrid(firstWord, { x: centerX, y: centerY }, 'horizontal', 1);

    // Добавляем остальные слова
    let wordsAdded = 1;
    let attempts = 0;
    const maxAttempts = 1000;

    while (wordsAdded < levelConfig.total && attempts < maxAttempts) {
        const needEasy = wordsAdded < levelConfig.easy;
        const type = needEasy ? WORD_TYPES.EASY : WORD_TYPES.HARD;
        const wordObj = getRandomWord(type, levelConfig.minLength, levelConfig.maxLength);

        if (wordObj && tryAddConnectedWord(wordObj)) {
            wordsAdded++;
            attempts = 0; // Сбрасываем счетчик после успешного добавления
        } else {
            attempts++;
        }
    }

    if (wordsAdded < Math.max(3, levelConfig.total * 0.7)) {
        console.warn(`Добавлено только ${wordsAdded} из ${levelConfig.total} слов`);
        return false;
    }

    crossword.wordsToFind = wordsAdded;
    return true;
}

function tryAddConnectedWord(wordObj) {
    // Пробуем разные стратегии соединения
    const strategies = [
        { method: 'singleIntersection' },
        { method: 'anyIntersection', maxIntersections: 2 },
        { method: 'anyPlacement' }
    ];

    for (const strategy of strategies) {
        for (const baseWord of [...crossword.words].sort(() => Math.random() - 0.5)) {
            if (tryAddWithStrategy(wordObj, baseWord, strategy)) {
                return true;
            }
        }
    }
    return false;
}

function tryAddWithStrategy(wordObj, baseWord, strategy) {
    const word = wordObj.word;
    
    for (let i = 0; i < baseWord.word.length; i++) {
        const letter = baseWord.word[i];
        const connectionIndex = word.indexOf(letter);
        if (connectionIndex === -1) continue;

        const direction = baseWord.direction === 'horizontal' ? 'vertical' : 'horizontal';
        const x = direction === 'horizontal' ? baseWord.x - connectionIndex : baseWord.x + i;
        const y = direction === 'horizontal' ? baseWord.y + i : baseWord.y - connectionIndex;

        if (strategy.method === 'singleIntersection') {
            if (canPlaceWordWithSingleIntersection(word, { x, y }, direction)) {
                addWordToGrid(wordObj, { x, y }, direction, crossword.words.length + 1);
                return true;
            }
        } else if (strategy.method === 'anyIntersection') {
            if (canPlaceWordWithIntersections(word, { x, y }, direction, strategy.maxIntersections)) {
                addWordToGrid(wordObj, { x, y }, direction, crossword.words.length + 1);
                return true;
            }
        }
    }
    
    return false;
}

function tryAddAnywhere(wordObj) {
    const word = wordObj.word;
    const direction = Math.random() > 0.5 ? 'horizontal' : 'vertical';
    
    // Пробуем случайные позиции
    for (let i = 0; i < 50; i++) {
        const x = Math.floor(Math.random() * (crossword.size - word.length));
        const y = Math.floor(Math.random() * (crossword.size - word.length));
        
        if (canPlaceWord(word, { x, y }, direction)) {
            addWordToGrid(wordObj, { x, y }, direction, crossword.words.length + 1);
            return true;
        }
    }
    return false;
}

function canPlaceWordWithIntersections(word, position, direction, maxIntersections = 2) {
    const { x, y } = position;
    const length = word.length;
    
    // Проверка границ
    if (x < 0 || y < 0) return false;
    if (direction === 'horizontal' && x + length > crossword.size) return false;
    if (direction === 'vertical' && y + length > crossword.size) return false;
    
    let intersectionCount = 0;
    
    for (let i = 0; i < length; i++) {
        const cellX = direction === 'horizontal' ? x + i : x;
        const cellY = direction === 'vertical' ? y + i : y;
        const cell = crossword.grid[cellY]?.[cellX];
        
        if (cell) {
            // Проверяем совпадение букв в пересечениях
            if (cell.correctLetter !== word[i]) return false;
            intersectionCount++;
            if (intersectionCount > maxIntersections) return false;
        }
        
        // Проверка соседних клеток
        const neighbors = [
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 }
        ];
        
        for (const { dx, dy } of neighbors) {
            const nx = cellX + dx;
            const ny = cellY + dy;
            
            if (nx >= 0 && ny >= 0 && nx < crossword.size && ny < crossword.size) {
                const neighbor = crossword.grid[ny][nx];
                if (neighbor && !(dx === 0 && dy === 0)) {
                    return false;
                }
            }
        }
    }
    
    return intersectionCount > 0;
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

    document.addEventListener('keydown', handlePhysicalKeyPress);
}

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
        currentLevel = 1;
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
        await saveCurrentLevel(currentLevel + 1);
        location.href = '../MAIN/index.html';
    });
}

async function completeLevel() {
    try {
        currentLevel++;
        const saved = await saveCurrentLevel(currentLevel);
        if (!saved) {
            console.error("Не удалось сохранить уровень в CloudStorage");
            alert("Не удалось сохранить прогресс. Проверьте подключение.");
            return;
        }
        loadLevel();
    } catch (error) {
        console.error("Ошибка при завершении уровня:", error);
        alert("Произошла ошибка при сохранении прогресса.");
    }
}

function showError(message) {
    alert(message);
}

function getRandomWord(type, minLength, maxLength, recursionCount = 0) {
    const MAX_RECURSION = 3; // Reduce from 100 to prevent infinite loops
    
    // First try exact length matches
    const exactMatches = wordDatabase[type].filter(w => 
      !crossword.usedWords.has(w.word) && 
      w.word.length >= minLength && 
      w.word.length <= maxLength
    );
    
    if (exactMatches.length > 0) {
      return exactMatches[Math.floor(Math.random() * exactMatches.length)];
    }
  
    // Then try nearby lengths if no exact matches
    const extendedMatches = wordDatabase[type].filter(w => 
      !crossword.usedWords.has(w.word) &&
      w.word.length >= Math.max(3, minLength - 2) && 
      w.word.length <= maxLength + 2
    );
  
    if (extendedMatches.length > 0) {
      return extendedMatches[Math.floor(Math.random() * extendedMatches.length)];
    }
  
    // As last resort, try any word
    if (recursionCount < MAX_RECURSION) {
      console.warn("No suitable words, clearing used words");
      crossword.usedWords.clear();
      return getRandomWord(type, minLength, maxLength, recursionCount + 1);
    }
  
    console.error("Completely failed to find word");
    return null;
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

    if (x < 0 || y < 0) return false;
    if (direction === 'horizontal' && x + length > crossword.size) return false;
    if (direction === 'vertical' && y + length > crossword.size) return false;

    for (let i = 0; i < length; i++) {
        const cellX = direction === 'horizontal' ? x + i : x;
        const cellY = direction === 'horizontal' ? y : y + i;
        const cell = crossword.grid[cellY]?.[cellX];

        if (cell && cell.correctLetter !== word[i]) return false;
    }

    for (let i = 0; i < length; i++) {
        const cellX = direction === 'horizontal' ? x + i : x;
        const cellY = direction === 'horizontal' ? y : y + i;

        const neighbors = [
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 },
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 1 },
            { dx: -1, dy: -1 },
            { dx: 1, dy: -1 },
            { dx: -1, dy: 1 }
        ];
        
        for (const { dx, dy } of neighbors) {
            const nx = cellX + dx;
            const ny = cellY + dy;

            if (nx >= 0 && ny >= 0 && nx < crossword.size && ny < crossword.size) {
                const neighborCell = crossword.grid[ny][nx];

                if (neighborCell) {
                    let intersects = false;
                    for (let j = 0; j < length; j++) {
                        const checkX = direction === 'horizontal' ? x + j : x;
                        const checkY = direction === 'horizontal' ? y : y + j;
                        if (crossword.grid[checkY][checkX]?.wordIndices?.length > 0) {
                            intersects = true;
                            break;
                        }
                    }
                    
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
    const crosswordGrid = document.getElementById('crossword-grid');
    if (!force && !crosswordGrid.children.length) {
        return;
    }
    
    crosswordGrid.innerHTML = '';
    
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
            crosswordGrid.appendChild(cell);
        }
    }
    
    crosswordGrid.style.gridTemplateColumns = `repeat(${maxX - minX + 1}, 30px)`;
    crosswordGrid.style.gridTemplateRows = `repeat(${maxY - minY + 1}, 30px)`; 
    
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

async function debugCloudStorage() {
    if (window.Telegram?.WebApp) {
        const userId = Telegram.WebApp.initDataUnsafe.user?.id;
        if (userId) {
            const key = `user_level_${userId}`;
            Telegram.WebApp.CloudStorage.getItem(key, (error, value) => {
                console.log(`Cloud Storage для ${key}:`, value || "Нет данных", error || "");
            });
        }
    }
}

initGame().then(() => debugCloudStorage());

document.addEventListener('DOMContentLoaded', async () => {
    if (window.gameInitialized) return;
    window.gameInitialized = true;

    try {
        await initGame();
        await debugCloudStorage();
    } catch (error) {
        console.error("Фатальная ошибка при запуске игры:", error);
        alert("Не удалось запустить игру. Проверьте подключение и попробуйте снова.");
    }
});