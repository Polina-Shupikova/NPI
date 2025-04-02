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
const MAX_ATTEMPTS = 100;

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

const usedLettersCache = {};

/* ========== ГЕНЕРАЦИЯ КРОССВОРДА ========== */
function tryPlaceFirstWord(levelConfig) {
    const wordType = levelConfig.easy > 0 ? WORD_TYPES.EASY : WORD_TYPES.HARD;
    const wordObj = getRandomWord(wordType, levelConfig.minLength, levelConfig.maxLength);
    if (!wordObj) return false;

    // Пробуем разные позиции для первого слова
    const center = Math.floor(CROSSWORD_SIZE / 2) - Math.floor(wordObj.word.length / 2);
    const positions = [
        { x: center, y: center, direction: 'horizontal' },
        { x: center, y: center, direction: 'vertical' },
        { x: Math.max(0, center - 3), y: center, direction: 'horizontal' },
        { x: center, y: Math.max(0, center - 3), direction: 'vertical' }
    ];

    for (const pos of positions) {
        if (canPlaceWord(wordObj.word, pos, pos.direction)) {
            addWordToGrid(wordObj, pos, pos.direction, 1);
            return true;
        }
    }
    
    return false;
}

function generateCrossword(levelConfig) {
    console.log('Начало генерации кроссворда для уровня', currentLevel);
    
    // Инициализация кроссворда
    resetCrossword();
    
    // 1. Размещаем первое слово по центру
    let firstWordPlaced = false;
    let firstWordAttempts = 0;
    const maxFirstWordAttempts = 50;
    
    while (!firstWordPlaced && firstWordAttempts < maxFirstWordAttempts) {
        firstWordAttempts++;
        firstWordPlaced = tryPlaceFirstWord(levelConfig);
    }
    
    if (!firstWordPlaced) {
        console.error('Не удалось разместить первое слово после', maxFirstWordAttempts, 'попыток');
        return false;
    }

    // 2. Размещаем остальные слова
    let wordsPlaced = 1;
    let totalAttempts = 0;
    const maxTotalAttempts = levelConfig.total * 100;
    
    while (wordsPlaced < levelConfig.total && totalAttempts < maxTotalAttempts) {
        totalAttempts++;
        
        // Определяем тип следующего слова
        const needHard = wordsPlaced >= levelConfig.easy;
        const wordType = needHard ? WORD_TYPES.HARD : WORD_TYPES.EASY;
        
        // Получаем случайное слово с расширенными параметрами, если нужно
        const wordObj = getRandomWordExtended(wordType, levelConfig.minLength, levelConfig.maxLength, wordsPlaced);
        if (!wordObj) continue;

        // Пробуем разместить слово
        if (tryPlaceWord(wordObj)) {
            wordsPlaced++;
            console.log(`Размещено слово ${wordsPlaced}/${levelConfig.total}:`, wordObj.word);
            totalAttempts = 0; // Сбрасываем счетчик после успешного размещения
        }
    }

    if (wordsPlaced < levelConfig.total) {
        console.error(`Удалось разместить только ${wordsPlaced} из ${levelConfig.total} слов`);
        return false;
    }

    // Оптимизируем сетку
    trimGrid();
    console.log('Кроссворд успешно сгенерирован!');
    return true;
}

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

function getNextWordType(levelConfig, wordsPlaced) {
    const needHard = wordsPlaced >= levelConfig.easy;
    return needHard ? WORD_TYPES.HARD : WORD_TYPES.EASY;
}

function placeFirstWord(levelConfig) {
    const wordType = levelConfig.easy > 0 ? WORD_TYPES.EASY : WORD_TYPES.HARD;
    const wordObj = getRandomWord(wordType, levelConfig.minLength, levelConfig.maxLength);
    if (!wordObj) return false;

    const center = Math.floor(CROSSWORD_SIZE / 2) - Math.floor(wordObj.word.length / 2);
    const position = { x: center, y: center };

    if (canPlaceWord(wordObj.word, position, 'horizontal')) {
        addWordToGrid(wordObj, position, 'horizontal', 1);
        return true;
    }
    return false;
}

function calculatePlacementScore(word, pos, direction) {
    let score = 0;
    const {x, y} = pos;
    
    for (let i = 0; i < word.length; i++) {
        const cellX = direction === 'horizontal' ? x + i : x;
        const cellY = direction === 'horizontal' ? y : y + i;
        
        if (crossword.grid[cellY][cellX]) {
            // Бонус за пересечение с существующим словом
            score += 5;
            
            // Дополнительный бонус за пересечение с несколькими словами
            if (crossword.grid[cellY][cellX].wordIndices.length > 1) {
                score += 2;
            }
        } else {
            // Штраф за отсутствие пересечения
            score -= 1;
        }
    }
    
    return score;
}

function findBestWordPlacement(word) {
    let bestScore = -1;
    let bestPlacement = null;
    
    for (const existingWord of shuffleArray([...crossword.words])) {
        const intersections = findWordIntersections(word, existingWord);
        
        for (const placement of intersections) {
            if (canPlaceWord(word, placement.pos, placement.direction)) {
                const score = calculatePlacementScore(word, placement.pos, placement.direction);
                if (score > bestScore) {
                    bestScore = score;
                    bestPlacement = placement;
                }
            }
        }
    }
    
    return bestPlacement;
}

function tryPlaceWord(wordObj) {
    // Сначала пробуем разместить с максимальным количеством пересечений
    const bestPlacement = findBestWordPlacement(wordObj.word);
    if (bestPlacement) {
        addWordToGrid(wordObj, bestPlacement.pos, bestPlacement.direction, crossword.words.length + 1);
        return true;
    }
    
    return false;
}

function findWordIntersections(newWord, existingWord) {
    const intersections = [];
    
    for (let i = 0; i < existingWord.word.length; i++) {
        const existingLetter = existingWord.word[i];
        const newWordLetterIndices = getAllIndices(newWord, existingLetter);
        
        if (newWordLetterIndices.length > 0) {
            const direction = existingWord.direction === 'horizontal' ? 'vertical' : 'horizontal';
            
            for (const j of newWordLetterIndices) {
                const x = direction === 'horizontal' 
                    ? existingWord.x + i - j 
                    : existingWord.x + i;
                    
                const y = direction === 'horizontal' 
                    ? existingWord.y 
                    : existingWord.y + i - j;

                intersections.push({
                    pos: {x, y},
                    direction
                });
            }
        }
    }
    
    return intersections;
}

function canPlaceWord(word, position, direction) {
    const {x, y} = position;
    const length = word.length;

    // Проверка границ
    if (x < 0 || y < 0) return false;
    if (direction === 'horizontal' && x + length > CROSSWORD_SIZE) return false;
    if (direction === 'vertical' && y + length > CROSSWORD_SIZE) return false;

    let hasIntersection = false;
    let cellsToCheck = [];

    // Сначала собираем все клетки для проверки
    for (let i = 0; i < length; i++) {
        const cellX = direction === 'horizontal' ? x + i : x;
        const cellY = direction === 'horizontal' ? y : y + i;
        cellsToCheck.push({cellX, cellY, letter: word[i]});
    }

    // Затем проверяем все клетки
    for (const {cellX, cellY, letter} of cellsToCheck) {
        const cell = crossword.grid[cellY][cellX];
        
        if (cell) {
            if (cell.correctLetter !== letter) return false;
            hasIntersection = true;
            continue;
        }

        // Проверка соседей
        const neighbors = [
            [0, 1], [1, 0], [0, -1], [-1, 0] // Только горизонтальные/вертикальные
        ];

        for (const [dx, dy] of neighbors) {
            const nx = cellX + dx;
            const ny = cellY + dy;

            if (nx >= 0 && nx < CROSSWORD_SIZE && ny >= 0 && ny < CROSSWORD_SIZE) {
                const neighbor = crossword.grid[ny][nx];
                if (neighbor && neighbor.correctLetter !== letter) {
                    return false;
                }
            }
        }
    }

    // Для не первого слова требуется хотя бы одно пересечение
    if (crossword.words.length > 0 && !hasIntersection) return false;

    return true;
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

function getRandomWordExtended(type, minLen, maxLen, wordsPlaced) {
    // Сначала пробуем найти слово с точными параметрами
    let word = getRandomWord(type, minLen, maxLen);
    if (word) return word;
    
    // Если не нашли, расширяем диапазон длин
    const extendedMin = Math.max(3, minLen - 2);
    const extendedMax = maxLen + 2;
    word = getRandomWord(type, extendedMin, extendedMax);
    if (word) return word;
    
    // Если все еще не нашли, пробуем другой тип слов
    const altType = type === WORD_TYPES.EASY ? WORD_TYPES.HARD : WORD_TYPES.EASY;
    word = getRandomWord(altType, extendedMin, extendedMax);
    if (word) return word;
    
    // Если слов совсем нет, очищаем использованные слова для этого типа
    console.log('Очищаем использованные слова для типа', type);
    for (const w of crossword.words) {
        if ((type === WORD_TYPES.EASY && wordDatabase.easy.some(e => e.word === w.word)) ||
            (type === WORD_TYPES.HARD && wordDatabase.hard.some(h => h.word === w.word))) {
            crossword.usedWords.delete(w.word);
        }
    }
    
    return getRandomWord(type, minLen, maxLen);
}

function trimGrid() {
    let minX = CROSSWORD_SIZE, maxX = 0, minY = CROSSWORD_SIZE, maxY = 0;
    
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
    
    minX = Math.max(0, minX - 1);
    maxX = Math.min(CROSSWORD_SIZE - 1, maxX + 1);
    minY = Math.max(0, minY - 1);
    maxY = Math.min(CROSSWORD_SIZE - 1, maxY + 1);
    
    const newGrid = [];
    for (let y = minY; y <= maxY; y++) {
        const row = [];
        for (let x = minX; x <= maxX; x++) {
            row.push(crossword.grid[y][x]);
        }
        newGrid.push(row);
    }
    
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

function shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
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
                
                if (cellData.letter) {
                    cell.textContent = cellData.letter;
                    cell.classList.add(cellData.letter === cellData.correctLetter ? 
                        'correct-letter' : 'incorrect-letter');
                    
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
    
    if (crossword.selectedCell) {
        selectCell(crossword.selectedCell.x, crossword.selectedCell.y);
    }
}

function calculateMaxCellSize() {
    const gridWidth = crossword.size;
    const gridHeight = crossword.size;
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const maxWidth = Math.floor((viewportWidth - 40) / gridWidth);
    const maxHeight = Math.floor((viewportHeight - 200) / gridHeight);
    
    return Math.min(40, Math.max(20, Math.min(maxWidth, maxHeight)));
}

function selectCell(x, y, wordIndex = null) {
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
    } else if (!crossword.activeWordIndex || !cellData.wordIndices.includes(crossword.activeWordIndex)) {
        crossword.activeWordIndex = cellData.wordIndices[0];
    }
    
    cell.classList.add('highlight');
    crossword.selectedCell = { x, y };
    
    highlightCurrentWord();
}

function highlightCurrentWord() {
    if (crossword.activeWordIndex === null) return;
    
    const activeWord = crossword.words[crossword.activeWordIndex];
    for (const {x, y} of activeWord.letters) {
        const cell = document.querySelector(`.crossword-cell[data-x="${x}"][data-y="${y}"]`);
        if (cell) cell.classList.add('current-word');
    }
}

/* ========== ИГРОВАЯ ЛОГИКА ========== */

function handleKeyPress(letter) {
    if (!crossword.selectedCell) return;
    
    const {x, y} = crossword.selectedCell;
    const cellData = crossword.grid[y][x];
    if (!cellData) return;
    
    cellData.letter = letter;
    renderCrossword();
    
    if (letter === cellData.correctLetter) {
        moveToNextCell(x, y, crossword.activeWordIndex);
    }
    
    checkAllWordsCompletion();
}

function moveToNextCell(x, y, wordIndex) {
    const word = crossword.words[wordIndex];
    const direction = word.direction;
    
    let nextX = direction === 'horizontal' ? x + 1 : x;
    let nextY = direction === 'horizontal' ? y : y + 1;
    
    if ((direction === 'horizontal' && nextX >= word.x + word.word.length) ||
        (direction === 'vertical' && nextY >= word.y + word.word.length)) {
        findNextWord(wordIndex);
        return;
    }
    
    if (crossword.grid[nextY]?.[nextX]?.wordIndices.includes(wordIndex)) {
        selectCell(nextX, nextY, wordIndex);
    } else {
        findNextWord(wordIndex);
    }
}

function findNextWord(currentWordIndex) {
    for (let i = 1; i <= crossword.words.length; i++) {
        const idx = (currentWordIndex + i) % crossword.words.length;
        const word = crossword.words[idx];
        
        if (!word.completed) {
            selectCell(word.letters[0].x, word.letters[0].y, idx);
            return;
        }
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
        { text: '⌫', action: clearCell },
        { text: '📖', action: showDefinitions },
        { text: 'Подсказка', action: giveHint, width: '80px' }
    ];
    
    for (const key of specialKeys) {
        const btn = document.createElement('button');
        btn.className = 'keyboard-key keyboard-key-special';
        btn.textContent = key.text;
        if (key.width) btn.style.width = key.width;
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
    list.innerHTML = '';
    
    for (const def of crossword.definitions) {
        const item = document.createElement('div');
        item.className = 'definition-item';
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
    document.getElementById('hint-count').textContent = crossword.hints;
    
    renderCrossword();
    checkAllWordsCompletion();
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

/* ========== ИНИЦИАЛИЗАЦИЯ ИГРЫ ========== */

async function initGame() {
    console.log("Инициализация игры...");
    
    if (isTelegramWebApp()) {
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

function showLoadingIndicator() {
    const loader = document.createElement('div');
    loader.id = 'loading-indicator';
    loader.innerHTML = '<div class="loader">Генерация кроссворда...</div>';
    document.body.appendChild(loader);
}

function hideLoadingIndicator() {
    const loader = document.getElementById('loading-indicator');
    if (loader) loader.remove();
}

function showGenerationErrorDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'error-dialog';
    dialog.innerHTML = `
        <div class="dialog-content">
            <h3>Не удалось создать кроссворд</h3>
            <p>Попробуйте один из вариантов:</p>
            <div class="dialog-buttons">
                <button id="try-again-btn">Попробовать снова</button>
                <button id="simplify-level-btn">Упростить уровень</button>
                <button id="change-words-btn">Изменить набор слов</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    document.getElementById('try-again-btn').addEventListener('click', () => {
        dialog.remove();
        startGame();
    });
    
    document.getElementById('simplify-level-btn').addEventListener('click', () => {
        dialog.remove();
        simplifyLevel();
    });
    
    document.getElementById('change-words-btn').addEventListener('click', () => {
        dialog.remove();
        changeWordSet();
    });
}

async function simplifyLevel() {
    const levelConfig = getLevelConfig(currentLevel);
    const simplifiedConfig = {
        ...levelConfig,
        total: Math.max(3, levelConfig.total - 2),
        hard: Math.max(0, levelConfig.hard - 1)
    };
    
    if (generateCrossword(simplifiedConfig)) {
        renderCrossword();
        generateKeyboard();
        showDefinitions();
    } else {
        await startGame();
    }
}

async function changeWordSet() {
    try {
        await loadWords();
        await startGame();
    } catch (error) {
        console.error('Ошибка загрузки слов:', error);
        loadBackupWords();
        await startGame();
    }
}

async function startGame() {
    currentLevel = await loadSavedLevel();
    console.log("Начинаем игру с уровня:", currentLevel);
    
    const levelConfig = getLevelConfig(currentLevel);
    let attempts = 0;
    const maxAttempts = 10; // Увеличили количество попыток
    
    // Показываем индикатор загрузки
    showLoadingIndicator();
    
    while (attempts < maxAttempts) {
        attempts++;
        console.log(`Попытка генерации ${attempts}/${maxAttempts}`);
        
        if (generateCrossword(levelConfig)) {
            hideLoadingIndicator();
            renderCrossword();
            generateKeyboard();
            showDefinitions();
            return;
        }
        
        // Добавляем небольшую задержку между попытками
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    hideLoadingIndicator();
    console.error("Не удалось сгенерировать кроссворд после", maxAttempts, "попыток");
    
    // Пробуем использовать резервные слова
    if (wordDatabase.easy.length + wordDatabase.hard.length < levelConfig.total) {
        loadBackupWords();
        await startGame();
        return;
    }
    
    // Если все равно не получилось, предлагаем варианты
    showGenerationErrorDialog();
}

async function loadLevel() {
    const levelConfig = getLevelConfig(currentLevel);
    if (generateCrossword(levelConfig)) {
        renderCrossword();
        generateKeyboard();
        showDefinitions();
    } else {
        setTimeout(loadLevel, 100);
    }
}

async function completeLevel() {
    const newLevel = currentLevel + 1;
    await saveCurrentLevel(newLevel);
    await saveUserRecord(newLevel);
    currentLevel = newLevel;
    loadLevel();
}

function initEventListeners() {
    document.getElementById('hint-button').addEventListener('click', giveHint);
    document.addEventListener('keydown', handlePhysicalKeyPress);
}

function handlePhysicalKeyPress(e) {
    if (!crossword.selectedCell) return;
    
    const {x, y} = crossword.selectedCell;
    const cellData = crossword.grid[y][x];
    if (!cellData) return;

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

/* ========== РАБОТА С ДАННЫМИ ========== */

async function loadWords() {
    try {
        const [easyResponse, hardResponse] = await Promise.all([
            fetch('easy_words.json'),
            fetch('hard_words.json')
        ]);
        
        if (!easyResponse.ok || !hardResponse.ok) throw new Error('Ошибка загрузки слов');
        
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
        { word: "АЛГОРИТМ", definition: "Последовательность действий для решения задачи" }
    ];
    
    wordDatabase.hard = [
        { word: "БАЗАДАННЫХ", definition: "Организованная совокупность данных" },
        { word: "ИНТЕРФЕЙС", definition: "Средство взаимодействия между системами" }
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