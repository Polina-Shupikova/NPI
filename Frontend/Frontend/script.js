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
    showDefinitions();
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

// Загрузка цитаты дня
const quotes = [
    "Звук - это волна, которая распространяется в упругой среде.",
    "Фигура - это графическое представление данных.",
    "Клавиатура - это устройство ввода информации.",
    "Свобода - это возможность выбора.",
    "Работа - это целенаправленная деятельность."
];

document.getElementById('daily-quote').textContent = quotes[Math.floor(Math.random() * quotes.length)];

// База слов для кроссворда с определениями
const wordDatabase = [
    { word: "ПРОГРАММИРОВАНИЕ", definition: "Процесс создания компьютерных программ" },
    { word: "КОМПЬЮТЕР", definition: "Электронное устройство для обработки информации" },
    { word: "АЛГОРИТМ", definition: "Последовательность действий для решения задачи" },
    { word: "ФУНКЦИЯ", definition: "Подпрограмма, выполняющая определенную задачу" },
    { word: "ПЕРЕМЕННАЯ", definition: "Именованная область памяти для хранения данных" },
    { word: "ЦИКЛ", definition: "Многократное выполнение набора инструкций" },
    { word: "УСЛОВИЕ", definition: "Проверка логического выражения в программе" },
    { word: "МАССИВ", definition: "Набор элементов одного типа" },
    { word: "ОБЪЕКТ", definition: "Экземпляр класса в ООП" },
    { word: "КЛАСС", definition: "Шаблон для создания объектов" },
    { word: "МЕТОД", definition: "Функция, принадлежащая классу" },
    { word: "СВОЙСТВО", definition: "Характеристика объекта" },
    { word: "ИНТЕРФЕЙС", definition: "Набор методов для взаимодействия с объектом" },
    { word: "НАСЛЕДОВАНИЕ", definition: "Механизм ООП для создания новых классов на основе существующих" },
    { word: "ИНКАПСУЛЯЦИЯ", definition: "Сокрытие внутренней реализации объекта" },
    { word: "ПОЛИМОРФИЗМ", definition: "Возможность объектов с одинаковой спецификацией иметь разную реализацию" },
    { word: "БАЗАДАННЫХ", definition: "Организованная совокупность данных" },
    { word: "СЕРВЕР", definition: "Компьютер, предоставляющий услуги другим компьютерам" },
    { word: "КЛИЕНТ", definition: "Компьютер или программа, использующая услуги сервера" },
    { word: "СЕТЬ", definition: "Система соединенных компьютеров" },
    { word: "ПРОТОКОЛ", definition: "Набор правил для передачи данных" },
    { word: "БРАУЗЕР", definition: "Программа для просмотра веб-страниц" },
    { word: "ВЕБСАЙТ", definition: "Совокупность веб-страниц" },
    { word: "ПРИЛОЖЕНИЕ", definition: "Программа для выполнения конкретных задач" }
];

// Структура кроссворда
let crossword = {
    words: [],
    grid: [],
    size: 15,
    selectedCell: null,
    definitions: [],
    hints: 3,
    usedWords: new Set() // Для отслеживания уже использованных слов
};

// Генерация кроссворда
function generateCrossword() {
    // Очищаем предыдущий кроссворд
    crossword.words = [];
    crossword.grid = Array(crossword.size).fill().map(() => Array(crossword.size).fill(null));
    crossword.selectedCell = null;
    crossword.definitions = [];
    crossword.hints = 3;
    crossword.usedWords.clear();
    document.getElementById('hint-count').textContent = crossword.hints;

    // Выбираем первое случайное слово
    const firstWordObj = getRandomWord();
    addWordToGrid(firstWordObj, {x: 7, y: 7}, 'horizontal', 1);
    
    // Генерируем второе и третье слова, связанные с первым
    generateConnectedWords();
    
    // Отображаем кроссворд (только пустые клетки)
    renderCrossword();
}

// Получение случайного слова из базы, которое еще не использовалось
function getRandomWord() {
    const availableWords = wordDatabase.filter(wordObj => !crossword.usedWords.has(wordObj.word));
    if (availableWords.length === 0) {
        // Если все слова использованы, очищаем список использованных
        crossword.usedWords.clear();
        return wordDatabase[Math.floor(Math.random() * wordDatabase.length)];
    }
    return availableWords[Math.floor(Math.random() * availableWords.length)];
}

// Добавление слова в сетку кроссворда
function addWordToGrid(wordObj, position, direction, wordNumber) {
    const {x, y} = position;
    const word = wordObj.word;
    
    // Добавляем слово в список использованных
    crossword.usedWords.add(word);
    
    const wordInfo = {
        word: word,
        x: x,
        y: y,
        direction: direction,
        letters: [],
        definition: wordObj.definition,
        completed: false
    };
    
    crossword.words.push(wordInfo);
    
    for (let i = 0; i < word.length; i++) {
        const cellX = direction === 'horizontal' ? x + i : x;
        const cellY = direction === 'horizontal' ? y : y + i;
        
        // Заполняем клетку
        crossword.grid[cellY][cellX] = {
            wordIndex: crossword.words.length - 1,
            letterIndex: i,
            letter: null,
            correctLetter: word[i]
        };
        
        // Запоминаем позиции букв в слове
        wordInfo.letters.push({x: cellX, y: cellY});
    }
    
    // Добавляем определение
    crossword.definitions.push({
        number: wordNumber,
        direction: direction === 'horizontal' ? 'по горизонтали' : 'по вертикали',
        length: word.length,
        definition: wordObj.definition
    });
}

// Генерация связанных слов
function generateConnectedWords() {
    for (let i = 0; i < 2; i++) {
        let attempts = 0;
        let wordAdded = false;
        
        while (attempts < 50 && !wordAdded) {
            attempts++;
            
            // Выбираем случайное слово из кроссворда
            const baseWordIndex = Math.floor(Math.random() * crossword.words.length);
            const baseWord = crossword.words[baseWordIndex];
            
            // Выбираем случайную букву в этом слове
            const letterIndex = Math.floor(Math.random() * baseWord.word.length);
            const letter = baseWord.word[letterIndex];
            
            // Ищем слово, которое содержит эту букву (кроме текущего)
            const connectedWordObj = findWordWithLetter(letter, baseWord.word);
            
            if (connectedWordObj) {
                // Пытаемся добавить слово в кроссворд
                wordAdded = tryAddWordToGrid(connectedWordObj, baseWord, letterIndex, i+2);
            }
        }
    }
}

// Поиск слова с заданной буквой (кроме исключенного слова)
function findWordWithLetter(letter, excludeWord) {
    const candidates = wordDatabase.filter(item => 
        item.word.includes(letter) && 
        item.word !== excludeWord &&
        !crossword.usedWords.has(item.word)
    );
    
    return candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : null;
}

// Попытка добавить слово в кроссворд
function tryAddWordToGrid(wordObj, baseWord, letterIndex, wordNumber) {
    const word = wordObj.word;
    const baseLetter = baseWord.word[letterIndex];
    const connectionLetterIndex = word.indexOf(baseLetter);
    
    if (connectionLetterIndex === -1) return false;
    
    // Определяем направление нового слова (перпендикулярное к базовому)
    const direction = baseWord.direction === 'horizontal' ? 'vertical' : 'horizontal';
    
    // Вычисляем позицию для нового слова
    let x, y;
    
    if (direction === 'horizontal') {
        x = baseWord.x - connectionLetterIndex;
        y = baseWord.y + letterIndex;
    } else {
        x = baseWord.x + letterIndex;
        y = baseWord.y - connectionLetterIndex;
    }
    
    // Проверяем, можно ли разместить слово в этой позиции
    if (canPlaceWord(word, {x, y}, direction)) {
        addWordToGrid(wordObj, {x, y}, direction, wordNumber);
        return true;
    }
    
    return false;
}

// Проверка возможности размещения слова
function canPlaceWord(word, position, direction) {
    const {x, y} = position;
    
    // Проверяем границы
    if (x < 0 || y < 0) return false;
    if (direction === 'horizontal' && x + word.length > crossword.size) return false;
    if (direction === 'vertical' && y + word.length > crossword.size) return false;
    
    for (let i = 0; i < word.length; i++) {
        const cellX = direction === 'horizontal' ? x + i : x;
        const cellY = direction === 'horizontal' ? y : y + i;
        
        // Если клетка уже занята другой буквой
        if (crossword.grid[cellY][cellX] !== null && 
            crossword.grid[cellY][cellX].correctLetter !== word[i]) {
            return false;
        }
    }
    
    return true;
}

// Отображение кроссворда (только клетки, в которые можно вводить слова)
function renderCrossword() {
    const grid = document.getElementById('crossword-grid');
    grid.innerHTML = '';
    
    // Находим границы активных клеток
    let minX = crossword.size, maxX = 0, minY = crossword.size, maxY = 0;
    
    for (let y = 0; y < crossword.size; y++) {
        for (let x = 0; x < crossword.size; x++) {
            if (crossword.grid[y][x] !== null) {
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            }
        }
    }
    
    // Добавляем небольшой отступ по краям
    minX = Math.max(0, minX - 1);
    maxX = Math.min(crossword.size - 1, maxX + 1);
    minY = Math.max(0, minY - 1);
    maxY = Math.min(crossword.size - 1, maxY + 1);
    
    // Создаем только видимые клетки
    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            const cell = document.createElement('div');
            cell.className = 'crossword-cell';
            
            if (crossword.grid[y][x] !== null) {
                const cellData = crossword.grid[y][x];
                
                // Показываем букву только если она была введена
                if (cellData.letter) {
                    cell.textContent = cellData.letter;
                    
                    // Подсвечиваем правильно/неправильно угаданные буквы
                    if (cellData.letter === cellData.correctLetter) {
                        cell.classList.add('correct');
                    } else {
                        cell.classList.add('incorrect');
                    }
                }
                
                cell.dataset.x = x;
                cell.dataset.y = y;
                
                cell.addEventListener('click', () => {
                    selectCell(x, y);
                });
            } else {
                // Пустая клетка, не являющаяся частью кроссворда
                cell.style.visibility = 'hidden';
            }
            
            grid.appendChild(cell);
        }
    }
    
    // Обновляем размеры сетки
    const cols = maxX - minX + 1;
    const rows = maxY - minY + 1;
    grid.style.gridTemplateColumns = `repeat(${cols}, 40px)`;
    grid.style.gridTemplateRows = `repeat(${rows}, 40px)`;
}

// Выбор клетки
function selectCell(x, y) {
    // Снимаем выделение с предыдущей клетки
    if (crossword.selectedCell) {
        const prevCell = document.querySelector(`.crossword-cell[data-x="${crossword.selectedCell.x}"][data-y="${crossword.selectedCell.y}"]`);
        if (prevCell) prevCell.classList.remove('highlight');
    }
    
    // Выделяем новую клетку только если она часть слова
    if (crossword.grid[y][x] !== null) {
        const cell = document.querySelector(`.crossword-cell[data-x="${x}"][data-y="${y}"]`);
        if (cell) {
            cell.classList.add('highlight');
            crossword.selectedCell = {x, y};
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
        
        key.addEventListener('click', () => {
            if (crossword.selectedCell) {
                const {x, y} = crossword.selectedCell;
                const cellData = crossword.grid[y][x];
                
                if (cellData) {
                    // Сохраняем букву в данных кроссворда
                    cellData.letter = russianLetters[i];
                    // Обновляем соответствующее слово
                    const wordInfo = crossword.words[cellData.wordIndex];
                    
                    // Перерисовываем кроссворд
                    renderCrossword();
                    // Повторно выделяем клетку
                    selectCell(x, y);
                    
                    // Проверяем завершение слова
                    checkWordCompletion(cellData.wordIndex);
                }
            }
        });
        
        keyboard.appendChild(key);
    }
    
    // Добавляем кнопку для очистки клетки
    const clearKey = document.createElement('button');
    clearKey.className = 'keyboard-key';
    clearKey.textContent = '⌫';
    clearKey.addEventListener('click', () => {
        if (crossword.selectedCell) {
            const {x, y} = crossword.selectedCell;
            const cellData = crossword.grid[y][x];
            
            if (cellData && cellData.letter) {
                // Очищаем букву
                cellData.letter = null;
                
                // Перерисовываем кроссворд
                renderCrossword();
                selectCell(x, y);
                
                // Снимаем отметку о завершении слова, если была
                crossword.words[cellData.wordIndex].completed = false;
            }
        }
    });
    keyboard.appendChild(clearKey);
    
    // Добавляем кнопку для показа определений
    const definitionsBtn = document.createElement('button');
    definitionsBtn.className = 'keyboard-key';
    definitionsBtn.textContent = '📖';
    definitionsBtn.style.width = '80px';
    definitionsBtn.addEventListener('click', showDefinitions);
    keyboard.appendChild(definitionsBtn);
    
    // Добавляем кнопку для подсказки
    const hintBtn = document.createElement('button');
    hintBtn.className = 'keyboard-key';
    hintBtn.textContent = 'Подсказка';
    hintBtn.style.width = '100px';
    hintBtn.addEventListener('click', giveHint);
    keyboard.appendChild(hintBtn);
}

// Проверка завершения слова
function checkWordCompletion(wordIndex) {
    const wordInfo = crossword.words[wordIndex];
    let completed = true;
    let correct = true;
    
    for (let i = 0; i < wordInfo.letters.length; i++) {
        const letterPos = wordInfo.letters[i];
        const cellData = crossword.grid[letterPos.y][letterPos.x];
        
        if (!cellData.letter) {
            completed = false;
            break;
        }
        
        if (cellData.letter !== cellData.correctLetter) {
            correct = false;
        }
    }
    
    if (completed) {
        wordInfo.completed = true;
        if (correct) {
            highlightWord(wordIndex, 'correct');
            setTimeout(() => {
                alert(`Поздравляем! Слово "${wordInfo.word}" угадано верно!`);
            }, 100);
        } else {
            highlightWord(wordIndex, 'incorrect');
        }
    }
}

// Подсветка всего слова
function highlightWord(wordIndex, className) {
    const wordInfo = crossword.words[wordIndex];
    
    for (const letterPos of wordInfo.letters) {
        const cell = document.querySelector(`.crossword-cell[data-x="${letterPos.x}"][data-y="${letterPos.y}"]`);
        if (cell) {
            cell.classList.add(className);
        }
    }
}

// Показать определения слов
function showDefinitions() {
    const definitionsBox = document.getElementById('definitions-box');
    const definitionsList = document.getElementById('definitions-list');
    
    definitionsList.innerHTML = '';
    
    crossword.definitions.forEach(def => {
        const div = document.createElement('div');
        div.className = 'definition-item';
        div.innerHTML = `<strong>${def.number}. (${def.direction}, ${def.length} букв):</strong> ${def.definition}`;
        definitionsList.appendChild(div);
    });
    
    definitionsBox.classList.remove('hidden');
    
    // Добавляем обработчик для закрытия
    definitionsBox.addEventListener('click', (e) => {
        if (e.target === definitionsBox || e.target.tagName === 'H3') {
            definitionsBox.classList.add('hidden');
        }
    });
}

// Дать подсказку
function giveHint() {
    if (crossword.hints <= 0) {
        alert('У вас больше нет подсказок!');
        return;
    }
    
    if (!crossword.selectedCell) {
        alert('Выберите клетку для подсказки');
        return;
    }
    
    const {x, y} = crossword.selectedCell;
    const cellData = crossword.grid[y][x];
    
    if (!cellData || cellData.letter) {
        alert('Выберите пустую клетку для подсказки');
        return;
    }
    
    // Показываем правильную букву
    cellData.letter = cellData.correctLetter;
    crossword.hints--;
    document.getElementById('hint-count').textContent = crossword.hints;
    
    // Перерисовываем кроссворд
    renderCrossword();
    selectCell(x, y);
    
    // Проверяем завершение слова
    checkWordCompletion(cellData.wordIndex);
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

// Обработчик для кнопки подсказки в заголовке
document.getElementById('hint-button').addEventListener('click', giveHint);