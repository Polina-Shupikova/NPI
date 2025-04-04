let userProgress = {
  userId: null,
  level: 1
};

function getTelegramUserId() {
  if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
    return Telegram.WebApp.initDataUnsafe.user.id;
  }
  console.log("Telegram WebApp не обнаружен, используется локальный режим");
  return null;
}

async function loadUserProgress() {
  const userId = getTelegramUserId();
  userProgress.userId = userId;

  if (userId && window.Telegram?.WebApp) {
    const key = `user_level_${userId}`;
    try {
      return new Promise((resolve) => {
        Telegram.WebApp.CloudStorage.getItem(key, (error, value) => {
          if (error || !value) {
            console.warn("Прогресс не найден в CloudStorage, проверяем localStorage");
            const localProgress = localStorage.getItem('crossword_user_progress');
            const level = localProgress ? JSON.parse(localProgress).level : 1;
            userProgress.level = level;
            resolve(userProgress);
          } else {
            userProgress.level = parseInt(value);
            localStorage.setItem('crossword_user_progress', JSON.stringify(userProgress));
            console.log(`Прогресс загружен из CloudStorage: уровень ${userProgress.level}`);
            resolve(userProgress);
          }
        });
      });
    } catch (error) {
      console.error("Ошибка загрузки из CloudStorage:", error);
      const localProgress = localStorage.getItem('crossword_user_progress');
      userProgress.level = localProgress ? JSON.parse(localProgress).level : 1;
      return userProgress;
    }
  } else {
    const localProgress = localStorage.getItem('crossword_user_progress');
    userProgress.level = localProgress ? JSON.parse(localProgress).level : 1;
    return userProgress;
  }
}

async function saveUserProgress(level) {
  userProgress.level = level;
  localStorage.setItem('crossword_user_progress', JSON.stringify(userProgress));

  if (userProgress.userId && window.Telegram?.WebApp) {
    const key = `user_level_${userProgress.userId}`;
    return new Promise((resolve) => {
      Telegram.WebApp.CloudStorage.setItem(key, String(level), (error) => {
        if (error) {
          console.error("Ошибка сохранения в CloudStorage:", error);
          resolve(false);
        } else {
          console.log(`Прогресс сохранен в CloudStorage: уровень ${level}`);
          resolve(true);
        }
      });
    });
  }
  console.log(`Прогресс сохранен локально: уровень ${level}`);
  return true;
}

window.addEventListener('message', async (event) => {
  if (event.data.type === 'SAVE_PROGRESS') {
    const level = event.data.level;
    const success = await saveUserProgress(level);
    if (event.source.postMessage) {
      event.source.postMessage({
        type: 'PROGRESS_SAVED',
        success
      }, event.origin);
    }
  }
});

function include() {
  var js = document.createElement("script");

  js.type = "text/javascript";
  js.src = "../getpost_data.js";

  document.body.appendChild(js);
}
  
  // Навешиваем обработчики изменений
  document.getElementById('theme_sw').addEventListener('change', saveSettings);
  document.getElementById('volume-slider').addEventListener('input', saveSettings);
  document.getElementById('font-size').addEventListener('change', saveSettings);
  
  // Для громкости также обновляем label
  document.getElementById('volume-slider').addEventListener('input', function() {
    document.getElementById('volume-label').textContent = this.value + '%';
  });


  document.getElementById("background-music").volume = document.getElementById("volume-slider").value / 100;

async function saveSettings() {
  // Собираем текущие настройки из UI
  const settings = {
    Settings: {
      theme: document.getElementById('theme_sw').checked ? 'dark' : 'light',
      volume: parseInt(document.getElementById('volume-slider').value),
      fontSize: document.getElementById('font-size').value
    }
  };

  try {
    // В реальном приложении здесь должен быть fetch с методом POST для сохранения на сервер
    // Но так как у нас нет сервера, будем сохранять в localStorage
    localStorage.setItem('crosswordSettings', JSON.stringify(settings));
    console.log("Настройки сохранены в localStorage:", settings);
    
    // В реальном приложении:
    // const response = await fetch('jsons/settings.json', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(settings)
    // });
    
    // if (!response.ok) {
    //   throw new Error(`Ошибка сохранения: ${response.status}`);
    // }
    
    return true;
  } catch (error) {
    console.error("Ошибка при сохранении настроек:", error);
    return false;
  }
}

// Функция для загрузки настроек
async function loadSettings() {
  try {
    // Пытаемся загрузить из localStorage
    const savedSettings = localStorage.getItem('crosswordSettings');
    
    if (savedSettings) {
      const settings = JSON.parse(savedSettings).Settings;
      console.log("Настройки загружены из localStorage:", settings);

      // Применяем настройки к интерфейсу
      document.getElementById('theme_sw').checked = settings.theme === 'dark';
      document.body.classList.toggle('dark-theme', settings.theme === 'dark');
      
      document.getElementById('volume-slider').value = settings.volume;
      document.getElementById('volume-label').textContent = settings.volume + '%';
      
      document.getElementById('font-size').value = settings.fontSize;
      applyFontSize(settings.fontSize);
      
      return settings;
    }
    
    // Если в localStorage нет, пробуем загрузить с сервера (в реальном приложении)
    // const response = await fetch('jsons/settings.json');
    // if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    // const settings = (await response.json()).Settings;
    
    return null;
  } catch (error) {
    console.error("Ошибка загрузки настроек:", error);
    return null;
  }
}

// Применение размера шрифта
function applyFontSize(size) {
  if (size === 'small') {
    document.body.style.fontSize = '16px';
  } else if (size === 'medium') {
    document.body.style.fontSize = '18px';
  } else if (size === 'large') {
    document.body.style.fontSize = '20px';
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

document.getElementsByClassName('old')[0].addEventListener('click', () => {
    // console.log("This element's classList contains old");
    document.getElementById('main-page').classList.add('hidden');
    document.getElementById('game-page-old').classList.remove('hidden');
    // generate();

});

document.getElementsByClassName('new')[0].addEventListener('click', () => {
    // console.log("This element's classList contains new");
    document.getElementById('main-page').classList.add('hidden');
    document.getElementById('game-page-new').classList.remove('hidden');
    // generate();
})




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
        
        // const audioElement = document.querySelector("audio");
        const audioElement = document.getElementById("background-music")
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


// function to_old(){
//     document.location.href = 'pages/NEW/index.html';
// }