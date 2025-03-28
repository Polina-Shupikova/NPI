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

async function initGame() {
    try {
        await loadWords();
        initEventListeners();
        startGame();
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        loadBackupWords();
        initEventListeners();
        startGame();
    }
}

async function loadWords() {
    try {
        const response = await fetch('words.json');
        if (!response.ok) throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
        
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error("words.json не содержит массив слов");
        
        // Разделяем слова на easy и hard по длине
        wordDatabase.easy = data.filter(word => word.word.length <= 7);
        wordDatabase.hard = data.filter(word => word.word.length > 7);
        
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
    
    alert('Используется резервный набор слов. Для полной версии проверьте подключение.');
}

function initEventListeners() {
    document.getElementById('game-settings-button').addEventListener('click', () => togglePages('game-page', 'settings-page'));
    document.getElementById('back-button').addEventListener('click', () => togglePages('settings-page', 'game-page'));
    document.getElementById('light-theme').addEventListener('click', () => document.body.classList.remove('dark-theme'));
    document.getElementById('dark-theme').addEventListener('click', () => document.body.classList.add('dark-theme'));
    document.getElementById('font-size').addEventListener('change', handleFontSizeChange);
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

function togglePages(hideId, showId) {
    document.getElementById(hideId).classList.add('hidden');
    document.getElementById(showId).classList.remove('hidden');
}

function handleFontSizeChange(e) {
    const sizes = { small: '14px', medium: '16px', large: '18px' };
    document.body.style.fontSize = sizes[e.target.value];
}

function startGame() {
    if (wordDatabase.easy.length + wordDatabase.hard.length < 3) {
        alert('Недостаточно слов для начала игры. Минимум 3 слова.');
        return;
    }
    currentLevel = 1;
    loadLevel();
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
    const levelConfig = LEVEL_WORDS[currentLevel] || { 
        ...LEVEL_WORDS[26], 
        minLength: 12, 
        maxLength: 15 
    };
    
    crossword.size = Math.max(15, levelConfig.maxLength + 3);
    crossword.hints = levelConfig.total;
    crossword.wordsToFind = levelConfig.total;
    crossword.wordsFound = 0;
    crossword.words = [];
    crossword.grid = Array(crossword.size).fill().map(() => Array(crossword.size).fill(null));
    crossword.definitions = [];
    crossword.usedWords.clear();
    crossword.activeWordIndex = null;
    document.getElementById('hint-count').textContent = crossword.hints;

    for (let attempt = 0; attempt < 10; attempt++) {
        try {
            let easyWordsAdded = 0;
            let hardWordsAdded = 0;
            
            const firstWordObj = getRandomWord(
                WORD_TYPES.EASY, 
                levelConfig.minLength, 
                levelConfig.maxLength
            );
            
            if (!firstWordObj) continue;
            
            const center = Math.floor(crossword.size / 2) - Math.floor(firstWordObj.word.length / 2);
            const startPos = { x: Math.max(0, center), y: Math.max(0, center) };
            
            if (canPlaceWord(firstWordObj.word, startPos, 'horizontal')) {
                addWordToGrid(firstWordObj, startPos, 'horizontal', 1);
                easyWordsAdded++;
                
                while (easyWordsAdded < levelConfig.easy || hardWordsAdded < levelConfig.hard) {
                    const needEasy = easyWordsAdded < levelConfig.easy;
                    const wordType = needEasy ? WORD_TYPES.EASY : WORD_TYPES.HARD;
                    
                    const wordObj = getRandomWord(
                        wordType, 
                        levelConfig.minLength, 
                        levelConfig.maxLength
                    );
                    
                    if (!wordObj) break;
                    
                    if (tryAddConnectedWord(wordObj)) {
                        if (wordType === WORD_TYPES.EASY) easyWordsAdded++;
                        else hardWordsAdded++;
                    } else {
                        break;
                    }
                }
                
                if (easyWordsAdded >= levelConfig.easy && hardWordsAdded >= levelConfig.hard) {
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
    
    if (x < 0 || y < 0) return false;
    if (direction === 'horizontal' && x + length > crossword.size) return false;
    if (direction === 'vertical' && y + length > crossword.size) return false;
    
    for (let i = 0; i < length; i++) {
        const cellX = direction === 'horizontal' ? x + i : x;
        const cellY = direction === 'horizontal' ? y : y + i;
        
        const cell = crossword.grid[cellY]?.[cellX];
        if (cell && cell.correctLetter !== word[i]) return false;
        
        const neighbors = [
            { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
            { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
            { dx: 1, dy: 1 }, { dx: -1, dy: -1 },
            { dx: 1, dy: -1 }, { dx: -1, dy: 1 }
        ];
        
        for (const { dx, dy } of neighbors) {
            const nx = cellX + dx, ny = cellY + dy;
            if (nx >= 0 && ny >= 0 && nx < crossword.size && ny < crossword.size) {
                const neighborCell = crossword.grid[ny][nx];
                if (neighborCell) {
                    const neighborWord = crossword.words[neighborCell.wordIndices[0]];
                    if (neighborWord.direction === direction) {
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
        } else {
            key.classList.add('keyboard-key-unused');
        }
        
        key.addEventListener('click', () => handleKeyPress(letter));
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
    
    checkWordCompletion(crossword.activeWordIndex);
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

function checkWordCompletion(wordIndex) {
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
        renderCrossword();
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
    if (currentLevel <= 26 || confirm("Поздравляем! Хотите продолжить на следующем уровне?")) {
        loadLevel();
    } else {
        togglePages('game-page', 'main-page');
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
    if (crossword.activeWordIndex !== null) {
        checkWordCompletion(crossword.activeWordIndex);
    }
}

document.addEventListener('DOMContentLoaded', initGame);