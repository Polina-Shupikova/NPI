// Глобальные переменные
let currentLevel = 1;
let userProgress = { userId: null, level: 1 };
let wordDatabase = { easy: [], hard: [] };
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

// Русская раскладка клавиатуры
const RUSSIAN_LAYOUT = {
  'q': 'й', 'w': 'ц', 'e': 'у', 'r': 'к', 't': 'е', 'y': 'н', 
  'u': 'г', 'i': 'ш', 'o': 'щ', 'p': 'з', '[': 'х', ']': 'ъ',
  'a': 'ф', 's': 'ы', 'd': 'в', 'f': 'а', 'g': 'п', 'h': 'р',
  'j': 'о', 'k': 'л', 'l': 'д', ';': 'ж', "'": 'э', 
  'z': 'я', 'x': 'ч', 'c': 'с', 'v': 'м', 'b': 'и', 'n': 'т',
  'm': 'ь', ',': 'б', '.': 'ю', '/': '.', '`': 'ё'
};

// Типы слов
const WORD_TYPES = {
  EASY: 'easy',
  HARD: 'hard'
};

// Конфигурация уровней
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

// Получение конфигурации уровня
function getLevelConfig(level) {
  return level <= 26 ? LEVEL_WORDS[level] : LEVEL_WORDS[26];
}

// Загрузка сохраненного уровня из localStorage
async function loadSavedLevel() {
  try {
    const progress = localStorage.getItem('crossword_user_progress');
    if (!progress) {
      console.warn("Прогресс не найден, начинаем с 1 уровня");
      return 1;
    }
    const parsed = JSON.parse(progress);
    userProgress = { userId: parsed.userId, level: parsed.level || 1 };
    console.log(`Загружен уровень ${userProgress.level} для userId: ${userProgress.userId || 'local'}`);
    return userProgress.level;
  } catch (error) {
    console.error("Ошибка при загрузке прогресса:", error);
    return 1;
  }
}

async function saveCurrentLevel(level) {
    try {
      userProgress.level = level;
      localStorage.setItem('crossword_user_progress', JSON.stringify(userProgress));
      if (window.parent && window.parent.postMessage) {
        return new Promise((resolve) => {
          window.parent.postMessage({ type: 'SAVE_PROGRESS', level }, '*');
          const timeout = setTimeout(() => {
            console.warn('Тайм-аут ожидания ответа от CloudStorage');
            resolve(false);
          }, 5000); // Тайм-аут 5 секунд
          window.addEventListener('message', (event) => {
            if (event.data.type === 'PROGRESS_SAVED') {
              clearTimeout(timeout);
              console.log(`Сохранение в CloudStorage: ${event.data.success ? 'успешно' : 'не удалось'}`);
              resolve(event.data.success);
            }
          }, { once: true });
        });
      }
      console.log(`Уровень ${level} сохранен локально`);
      return true;
    } catch (error) {
      console.error("Ошибка при сохранении уровня:", error);
      return false;
    }
}

// Инициализация Telegram WebApp
async function initTelegramWebApp() {
  if (window.Telegram?.WebApp) {
    try {
      console.log("Обнаружен Telegram WebApp, инициализация...");
      Telegram.WebApp.ready();
      await new Promise(resolve => setTimeout(() => {
        Telegram.WebApp.expand();
        resolve();
      }, 100));
      console.log("Telegram WebApp успешно инициализирован");
    } catch (error) {
      console.warn("Ошибка инициализации Telegram WebApp:", error);
    }
  } else {
    console.log("Telegram WebApp не обнаружен");
  }
}

// Загрузка слов
async function loadWords() {
  const EASY_WORDS_URL = 'https://gist.githubusercontent.com/Ukinnne/7374dccab584f7903680e5a5bacb56a5/raw/easy_words.json';
  const HARD_WORDS_URL = 'https://gist.githubusercontent.com/Ukinnne/d8b156ad91831540f90236961c5095c9/raw/hard_words.json';
  try {
    const fetchWithTimeout = (url, timeout = 10000) => {
      return Promise.race([
        fetch(url),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
      ]);
    };
    const [easyResponse, hardResponse] = await Promise.all([
      fetchWithTimeout(EASY_WORDS_URL),
      fetchWithTimeout(HARD_WORDS_URL)
    ]);
    if (!easyResponse.ok || !hardResponse.ok) throw new Error("Ошибка загрузки слов");
    wordDatabase.easy = await easyResponse.json();
    wordDatabase.hard = await hardResponse.json();
    console.log(`Загружено: ${wordDatabase.easy.length} легких и ${wordDatabase.hard.length} сложных слов`);
  } catch (error) {
    console.error("Ошибка загрузки слов:", error);
    loadBackupWords();
  }
}

// Резервные слова
function loadBackupWords() {
  wordDatabase.easy = [
    { word: "КОД", definition: "Набор символов для программы" },
    { word: "БИТ", definition: "Единица информации" },
    { word: "БАЙТ", definition: "Группа битов" }
  ];
  wordDatabase.hard = [
    { word: "СЕРВЕР", definition: "Центральный компьютер" },
    { word: "КЛИЕНТ", definition: "Пользователь сети" }
  ];
  console.log("Используются резервные слова");
}

async function initGame() {
  console.log("Запуск initGame...");
  await initTelegramWebApp();
  try {
    await loadWords();
    if (wordDatabase.easy.length === 0 || wordDatabase.hard.length === 0) {
      loadBackupWords();
    }
    currentLevel = await loadSavedLevel();
    console.log("Игра начинается с уровня:", currentLevel);
    await loadLevel();
    initEventListeners();
  } catch (error) {
    console.error("Фатальная ошибка при запуске игры:", error);
    alert("Не удалось запустить игру. Проверьте подключение.");
  }
}

async function loadLevel() {
    console.log(`Загрузка уровня ${currentLevel}`);
    let generated = generateCrossword();
    if (!generated) {
      console.warn("Не удалось сгенерировать кроссворд, повторная попытка...");
      crossword.usedWords.clear();
      generated = generateCrossword();
    }
    if (generated) {
      // Обновляем номер уровня перед отрисовкой
      document.getElementById('level-number').textContent = currentLevel;
      renderCrossword(true);
      generateKeyboard();
      document.getElementById('hint-count').textContent = crossword.hints;
    } else {
      console.error("Критическая ошибка генерации кроссворда");
      showError("Не удалось загрузить уровень.");
    }
  }

// Генерация кроссворда
function generateCrossword() {
  const levelConfig = getLevelConfig(currentLevel);
  crossword.size = Math.max(20, levelConfig.maxLength + 7);
  crossword.hints = levelConfig.total;
  crossword.wordsToFind = levelConfig.total;
  crossword.wordsFound = 0;
  crossword.words = [];
  crossword.grid = Array(crossword.size).fill().map(() => Array(crossword.size).fill(null));
  crossword.definitions = [];
  crossword.usedWords.clear();

  const firstWord = getRandomWord(WORD_TYPES.EASY, levelConfig.minLength, levelConfig.maxLength);
  if (!firstWord) return false;
  const centerY = Math.floor(crossword.size / 2);
  const centerX = Math.floor((crossword.size - firstWord.word.length) / 2);
  addWordToGrid(firstWord, { x: centerX, y: centerY }, 'horizontal', 1);

  let wordsAdded = 1;
  const maxAttempts = 1000;
  let attempts = 0;

  while (wordsAdded < levelConfig.total && attempts < maxAttempts) {
    const needEasy = wordsAdded < levelConfig.easy;
    const type = needEasy ? WORD_TYPES.EASY : WORD_TYPES.HARD;
    const wordObj = getRandomWord(type, levelConfig.minLength, levelConfig.maxLength);
    if (wordObj && tryAddConnectedWord(wordObj)) {
      wordsAdded++;
      attempts = 0;
    } else {
      attempts++;
    }
  }
  crossword.wordsToFind = wordsAdded;
  return wordsAdded >= Math.max(3, levelConfig.total * 0.7);
}

// Выбор случайного слова
function getRandomWord(type, minLength, maxLength) {
  const matches = wordDatabase[type].filter(w => 
    !crossword.usedWords.has(w.word) && 
    w.word.length >= minLength && 
    w.word.length <= maxLength
  );
  if (matches.length === 0) {
    crossword.usedWords.clear();
    return wordDatabase[type][Math.floor(Math.random() * wordDatabase[type].length)];
  }
  return matches[Math.floor(Math.random() * matches.length)];
}

// Добавление слова с пересечением
function tryAddConnectedWord(wordObj) {
  const strategies = [
    { method: 'singleIntersection' },
    { method: 'anyIntersection', maxIntersections: 2 }
  ];
  for (const strategy of strategies) {
    for (const baseWord of [...crossword.words].sort(() => Math.random() - 0.5)) {
      if (tryAddWithStrategy(wordObj, baseWord, strategy)) return true;
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

function canPlaceWordWithSingleIntersection(word, position, direction) {
  const { x, y } = position;
  if (x < 0 || y < 0 || (direction === 'horizontal' && x + word.length > crossword.size) || 
      (direction === 'vertical' && y + word.length > crossword.size)) return false;

  let intersectionCount = 0;
  for (let i = 0; i < word.length; i++) {
    const cellX = direction === 'horizontal' ? x + i : x;
    const cellY = direction === 'vertical' ? y + i : y;
    const cell = crossword.grid[cellY]?.[cellX];
    if (cell) {
      if (cell.correctLetter !== word[i]) return false;
      intersectionCount++;
    }
  }
  return intersectionCount === 1;
}

function canPlaceWordWithIntersections(word, position, direction, maxIntersections) {
  const { x, y } = position;
  if (x < 0 || y < 0 || (direction === 'horizontal' && x + word.length > crossword.size) || 
      (direction === 'vertical' && y + word.length > crossword.size)) return false;

  let intersectionCount = 0;
  for (let i = 0; i < word.length; i++) {
    const cellX = direction === 'horizontal' ? x + i : x;
    const cellY = direction === 'vertical' ? y + i : y;
    const cell = crossword.grid[cellY]?.[cellX];
    if (cell) {
      if (cell.correctLetter !== word[i]) return false;
      intersectionCount++;
      if (intersectionCount > maxIntersections) return false;
    }
  }
  return intersectionCount > 0;
}

function addWordToGrid(wordObj, position, direction, wordNumber) {
  const { word, definition } = wordObj;
  const { x, y } = position;
  crossword.usedWords.add(word);
  const wordInfo = { word, x, y, direction, letters: [], definition, completed: false, countedAsFound: false, number: wordNumber };
  const wordIndex = crossword.words.length;
  crossword.words.push(wordInfo);

  for (let i = 0; i < word.length; i++) {
    const cellX = direction === 'horizontal' ? x + i : x;
    const cellY = direction === 'horizontal' ? y : y + i;
    if (!crossword.grid[cellY][cellX]) {
      crossword.grid[cellY][cellX] = { wordIndices: [], letter: null, correctLetter: word[i] };
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

// Отрисовка кроссворда
function renderCrossword(force = false) {
  const crosswordGrid = document.getElementById('crossword-grid');
  if (!force && !crosswordGrid.children.length) return;
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
        if (cellData.wordIndices.length > 1) cell.classList.add('multiple-words');
        if (cellData.letter) {
          cell.textContent = cellData.letter;
          if (cellData.letter === cellData.correctLetter) cell.classList.add('correct-letter');
          else cell.classList.add('incorrect-letter');
          const wordInfo = crossword.words[cellData.wordIndices[0]];
          if (wordInfo.completed) cell.classList.add('completed-word');
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
  if (crossword.selectedCell) selectCell(crossword.selectedCell.x, crossword.selectedCell.y, crossword.activeWordIndex);
}

// Выбор ячейки
function selectCell(x, y, wordIndex = null) {
  document.querySelectorAll('.crossword-cell').forEach(cell => cell.classList.remove('highlight', 'current-word'));
  const cellData = crossword.grid[y]?.[x];
  if (!cellData) return;
  const cell = document.querySelector(`.crossword-cell[data-x="${x}"][data-y="${y}"]`);
  if (!cell) return;

  if (wordIndex !== null) crossword.activeWordIndex = wordIndex;
  else if (cellData.wordIndices.length === 1) crossword.activeWordIndex = cellData.wordIndices[0];
  else if (crossword.activeWordIndex === null || !cellData.wordIndices.includes(crossword.activeWordIndex)) {
    crossword.activeWordIndex = cellData.wordIndices[0];
  }

  cell.classList.add('highlight');
  crossword.selectedCell = { x, y };
  const activeWord = crossword.words[crossword.activeWordIndex];
  for (const { x: wx, y: wy } of activeWord.letters) {
    const wCell = document.querySelector(`.crossword-cell[data-x="${wx}"][data-y="${wy}"]`);
    if (wCell) wCell.classList.add('current-word');
  }
}

// Генерация клавиатуры
function generateKeyboard() {
  const keyboard = document.getElementById('keyboard');
  keyboard.innerHTML = '';
  const russianLetters = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
  const usedLetters = new Set(crossword.words.map(w => w.word).join(''));

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
    { text: '⌫', action: clearCell },
    { text: '📖', action: showDefinitions },
    { text: '💡', action: giveHint }
  ];
  for (const btn of specialButtons) {
    const key = document.createElement('button');
    key.className = 'keyboard-key keyboard-key-used';
    key.textContent = btn.text;
    key.addEventListener('click', btn.action);
    keyboard.appendChild(key);
  }
}

// Обработка нажатия клавиши
function handleKeyPress(letter) {
  if (!crossword.selectedCell || crossword.activeWordIndex === null) return;
  const { x, y } = crossword.selectedCell;
  const cellData = crossword.grid[y][x];
  if (!cellData || (cellData.letter && cellData.letter === cellData.correctLetter)) return;

  cellData.letter = letter;
  renderCrossword();
  moveToNextCell(x, y, crossword.activeWordIndex);
  checkAllWordsCompletion();
}

// Переход к следующей ячейке
function moveToNextCell(x, y, wordIndex) {
  const wordInfo = crossword.words[wordIndex];
  const direction = wordInfo.direction;
  let nextX = x, nextY = y;
  if (direction === 'horizontal') {
    nextX++;
    if (nextX >= wordInfo.x + wordInfo.word.length) {
      findNextWord(wordIndex, x, y);
      return;
    }
  } else {
    nextY++;
    if (nextY >= wordInfo.y + wordInfo.word.length) {
      findNextWord(wordIndex, x, y);
      return;
    }
  }
  const nextCell = crossword.grid[nextY]?.[nextX];
  if (nextCell && nextCell.wordIndices.includes(wordIndex)) selectCell(nextX, nextY, wordIndex);
  else findNextWord(wordIndex, x, y);
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

// Очистка ячейки
function clearCell() {
  if (!crossword.selectedCell) return;
  const { x, y } = crossword.selectedCell;
  const cellData = crossword.grid[y][x];
  if (!cellData?.letter || cellData.letter === cellData.correctLetter) return;
  cellData.letter = null;
  if (crossword.activeWordIndex !== null) crossword.words[crossword.activeWordIndex].completed = false;
  renderCrossword();
  selectCell(x, y);
}

// Проверка завершения всех слов
function checkAllWordsCompletion() {
  const newlyCompletedWords = [];
  for (let i = 0; i < crossword.words.length; i++) {
    const wordInfo = crossword.words[i];
    if (wordInfo.completed) continue;
    let allLettersCorrect = true;
    let allLettersFilled = true;
    for (const { x, y } of wordInfo.letters) {
      const cell = crossword.grid[y][x];
      if (!cell.letter) {
        allLettersFilled = false;
        break;
      }
      if (cell.letter !== cell.correctLetter) allLettersCorrect = false;
    }
    if (allLettersFilled) {
      wordInfo.completed = allLettersCorrect;
      if (allLettersCorrect && !wordInfo.countedAsFound) {
        wordInfo.countedAsFound = true;
        crossword.wordsFound++;
        newlyCompletedWords.push(wordInfo);
        highlightWord(i, 'completed-word');
        addSolvedDefinition(wordInfo.word, wordInfo.definition);
      }
    }
  }
  if (newlyCompletedWords.length > 0) {
    renderCrossword();
    newlyCompletedWords.forEach((wordInfo, index) => {
      setTimeout(() => alert(`Верно! Слово "${wordInfo.word}" угадано.`), 200 + (index * 300));
    });
    if (crossword.wordsFound === crossword.wordsToFind) {
      setTimeout(() => showLevelCompleteDialog(), 500 + (newlyCompletedWords.length * 300));
    }
  }
}

function highlightWord(wordIndex, className) {
  for (const { x, y } of crossword.words[wordIndex].letters) {
    const cell = document.querySelector(`.crossword-cell[data-x="${x}"][data-y="${y}"]`);
    if (cell) cell.classList.add(className);
  }
}

// Показать определения
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
    if (e.target === box || e.target.tagName === 'H3') box.classList.add('hidden');
  };
}

// Добавить решенное определение
function addSolvedDefinition(word, definition) {
  const panel = document.getElementById('solved-definitions');
  const list = document.getElementById('solved-definitions-list');
  if (panel.classList.contains('hidden')) panel.classList.remove('hidden');
  const item = document.createElement('div');
  item.className = 'solved-definition-item';
  item.innerHTML = `<strong>${word}:</strong> ${definition}`;
  list.appendChild(item);
  panel.scrollTop = panel.scrollHeight;
}

// Дать подсказку
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
  
    document.getElementById('next-level-btn').onclick = () => {
      console.log('Клик: Следующий уровень');
      dialog.remove();
      currentLevel++;
      document.getElementById('level-number').textContent = currentLevel;
      localStorage.setItem('crossword_user_progress', JSON.stringify({ level: currentLevel }));
      loadLevel();
    };
  
    document.getElementById('menu-btn').onclick = () => {
      console.log('Клик: В меню');
      localStorage.setItem('crossword_user_progress', JSON.stringify({ level: currentLevel + 1 }));
      window.location.href = '../MAIN/index.html';
    };
}

  async function completeLevel() {
    try {
      currentLevel++;
      const saved = await saveCurrentLevel(currentLevel);
      if (!saved) {
        console.warn("Не удалось сохранить в CloudStorage, сохранено локально");
        alert("Прогресс сохранен локально. Проверьте подключение для синхронизации.");
      }
      console.log(`Переход на уровень ${currentLevel}`);
      document.getElementById('level-number').textContent = currentLevel;
      await loadLevel();
    } catch (error) {
      console.error('Ошибка в completeLevel:', error);
      throw error; // Передаем ошибку вверх для обработки в showLevelCompleteDialog
    }
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
      switch (e.key) {
        case 'ArrowUp': newY--; break;
        case 'ArrowDown': newY++; break;
        case 'ArrowLeft': newX--; break;
        case 'ArrowRight': newX++; break;
        }
      if (crossword.grid[newY]?.[newX]) selectCell(newX, newY);
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
    if (RUSSIAN_LAYOUT[letter]) letter = RUSSIAN_LAYOUT[letter];
    if (/[а-яё]/.test(letter)) {
      handleKeyPress(letter.toUpperCase());
      e.preventDefault();
    }
}

  function initEventListeners() {
    document.addEventListener('keydown', handlePhysicalKeyPress);
    console.log("Обработчики событий инициализированы");
    }

  document.addEventListener('DOMContentLoaded', initGame);