async function loadSettings() {
  try {
    const response = await fetch('jsons/settings.json'); // Путь относительно HTML-файла
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    let settings = await response.json();
    settings = settings["Settings"];
    console.log("Настройки загружены:", settings);

    if (settings.theme == 'light') {
        document.getElementById('theme_sw').checked = false;
        document.body.classList.remove('dark-theme');
    } else {
        document.getElementById('theme_sw').checked = true;
        document.body.classList.add('dark-theme');
    }

    document.getElementById('volume-slider').value = settings.volume;
    document.getElementById('volume-label').textContent = settings.volume + '%';
    document.getElementById('font-size').value = settings.fontSize;
    
    return settings;
  } catch (error) {
    console.error("Ошибка загрузки JSON:", error);
    return null;
  }
}

loadSettings();

async function saveSettings() {
  // Собираем текущие настройки из UI
  let settings = {
    Settings: {
      theme: document.getElementById('theme_sw').checked ? 'dark' : 'light',
      volume: parseInt(document.getElementById('volume-slider').value),
      fontSize: document.getElementById('font-size').value
    }
  };

  settings = JSON.stringify(settings);

  console.log("Сохранение настроек:", settings);

  try {
    const response = await fetch('jsons/settings.json');

    if (!response.ok) {
      throw new Error(`Ошибка сохранения: ${response.status}`);
    }
    console.log("Настройки успешно сохранены на сервере");
  } catch (error) {
    console.error("Ошибка при сохранении на сервер:", error);
  }
}




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

// document.getElementById('game-settings-button').addEventListener('click', () => { //Не сделано
//     // document.getElementById('game-page').classList.add('hidden');
//     document.getElementById('settings-page').classList.remove('hidden');
// });

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
    saveSettings();
});

// Настройка темы (завершён)
document.getElementById('theme_sw').addEventListener('click', () => {
    if (document.body.classList.contains('dark-theme')) {
        document.body.classList.remove('dark-theme');
    } else{
        document.body.classList.add('dark-theme');
    }
    saveSettings();
})

// Настройка звука
document.addEventListener("DOMContentLoaded", () => {
    const volumeSlider = document.getElementById("volume-slider");
    const volumeLabel = document.getElementById("volume-label");

    function setVolume(value) {

        let x = (Math.random() - 0.5) * 4;
        let y = (Math.random() - 0.5) * 4;
        // volumeSlider.style.transform = `translate(${x}px, ${y}px)`;
        volumeLabel.style.transform = `translate(${y}px, ${x}px)`;

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

    saveSettings();
});

// Загрузка цитаты дня (завершён)
const quotes = [
    // "Война — это мир. Свобода — это рабство. Незнание — сила.",
    // "Сообщите о всех подозрительных действиях.",
    // "Мы знаем, что никто не захватывает власть с намерением отказаться от неё.",
    // "Старший Брат наблюдает за тобой. Всегда.",
    // "Мы контролируем жизнь на всех её уровнях.",
    // "Правда — это то, что говорит Партия."
    "Реальность существует в человеческом сознании и нигде больше.",    
    "Мы не просто уничтожаем наших врагов — мы меняем их.",
    "Пролетарии и животные свободны.",
    "Кто управляет прошлым, тот управляет будущим. Кто управляет настоящим, тот управляет прошлым.",
    "Не человек управляет государством, а государство управляет человеком.",
    "Если ты хочешь представить себе будущее, представь сапог, топчущий человеческое лицо — вечно.",
    "Труд сделал из обезьяны человека.",
    "Жизнь дается один раз, и ее нужно прожить так, чтобы не было мучительно больно за бесцельно прожитые годы.",
    "Тот, кто не работает, тот не ест.",
    "Учиться, учиться и еще раз учиться!",
    "Кто хочет — ищет возможности, кто не хочет — ищет причины.",
    "Дорогу осилит идущий.",
    "Человек человеку — друг, товарищ и брат.",
    "Работа не волк — в лес не убежит.",
    "Лучше меньше, да лучше.",
    "Смелость города берет.",
    "Жить стало лучше, жить стало веселее.",
    "Никогда не сдавайся без боя.",
    "Нет такой крепости, которую не могли бы взять большевики!",
    "Главное — вовремя остановиться.",
    "Мы рождены, чтобы сказку сделать былью.",
    "Работать надо так, чтобы не осталось времени на глупости.",
    "Чем больше делаешь, тем больше успеваешь.",
    "Тот, кто идёт вперёд, всегда столкнётся с трудностями, но дорога под силу идущему.",
    "Секрет успеха — в труде и настойчивости.",
    "Каждый новый день — это шанс стать лучше, чем вчера.",
    "Кто хочет — ищет возможности, кто не хочет — ищет причины.",
    "Будущее создаётся сегодня.",
    "Жизнь награждает тех, кто не боится идти вперёд.",
    "Мечты становятся реальностью, если подкреплены делом.",
    "Нет недостижимых целей, есть недостаточно сильное желание."

];
    


document.getElementById('daily-quote').textContent = quotes[Math.floor(Math.random() * quotes.length)];

// const slider = document.getElementById("volume-slider");
// function shake() {
//     let x = (Math.random() - 0.5) * 4; // Дрожание в пределах ±2px
//     let y = (Math.random() - 0.5) * 4;
//     slider.style.transform = `translate(${x}px, ${y}px)`;
// }

// setInterval(shake, 50); // Меняем позицию каждые 50 мс
