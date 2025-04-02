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

const CROSSWORD_SIZE = 30;
const MAX_ATTEMPTS_PER_WORD = 100;

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
    hints: 3,
    usedWords: new Set(),
    wordsToFind: 0,
    wordsFound: 0,
    activeWordIndex: null
};

/* ========== ОСНОВНЫЕ ФУНКЦИИ ГЕНЕРАЦИИ ========== */

async function generateCrossword(levelConfig) {
    console.log(`Генерация кроссворда уровня ${currentLevel}...`);
    
    // Инициализация кроссворда
    resetCrossword();
    
    // 1. Размещаем первое слово
    if (!await placeFirstWord(levelConfig)) {
        console.error("Не удалось разместить первое слово");
        return false;
    }
    
    // 2. Размещаем остальные слова
    let wordsPlaced = 1;
    let totalAttempts = 0;
    const maxTotalAttempts = levelConfig.total * MAX_ATTEMPTS_PER_WORD;
    
    while (wordsPlaced < levelConfig.total && totalAttempts < maxTotalAttempts) {
        totalAttempts++;
        
        const wordType = wordsPlaced >= levelConfig.easy ? WORD_TYPES.HARD : WORD_TYPES.EASY;
        const wordObj = getRandomWord(wordType, levelConfig.minLength, levelConfig.maxLength);
        
        if (wordObj && tryPlaceWord(wordObj)) {
            wordsPlaced++;
            console.log(`Размещено слово ${wordsPlaced}/${levelConfig.total}: ${wordObj.word}`);
            totalAttempts = 0;
        }
        
        // Добавляем небольшую задержку, чтобы не блокировать интерфейс
        if (totalAttempts % 50 === 0) await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    if (wordsPlaced < levelConfig.total) {
        console.error(`Удалось разместить только ${wordsPlaced} из ${levelConfig.total} слов`);
        return false;
    }
    
    // Оптимизация и отрисовка
    trimGrid();
    console.log("Кроссворд успешно сгенерирован!");
    return true;
}

async function placeFirstWord(levelConfig) {
    const wordType = levelConfig.easy > 0 ? WORD_TYPES.EASY : WORD_TYPES.HARD;
    const wordObj = getRandomWord(wordType, levelConfig.minLength, levelConfig.maxLength);
    if (!wordObj) return false;

    // Пробуем разные варианты размещения первого слова
    const center = Math.floor(CROSSWORD_SIZE / 2);
    const positions = [
        { x: center - Math.floor(wordObj.word.length / 2), y: center, direction: 'horizontal' },
        { x: center, y: center - Math.floor(wordObj.word.length / 2), direction: 'vertical' },
        { x: 5, y: 5, direction: 'horizontal' },
        { x: 5, y: 5, direction: 'vertical' }
    ];

    for (const pos of positions) {
        if (canPlaceWord(wordObj.word, pos, pos.direction)) {
            addWordToGrid(wordObj, pos, pos.direction, 1);
            return true;
        }
    }
    
    return false;
}

function tryPlaceWord(wordObj) {
    // Ищем все возможные пересечения с существующими словами
    for (const baseWord of shuffleArray(crossword.words)) {
        for (let i = 0; i < baseWord.word.length; i++) {
            const baseLetter = baseWord.word[i];
            const letterIndices = getAllIndices(wordObj.word, baseLetter);
            
            if (letterIndices.length > 0) {
                const direction = baseWord.direction === 'horizontal' ? 'vertical' : 'horizontal';
                
                for (const j of letterIndices) {
                    const x = direction === 'horizontal' 
                        ? baseWord.x + i - j 
                        : baseWord.x + i;
                        
                    const y = direction === 'horizontal' 
                        ? baseWord.y 
                        : baseWord.y + i - j;
                    
                    if (canPlaceWord(wordObj.word, {x, y}, direction)) {
                        addWordToGrid(wordObj, {x, y}, direction, crossword.words.length + 1);
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

function canPlaceWord(word, position, direction) {
    const {x, y} = position;
    const length = word.length;

    // Проверка границ
    if (x < 0 || y < 0) return false;
    if (direction === 'horizontal' && x + length > CROSSWORD_SIZE) return false;
    if (direction === 'vertical' && y + length > CROSSWORD_SIZE) return false;

    let hasIntersection = false;

    for (let i = 0; i < length; i++) {
        const cellX = direction === 'horizontal' ? x + i : x;
        const cellY = direction === 'horizontal' ? y : y + i;

        const cell = crossword.grid[cellY][cellX];
        if (cell) {
            if (cell.correctLetter !== word[i]) return false;
            hasIntersection = true;
            continue;
        }

        // Проверка соседей (кроме диагоналей)
        for (const [dx, dy] of [[0,1],[1,0],[0,-1],[-1,0]]) {
            const nx = cellX + dx;
            const ny = cellY + dy;

            if (nx >= 0 && nx < CROSSWORD_SIZE && ny >= 0 && ny < CROSSWORD_SIZE) {
                const neighbor = crossword.grid[ny][nx];
                if (neighbor && neighbor.correctLetter !== word[i]) {
                    return false;
                }
            }
        }
    }

    // Для не первого слова требуется хотя бы одно пересечение
    return crossword.words.length === 0 || hasIntersection;
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

function getRandomWord(type, minLength, maxLength) {
    // Сначала ищем слова с точной длиной
    let availableWords = wordDatabase[type].filter(w => 
        !crossword.usedWords.has(w.word) && 
        w.word.length >= minLength && 
        w.word.length <= maxLength
    );
    
    // Если не нашли, расширяем диапазон
    if (availableWords.length === 0) {
        availableWords = wordDatabase[type].filter(w => 
            !crossword.usedWords.has(w.word) && 
            w.word.length >= Math.max(3, minLength - 2) && 
            w.word.length <= maxLength + 2
        );
    }
    
    // Если все еще не нашли, пробуем другой тип
    if (availableWords.length === 0 && type === WORD_TYPES.HARD) {
        availableWords = wordDatabase[WORD_TYPES.EASY].filter(w => 
            !crossword.usedWords.has(w.word) && 
            w.word.length >= minLength && 
            w.word.length <= maxLength
        );
    }
    
    // Если слов совсем нет, очищаем использованные слова этого типа
    if (availableWords.length === 0) {
        for (const w of crossword.words) {
            if (wordDatabase[type].some(d => d.word === w.word)) {
                crossword.usedWords.delete(w.word);
            }
        }
        return getRandomWord(type, minLength, maxLength);
    }
    
    return availableWords[Math.floor(Math.random() * availableWords.length)];
}

function trimGrid() {
    let minX = CROSSWORD_SIZE, maxX = 0, minY = CROSSWORD_SIZE, maxY = 0;
    
    // Находим границы занятых клеток
    for (let y = 0; y < CROSSWORD_SIZE; y++) {
        for (let x = 0; x < CROSSWORD_SIZE; x++) {
            if (crossword.grid[y][x]) {
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            }
        }
    }
    
    // Добавляем небольшие отступы
    minX = Math.max(0, minX - 1);
    maxX = Math.min(CROSSWORD_SIZE - 1, maxX + 1);
    minY = Math.max(0, minY - 1);
    maxY = Math.min(CROSSWORD_SIZE - 1, maxY + 1);
    
    // Создаем новую обрезанную сетку
    const newGrid = [];
    for (let y = minY; y <= maxY; y++) {
        const row = [];
        for (let x = minX; x <= maxX; x++) {
            row.push(crossword.grid[y][x]);
        }
        newGrid.push(row);
    }
    
    // Обновляем координаты слов
    for (const word of crossword.words) {
        word.x -= minX;
        word.y -= minY;
        for (const letter of word.letters) {
            letter.x -= minX;
            letter.y -= minY;
        }
    }
    
    crossword.grid = newGrid;
    crossword.size = newGrid.length;
}

/* ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ========== */

function resetCrossword() {
    crossword = {
        words: [],
        grid: Array(CROSSWORD_SIZE).fill().map(() => Array(CROSSWORD_SIZE).fill(null)),
        size: CROSSWORD_SIZE,
        selectedCell: null,
        definitions: [],
        hints: 3,
        usedWords: new Set(),
        wordsToFind: getLevelConfig(currentLevel).total,
        wordsFound: 0,
        activeWordIndex: null
    };
}

function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function getAllIndices(word, letter) {
    const indices = [];
    for (let i = 0; i < word.length; i++) {
        if (word[i] === letter) indices.push(i);
    }
    return indices;
}

function getLevelConfig(level) {
    return LEVEL_WORDS[Math.min(level, 27)] || LEVEL_WORDS[27];
}

/* ========== ОТОБРАЖЕНИЕ КРОССВОРДА ========== */

function renderCrossword() {
    const grid = document.getElementById('crossword-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    const cellSize = calculateMaxCellSize();
    
    for (let y = 0; y < crossword.size; y++) {
        for (let x = 0; x < crossword.size; x++) {
            const cellData = crossword.grid[y][x];
            const cell = document.createElement('div');
            cell.className = 'crossword-cell';
            cell.style.width = `${cellSize}px`;
            cell.style.height = `${cellSize}px`;
            
            if (cellData) {
                if (cellData.wordIndices.length > 1) {
                    cell.classList.add('multiple-words');
                }
                
                // Добавляем номер слова (для первой буквы)
                const isFirstLetter = crossword.words.some(w => 
                    (w.direction === 'horizontal' && w.x === x && w.y === y) ||
                    (w.direction === 'vertical' && w.x === x && w.y === y)
                );
                
                if (isFirstLetter) {
                    const wordNumber = crossword.words.find(w => 
                        (w.direction === 'horizontal' && w.x === x && w.y === y) ||
                        (w.direction === 'vertical' && w.x === x && w.y === y)
                    ).number;
                    
                    const numberSpan = document.createElement('span');
                    numberSpan.className = 'word-number';
                    numberSpan.textContent = wordNumber;
                    cell.appendChild(numberSpan);
                }
                
                if (cellData.letter) {
                    cell.textContent = cellData.letter;
                    cell.classList.add(
                        cellData.letter === cellData.correctLetter ? 
                        'correct-letter' : 'incorrect-letter'
                    );
                    
                    if (crossword.words[cellData.wordIndices[0]].completed) {
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
    
    grid.style.gridTemplateColumns = `repeat(${crossword.size}, ${cellSize}px)`;
    grid.style.gridTemplateRows = `repeat(${crossword.size}, ${cellSize}px)`;
    
    // Восстанавливаем выделение
    if (crossword.selectedCell) {
        selectCell(crossword.selectedCell.x, crossword.selectedCell.y);
    }
}

function calculateMaxCellSize() {
    const gridWidth = crossword.size;
    const gridHeight = crossword.size;
    
    const availableWidth = window.innerWidth - 40;
    const availableHeight = window.innerHeight - 250; // Учитываем место для других элементов
    
    const maxWidth = Math.floor(availableWidth / gridWidth);
    const maxHeight = Math.floor(availableHeight / gridHeight);
    
    return Math.min(40, Math.max(20, Math.min(maxWidth, maxHeight)));
}

/* ========== ИГРОВАЯ ЛОГИКА ========== */

function selectCell(x, y) {
    // Снимаем предыдущее выделение
    document.querySelectorAll('.crossword-cell').forEach(cell => {
        cell.classList.remove('highlight', 'current-word');
    });
    
    const cellData = crossword.grid[y][x];
    if (!cellData) return;
    
    const cell = document.querySelector(`.crossword-cell[data-x="${x}"][data-y="${y}"]`);
    if (!cell) return;
    
    // Устанавливаем активное слово
    if (cellData.wordIndices.length > 0) {
        crossword.activeWordIndex = cellData.wordIndices[0];
        highlightCurrentWord();
    }
    
    cell.classList.add('highlight');
    crossword.selectedCell = { x, y };
}

function highlightCurrentWord() {
    if (crossword.activeWordIndex === null) return;
    
    const word = crossword.words[crossword.activeWordIndex];
    for (const {x, y} of word.letters) {
        const cell = document.querySelector(`.crossword-cell[data-x="${x}"][data-y="${y}"]`);
        if (cell) cell.classList.add('current-word');
    }
}

function handleKeyPress(letter) {
    if (!crossword.selectedCell) return;
    
    const {x, y} = crossword.selectedCell;
    const cellData = crossword.grid[y][x];
    if (!cellData) return;
    
    cellData.letter = letter;
    renderCrossword();
    
    // Проверяем правильность
    if (letter === cellData.correctLetter) {
        moveToNextCell(x, y);
    }
    
    checkAllWordsCompletion();
}

function moveToNextCell(x, y) {
    if (crossword.activeWordIndex === null) return;
    
    const word = crossword.words[crossword.activeWordIndex];
    const direction = word.direction;
    
    let nextX = direction === 'horizontal' ? x + 1 : x;
    let nextY = direction === 'horizontal' ? y : y + 1;
    
    // Проверяем границы слова
    if ((direction === 'horizontal' && nextX >= word.x + word.word.length) ||
        (direction === 'vertical' && nextY >= word.y + word.word.length)) {
        findNextWord();
        return;
    }
    
    // Проверяем, что следующая клетка принадлежит слову
    if (crossword.grid[nextY]?.[nextX]?.wordIndices.includes(crossword.activeWordIndex)) {
        selectCell(nextX, nextY);
    } else {
        findNextWord();
    }
}

function findNextWord() {
    if (crossword.words.length === 0) return;
    
    let nextIndex = crossword.activeWordIndex !== null ? 
        (crossword.activeWordIndex + 1) % crossword.words.length : 0;
    
    for (let i = 0; i < crossword.words.length; i++) {
        const word = crossword.words[nextIndex];
        if (!word.completed) {
            selectCell(word.letters[0].x, word.letters[0].y);
            return;
        }
        nextIndex = (nextIndex + 1) % crossword.words.length;
    }
}

function checkAllWordsCompletion() {
    let newlyCompleted = [];
    
    for (let i = 0; i < crossword.words.length; i++) {
        const word = crossword.words[i];
        if (word.completed) continue;
        
        let allCorrect = true;
        let allFilled = true;
        
        for (const {x, y} of word.letters) {
            const cell = crossword.grid[y][x];
            if (!cell.letter) {
                allFilled = false;
                break;
            }
            if (cell.letter !== cell.correctLetter) {
                allCorrect = false;
            }
        }
        
        if (allFilled) {
            word.completed = allCorrect;
            
            if (allCorrect && !word.countedAsFound) {
                word.countedAsFound = true;
                crossword.wordsFound++;
                newlyCompleted.push(word);
                
                highlightWord(i, 'completed-word');
                addSolvedDefinition(word.word, word.definition);
            }
        }
    }
    
    if (newlyCompleted.length > 0) {
        renderCrossword();
        
        if (crossword.wordsFound === crossword.wordsToFind) {
            setTimeout(showLevelCompleteDialog, 500);
        }
    }
}

function highlightWord(wordIndex, className) {
    const word = crossword.words[wordIndex];
    for (const {x, y} of word.letters) {
        const cell = document.querySelector(`.crossword-cell[data-x="${x}"][data-y="${y}"]`);
        if (cell) cell.classList.add(className);
    }
}

/* ========== ИНТЕРФЕЙС ========== */

function generateKeyboard() {
    const keyboard = document.getElementById('keyboard');
    if (!keyboard) return;
    
    keyboard.innerHTML = '';
    
    const letters = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
    const usedLetters = getUsedLetters();
    
    for (const letter of letters) {
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
    
    // Добавляем специальные кнопки
    const specialKeys = [
        { text: '⌫', action: clearCell, cls: 'keyboard-key-special' },
        { text: '📖', action: showDefinitions, cls: 'keyboard-key-special' },
        { text: 'Подсказка', action: giveHint, cls: 'keyboard-key-hint' }
    ];
    
    for (const key of specialKeys) {
        const btn = document.createElement('button');
        btn.className = `keyboard-key ${key.cls}`;
        btn.textContent = key.text;
        btn.addEventListener('click', key.action);
        keyboard.appendChild(btn);
    }
}

function getUsedLetters() {
    const letters = new Set();
    for (const word of crossword.words) {
        for (const letter of word.word) {
            letters.add(letter);
        }
    }
    return letters;
}

function clearCell() {
    if (!crossword.selectedCell) return;
    
    const {x, y} = crossword.selectedCell;
    const cell = crossword.grid[y][x];
    if (!cell?.letter) return;
    
    cell.letter = null;
    if (crossword.activeWordIndex !== null) {
        crossword.words[crossword.activeWordIndex].completed = false;
    }
    
    renderCrossword();
    selectCell(x, y);
}

function showDefinitions() {
    const box = document.getElementById('definitions-box');
    const list = document.getElementById('definitions-list');
    if (!box || !list) return;
    
    list.innerHTML = '';
    
    // Сортируем определения по номеру
    const sortedDefinitions = [...crossword.definitions].sort((a, b) => a.number - b.number);
    
    for (const def of sortedDefinitions) {
        const item = document.createElement('div');
        item.className = 'definition-item';
        if (crossword.words[def.number - 1]?.completed) {
            item.classList.add('completed-definition');
        }
        item.innerHTML = `
            <strong>${def.number}. (${def.direction}, ${def.length} букв):</strong>
            ${def.definition}
        `;
        list.appendChild(item);
    }
    
    box.classList.remove('hidden');
}

function addSolvedDefinition(word, definition) {
    const panel = document.getElementById('solved-definitions');
    const list = document.getElementById('solved-definitions-list');
    if (!panel || !list) return;
    
    const item = document.createElement('div');
    item.className = 'solved-definition-item';
    item.innerHTML = `<strong>${word}:</strong> ${definition}`;
    list.appendChild(item);
    
    panel.classList.remove('hidden');
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
    
    const {x, y} = crossword.selectedCell;
    const cell = crossword.grid[y][x];
    
    if (!cell || cell.letter) {
        alert('Выберите пустую клетку');
        return;
    }
    
    cell.letter = cell.correctLetter;
    crossword.hints--;
    updateHintCount();
    
    renderCrossword();
    checkAllWordsCompletion();
}

function updateHintCount() {
    const hintElement = document.getElementById('hint-count');
    if (hintElement) {
        hintElement.textContent = crossword.hints;
    }
}

/* ========== УПРАВЛЕНИЕ ИГРОЙ ========== */

async function startGame() {
    console.log("Запуск игры...");
    
    // Загружаем уровень
    currentLevel = await loadSavedLevel();
    console.log("Текущий уровень:", currentLevel);
    
    // Загружаем слова
    if (wordDatabase.easy.length + wordDatabase.hard.length < 3) {
        loadBackupWords();
    }
    
    // Показываем индикатор загрузки
    showLoadingIndicator();
    
    // Пробуем сгенерировать кроссворд
    const levelConfig = getLevelConfig(currentLevel);
    let attempts = 0;
    const maxAttempts = 5;
    
    let success = false;
    while (attempts < maxAttempts && !success) {
        attempts++;
        console.log(`Попытка генерации ${attempts}/${maxAttempts}`);
        success = await generateCrossword(levelConfig);
    }
    
    // Скрываем индикатор загрузки
    hideLoadingIndicator();
    
    if (success) {
        renderCrossword();
        generateKeyboard();
        showDefinitions();
        updateHintCount();
    } else {
        showGenerationError();
    }
}

function showLoadingIndicator() {
    let loader = document.getElementById('loading-indicator');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'loading-indicator';
        loader.innerHTML = '<div class="loader">Генерация кроссворда...</div>';
        document.body.appendChild(loader);
    }
    loader.style.display = 'flex';
}

function hideLoadingIndicator() {
    const loader = document.getElementById('loading-indicator');
    if (loader) loader.style.display = 'none';
}

function showGenerationError() {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <p>Не удалось создать кроссворд. Возможные причины:</p>
        <ul>
            <li>Недостаточно слов в базе данных</li>
            <li>Слишком сложные параметры уровня</li>
        </ul>
        <button id="retry-button">Попробовать снова</button>
    `;
    
    document.body.appendChild(errorDiv);
    
    document.getElementById('retry-button').addEventListener('click', () => {
        errorDiv.remove();
        startGame();
    });
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
    
    document.getElementById('menu-btn').addEventListener('click', () => {
        location.href = '../MAIN/index.html';
    });
}

async function completeLevel() {
    const newLevel = currentLevel + 1;
    await saveCurrentLevel(newLevel);
    await saveUserRecord(newLevel);
    currentLevel = newLevel;
    await startGame();
}

/* ========== РАБОТА С ДАННЫМИ ========== */

async function loadWords() {
    try {
        const [easyResponse, hardResponse] = await Promise.all([
            fetch('easy_words.json'),
            fetch('hard_words.json')
        ]);
        
        if (!easyResponse.ok || !hardResponse.ok) {
            throw new Error('Ошибка загрузки файлов со словами');
        }
        
        wordDatabase.easy = await easyResponse.json();
        wordDatabase.hard = await hardResponse.json();
        
        console.log('Загружено слов:', {
            easy: wordDatabase.easy.length,
            hard: wordDatabase.hard.length
        });
    } catch (error) {
        console.error('Ошибка загрузки слов:', error);
        throw error;
    }
}

function loadBackupWords() {
    wordDatabase.easy = [
        { word: "КОМПЬЮТЕР", definition: "Электронное устройство для обработки информации" },
        { word: "ПРОГРАММА", definition: "Набор инструкций для компьютера" },
        { word: "АЛГОРИТМ", definition: "Последовательность действий для решения задачи" },
        { word: "СЕРВЕР", definition: "Компьютер, предоставляющий услуги другим компьютерам" },
        { word: "БРАУЗЕР", definition: "Программа для просмотра веб-страниц" }
    ];
    
    wordDatabase.hard = [
        { word: "БАЗАДАННЫХ", definition: "Организованная совокупность данных" },
        { word: "ИНТЕРФЕЙС", definition: "Средство взаимодействия между системами" },
        { word: "ПРОТОКОЛ", definition: "Стандарт передачи данных" },
        { word: "ФРЕЙМВОРК", definition: "Структура программной системы" }
    ];
    
    console.log('Используется резервный набор слов');
}

function isTelegramWebApp() {
    return window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe;
}

async function saveCurrentLevel(level) {
    const levelStr = String(level);
    
    if (isTelegramWebApp()) {
        try {
            await Telegram.WebApp.CloudStorage.setItem('user_level', levelStr);
            console.log("Уровень сохранён в CloudStorage");
            return true;
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
            const value = await Telegram.WebApp.CloudStorage.getItem('user_level');
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
        await Telegram.WebApp.CloudStorage.setItem(
            `user_${userId}_record`,
            String(level)
        );
        console.log("Рекорд сохранён:", level);
    } catch (e) {
        console.error("Ошибка сохранения рекорда:", e);
    }
}

// Запуск игры
document.addEventListener('DOMContentLoaded', () => {
    if (isTelegramWebApp()) {
        Telegram.WebApp.ready();
        Telegram.WebApp.enableClosingConfirmation();
    }
    initGame();
});