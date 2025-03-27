// script.js
// Глобальные переменные

const RUSSIAN_LAYOUT = {
    'q': 'й', 'w': 'ц', 'e': 'у', 'r': 'к', 't': 'е', 'y': 'н', 
    'u': 'г', 'i': 'ш', 'o': 'щ', 'p': 'з', '[': 'х', ']': 'ъ',
    'a': 'ф', 's': 'ы', 'd': 'в', 'f': 'а', 'g': 'п', 'h': 'р',
    'j': 'о', 'k': 'л', 'l': 'д', ';': 'ж', "'": 'э', 
    'z': 'я', 'x': 'ч', 'c': 'с', 'v': 'м', 'b': 'и', 'n': 'т',
    'm': 'ь', ',': 'б', '.': 'ю', '/': '.', '`': 'ё'
};

let currentLevel = 1;
const MAX_BASE_LEVEL = 26;
const LEVEL_WORDS = {
    1: 3, 2: 3, 3: 4, 4: 4, 5: 5, 6: 5,
    7: 6, 8: 6, 9: 7, 10: 7, 11: 8, 12: 8,
    13: 9, 14: 9, 15: 10, 16: 10, 17: 11, 18: 11,
    19: 12, 20: 12, 21: 13, 22: 13, 23: 14, 24: 14,
    25: 15, 26: 15
};

let wordDatabase = [];
let crossword = {
    words: [],
    grid: [],
    size: 0,
    selectedCell: null,
    definitions: [],
    hints: 0,
    usedWords: new Set(),
    wordsToFind: 0,
    wordsFound: 0
};

// Основная функция инициализации
async function initGame() {
    try {
        await loadWords();
        initEventListeners();
        loadDailyQuote();
        console.log('Игра инициализирована. Слов в базе:', wordDatabase.length);
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        loadBackupWords();
        initEventListeners();
    }
}

// Загрузка слов из JSON
async function loadWords() {
    try {
      const response = await fetch('words.json');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error("Файл JSON не содержит массив слов");
      }
      
      if (data.length === 0) {
        throw new Error("Файл words.json пуст");
      }
      
      wordDatabase = data;
      console.log("Успешно загружено слов:", wordDatabase.length);
      
    } catch (error) {
      console.error("Ошибка загрузки words.json:", error.message);
      throw error; // Передаём ошибку дальше
    }
  }

// Резервные слова
function loadBackupWords() {
    wordDatabase = [
        { word: "КОМПЬЮТЕР", definition: "Электронное устройство для обработки информации" },
        { word: "ПРОГРАММА", definition: "Набор инструкций для компьютера" },
        { word: "АЛГОРИТМ", definition: "Последовательность действий для решения задачи" },
        { word: "БАЗАДАННЫХ", definition: "Организованная совокупность данных" },
        { word: "ИНТЕРФЕЙС", definition: "Средство взаимодействия между системами" }
    ];
    alert('Используется резервный набор слов. Для полной версии проверьте подключение.');
}

// Инициализация обработчиков событий
function initEventListeners() {
    // Навигация
    document.getElementById('main-settings-button').addEventListener('click', () => togglePages('main-page', 'settings-page'));
    document.getElementById('play-button').addEventListener('click', startGame);
    document.getElementById('back-button').addEventListener('click', () => togglePages('settings-page', 'main-page'));
    document.getElementById('game-settings-button').addEventListener('click', () => togglePages('game-page', 'settings-page'));

    // Настройки
    document.getElementById('light-theme').addEventListener('click', () => document.body.classList.remove('dark-theme'));
    document.getElementById('dark-theme').addEventListener('click', () => document.body.classList.add('dark-theme'));
    document.getElementById('font-size').addEventListener('change', handleFontSizeChange);
    document.getElementById('hint-button').addEventListener('click', giveHint);
}

function togglePages(hideId, showId) {
    document.getElementById(hideId).classList.add('hidden');
    document.getElementById(showId).classList.remove('hidden');
}

function handleFontSizeChange(e) {
    const sizes = { small: '14px', medium: '16px', large: '18px' };
    document.body.style.fontSize = sizes[e.target.value];
}

function loadDailyQuote() {
    const quotes = [
        "Программирование - это искусство создавать мир из ничего.",
        "Код должен быть красивым как поэзия и точен как математика.",
        "Компьютер делает то, что вы ему сказали, а не то, что вы хотели."
    ];
    document.getElementById('daily-quote').textContent = quotes[Math.floor(Math.random() * quotes.length)];
}

// Логика игры
function startGame() {
    if (wordDatabase.length < 3) {
        alert('Недостаточно слов для начала игры. Минимум 3 слова.');
        return;
    }
    currentLevel = 1;
    togglePages('main-page', 'game-page');
    loadLevel();
}

function getWordCountForLevel(level) {
    return level <= MAX_BASE_LEVEL ? LEVEL_WORDS[level] : 15;
}

function loadLevel() {
    const wordCount = getWordCountForLevel(currentLevel);
    document.getElementById('level-number').textContent = currentLevel;
    document.getElementById('crossword-grid').innerHTML = `<div class="loading">Генерация уровня ${currentLevel}...</div>`;
    document.getElementById('keyboard').innerHTML = '';
    document.getElementById('definitions-list').innerHTML = '';

    setTimeout(() => {
        try {
            if (generateCrossword(wordCount)) {
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
    togglePages('game-page', 'main-page');
}

function generateCrossword(wordCount) {
    const maxWordLength = Math.max(...wordDatabase.map(w => w.word.length));
    crossword.size = Math.max(15, maxWordLength + 3);
    crossword.hints = wordCount;
    crossword.wordsToFind = wordCount;
    crossword.wordsFound = 0;
    crossword.words = [];
    crossword.grid = Array(crossword.size).fill().map(() => Array(crossword.size).fill(null));
    crossword.definitions = [];
    crossword.usedWords.clear();
    document.getElementById('hint-count').textContent = crossword.hints;

    for (let attempt = 0; attempt < 10; attempt++) {
        try {
            const firstWordObj = getRandomWord();
            if (!firstWordObj) continue;
            
            const center = Math.floor(crossword.size / 2) - Math.floor(firstWordObj.word.length / 2);
            const startPos = { x: Math.max(0, center), y: Math.max(0, center) };
            
            if (canPlaceWord(firstWordObj.word, startPos, 'horizontal')) {
                addWordToGrid(firstWordObj, startPos, 'horizontal', 1);
                
                if (generateConnectedWords(wordCount - 1)) {
                    renderCrossword();
                    return true;
                }
            }
        } catch (e) {
            console.error('Попытка генерации не удалась:', e);
        }
        
        crossword.words = [];
        crossword.grid = Array(crossword.size).fill().map(() => Array(crossword.size).fill(null));
        crossword.definitions = [];
        crossword.usedWords.clear();
    }
    return false;
}

function getRandomWord() {
    const availableWords = wordDatabase.filter(w => 
        !crossword.usedWords.has(w.word) && 
        w.word.length <= crossword.size - 2
    );
    
    if (availableWords.length === 0) {
        crossword.usedWords.clear();
        return wordDatabase.find(w => w.word.length <= crossword.size - 2);
    }
    return availableWords[Math.floor(Math.random() * availableWords.length)];
}

function addWordToGrid(wordObj, position, direction, wordNumber) {
    const { word, definition } = wordObj;
    const { x, y } = position;
    
    crossword.usedWords.add(word);
    const wordInfo = {
        word, x, y, direction,
        letters: [],
        definition,
        completed: false
    };
    
    crossword.words.push(wordInfo);
    
    for (let i = 0; i < word.length; i++) {
        const cellX = direction === 'horizontal' ? x + i : x;
        const cellY = direction === 'horizontal' ? y : y + i;
        
        crossword.grid[cellY][cellX] = {
            wordIndex: crossword.words.length - 1,
            letterIndex: i,
            letter: null,
            correctLetter: word[i]
        };
        
        wordInfo.letters.push({ x: cellX, y: cellY });
    }
    
    crossword.definitions.push({
        number: wordNumber,
        direction: direction === 'horizontal' ? 'по горизонтали' : 'по вертикали',
        length: word.length,
        definition
    });
}

function generateConnectedWords(count) {
    let wordsAdded = 0;
    let attempts = 0;
    const maxAttempts = count * 25;
    
    while (wordsAdded < count && attempts < maxAttempts) {
        attempts++;
        const baseWord = crossword.words[Math.floor(Math.random() * crossword.words.length)];
        const letterIndex = Math.floor(Math.random() * baseWord.word.length);
        const letter = baseWord.word[letterIndex];
        
        const connectedWordObj = findWordWithLetter(letter, baseWord.word);
        if (connectedWordObj && tryAddWordToGrid(connectedWordObj, baseWord, letterIndex, crossword.words.length + 1)) {
            wordsAdded++;
            attempts = 0;
        }
    }
    return wordsAdded >= count;
}

function findWordWithLetter(letter, excludeWord) {
    const candidates = wordDatabase.filter(item => 
        item.word.includes(letter) && 
        item.word !== excludeWord &&
        !crossword.usedWords.has(item.word) &&
        item.word.length <= crossword.size - 2
    );
    return candidates[Math.floor(Math.random() * candidates.length)];
}

function tryAddWordToGrid(wordObj, baseWord, letterIndex, wordNumber) {
    const word = wordObj.word;
    const baseLetter = baseWord.word[letterIndex];
    const connectionIndex = word.indexOf(baseLetter);
    if (connectionIndex === -1) return false;
    
    const direction = baseWord.direction === 'horizontal' ? 'vertical' : 'horizontal';
    const x = direction === 'horizontal' ? baseWord.x - connectionIndex : baseWord.x + letterIndex;
    const y = direction === 'horizontal' ? baseWord.y + letterIndex : baseWord.y - connectionIndex;
    
    if (canPlaceWord(word, { x, y }, direction)) {
        addWordToGrid(wordObj, { x, y }, direction, wordNumber);
        return true;
    }
    return false;
}

function canPlaceWord(word, position, direction) {
    const { x, y } = position;
    const length = word.length;
    
    // Проверка границ
    if (x < 0 || y < 0) return false;
    if (direction === 'horizontal' && x + length > crossword.size) return false;
    if (direction === 'vertical' && y + length > crossword.size) return false;
    
    // Проверка пересечений
    for (let i = 0; i < length; i++) {
        const cellX = direction === 'horizontal' ? x + i : x;
        const cellY = direction === 'horizontal' ? y : y + i;
        
        const cell = crossword.grid[cellY]?.[cellX];
        if (cell && cell.correctLetter !== word[i]) return false;
        
        // Проверка соседей
        const neighbors = direction === 'horizontal' 
            ? [{ dx: 0, dy: 1 }, { dx: 0, dy: -1 }]
            : [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }];
        
        for (const { dx, dy } of neighbors) {
            const nx = cellX + dx, ny = cellY + dy;
            if (nx >= 0 && ny >= 0 && nx < crossword.size && ny < crossword.size) {
                if (crossword.grid[ny][nx] && crossword.words[crossword.grid[ny][nx].wordIndex].direction === direction) {
                    return false;
                }
            }
        }
    }
    return true;
}

function renderCrossword() {
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
            
            if (crossword.grid[y][x]) {
                const cellData = crossword.grid[y][x];
                if (cellData.letter) {
                    cell.textContent = cellData.letter;
                    
                    if (cellData.isCorrect) {
                        cell.classList.add('correct-letter');
                    } else {
                        cell.classList.add('incorrect-letter');
                    }
                    
                    const wordInfo = crossword.words[cellData.wordIndex];
                    if (wordInfo.completed) {
                        cell.classList.add('completed-word');
                    }
                }
                cell.dataset.x = x;
                cell.dataset.y = y;
                cell.addEventListener('click', () => selectCell(x, y));
            } else {
                cell.style.visibility = 'hidden';
            }
            grid.appendChild(cell);
        }
    }
    
    grid.style.gridTemplateColumns = `repeat(${maxX - minX + 1}, 30px)`;
    grid.style.gridTemplateRows = `repeat(${maxY - minY + 1}, 30px)`;
}

function selectCell(x, y) {
    if (crossword.selectedCell) {
        const prevCell = document.querySelector(`.crossword-cell[data-x="${crossword.selectedCell.x}"][data-y="${crossword.selectedCell.y}"]`);
        if (prevCell) prevCell.classList.remove('highlight');
    }
    
    if (crossword.grid[y][x]) {
        const cell = document.querySelector(`.crossword-cell[data-x="${x}"][data-y="${y}"]`);
        if (cell) {
            cell.classList.add('highlight');
            crossword.selectedCell = { x, y };
        }
    }
}

function getUsedLetters() {
    const usedLetters = new Set();
    for (const wordInfo of crossword.words) {
        for (const letter of wordInfo.word) {
            usedLetters.add(letter);
        }
    }
    return usedLetters;
}

function generateKeyboard() {
    const keyboard = document.getElementById('keyboard');
    keyboard.innerHTML = '';
    const russianLetters = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
    const usedLetters = getUsedLetters();
    
    // Буквы
    for (const letter of russianLetters) {
        const key = document.createElement('button');
        key.className = 'keyboard-key';
        key.textContent = letter;
        
        // Добавляем класс в зависимости от наличия буквы в кроссворде
        if (usedLetters.has(letter)) {
            key.classList.add('keyboard-key-used');
        } else {
            key.classList.add('keyboard-key-unused');
        }
        
        key.addEventListener('click', () => handleKeyPress(letter));
        keyboard.appendChild(key);
    }
    
    // Специальные кнопки (теперь тоже красные)
    const specialButtons = [
        { text: '⌫', action: clearCell, width: null },
        { text: '📖', action: showDefinitions, width: '60px' },
        { text: 'Подсказка', action: giveHint, width: '80px' }
    ];
    
    for (const btn of specialButtons) {
        const key = document.createElement('button');
        key.className = 'keyboard-key keyboard-key-used'; // Добавляем класс used
        key.textContent = btn.text;
        if (btn.width) key.style.width = btn.width;
        key.addEventListener('click', btn.action);
        keyboard.appendChild(key);
    }
}

function handleKeyPress(letter) {
    if (!crossword.selectedCell) return;
    const { x, y } = crossword.selectedCell;
    const cellData = crossword.grid[y][x];
    if (!cellData) return;
    
    cellData.letter = letter;
    
    // Сразу проверяем правильность буквы
    if (letter === cellData.correctLetter) {
        crossword.grid[y][x].isCorrect = true;
    } else {
        crossword.grid[y][x].isCorrect = false;
    }
    
    renderCrossword();
    selectCell(x, y);
    checkWordCompletion(cellData.wordIndex);
}

function clearCell() {
    if (!crossword.selectedCell) return;
    const { x, y } = crossword.selectedCell;
    const cellData = crossword.grid[y][x];
    if (!cellData?.letter) return;
    
    cellData.letter = null;
    crossword.words[cellData.wordIndex].completed = false;
    renderCrossword();
    selectCell(x, y);
}

function checkWordCompletion(wordIndex) {
    const wordInfo = crossword.words[wordIndex];
    let completed = true;
    let correct = true;
    
    for (const { x, y } of wordInfo.letters) {
        const cell = crossword.grid[y][x];
        if (!cell.letter) {
            completed = false;
            break;
        }
        if (cell.letter !== cell.correctLetter) {
            correct = false;
        }
    }
    
    if (completed) {
        wordInfo.completed = correct;
        if (correct) {
            crossword.wordsFound++;
            
            if (crossword.wordsFound === crossword.wordsToFind) {
                setTimeout(() => completeLevel(), 500);
            } else {
                setTimeout(() => alert(`Верно! Слово "${wordInfo.word}" угадано.`), 100);
            }
        }
        renderCrossword(); // Перерисовываем для обновления стилей
    }
}

function completeLevel() {
    currentLevel++;
    if (currentLevel <= MAX_BASE_LEVEL || confirm("Поздравляем! Хотите продолжить на следующем уровне?")) {
        loadLevel();
    } else {
        togglePages('game-page', 'main-page');
    }
}

function highlightWord(wordIndex, className) {
    for (const { x, y } of crossword.words[wordIndex].letters) {
        const cell = document.querySelector(`.crossword-cell[data-x="${x}"][data-y="${y}"]`);
        if (cell) cell.classList.add(className);
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
    cell.isCorrect = true; // Добавляем эту строку
    
    crossword.hints--;
    document.getElementById('hint-count').textContent = crossword.hints;
    renderCrossword();
    selectCell(x, y);
    checkWordCompletion(cell.wordIndex);
}

// Запуск игры
document.addEventListener('DOMContentLoaded', initGame);