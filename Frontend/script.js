function generate(){
    generateCrossword();
    generateKeyboard();
}


// Переключение между страницами

document.getElementById('main-settings-button').addEventListener('click', () => {
    document.getElementById('main-page').classList.add('hidden');
    document.getElementById('settings-page').classList.remove('hidden');
    document.getElementById('settings-page').style.display = "flex";

});

document.getElementById('back-button').addEventListener('click', () => {
    document.getElementById('settings-page').classList.add('hidden');
    document.getElementById('main-page').classList.remove('hidden');
    document.getElementById('settings-page').style.display = "none";
});

document.getElementById('game-settings-button').addEventListener('click', () => { //Не сделано
    // document.getElementById('game-page').classList.add('hidden');
    document.getElementById('settings-page').classList.remove('hidden');
});

document.getElementsByClassName('old')[0].addEventListener('click', () => {
    // console.log("This element's classList contains old");
    document.getElementById('main-page').classList.add('hidden');
    document.getElementById('game-page-old').classList.remove('hidden');
    generate();

});

document.getElementsByClassName('new')[0].addEventListener('click', () => {
    // console.log("This element's classList contains new");
    document.getElementById('main-page').classList.add('hidden');
    document.getElementById('game-page-new').classList.remove('hidden');
    generate();
})


// Генерация кроссворда
function generateCrossword() {
    const grid = document.getElementById('crossword-grid');
    
}

// Генерация экранной клавиатуры
function generateKeyboard() {
    const keyboard = document.getElementById('keyboard');
    
}



// Обработка изменения размера шрифта
document.getElementById('font-size').addEventListener('change', (e) => {
    const size = e.target.value;
    if (size === 'small') {
        document.body.style.fontSize = '16px';
    } else if (size === 'medium') {
        document.body.style.fontSize = '18px';
    } else if (size === 'large') {
        document.body.style.fontSize = '20px';
    }
});

// Настройка темы (завершён)
document.getElementById('theme_sw').addEventListener('click', () => {
    if (document.body.classList.contains('dark-theme')) {
        document.body.classList.remove('dark-theme');
    } else{
        document.body.classList.add('dark-theme');
    }
})

// Настройка звука
document.addEventListener("DOMContentLoaded", () => {
    const volumeSlider = document.getElementById("volume-slider");
    const volumeLabel = document.getElementById("volume-label");

    function setVolume(value) {
        const volume = value / 100;
        volumeLabel.textContent = value + "%";
        
        const audioElement = document.querySelector("audio");
        if (audioElement) {
            audioElement.volume = volume;
        }
    }

    volumeSlider.addEventListener("input", (event) => {
        setVolume(event.target.value);
    });

    setVolume(volumeSlider.value);
});

// Загрузка цитаты дня (завершён)
const quotes = [
    "Война — это мир. Свобода — это рабство. Незнание — сила.",
    "Сообщите о всех подозрительных действиях.",
    "Реальность существует в человеческом сознании и нигде больше.",    
    "Мы не просто уничтожаем наших врагов — мы меняем их.",
    "Мы знаем, что никто не захватывает власть с намерением отказаться от неё.",
    "Пролетарии и животные свободны.",
    "Кто управляет прошлым, тот управляет будущим. Кто управляет настоящим, тот управляет прошлым.",
    "Старший Брат наблюдает за тобой. Всегда.",
    "Не человек управляет государством, а государство управляет человеком.",
    "Если ты хочешь представить себе будущее, представь сапог, топчущий человеческое лицо — вечно.",
    "Мы контролируем жизнь на всех её уровнях.",
    "Правда — это то, что говорит Партия."
];

document.getElementById('daily-quote').textContent = quotes[Math.floor(Math.random() * quotes.length)];