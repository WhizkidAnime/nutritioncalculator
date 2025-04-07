// Ожидание полной загрузки DOM перед выполнением скрипта
document.addEventListener('DOMContentLoaded', () => {
    // --- Элементы для переключения темы ---
    const lightThemeBtn = document.getElementById('light-theme-btn');
    const darkThemeBtn = document.getElementById('dark-theme-btn');
    
    // --- Переменная для хранения элемента, открывшего модальное окно ---
    let modalTriggerElement = null;

    // --- Вспомогательные функции для управления фокусом в модальных окнах ---

    // Получить все фокусируемые элементы внутри контейнера
    function getFocusableElements(container) {
      return Array.from(
        container.querySelectorAll(
          'button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter(el => !el.disabled && el.offsetWidth > 0 && el.offsetHeight > 0); // Check visibility and enabled
    }

    // Ловушка фокуса внутри модального окна
    function trapFocus(modalElement, event) {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements(modalElement);
      if (focusableElements.length === 0) {
          event.preventDefault(); // Prevent tabbing out if nothing focusable
          return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) { // Shift + Tab
        // Если фокус на первом элементе, переместить на последний
        if (document.activeElement === firstElement) {
          lastElement.focus();
          event.preventDefault();
        }
      } else { // Tab
        // Если фокус на последнем элементе, переместить на первый
        if (document.activeElement === lastElement) {
          firstElement.focus();
          event.preventDefault();
        }
      }
    }

    // Функция для открытия модального окна с управлением фокусом
    function openModal(modalElement) {
        if (!modalElement) return;
        modalTriggerElement = document.activeElement; // Сохраняем элемент, который вызвал модалку

        modalElement.classList.add('show');
        // Устанавливаем aria-атрибуты для доступности
        modalElement.setAttribute('aria-hidden', 'false');

        requestAnimationFrame(() => {
            modalElement.classList.add('visible');

            // Находим первый фокусируемый элемент или кнопку закрытия/действия
            const focusableElements = getFocusableElements(modalElement);
            // Приоритет: кнопка подтверждения (danger), OK (primary), Отмена (secondary), любая другая кнопка, первый фокусируемый
            const focusTarget =
                modalElement.querySelector('.btn-danger') ||
                modalElement.querySelector('#modal-ok-btn') || // Кнопка OK в модалке уведомления
                modalElement.querySelector('.btn-primary') || // Кнопки OK, Info Close
                modalElement.querySelector('.btn-secondary') || // Кнопка Cancel
                modalElement.querySelector('.btn') || // Любая другая кнопка
                (focusableElements.length > 0 ? focusableElements[0] : null); // Первый интерактивный элемент

            if (focusTarget) {
                focusTarget.focus();
            }

            // Добавляем слушатель для ловушки фокуса
            modalElement.focusTrapListener = (e) => trapFocus(modalElement, e);
            modalElement.addEventListener('keydown', modalElement.focusTrapListener);
        });
    }

    // Функция для закрытия модального окна с возвратом фокуса
    function closeModal(modalElement) {
        if (!modalElement) return;

        modalElement.classList.remove('visible');
        modalElement.setAttribute('aria-hidden', 'true');

        // Удаляем слушатель ловушки фокуса
        if (modalElement.focusTrapListener) {
            modalElement.removeEventListener('keydown', modalElement.focusTrapListener);
            delete modalElement.focusTrapListener; // Удаляем ссылку на функцию
        }

        setTimeout(() => {
            modalElement.classList.remove('show');

            // Возвращаем фокус на элемент, который открыл модальное окно
            if (modalTriggerElement) {
                modalTriggerElement.focus();
                modalTriggerElement = null; // Очищаем сохраненный элемент
            }
        }, 200); // Соответствует времени анимации CSS
    }

    // --- Обработка скролла для title-container ---
    const titleContainer = document.querySelector('.title-container');
    let ticking = false;
    let lastScrollY = 0;

    // Функция для обработки скролла и управления прозрачностью title-container
    function handleScroll() {
        const scrollY = window.scrollY;
        
        // Если прокрутка больше 50px, добавляем класс fixed
        if (scrollY > 50 && titleContainer) {
            titleContainer.classList.add('fixed');
        } else if (titleContainer) {
            titleContainer.classList.remove('fixed');
        }
        
        lastScrollY = scrollY;
        ticking = false;
    }

    // Добавляем слушатель события скролла с использованием requestAnimationFrame
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                handleScroll();
                ticking = false;
            });
            ticking = true;
        }
    });

    // Запускаем обработчик единожды при загрузке страницы
    handleScroll();

    // Обновляем состояние при изменении размера окна
    window.addEventListener('resize', () => {
        handleScroll();
    });

    // --- Функции для темы ---

    // Устанавливает тему: применяет класс к body, сохраняет в localStorage, обновляет кнопки
    function setTheme(themeName) {
        localStorage.setItem('appTheme', themeName);
        document.body.className = `theme-${themeName}`; // Устанавливаем класс темы

        // Обновляем состояние кнопок
        if (lightThemeBtn) lightThemeBtn.classList.toggle('active-theme', themeName === 'light');
        if (darkThemeBtn) darkThemeBtn.classList.toggle('active-theme', themeName === 'dark');

        // Обновляем title кнопок темы
        if (lightThemeBtn) lightThemeBtn.title = getTranslation('Светлая тема (GB)');
        if (darkThemeBtn) darkThemeBtn.title = getTranslation('Тёмная тема (GBP)');
    }

    // Загружает и применяет сохраненную тему или устанавливает светлую по умолчанию
    function loadTheme() {
        const savedTheme = localStorage.getItem('appTheme') || 'light'; // По умолчанию светлая
        setTheme(savedTheme);
    }

    // --- Обработчики для кнопок темы ---
    if (lightThemeBtn) {
        lightThemeBtn.addEventListener('click', () => setTheme('light'));
    }
    if (darkThemeBtn) {
        darkThemeBtn.addEventListener('click', () => setTheme('dark'));
    }

    // --- Словари для многоязычности --- //
    const TRANSLATIONS = {
        ru: {
            // Заголовки
            'GAMEBOY NUTRITION RPG': 'GAMEBOY NUTRITION RPG',
            'НАСТРОЙКА КВЕСТА': 'QUEST SETTINGS',
            'НОВАЯ ДОБЫЧА': 'NEW ITEM',
            'ХАРАКТЕРИСТИКИ ГЕРОЯ': 'HERO STATS',
            'ЖУРНАЛ ПРИКЛЮЧЕНИЙ': 'ADVENTURE LOG',
            // Поля ввода и подписи
            'Калории (ккал):': 'Calories (kcal):',
            'Белки (г):': 'Protein (g):',
            'Жиры (г):': 'Fat (g):',
            'Углеводы (г):': 'Carbs (g):',
            'Название продукта:': 'Product name:',
            'Белки на 100г:': 'Protein per 100g:',
            'Жиры на 100г:': 'Fat per 100g:',
            'Углеводы на 100г:': 'Carbs per 100g:',
            'Вес продукта (г):': 'Product weight (g):',
            // Кнопки
            'СОХРАНИТЬ ИГРУ': 'SAVE GAME',
            'СБРОСИТЬ ИГРУ': 'RESET GAME',
            'СОБРАТЬ ПРЕДМЕТ': 'COLLECT ITEM',
            'НОВЫЙ УРОВЕНЬ': 'NEW LEVEL',
            'ЭКСПОРТ': 'EXPORT',
            // Статус
            'Собрано:': 'Collected:',
            'До цели:': 'Goal:',
            // Таблица истории
            'НАЗВАНИЕ': 'NAME',
            'БЕЛКИ (Г)': 'PROTEIN (G)',
            'ЖИРЫ (Г)': 'FAT (G)',
            'УГЛЕВОДЫ (Г)': 'CARBS (G)',
            'КАЛОРИИ (ККАЛ)': 'CALORIES (KCAL)',
            'ДАТА': 'DATE',
            'ВРЕМЯ': 'TIME',
            'ДЕЙСТВИЕ': 'ACTION',
            'Поиск по названию:': 'Search by name:',
            'Введите название продукта...': 'Enter product name...',
            'ВЕС (Г)': 'WEIGHT (G)', // Добавляем перевод для веса
            // Навигация по датам
            'ПРЕДЫДУЩИЙ ДЕНЬ': 'PREVIOUS DAY',
            'СЛЕДУЮЩИЙ ДЕНЬ': 'NEXT DAY',
            'ПОКАЗАТЬ ВСЕ ДНИ': 'SHOW ALL DAYS', // title для 🌐
            // Единицы измерения и т.д.
            'ккал': 'kcal',
            'кг': 'kg', // Добавляем единицу веса
            'г': 'g',
            'N/A': 'N/A',
            // Новые переводы для секции веса
            'СТАТИСТИКА ПЕРСОНАЖА': 'CHARACTER STATS',
            'Текущий вес (кг):': 'Current weight (kg):',
            'Например, 75.5': 'F.e., 75.5',
            'Дата замера:': 'Measurement date:',
            'СОХРАНИТЬ ВЕС': 'SAVE WEIGHT',
            'ЗАПИСАТЬ ВЕС! ПАРАМЕТРЫ ОБНОВЛЕНЫ.': 'RECORD WEIGHT! PARAMETERS UPDATED.',
            'ИСТОРИЯ ВЕСА': 'WEIGHT HISTORY',
            'ДАТА ЗАМЕРА': 'MEASUREMENT DATE',
            'ВЕС (КГ)': 'WEIGHT (KG)',
            'Пожалуйста, введите корректный вес (положительное число).': 'Please enter a valid weight (positive number).',
            'Пожалуйста, выберите дату замера.': 'Please select a measurement date.',
            'Вес успешно сохранен!': 'Weight saved successfully!',
            'Запись о весе удалена.': 'Weight entry deleted.',
            'Вы уверены, что хотите удалить эту запись о весе?': 'Are you sure you want to delete this weight entry?',
            // Уведомления
            'Для сохранения необходимо ввести калории и минимум два из трёх макронутриентов (БЖУ)': 'To save, you need to enter calories and at least two out of three macronutrients (PFC)',
            'Лимиты сохранены!': 'Limits saved!',
            'Вы уверены, что хотите очистить все установленные лимиты? Съеденные продукты останутся в истории.': 'Are you sure you want to clear all set limits? Consumed food will remain in history.',
            'Лимиты успешно очищены.': 'Limits successfully cleared.',
            'Вы уверены, что хотите сбросить счетчики текущего дня? История сохранится.': 'Are you sure you want to reset the counters for the current day? History will be preserved.',
            'Счетчики текущего дня успешно сброшены!': 'Current day counters successfully reset!',
            'Вы уверены, что хотите удалить эту запись из истории?': 'Are you sure you want to delete this entry from history?',
            'Запись удалена.': 'Entry deleted.',
            'История приема пищи пуста. Нечего экспортировать.': 'Food intake history is empty. Nothing to export.',
            'Не удалось сохранить данные. Возможно, хранилище переполнено.': 'Failed to save data. The storage may be full.',
            'Пожалуйста, введите корректные значения БЖУ на 100г (неотрицательные числа).': 'Please enter valid PFC values per 100g (non-negative numbers).',
            'Пожалуйста, введите корректный вес продукта (положительное число больше 0).': 'Please enter a valid product weight (positive number greater than 0).',
            // Кнопки title
            'СМЕНИТЬ ЯЗЫК': 'CHANGE LANGUAGE',
            'РУССКИЙ': 'Russian', // Для title кнопки RU
            'ENGLISH': 'English', // Для title кнопки EN
            'ИНФОРМАЦИЯ О КВЕСТЕ': 'QUEST INFORMATION',
            'СОХРАНИТЬ ПРОГРЕСС! ЛИМИТЫ ЗАПИСАНЫ.': 'SAVE PROGRESS! LIMITS RECORDED.',
            'ВНИМАНИЕ! ВЕСЬ ПРОГРЕСС СБРОШЕН.': 'ATTENTION! ALL PROGRESS RESET.',
            'ПРЕДМЕТ ДОБЫТ! +ОПЫТ': 'ITEM OBTAINED! +EXP',
            'ИГРОК ОТДОХНУЛ. СЧЁТЧИКИ ОБНУЛЕНЫ.': 'PLAYER RESTED. COUNTERS RESET.',
            'СОХРАНИТЬ ЖУРНАЛ ПРИКЛЮЧЕНИЙ': 'SAVE ADVENTURE LOG',
            'ПРЕДМЕТ УНИЧТОЖЕН!': 'ITEM DESTROYED!',
            'ПОДТВЕРДИТЬ ВЫБОР': 'CONFIRM SELECTION',
            'ОТМЕНИТЬ ДЕЙСТВИЕ': 'CANCEL ACTION',
            'ПРИНЯТЬ ИНФОРМАЦИЮ': 'ACCEPT INFORMATION',
            'ЗАКРЫТЬ РУКОВОДСТВО': 'CLOSE GUIDE',
            'ПОКАЗАТЬ ВСЕ ДНИ': 'SHOW ALL DAYS', // title для 🌐
            // Единицы измерения и т.д.
            'ккал': 'kcal',
            'г': 'g',
            'N/A': 'N/A',
            'На дату %DATE% нет записей.': 'No entries for date %DATE%.', // Добавляем перевод с плейсхолдером
            'Удалить запись о весе': 'Delete weight entry', // Добавлено для кнопки удаления веса
            'Цель:': 'Goal:',
            'Отслеживай еду и вес в стиле RPG. Балансируй КБЖУ, контролируй вес.': 'Track food and weight RPG-style. Balance macros, control weight.',
            'Секции:': 'Sections:',
            'Ввод и история веса.': 'Weight input and history.',
            'Установка дневных лимитов КБЖУ. Пусто = без лимита.': 'Set daily macro limits. Empty = no limit.',
            'Добавление съеденной еды (БЖУ на 100г и вес).': 'Add eaten food (macros per 100g and weight).',
            'Итоги за день и сколько осталось до лимита.': 'Daily totals and remaining to limit.',
            'История съеденной еды. Фильтр по дате и поиск.': 'History of eaten food. Filter by date and search.',
            'Действия:': 'Actions:',
            'Записать текущий вес и дату.': 'Record current weight and date.',
            'Сохранить лимиты КБЖУ.': 'Save macro limits.',
            'Удалить лимиты КБЖУ.': 'Clear macro limits.',
            'Сбросить счетчики *текущего* дня (история останется).': 'Reset *current* day counters (history remains).',
            'Скачать журнал еды в CSV.': 'Download food log as CSV.',
            'Навигация по дням в журнале еды.': 'Navigate by day in the food log.',
            'Показать всю историю еды.': 'Show all food history.',
            'Удалить запись о весе.': 'Delete weight entry.',
            'Удалить запись о еде.': 'Delete food entry.',
            'Переключить язык.': 'Switch language.',
            'Открыть этот гайд.': 'Open this guide.',
            'Прогресс сохраняется в браузере.': 'Progress is saved in the browser.',
            'Не удалось сохранить данные. Возможно, хранилище переполнено.': 'Failed to save data. The storage may be full.',
            'Для самого точного результата взвешивайтесь утром натощак, сразу после пробуждения и посещения туалета.': 'For the most accurate result, weigh yourself in the morning on an empty stomach, right after waking up and using the restroom.',
            'Светлая тема (GB)': 'Light Theme (GB)', // Добавляем перевод
            'Тёмная тема (GBP)': 'Dark Theme (GBP)', // Добавляем перевод
            
            // НАЧАЛО НОВЫХ ПЕРЕВОДОВ ДЛЯ СТРАНИЦЫ WELCOME
            'СОЗДАНИЕ ПЕРСОНАЖА': 'CHARACTER CREATION',
            'ВЫБЕРИ ЦЕЛЬ': 'CHOOSE YOUR GOAL',
            'ПОХУДЕНИЕ': 'WEIGHT LOSS',
            'НАБОР МАССЫ': 'MUSCLE GAIN',
            'ПОДДЕРЖАНИЕ': 'MAINTENANCE',
            'ТВОИ ПАРАМЕТРЫ': 'YOUR PARAMETERS',
            'Пол:': 'Gender:',
            'МУЖСКОЙ': 'MALE',
            'ЖЕНСКИЙ': 'FEMALE',
            'Возраст:': 'Age:',
            'Рост:': 'Height:',
            'Вес:': 'Weight:',
            'Вес (кг):': 'Weight (kg):',
            'Активность:': 'Activity:',
            'РАССЧИТАТЬ': 'CALCULATE',
            'РЕЗУЛЬТАТЫ РАСЧЕТА': 'CALCULATION RESULTS',
            'ТВОЯ ДНЕВНАЯ НОРМА': 'YOUR DAILY INTAKE',
            'РЕКОМЕНДУЕМЫЕ БЖУ': 'RECOMMENDED MACROS',
            'СОВЕТЫ': 'TIPS',
            'НАЧАТЬ ПРИКЛЮЧЕНИЕ': 'START ADVENTURE',
            'ПЕРЕСЧИТАТЬ': 'RECALCULATE',
            'ПЕРЕСОЗДАТЬ': 'RECREATE',
            'ВЕРНУТЬСЯ К СОЗДАНИЮ ПЕРСОНАЖА': 'RETURN TO CHARACTER CREATION',
            'Малоподвижный': 'Sedentary',
            'Легкая активность': 'Light activity',
            'Умеренная активность': 'Moderate activity',
            'Высокая активность': 'High activity',
            'Очень высокая активность': 'Very high activity',
            'Лет': 'Years',
            'см': 'cm',
            'кг': 'kg',
            
            // Советы по похудению
            'СОВЕТЫ ПО ПОХУДЕНИЮ': 'WEIGHT LOSS TIPS',
            'Ешь больше белка, чтобы сохранить мышцы': 'Eat more protein to preserve muscle',
            'Избегай простых углеводов и сахара': 'Avoid simple carbs and sugar',
            'Пей много воды (2-3 литра в день)': 'Drink plenty of water (2-3 liters per day)',
            'Добавь кардио тренировки 3-4 раза в неделю': 'Add cardio workouts 3-4 times per week',
            'Не голодай - снижай калории постепенно': 'Don\'t starve - reduce calories gradually',
            'Старайся спать 7-8 часов для нормализации гормонов': 'Try to sleep 7-8 hours to normalize hormones',
            
            // Советы по набору массы
            'СОВЕТЫ ПО НАБОРУ МАССЫ': 'MUSCLE GAIN TIPS',
            'Ешь регулярно, 4-6 приемов пищи в день': 'Eat regularly, 4-6 meals per day',
            'Увеличь потребление сложных углеводов': 'Increase complex carbohydrate intake',
            'Добавь силовые тренировки 3-5 раз в неделю': 'Add strength training 3-5 times per week',
            'Употребляй белок через 30-60 минут после тренировки': 'Consume protein 30-60 minutes after workout',
            'Не забывай о полезных жирах (орехи, авокадо, рыба)': 'Don\'t forget about healthy fats (nuts, avocado, fish)',
            'Отслеживай прогресс и корректируй питание по необходимости': 'Track progress and adjust nutrition as needed',
            
            // Советы по поддержанию
            'СОВЕТЫ ПО ПОДДЕРЖАНИЮ ВЕСА': 'WEIGHT MAINTENANCE TIPS',
            'Сбалансируй потребление калорий и физическую активность': 'Balance calorie intake and physical activity',
            'Поддерживай регулярный режим питания': 'Maintain a regular eating schedule',
            'Чередуй силовые и кардио тренировки': 'Alternate strength and cardio workouts',
            'Следи за размером порций': 'Monitor portion sizes',
            'Регулярно взвешивайся для контроля': 'Weigh yourself regularly for control',
            'Включай в рацион разнообразные продукты': 'Include a variety of foods in your diet',
            
            // Общие советы
            'ОБЩИЕ СОВЕТЫ': 'GENERAL ADVICE',
            'Пей достаточно воды': 'Drink enough water',
            'Ешь больше овощей и фруктов': 'Eat more vegetables and fruits',
            'Ограничь потребление ультра-обработанных продуктов': 'Limit ultra-processed foods',
            'Регулярно занимайся спортом': 'Exercise regularly',
            'Следи за качеством сна': 'Monitor sleep quality',
            
            // Текст руководства для welcome.html
            'Начало пути:': 'Starting point:',
            'Создай своего персонажа, выбери цель и введи параметры для расчета нормы калорий.': 'Create your character, choose a goal and enter parameters to calculate calorie norm.',
            'Цели:': 'Goals:',
            'сжигай жир, сохраняй мышцы.': 'burn fat, preserve muscle.',
            'наращивай мышцы и силу.': 'build muscle and strength.',
            'сохраняй текущий вес.': 'maintain current weight.',
            'Параметры:': 'Parameters:',
            'влияет на базовый обмен веществ.': 'affects basal metabolism.',
            'с возрастом меняется метаболизм.': 'metabolism changes with age.',
            'основа для расчета нормы.': 'basis for calculation.',
            'учитывает ежедневные затраты энергии.': 'accounts for daily energy expenditure.',
            'После расчета:': 'After calculation:',
            'Получи персональные рекомендации и нажми "НАЧАТЬ ПРИКЛЮЧЕНИЕ" для перехода к трекеру питания.': 'Get personalized recommendations and press "START ADVENTURE" to proceed to the nutrition tracker.',
            
            // ОБНОВЛЕННЫЕ ПЕРЕВОДЫ ДЛЯ СТРАНИЦЫ WELCOME
            'КАЛЬКУЛЯТОР КАЛОРИЙ': 'CALORIE CALCULATOR',
            'СОЗДАНИЕ ПЕРСОНАЖА': 'CHARACTER CREATION',
            'ВЫБЕРИТЕ ЦЕЛЬ:': 'SELECT GOAL:',
            'ПОХУДЕНИЕ': 'WEIGHT LOSS',
            'ПОДДЕРЖАНИЕ': 'MAINTENANCE',
            'НАБОР МАССЫ': 'MUSCLE GAIN',
            'ПОЛ:': 'GENDER:',
            'МУЖСКОЙ': 'MALE',
            'ЖЕНСКИЙ': 'FEMALE',
            'ВОЗРАСТ:': 'AGE:',
            'РОСТ:': 'HEIGHT:',
            'ВЕС:': 'WEIGHT:',
            'АКТИВНОСТЬ:': 'ACTIVITY:',
            'МИНИМАЛЬНАЯ (СИДЯЧАЯ РАБОТА, НЕТ ТРЕНИРОВОК)': 'MINIMAL (SEDENTARY, NO WORKOUTS)',
            'НИЗКАЯ (ТРЕНИРОВКИ 1-3 РАЗА В НЕДЕЛЮ)': 'LOW (WORKOUTS 1-3 TIMES A WEEK)',
            'СРЕДНЯЯ (ТРЕНИРОВКИ 3-5 РАЗ В НЕДЕЛЮ)': 'MODERATE (WORKOUTS 3-5 TIMES A WEEK)',
            'ВЫСОКАЯ (ТРЕНИРОВКИ 6-7 РАЗ В НЕДЕЛЮ)': 'HIGH (WORKOUTS 6-7 TIMES A WEEK)',
            'ОЧЕНЬ ВЫСОКАЯ (СПОРТСМЕН, ФИЗИЧЕСКАЯ РАБОТА)': 'VERY HIGH (ATHLETE, PHYSICAL WORK)',
            'РАССЧИТАТЬ': 'CALCULATE',
            'ЛЕТ': 'YEARS',
            'СМ': 'CM',
            'КГ': 'KG',
            'ВАШИ РЕЗУЛЬТАТЫ': 'YOUR RESULTS',
            'ДНЕВНАЯ НОРМА КАЛОРИЙ:': 'DAILY CALORIE INTAKE:',
            'ККАЛ': 'KCAL',
            'РЕКОМЕНДУЕМЫЕ БЖУ:': 'RECOMMENDED MACROS:',
            'БЕЛКИ:': 'PROTEIN:',
            'ЖИРЫ:': 'FAT:',
            'УГЛЕВОДЫ:': 'CARBS:',
            'Г': 'G',
            'СОВЕТЫ ПО ВАШЕЙ ЦЕЛИ:': 'ADVICE FOR YOUR GOAL:',
            'ПЕРЕСЧИТАТЬ': 'RECALCULATE',
            'ИСПОЛЬЗОВАТЬ КАЛЬКУЛЯТОР': 'USE CALCULATOR',
            
            // Советы и рекомендации
            'СОЗДАЙТЕ ДЕФИЦИТ КАЛОРИЙ 15-20%': 'CREATE A 15-20% CALORIE DEFICIT',
            'УПОТРЕБЛЯЙТЕ БОЛЬШЕ БЕЛКА ДЛЯ СОХРАНЕНИЯ МЫШЦ': 'CONSUME MORE PROTEIN TO PRESERVE MUSCLE',
            'НЕ ГОЛОДАЙ - СНИЖАЙ КАЛОРИИ ПОСТЕПЕННО': 'DON\'T STARVE - REDUCE CALORIES GRADUALLY',
            'РЕГУЛЯРНО ЗАНИМАЙТЕСЬ СИЛОВЫМИ ТРЕНИРОВКАМИ': 'DO REGULAR STRENGTH TRAINING',
            
            'СОЗДАЙТЕ ПРОФИЦИТ КАЛОРИЙ 10-15%': 'CREATE A 10-15% CALORIE SURPLUS',
            'ПОТРЕБЛЯЙТЕ 1.6-2.0Г БЕЛКА НА КГ ВЕСА': 'CONSUME 1.6-2.0G PROTEIN PER KG OF WEIGHT',
            'НЕ ЗАБЫВАЙ О ПОЛЕЗНЫХ ЖИРАХ (ОРЕХИ, АВОКАДО, РЫБА)': 'DON\'T FORGET ABOUT HEALTHY FATS (NUTS, AVOCADO, FISH)',
            'ТРЕНИРУЙТЕСЬ ИНТЕНСИВНО 3-5 РАЗ В НЕДЕЛЮ': 'TRAIN INTENSELY 3-5 TIMES A WEEK',
            
            'ПОДДЕРЖИВАЙТЕ БАЛАНС ПОТРЕБЛЕНИЯ И РАСХОДА КАЛОРИЙ': 'MAINTAIN A BALANCE OF CALORIES IN AND OUT',
            'СЛЕДИТЕ ЗА КАЧЕСТВОМ ПИТАНИЯ': 'FOCUS ON FOOD QUALITY',
            'РЕГУЛЯРНО КОНТРОЛИРУЙТЕ ВЕС И ЗАМЕРЫ': 'REGULARLY MONITOR WEIGHT AND MEASUREMENTS',
            'СОВМЕЩАЙТЕ КАРДИО И СИЛОВЫЕ ТРЕНИРОВКИ': 'COMBINE CARDIO AND STRENGTH TRAINING',
            
            // Информационное окно
            'ИНФОРМАЦИЯ': 'INFORMATION',
            'СОЗДАЙТЕ ПЕРСОНАЖА, ЧТОБЫ РАССЧИТАТЬ ВАШУ ДНЕВНУЮ НОРМУ КАЛОРИЙ И ПОЛУЧИТЬ РЕКОМЕНДАЦИИ ПО ПИТАНИЮ.': 'CREATE A CHARACTER TO CALCULATE YOUR DAILY CALORIE NEEDS AND GET NUTRITION RECOMMENDATIONS.',
            'ВВЕДИТЕ ВАШИ ДАННЫЕ И ВЫБЕРИТЕ ЦЕЛЬ - ПОХУДЕНИЕ, ПОДДЕРЖАНИЕ ИЛИ НАБОР МАССЫ.': 'ENTER YOUR DATA AND CHOOSE A GOAL - WEIGHT LOSS, MAINTENANCE, OR MUSCLE GAIN.',
            'ПОСЛЕ РАСЧЕТА ВЫ ПОЛУЧИТЕ ВАШУ ДНЕВНУЮ НОРМУ КАЛОРИЙ И МАКРОНУТРИЕНТОВ, А ТАКЖЕ СОВЕТЫ ПО ДОСТИЖЕНИЮ ЦЕЛИ.': 'AFTER CALCULATION, YOU\'LL GET YOUR DAILY CALORIE AND MACRONUTRIENT NEEDS, PLUS ADVICE FOR ACHIEVING YOUR GOAL.',
            
            // ... continue with other translations ...
        },
        en: { // НАЧАЛО ПРАВИЛЬНОЙ СЕКЦИИ EN
            // --- ОБЩИЕ ПЕРЕВОДЫ (из основной части script.js, если нужны на welcome) ---
            'GAMEBOY NUTRITION RPG': 'GAMEBOY NUTRITION RPG',
            'СМЕНИТЬ ЯЗЫК': 'CHANGE LANGUAGE',
            'РУССКИЙ': 'Russian',
            'ENGLISH': 'English',
            'ИНФОРМАЦИЯ О КВЕСТЕ': 'QUEST INFORMATION',
            'Светлая тема (GB)': 'Light Theme (GB)',
            'Тёмная тема (GBP)': 'Dark Theme (GBP)',
            'ЗАКРЫТЬ РУКОВОДСТВО': 'CLOSE GUIDE',
            'ккал': 'kcal',
            'г': 'g',

            // --- ПЕРЕВОДЫ ДЛЯ WELCOME.HTML --- 
            // Заголовки и секции
            'СОЗДАНИЕ ПЕРСОНАЖА': 'CHARACTER CREATION',
            'ВЫБЕРИТЕ ЦЕЛЬ:': 'SELECT GOAL:',
            'ТВОИ ПАРАМЕТРЫ': 'YOUR PARAMETERS',
            'ВАШИ РЕЗУЛЬТАТЫ': 'YOUR RESULTS',
            'ДНЕВНАЯ НОРМА КАЛОРИЙ:': 'DAILY CALORIE INTAKE:',
            'РЕКОМЕНДУЕМЫЕ БЖУ:': 'RECOMMENDED MACROS',
            'СОВЕТЫ ПО ВАШЕЙ ЦЕЛИ:': 'ADVICE FOR YOUR GOAL:',
            'ИНФОРМАЦИЯ': 'INFORMATION',

            // Кнопки целей
            'ПОХУДЕНИЕ': 'WEIGHT LOSS',
            'НАБОР МАССЫ': 'MUSCLE GAIN',
            'ПОДДЕРЖАНИЕ': 'MAINTENANCE',

            // Параметры персонажа (лейблы)
            'Пол:': 'Gender:',
            'МУЖСКОЙ': 'MALE',
            'ЖЕНСКИЙ': 'FEMALE',
            'Возраст:': 'Age:',
            'Рост:': 'Height:',
            'Вес (кг):': 'Weight (kg):',
            'Активность:': 'Activity:',
            'ВЫБЕРИТЕ УРОВЕНЬ АКТИВНОСТИ': 'SELECT ACTIVITY LEVEL', // Title для селекта

            // Параметры персонажа (плейсхолдеры)
            'Лет': 'Years',
            'см': 'cm',
            'кг': 'kg',

            // Короткие названия активности (для select)
            'Малоподвижный': 'Sedentary',
            'Легкая активность': 'Light activity',
            'Умеренная активность': 'Moderate activity',
            'Высокая активность': 'High activity',
            'Очень высокая активность': 'Very high activity',

            // Основные кнопки действий
            'РАССЧИТАТЬ': 'CALCULATE',
            'НАЧАТЬ ПРИКЛЮЧЕНИЕ': 'START ADVENTURE',
            'ПЕРЕСЧИТАТЬ': 'RECALCULATE',
            'НАЗАД': 'BACK', // Кнопка в заголовке результатов

            // Советы по целям (из welcome.js, showAdviceForGoal)
            'СОЗДАЙТЕ ДЕФИЦИТ КАЛОРИЙ 15-20%': 'CREATE A 15-20% CALORIE DEFICIT',
            'УПОТРЕБЛЯЙТЕ БОЛЬШЕ БЕЛКА ДЛЯ СОХРАНЕНИЯ МЫШЦ': 'CONSUME MORE PROTEIN TO PRESERVE MUSCLE',
            'НЕ ГОЛОДАЙ - СНИЖАЙ КАЛОРИИ ПОСТЕПЕННО': 'DON\'T STARVE - REDUCE CALORIES GRADUALLY',
            'РЕГУЛЯРНО ЗАНИМАЙТЕСЬ СИЛОВЫМИ ТРЕНИРОВКАМИ': 'DO REGULAR STRENGTH TRAINING',
            'СОЗДАЙТЕ ПРОФИЦИТ КАЛОРИЙ 10-15%': 'CREATE A 10-15% CALORIE SURPLUS',
            'ПОТРЕБЛЯЙТЕ 1.6-2.0Г БЕЛКА НА КГ ВЕСА': 'CONSUME 1.6-2.0G PROTEIN PER KG OF WEIGHT',
            'НЕ ЗАБЫВАЙ О ПОЛЕЗНЫХ ЖИРАХ (ОРЕХИ, АВОКАДО, РЫБА)': 'DON\'T FORGET ABOUT HEALTHY FATS (NUTS, AVOCADO, FISH)',
            'ТРЕНИРУЙТЕСЬ ИНТЕНСИВНО 3-5 РАЗ В НЕДЕЛЮ': 'TRAIN INTENSELY 3-5 TIMES A WEEK',
            'ПОДДЕРЖИВАЙТЕ БАЛАНС ПОТРЕБЛЕНИЯ И РАСХОДА КАЛОРИЙ': 'MAINTAIN A BALANCE OF CALORIES IN AND OUT',
            'СЛЕДИТЕ ЗА КАЧЕСТВОМ ПИТАНИЯ': 'FOCUS ON FOOD QUALITY',
            'РЕГУЛЯРНО КОНТРОЛИРУЙТЕ ВЕС И ЗАМЕРЫ': 'REGULARLY MONITOR WEIGHT AND MEASUREMENTS',
            'СОВМЕЩАЙТЕ КАРДИО И СИЛОВЫЕ ТРЕНИРОВКИ': 'COMBINE CARDIO AND STRENGTH TRAINING',

            // Текст информационного окна
            'СОЗДАЙТЕ ПЕРСОНАЖА, ЧТОБЫ РАССЧИТАТЬ ВАШУ ДНЕВНУЮ НОРМУ КАЛОРИЙ И ПОЛУЧИТЬ РЕКОМЕНДАЦИИ ПО ПИТАНИЮ.': 'CREATE A CHARACTER TO CALCULATE YOUR DAILY CALORIE NEEDS AND GET NUTRITION RECOMMENDATIONS.',
            'ВВЕДИТЕ ВАШИ ДАННЫЕ И ВЫБЕРИТЕ ЦЕЛЬ - ПОХУДЕНИЕ, ПОДДЕРЖАНИЕ ИЛИ НАБОР МАССЫ.': 'ENTER YOUR DATA AND CHOOSE A GOAL - WEIGHT LOSS, MAINTENANCE, OR MUSCLE GAIN.',
            'ПОСЛЕ РАСЧЕТА ВЫ ПОЛУЧИТЕ ВАШУ ДНЕВНУЮ НОРМУ КАЛОРИЙ И МАКРОНУТРИЕНТОВ, А ТАКЖЕ СОВЕТЫ ПО ДОСТИЖЕНИЮ ЦЕЛИ.': 'AFTER CALCULATION, YOU\'LL GET YOUR DAILY CALORIE AND MACRONUTRIENT NEEDS, PLUS ADVICE FOR ACHIEVING YOUR GOAL.'
        } // КОНЕЦ ПРАВИЛЬНОЙ СЕКЦИИ EN
    };

    // Добавляем недостающие ключи сюда для исправления ошибок
    const missingRuTranslations = {
        '☀️': '☀️', // Day theme icon
        '🌙': '🌙', // Night theme icon
        '⚡': '⚡', // Calories icon
        '🍖': '🍖', // Protein icon
        '🧈': '🧈', // Fat icon
        '🍞': '🍞', // Carbs icon
        '◀': '◀', // Previous icon
        '▶': '▶', // Next icon
        '🌐': '🌐', // All days icon
        '❌': '❌', // Delete icon
        'i': 'i', // Info icon
        'RU': 'RU',
        'EN': 'EN',
        // Обработка текста с пробелами/переносами
        'RU\n                    EN': 'RU\n                    EN', // Используем экранированный перенос
        'RU/EN': 'RU/EN', // Guide text
        '◀ / ▶ / 📅': '◀ / ▶ / 📅', // Guide text
        '🌐 (Все дни)': '🌐 (All days)', // Guide text
        '❌ (в весе)': '❌ (weight)', // Guide text
        '❌ (в еде)': '❌ (food)', // Guide text
        '☀️/🌙': '☀️/🌙', // Guide text (New)
        '0': '0', // Placeholder/default value
        'Без лимита': 'No limit',
        'Например, куриная грудка': 'E.g., chicken breast',
        'Вы уверены?': 'Are you sure?', // Confirmation
        'ДА': 'YES', // Confirmation
        'НЕТ': 'NO', // Confirmation
        'ОК': 'OK', // Confirmation / Info Button
        'РУКОВОДСТВО ПРИКЛЮЧЕНЦА': 'ADVENTURER\'S GUIDE', // Escaped apostrophe
        '✧ РУКОВОДСТВО ПРИКЛЮЧЕНЦА ✧': '✧ ADVENTURER\'S GUIDE ✧', // Escaped apostrophe
        // Ключи из текста гайда (найденные в ошибках)
        // 'Цель: ...' // Уже существует, убрано
        // Добавляем полный ключ, на который ругается консоль
        'Цель: Отслеживай еду и вес в стиле RPG. Балансируй КБЖУ, контролируй вес.': 'Goal: Track food and weight RPG-style. Balance macros, control weight.',
        '- ввод и история веса.': '- weight input and history.',
        '- установка дневных лимитов КБЖУ. Пусто = без лимита.': '- set daily macro limits. Empty = no limit.',
        '- добавление съеденной еды (БЖУ на 100г и вес).': '- add eaten food (macros per 100g and weight).',
        '- итоги за день и сколько осталось до лимита.': '- daily totals and remaining to limit.',
        '- история съеденной еды. Фильтр по дате и поиск.': '- history of eaten food. Filter by date and search.',
        '- записать текущий вес и дату.': '- record current weight and date.',
        '- сохранить лимиты КБЖУ.': '- save macro limits.',
        '- удалить лимиты КБЖУ.': '- clear macro limits.',
        '- добавить продукт в журнал.': '- add product to log.',
        '- сбросить счетчики *текущего* дня (история останется).': '- reset *current* day counters (history remains).',
        '- скачать журнал еды в CSV.': '- download food log as CSV.',
        '- навигация по дням в журнале еды.': '- navigate by day in the food log.',
        '- показать всю историю еды.': '- show all food history.',
        '- удалить запись о весе.': '- delete weight entry.',
        '- удалить запись о еде.': '- delete food entry.',
        '- переключить язык.': '- switch language.',
        '- открыть этот гайд.': '- open this guide.',
        '- переключить светлую/тёмную тему.': '- switch light/dark theme.', // Guide text (New)
        'Все дни': 'All days', // For date display
        
        // Иконки для welcome.html
        '🔥': '🔥', // Fire icon (weight loss)
        '💪': '💪', // Muscle icon (muscle gain)
        '👤': '👤', // Person icon (gender)
        '♂️': '♂️', // Male icon
        '♀️': '♀️', // Female icon
        '🎂': '🎂', // Birthday cake icon (age)
        '📏': '📏', // Ruler icon (height)
        '🏃': '🏃', // Running icon (activity)
    };

    // Объединяем основные переводы с недостающими, ПЕРЕД генерацией EN
    Object.assign(TRANSLATIONS.ru, missingRuTranslations);

    // --- Генерация переводов с английского на русский --- //
    // Убедимся, что все русские ключи есть в английском словаре
    Object.keys(TRANSLATIONS.ru).forEach(key => {
        const englishValue = TRANSLATIONS.ru[key];
        // Если для английского значения еще нет ключа, или текущее значение - не пустая строка
        // и не перезаписываем существующие ключи, если они уже есть в en
        if (englishValue && !(englishValue in TRANSLATIONS.en)) {
            TRANSLATIONS.en[englishValue] = key;
        }
    });
    // Теперь гарантируем, что все английские ключи (значения из ru) есть в русском словаре
    // Это важно, если какой-то текст используется как ключ и в en, и в ru
    Object.keys(TRANSLATIONS.en).forEach(key => {
        const russianValue = TRANSLATIONS.en[key];
         // Если для русского значения еще нет ключа, добавляем его
         // И не перезаписываем существующие ключи, если они уже есть в ru
        if (russianValue && !(russianValue in TRANSLATIONS.ru)) {
            TRANSLATIONS.ru[russianValue] = key;
        }
    });

    // --- Helper функция для получения перевода --- (Переписана)
    function getTranslation(key, fallback = '') {
        if (!key) return fallback || ''; // Обработка пустого ключа

        if (currentLang === 'ru') {
            // Цель: Русский язык
            // 1. Ключ уже на русском?
            if (key in TRANSLATIONS.ru) {
                return key; // Да, возвращаем как есть
            }
            // 2. Ключ на английском и есть перевод на русский?
            if (key in TRANSLATIONS.en) {
                return TRANSLATIONS.en[key]; // Да, возвращаем русский перевод
            }
            // 3. Не найдено
            return fallback || key;

        } else { // currentLang === 'en'
            // Цель: Английский язык
            // 1. Ключ на русском и есть перевод на английский?
            if (key in TRANSLATIONS.ru) {
                return TRANSLATIONS.ru[key]; // Да, возвращаем английский перевод
            }
            // 2. Ключ уже на английском?
            if (key in TRANSLATIONS.en) {
                return key; // Да, возвращаем как есть
            }
            // 3. Не найдено
            return fallback || key;
        }
    }

    // Текущий язык интерфейса
    let currentLang = localStorage.getItem('appLanguage') || 'ru';

    // НОВАЯ КОНСТАНТА: управляет системой форматирования дат
    // true = перевернутая логика (русский язык -> английский формат и наоборот)
    // false = прямая логика (русский язык -> русский формат)
    const USE_REVERSED_DATE_FORMATTING = false;

    // НОВАЯ ФУНКЦИЯ: единая точка для определения формата даты
    function getDateFormatter(isHeader = false) {
        // Если используем перевернутую логику
        if (USE_REVERSED_DATE_FORMATTING) {
            return currentLang === 'ru' 
                ? (isHeader ? formatDateHeader_EN : formatDateDisplay_EN)  // RU → EN
                : (isHeader ? formatDateHeader_RU : formatDateDisplay_RU); // EN → RU
        } else {
            // Прямая логика
            return currentLang === 'ru' 
                ? (isHeader ? formatDateHeader_RU : formatDateDisplay_RU)  // RU → RU
                : (isHeader ? formatDateHeader_EN : formatDateDisplay_EN); // EN → EN
        }
    }

    // Функция для перевода всего интерфейса
    function translateUI() {
        // Переводим все текстовые элементы, ИСКЛЮЧАЯ иконки
        document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, button:not(.goal-btn):not(.gender-btn), label > span:not(.icon), th, span:not(.icon):not(.current-date-display)').forEach(element => {
             // --- УДАЛЕНО: Проверка на старый тумблер ---
             // if (element.closest('.lang-toggle-wrapper')) {
             //     return; 
             // }

            let originalKey = element.dataset.translateKey;
            let textContent = element.textContent?.trim();

            if (!originalKey && textContent) {
                 // Пытаемся найти ключ (в RU) по текущему тексту элемента
                 const foundRuKey = Object.keys(TRANSLATIONS.ru).find(k => k === textContent || TRANSLATIONS.ru[k] === textContent);

                 if (foundRuKey) {
                     // Если нашли ключ, значение которого равно тексту, используем ключ
                     if (TRANSLATIONS.ru[foundRuKey] === textContent) {
                         originalKey = foundRuKey;
                     } else { // Иначе используем сам текст как ключ (он уже на русском)
                         originalKey = textContent;
                     }
                 } else {
                    // Если совсем не нашли, пробуем найти ключ в EN словаре по тексту
                    const foundEnKey = Object.keys(TRANSLATIONS.en).find(k => k === textContent || TRANSLATIONS.en[k] === textContent);
                     if (foundEnKey) {
                          // Если нашли ключ в EN, значение которого равно тексту, используем ключ EN (это английский текст)
                          if (TRANSLATIONS.en[foundEnKey] === textContent) {
                             originalKey = foundEnKey;
                          } else { // Иначе используем сам текст как ключ (он уже на английском)
                             originalKey = textContent;
                          }
                     } else {
                        originalKey = textContent; // Используем сам текст как ключ, если не нашли нигде
                     }
                 }
                 element.dataset.translateKey = originalKey;
            }

            // Получаем перевод по ключу
            if (originalKey) {
                const translatedText = getTranslation(originalKey);
                // Проверяем, отличается ли перевод от текущего текста, чтобы избежать лишних обновлений
                 if (textContent !== translatedText) {
                    // Специальная обработка для заголовка H3 в info-modal
                    if (element.tagName === 'H3' && element.closest('#info-modal')) {
                        element.textContent = `✧ ${translatedText} ✧`;
                    } else {
                         element.textContent = translatedText;
                    }
                }
            }
        });

        // Специальная обработка для кнопок целей и пола
        // Эти кнопки имеют внутреннюю структуру с иконкой и текстом
        document.querySelectorAll('.goal-btn, .gender-btn').forEach(button => {
            // Находим span с текстом внутри кнопки
            const textSpan = button.querySelector('.goal-text, .gender-text');
            if (textSpan) {
                const originalKey = textSpan.getAttribute('data-translation-key');
                if (originalKey) {
                    const translatedText = getTranslation(originalKey);
                    if (textSpan.textContent !== translatedText) {
                        textSpan.textContent = translatedText;
                    }
                }
            }
        });

        // Обновляем плейсхолдеры и заголовки (title) элементов
        document.querySelectorAll('input[placeholder], [title]').forEach(element => {
             let originalKey = element.dataset.translateKeyPlaceholder || element.dataset.translateKeyTitle;
             let attributeName = '';
             let currentAttributeValue = '';

             if (element.hasAttribute('placeholder')) {
                 attributeName = 'placeholder';
                 currentAttributeValue = element.getAttribute(attributeName);
                 if (!originalKey) originalKey = element.dataset.translateKeyPlaceholder;
             } else if (element.hasAttribute('title')) {
                 attributeName = 'title';
                 currentAttributeValue = element.getAttribute(attributeName);
                 if (!originalKey) originalKey = element.dataset.translateKeyTitle;
             }

             if (attributeName && !originalKey && currentAttributeValue) {
                  // Пытаемся найти ключ по значению атрибута в RU
                  const foundRuKey = Object.keys(TRANSLATIONS.ru).find(key => key === currentAttributeValue || TRANSLATIONS.ru[key] === currentAttributeValue);
                  if (foundRuKey) {
                      // Если значение атрибута = ЗНАЧЕНИЮ в RU, то ключ - это КЛЮЧ RU
                      originalKey = (currentAttributeValue === TRANSLATIONS.ru[foundRuKey]) ? foundRuKey : currentAttributeValue;
                  } else {
                      // Если не нашли в RU, ищем ключ в EN
                      const foundEnKey = Object.keys(TRANSLATIONS.en).find(key => key === currentAttributeValue || TRANSLATIONS.en[key] === currentAttributeValue);
                      if (foundEnKey) {
                         // Если значение атрибута = ЗНАЧЕНИЮ в EN, то ключ - это КЛЮЧ EN
                          originalKey = (currentAttributeValue === TRANSLATIONS.en[foundEnKey]) ? foundEnKey : currentAttributeValue;
                      } else {
                         originalKey = currentAttributeValue;
                      }
                  }
                  // Сохраняем найденный ключ
                  if (attributeName === 'placeholder') element.dataset.translateKeyPlaceholder = originalKey;
                  if (attributeName === 'title') element.dataset.translateKeyTitle = originalKey;
             }

             if (originalKey) {
                 const translatedText = getTranslation(originalKey);
                 if (currentAttributeValue !== translatedText) {
                     element.setAttribute(attributeName, translatedText);
                 }
             }
        });

        // Обновляем title для тумблера и его частей
        const langToggleWrapper = document.querySelector('.lang-toggle-wrapper');
        if (langToggleWrapper) langToggleWrapper.title = getTranslation('СМЕНИТЬ ЯЗЫК');
        // updateLangToggleState(); // Обновляет RU/EN titles внутри -- УДАЛЕНО В ПРОШЛЫХ ШАГАХ

        // Обновляем плейсхолдеры полей ввода лимитов (если лимит не установлен)
        updateLimitPlaceholders();

        // Переводим тексты в модальных окнах (если они открыты или будут открыты)
        translateConfirmationModal();
        translateInfoModalStaticContent(); // Переводим статичный контент инфо-окна

        // Обновляем состояние контрола
        updateLangControlState(); // Этот вызов правильный и остается

        // Обновляем title для кнопок темы
        if (lightThemeBtn) lightThemeBtn.title = getTranslation('Светлая тема (GB)');
        if (darkThemeBtn) darkThemeBtn.title = getTranslation('Тёмная тема (GBP)');

        // --- Добавляем сохранение истории веса --- (если ее нужно сохранять здесь)
        localStorage.setItem('dailyLimits', JSON.stringify(dailyLimits));
        localStorage.setItem('fullHistory', JSON.stringify(fullHistory)); // Храним всю историю
    }

    // Функция для перевода статического контента модального окна информации
    function translateInfoModalStaticContent() {
        const infoModalContent = infoModal?.querySelector('.info-modal-content');
        if (!infoModalContent) return;

        // Заголовок H3
        const infoTitleH3 = infoModalContent.querySelector('h3');
        if (infoTitleH3) {
             let originalKey = infoTitleH3.dataset.translateKey;
             if (!originalKey) {
                 originalKey = infoTitleH3.textContent.replace(/[✧]/g, '').trim();
                 infoTitleH3.dataset.translateKey = originalKey;
             }
             if (originalKey) {
                 const translatedText = getTranslation(originalKey);
                 if (infoTitleH3.textContent.replace(/[✧]/g, '').trim() !== translatedText) {
                    infoTitleH3.textContent = `✧ ${translatedText} ✧`;
                 }
             }
        }

        // Основной текст
        const infoTextContainer = infoModalContent.querySelector('.info-text');
        if (!infoTextContainer) return;

        // Используем рекурсивный подход для перевода узлов
        function translateNode(node) {
             if (node.nodeType === Node.TEXT_NODE) {
                 const originalText = node.textContent.trim();
                 if (originalText) {
                     // Переводим текст напрямую, не полагаясь на ключи родителя
                     const translatedText = getTranslation(originalText);
                     if (node.textContent.trim() !== translatedText) {
                         // Заменяем только если текст действительно отличается
                         // Это предотвращает бесконечные циклы при частичном совпадении
                         if (node.textContent.includes(originalText)) {
                            node.textContent = node.textContent.replace(originalText, translatedText);
                         }
                     }
                 }
             } else if (node.nodeType === Node.ELEMENT_NODE) {
                // Сохраняем ключ для элемента, если его нет
                 let originalKey = node.dataset.translateKey;
                 let nodeTextContent = node.textContent?.trim(); // Безопасный доступ
                 if (!originalKey && nodeTextContent && !['UL', 'P', 'DIV', 'LI', 'H3'].includes(node.tagName)) { // Не сохраняем ключи для контейнеров и h3
                     // Ищем ключ в RU по текущему тексту
                     let foundRuKey = Object.keys(TRANSLATIONS.ru).find(key => key === nodeTextContent || TRANSLATIONS.ru[key] === nodeTextContent);
                     if (foundRuKey) {
                         // Если текст соответствует ЗНАЧЕНИЮ в RU, то ключ - это КЛЮЧ из RU
                         originalKey = (nodeTextContent === TRANSLATIONS.ru[foundRuKey]) ? foundRuKey : nodeTextContent;
                     } else {
                         // Если не нашли в RU, ищем ключ в EN
                         let foundEnKey = Object.keys(TRANSLATIONS.en).find(key => key === nodeTextContent || TRANSLATIONS.en[key] === nodeTextContent);
                         if (foundEnKey) {
                            // Если текст соответствует ЗНАЧЕНИЮ в EN, то ключ - это КЛЮЧ из EN
                             originalKey = (nodeTextContent === TRANSLATIONS.en[foundEnKey]) ? foundEnKey : nodeTextContent;
                         } else {
                             originalKey = nodeTextContent;
                         }
                     }
                     node.dataset.translateKey = originalKey;
                 }

                 // Переводим сам элемент, если у него есть ключ
                 if (originalKey) {
                     const translatedText = getTranslation(originalKey);
                     if (nodeTextContent !== translatedText) {
                         // Особая обработка для span.info-title и span.info-highlight
                         if (node.classList.contains('info-title') || node.classList.contains('info-highlight')) {
                              node.textContent = translatedText;
                         }
                         // Для LI переводим текст после " - "
                         else if (node.tagName === 'LI') {
                             const parts = node.innerHTML.split('</span> - ');
                             if (parts.length > 1) {
                                 const originalActionText = parts[1].trim();
                                 // Найдем ключ для actionText, если его нет
                                 let actionKey = node.dataset.translateActionKey;
                                 if (!actionKey) {
                                     const foundRuActionKey = Object.keys(TRANSLATIONS.ru).find(k => k === originalActionText || TRANSLATIONS.ru[k] === originalActionText);
                                     actionKey = foundRuActionKey ? ((originalActionText === TRANSLATIONS.ru[foundRuActionKey]) ? foundRuActionKey : originalActionText) : originalActionText;
                                     node.dataset.translateActionKey = actionKey;
                                 }
                                 const translatedActionText = getTranslation(actionKey);
                                 if (originalActionText !== translatedActionText) {
                                    node.innerHTML = `${parts[0]}</span> - ${translatedActionText}`;
                                 }
                             } else {
                                 // Если нет " - ", рекурсивно обрабатываем детей
                                 Array.from(node.childNodes).forEach(translateNode);
                             }
                         }
                         // Для других элементов (не контейнеров) просто меняем текст, если нет дочерних элементов
                         else if (!['UL', 'P', 'DIV'].includes(node.tagName) && !node.children.length) {
                              node.textContent = translatedText;
                         } else {
                             // Для контейнеров или элементов с детьми, рекурсивно обрабатываем детей
                             Array.from(node.childNodes).forEach(translateNode);
                         }
                     }
                 } else {
                     // Если у элемента нет ключа, просто рекурсивно обрабатываем его детей
                      Array.from(node.childNodes).forEach(translateNode);
                 }
             }
        }

        // Начинаем перевод с контейнера info-text
        Array.from(infoTextContainer.childNodes).forEach(translateNode);
    }

    // Функция для перевода текстов кнопок модального окна подтверждения
    function translateConfirmationModal() {
        if (modalConfirmBtn) modalConfirmBtn.textContent = getTranslation('ДА');
        if (modalCancelBtn) modalCancelBtn.textContent = getTranslation('НЕТ');
        if (modalOkBtn) modalOkBtn.textContent = getTranslation('ОК');
    }

    // Обновляет плейсхолдеры полей ввода лимитов
    function updateLimitPlaceholders() {
        const noLimitText = getTranslation('Без лимита');
        // Проверяем каждый инпут перед установкой placeholder
        if (caloriesLimitInput) {
            const currentPlaceholder = isFinite(dailyLimits.calories) ? Math.round(dailyLimits.calories).toFixed(0) : noLimitText;
            if (caloriesLimitInput.placeholder !== currentPlaceholder) caloriesLimitInput.placeholder = currentPlaceholder;
        }
         if (proteinLimitInput) {
            const currentPlaceholder = isFinite(dailyLimits.protein) ? Math.round(dailyLimits.protein).toFixed(0) : noLimitText;
            if (proteinLimitInput.placeholder !== currentPlaceholder) proteinLimitInput.placeholder = currentPlaceholder;
        }
        if (fatLimitInput) {
            const currentPlaceholder = isFinite(dailyLimits.fat) ? Math.round(dailyLimits.fat).toFixed(0) : noLimitText;
            if (fatLimitInput.placeholder !== currentPlaceholder) fatLimitInput.placeholder = currentPlaceholder;
        }
        if (carbsLimitInput) {
            const currentPlaceholder = isFinite(dailyLimits.carbs) ? Math.round(dailyLimits.carbs).toFixed(0) : noLimitText;
            if (carbsLimitInput.placeholder !== currentPlaceholder) carbsLimitInput.placeholder = currentPlaceholder;
        }
    }

    // Обновляем состояние СЕЛЕКТА
    function updateLangControlState() { 
        // Синхронизируем селект
        if (langSelect) langSelect.value = currentLang;

        // Обновляем title для обертки селекта
        const langSelectWrapper = document.querySelector('.lang-select-wrapper');
        if (langSelectWrapper) langSelectWrapper.title = getTranslation('СМЕНИТЬ ЯЗЫК');
    }

    // Общая функция для смены языка, вызываемая из селекта
    function changeLanguage(newLang) {
        if (newLang === currentLang) return; // Ничего не делать, если язык тот же

        console.log('[script.js] changeLanguage: Changing lang to', newLang); // <-- LOG
        currentLang = newLang;
        localStorage.setItem('appLanguage', currentLang);
        document.documentElement.lang = currentLang;

        // Обновляем контрол
        updateLangControlState(); 

        // Переводим интерфейс
        console.log('[script.js] changeLanguage: Before translateUI'); // <-- LOG
        translateUI();
        console.log('[script.js] changeLanguage: After translateUI'); // <-- LOG
        // Восстанавливаем результаты на странице welcome.html, если эта функция доступна
        if (typeof displaySavedResults === 'function') {
            console.log('[script.js] changeLanguage: Calling displaySavedResults'); // <-- LOG
            displaySavedResults();
            console.log('[script.js] changeLanguage: After displaySavedResults'); // <-- LOG
        } else {
            console.log('[script.js] changeLanguage: displaySavedResults function NOT found'); // <-- LOG
        }
        console.log('[script.js] changeLanguage: Before updateSummary'); // <-- LOG
        updateSummary(); // Эта функция обновляет итоги на основной странице (index.html)
        console.log('[script.js] changeLanguage: After updateSummary. Language change complete.'); // <-- LOG
    }

    // Обработчик селекта - вызывает общую функцию
    function handleSelectLanguage() {
        const newLang = langSelect.value;
        changeLanguage(newLang);
    }

    // Получаем НОВЫЙ селект языка и добавляем обработчик
    const langSelect = document.getElementById('lang-select');
    let choicesLangSelect = null; // Переменная для экземпляра Choices

    if (langSelect) {
        // Инициализируем Choices.js для селекта языка
        choicesLangSelect = new Choices(langSelect, {
            searchEnabled: false, // Отключаем поиск, т.к. всего 2 опции
            itemSelectText: '', // Убираем текст "Press to select"
            shouldSort: false, // Не сортируем опции
            // Можно добавить кастомные классы для стилизации, если нужно
            // classNames: {
            //     containerOuter: 'choices choices-lang',
            //     containerInner: 'choices__inner',
            //     input: 'choices__input',
            //     inputCloned: 'choices__input--cloned',
            //     list: 'choices__list',
            //     listItems: 'choices__list--multiple',
            //     listSingle: 'choices__list--single',
            //     listDropdown: 'choices__list--dropdown',
            //     item: 'choices__item',
            //     itemSelectable: 'choices__item--selectable',
            //     itemDisabled: 'choices__item--disabled',
            //     itemChoice: 'choices__item--choice',
            //     placeholder: 'choices__placeholder',
            //     group: 'choices__group',
            //     groupHeading : 'choices__heading',
            //     button: 'choices__button',
            //     activeState: 'is-active',
            //     focusState: 'is-focused',
            //     openState: 'is-open',
            //     disabledState: 'is-disabled',
            //     highlightedState: 'is-highlighted',
            //     selectedState: 'is-selected',
            //     flippedState: 'is-flipped',
            //     loadingState: 'is-loading',
            //     noResults: 'has-no-results',
            //     noChoices: 'has-no-choices'
            // }
        });

        // Используем событие 'change' от Choices.js
        langSelect.addEventListener('change', handleSelectLanguage);
    }

    // --- Получение ссылок на элементы DOM --- //

    // Элементы ввода продукта
    const productNameInput = document.getElementById('product-name');
    const protein100Input = document.getElementById('protein100');
    const fat100Input = document.getElementById('fat100');
    const carbs100Input = document.getElementById('carbs100');
    const weightInput = document.getElementById('weight');
    const addProductBtn = document.getElementById('add-product-btn');

    // Элементы ввода лимитов
    const caloriesLimitInput = document.getElementById('calories-limit');
    const proteinLimitInput = document.getElementById('protein-limit');
    const fatLimitInput = document.getElementById('fat-limit');
    const carbsLimitInput = document.getElementById('carbs-limit');
    const saveLimitBtn = document.getElementById('save-limit-btn');
    const clearLimitBtn = document.getElementById('clear-limit-btn');

    // Элементы отображения итогов
    const totalProteinDisplay = document.getElementById('total-protein');
    const totalFatDisplay = document.getElementById('total-fat');
    const totalCarbsDisplay = document.getElementById('total-carbs');
    const totalCaloriesDisplay = document.getElementById('total-calories');

    // Элементы отображения остатков
    const remainingCaloriesDisplay = document.getElementById('remaining-calories');
    const remainingProteinDisplay = document.getElementById('remaining-protein');
    const remainingFatDisplay = document.getElementById('remaining-fat');
    const remainingCarbsDisplay = document.getElementById('remaining-carbs');

    // Элементы управления
    const resetDayBtn = document.getElementById('reset-day-btn'); // Кнопка сброса дня
    const historyTbody = document.getElementById('history-tbody'); // Тело таблицы истории
    const historySearch = document.getElementById('history-search'); // Поле поиска по истории
    
    // Элементы навигации по дням
    const prevDayBtn = document.getElementById('prev-day-btn'); // Кнопка предыдущего дня
    const nextDayBtn = document.getElementById('next-day-btn'); // Кнопка следующего дня
    const allDaysBtn = document.getElementById('all-days-btn'); // Кнопка показа всех дней
    const historyDateInput = document.getElementById('history-date'); // Поле выбора даты
    const currentDateDisplay = document.getElementById('current-date-display'); // Отображение текущей выбранной даты

    // Элементы модального окна
    const confirmationModal = document.getElementById('confirmation-modal');
    const modalMessage = document.getElementById('modal-message');
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const modalOkBtn = document.getElementById('modal-ok-btn');

    // Добавим ссылку на кнопку экспорта истории
    const exportHistoryBtn = document.getElementById('export-history-btn');

    // Кнопка информации и модальное окно
    const infoBtn = document.getElementById('info-btn');
    const infoModal = document.getElementById('info-modal');
    const infoCloseBtn = document.getElementById('info-close-btn');
    const infoModalContent = document.getElementById('info-modal-content'); 
    const infoTextElement = infoModalContent?.querySelector('.info-text'); 

    // --- Новые элементы для трекинга веса ---
    const currentWeightInput = document.getElementById('current-weight');
    const measurementDateInput = document.getElementById('measurement-date');
    const saveWeightBtn = document.getElementById('save-weight-btn');
    const weightHistoryTbody = document.getElementById('weight-history-tbody');
    const weightTrackingSection = document.getElementById('weight-tracking'); // Для делегирования событий

    // --- Глобальные переменные для хранения данных --- //

    // Переменная для хранения ВСЕЙ истории приемов пищи
    let fullHistory = [];

    // Объект для хранения суммарных значений БЖУК за ТЕКУЩИЙ день
    let dailyTotals = {
        protein: 0,
        fat: 0,
        carbs: 0,
        calories: 0,
        items: [] // Массив {id, name, protein, fat, carbs, calories, date, time}
    };

    // Объект для хранения установленных дневных лимитов
    let dailyLimits = {
        calories: Infinity,
        protein: Infinity,
        fat: Infinity,
        carbs: Infinity
    };

    // Переменная для хранения выбранной даты фильтрации (null - все даты)
    let selectedDate = null;

    // --- Новая переменная для истории веса ---
    let weightHistory = [];

    // --- Функции --- //

    // Получение сегодняшней даты в формате YYYY-MM-DD
    function getTodayDateString() {
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0'); // Месяцы от 0 до 11
        const day = today.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Новая функция для расчета итогов текущего дня на основе fullHistory
    function calculateDailyTotals() {
        const todayDate = getTodayDateString();
        // Сбрасываем текущие итоги перед пересчетом
        dailyTotals = { protein: 0, fat: 0, carbs: 0, calories: 0, items: [] };

        // Фильтруем всю историю, выбирая только сегодняшние записи
        fullHistory.forEach(item => {
            if (item.date === todayDate) {
                // Добавляем к итогам дня (используем getNumericTotal для безопасности)
                dailyTotals.protein += getNumericTotal(item.protein);
                dailyTotals.fat += getNumericTotal(item.fat);
                dailyTotals.carbs += getNumericTotal(item.carbs);
                dailyTotals.calories += getNumericTotal(item.calories);
                // Добавляем в массив сегодняшних элементов
                dailyTotals.items.push(item);
            }
        });
    }

    // Функция для обновления отображения всех данных на странице и сохранения в localStorage
    function updateSummary() {
        // Обновление текстового содержимого элементов с итогами ТЕКУЩЕГО дня
        if (totalProteinDisplay) totalProteinDisplay.textContent = Math.round(dailyTotals.protein).toFixed(0);
        if (totalFatDisplay) totalFatDisplay.textContent = Math.round(dailyTotals.fat).toFixed(0);
        if (totalCarbsDisplay) totalCarbsDisplay.textContent = Math.round(dailyTotals.carbs).toFixed(0);
        if (totalCaloriesDisplay) totalCaloriesDisplay.textContent = Math.round(dailyTotals.calories).toFixed(0);

        // Получаем единицы измерения в соответствии с текущим языком
        const kcalUnit = getTranslation('ккал');
        const gUnit = getTranslation('г');
        const naText = getTranslation('N/A');

        // Обновление отображения остатков (с учетом лимитов)
        if (remainingCaloriesDisplay) updateRemainingDisplay(remainingCaloriesDisplay, dailyLimits.calories, dailyTotals.calories, 0, kcalUnit, naText);
        if (remainingProteinDisplay) updateRemainingDisplay(remainingProteinDisplay, dailyLimits.protein, dailyTotals.protein, 0, gUnit, naText);
        if (remainingFatDisplay) updateRemainingDisplay(remainingFatDisplay, dailyLimits.fat, dailyTotals.fat, 0, gUnit, naText);
        if (remainingCarbsDisplay) updateRemainingDisplay(remainingCarbsDisplay, dailyLimits.carbs, dailyTotals.carbs, 0, gUnit, naText);

        // Обновляем единицы измерения в таблице с суммарными значениями
        document.querySelectorAll('#daily-status .totals-block tbody td').forEach((cell, index) => {
            const valueElement = cell.querySelector('span'); // Получаем span
            if (!valueElement) return;

            // Обновляем только числовое значение в span
            const newValue = index === 0 ? Math.round(dailyTotals.calories).toFixed(0) :
                             index === 1 ? Math.round(dailyTotals.protein).toFixed(0) :
                             index === 2 ? Math.round(dailyTotals.fat).toFixed(0) :
                             Math.round(dailyTotals.carbs).toFixed(0);
             if (valueElement.textContent !== newValue) valueElement.textContent = newValue;

            // Определяем новую единицу
            const newUnit = index === 0 ? kcalUnit : gUnit;
            const unitWithSpace = ` ${newUnit}`;

            // Находим или создаем текстовый узел для единицы
            let unitTextNode = Array.from(cell.childNodes).find(node =>
                node.nodeType === Node.TEXT_NODE && node !== valueElement
            );
            if (unitTextNode) {
                 if (unitTextNode.textContent !== unitWithSpace) unitTextNode.textContent = unitWithSpace;
            } else {
                // Удаляем старые текстовые узлы (на всякий случай)
                Array.from(cell.childNodes).forEach(node => {
                     if(node.nodeType === Node.TEXT_NODE && node !== valueElement) {
                        cell.removeChild(node);
                     }
                });
                cell.appendChild(document.createTextNode(unitWithSpace));
            }
        });

        // Получаем текущее значение поиска (если есть)
        const searchQuery = historySearch?.value.trim().toLowerCase() || '';

        // Перерисовка таблицы ВСЕЙ истории
        if (historyTbody) historyTbody.innerHTML = ''; // Очищаем таблицу перед заполнением

        // Сортируем всю историю по дате и времени (сначала новые)
        const sortedHistory = [...fullHistory].sort((a, b) => {
            // Используем getTime() для надежного сравнения
            const dateA = new Date(`${a.date}T${a.time}`).getTime();
            const dateB = new Date(`${b.date}T${b.time}`).getTime();
            // Проверяем на NaN перед вычитанием
            if (isNaN(dateA) || isNaN(dateB)) return 0;
            return dateB - dateA; // Сортировка по убыванию (новые сверху)
        });

        // Фильтруем историю по поисковому запросу и выбранной дате
        let filteredHistory = sortedHistory;
        
        // Фильтрация по поисковому запросу
        if (searchQuery) {
            filteredHistory = filteredHistory.filter(item => 
                item.name.toLowerCase().includes(searchQuery)
            );
        }
        
        // Фильтрация по дате
        if (selectedDate) {
            filteredHistory = filteredHistory.filter(item => 
                item.date === selectedDate
            );
        }

         // Добавляем строки в таблицу
         if (historyTbody) {
             // Если НЕ выбрана конкретная дата, группируем по датам
             if (!selectedDate) {
                 const entriesByDate = {};
                 filteredHistory.forEach(item => {
                     if (!entriesByDate[item.date]) {
                         entriesByDate[item.date] = [];
                     }
                     entriesByDate[item.date].push(item);
                 });

                 const sortedDates = Object.keys(entriesByDate).sort().reverse();

                 sortedDates.forEach(date => {
                     const dateRow = historyTbody.insertRow();
                     dateRow.className = 'date-separator';
                     const dateCell = dateRow.insertCell();
                     dateCell.colSpan = 9; // Исправлено: Учитываем новый столбец ВЕС
                     // --- ИСПОЛЬЗУЕМ НОВУЮ ФУНКЦИЮ ВМЕСТО ПРЯМОЙ ПРОВЕРКИ ---
                     dateCell.textContent = getDateFormatter(true)(date);

                     entriesByDate[date].forEach(item => { addHistoryRow(item, gUnit, kcalUnit); });
                 });
             } else {
                 // Если выбрана конкретная дата, просто добавляем строки
                 filteredHistory.forEach(item => { addHistoryRow(item, gUnit, kcalUnit); });
             }
         }

        // Вызываем feather.replace() ПОСЛЕ добавления всех строк истории
        feather.replace(); 

        // Сохраняем текущее состояние (лимиты, ВСЯ ИСТОРИЯ) в localStorage
        try {
             localStorage.setItem('dailyLimits', JSON.stringify(dailyLimits));
             localStorage.setItem('fullHistory', JSON.stringify(fullHistory)); // Храним всю историю
        } catch (e) {
             // Используем кастомную модалку вместо alert
             showInfoModalAlert(getTranslation('Не удалось сохранить данные. Возможно, хранилище переполнено.'));
        }
        
        // Обновляем отображение текущей даты в навигации
        updateDateDisplay();

        // --- Добавляем рендер истории веса --- (вызывается в конце updateSummary)
        renderWeightHistory(); // Убедимся, что feather.replace() в renderWeightHistory тоже вызывается
    }

    // Вспомогательная функция для добавления строки истории в таблицу
    function addHistoryRow(item, gUnit, kcalUnit) {
        if (!historyTbody) return; // Проверка на существование tbody
        const row = historyTbody.insertRow(); // Создаем новую строку

        // --- Ячейки --- (Порядок как в HTML)
        const nameCell = row.insertCell();
        const proteinCell = row.insertCell();
        const fatCell = row.insertCell();
        const carbsCell = row.insertCell();
        const caloriesCell = row.insertCell();
        const weightCell = row.insertCell(); // Добавлено: ячейка для веса
        const dateCell = row.insertCell();
        const timeCell = row.insertCell();
        const actionCell = row.insertCell(); // Ячейка для кнопки удаления

        // --- Форматирование даты --- Используем formatDateDisplay
        // --- ИСПОЛЬЗУЕМ НОВУЮ ФУНКЦИЮ ВМЕСТО ПРЯМОЙ ПРОВЕРКИ ---
        const formattedDate = getDateFormatter(false)(item.date);
        // const kgUnit = getTranslation('кг'); // kgUnit не используется здесь

        // --- Заполнение ячеек --- 
        nameCell.textContent = item.name;
        proteinCell.textContent = `${Math.round(item.protein).toFixed(0)} ${gUnit}`;
        fatCell.textContent = `${Math.round(item.fat).toFixed(0)} ${gUnit}`;
        carbsCell.textContent = `${Math.round(item.carbs).toFixed(0)} ${gUnit}`;
        caloriesCell.textContent = `${Math.round(item.calories).toFixed(0)} ${kcalUnit}`;
        weightCell.textContent = `${item.weight} ${gUnit}`; // Добавлено: отображаем вес
        dateCell.textContent = formattedDate;
        timeCell.textContent = item.time;

        // Создание кнопки удаления для текущей строки
        const deleteBtn = document.createElement('button');
        // deleteBtn.textContent = '❌'; // Старый вариант: Иконка удаления
        deleteBtn.innerHTML = '<i data-feather="trash-2"></i>'; // Новый вариант: Feather иконка
        // deleteBtn.classList.add('delete-btn'); // Старый вариант: Класс для стилизации и обработчика
        deleteBtn.classList.add('btn', 'btn-danger', 'delete-btn'); // Новый вариант: Добавляем классы для стиля кнопки
        deleteBtn.dataset.id = item.id; // Используем УНИКАЛЬНЫЙ ID элемента для удаления
        deleteBtn.title = getTranslation('ПРЕДМЕТ УНИЧТОЖЕН!');
        deleteBtn.setAttribute('aria-label', getTranslation('Удалить запись о еде')); // Добавляем aria-label
        actionCell.appendChild(deleteBtn); // Добавляем кнопку в ячейку
    }

    // Вспомогательная функция для обновления одного элемента отображения остатка
    function updateRemainingDisplay(valueSpanElement, limit, total, precision, unit = '', naText = 'N/A') {
        if (!valueSpanElement) return; // Проверка на существование элемента
        const parentTd = valueSpanElement.parentElement; // Получаем родительскую ячейку TD
        if (!parentTd) return; // На всякий случай, если span не в TD

        parentTd.classList.remove('remaining-negative', 'remaining-low'); // Сначала убираем классы

        // Обновляем значение в самом SPAN
        if (!isFinite(limit)) {
            if (valueSpanElement.textContent !== naText) valueSpanElement.textContent = naText;
        } else {
            // Рассчитываем остаток
            const remaining = limit - total;
            const remainingText = Math.round(remaining).toFixed(precision);
             if (valueSpanElement.textContent !== remainingText) valueSpanElement.textContent = remainingText;

            // Добавляем класс для отрицательного остатка (превышение лимита) к TD
            if (remaining < 0) {
                parentTd.classList.add('remaining-negative');
            }
            // Можно добавить стилизацию для малого остатка
            // else if (limit > 0 && remaining < limit * 0.1) { ... }
        }

        // --- Обновление единицы измерения --- 
        const unitWithSpace = ` ${unit}`;

        // Находим или создаем текстовый узел для единицы
         let unitTextNode = Array.from(parentTd.childNodes).find(node =>
            node.nodeType === Node.TEXT_NODE && node !== valueSpanElement
         );

        if (unitTextNode) {
            if (unitTextNode.textContent !== unitWithSpace) unitTextNode.textContent = unitWithSpace;
        } else {
             // Удаляем старые текстовые узлы (на всякий случай)
             Array.from(parentTd.childNodes).forEach(node => {
                 if(node.nodeType === Node.TEXT_NODE && node !== valueSpanElement) {
                    parentTd.removeChild(node);
                 }
             });
            parentTd.appendChild(document.createTextNode(unitWithSpace));
        }
    }

    // Вспомогательная функция для парсинга числовых лимитов/итогов
    function parseNumericValue(value, defaultValue) {
         const number = parseFloat(value);
         return (typeof number === 'number' && isFinite(number)) ? number : defaultValue;
    }

    // Используем parseNumericValue
    function getNumericLimit(value, defaultValue = Infinity) {
         const number = parseNumericValue(value, defaultValue);
         // Лимит должен быть >= 0
         return (number >= 0) ? number : defaultValue;
    }

    function getNumericTotal(value, defaultValue = 0) {
         // Убедимся, что возвращаем 0, если значение некорректно
         const number = parseNumericValue(value, defaultValue);
         return number ?? defaultValue; // Возвращаем defaultValue, если number null или undefined
    }

    // Форматирует дату в читаемый вид в зависимости от языка (ДЛЯ КОЛОНКИ ДАТА)
    function formatDateDisplay(dateString) {
        if (!dateString || typeof dateString !== 'string') return '';
        // -- УБИРАЕМ ЛОГИКУ ОТСЮДА -- 
        // Теперь вызывающий код будет выбирать нужную функцию (RU или EN)
        try {
            const [year, month, day] = dateString.split('-');
            if (!year || !month || !day || year.length !== 4 || month.length !== 2 || day.length !== 2) {
                return dateString;
            }
            // Возвращаем части для использования в специфичных функциях
            return { day, month, year };
        } catch (e) {
            return { day: '??', month: '??', year: '????' }; // Возвращаем заглушку при ошибке
        }
    }
    // Новые функции для конкретных форматов
    function formatDateDisplay_RU(dateString) {
        const parts = formatDateDisplay(dateString);
        return `${parts.day}.${parts.month}.${parts.year}`;
    }
    function formatDateDisplay_EN(dateString) {
        const parts = formatDateDisplay(dateString);
        return `${parts.month}/${parts.day}/${parts.year}`;
    }

    // Форматирует дату для отображения в заголовке даты (ДЛЯ РАЗДЕЛИТЕЛЯ)
    function formatDateHeader(dateString) {
         if (!dateString || typeof dateString !== 'string') return '';
         // -- УБИРАЕМ ЛОГИКУ ОТСЮДА -- 
         // Теперь вызывающий код будет выбирать нужную функцию (RU или EN)
         try {
            const date = new Date(`${dateString}T00:00:00`);
             if (isNaN(date.getTime())) {
                 return dateString;
             }
             // Возвращаем части для использования в специфичных функциях
             return {
                day: date.getDate(),
                monthIndex: date.getMonth(),
                year: date.getFullYear()
             };
         } catch (e) {
             return { day: '??', monthIndex: 0, year: '????' }; // Возвращаем заглушку при ошибке
         }
    }
    // Новые функции для конкретных форматов
    const monthNamesRu = [
        'Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня',
        'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря'
    ];
    const monthNamesEn = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    function formatDateHeader_RU(dateString) {
        const parts = formatDateHeader(dateString);
        return `${parts.day} ${monthNamesRu[parts.monthIndex]} ${parts.year}`;
    }
    function formatDateHeader_EN(dateString) {
        const parts = formatDateHeader(dateString);
        return `${monthNamesEn[parts.monthIndex]} ${parts.day}, ${parts.year}`;
    }

    // Функция загрузки данных (лимитов и итогов) из localStorage при запуске
    function loadData() {
        let storedLimits = {};
        const limitsString = localStorage.getItem('dailyLimits');
        if (limitsString) {
            try {
                storedLimits = JSON.parse(limitsString);
            } catch (e) {
                localStorage.removeItem('dailyLimits'); // Удаляем поврежденные данные
                storedLimits = {};
            }
        }

        // Устанавливаем загруженные или дефолтные значения лимитов
        dailyLimits.calories = getNumericLimit(storedLimits.calories);
        dailyLimits.protein = getNumericLimit(storedLimits.protein);
        dailyLimits.fat = getNumericLimit(storedLimits.fat);
        dailyLimits.carbs = getNumericLimit(storedLimits.carbs);

        // Заполняем поля ввода лимитов значениями (если лимит установлен)
        if (caloriesLimitInput) caloriesLimitInput.value = isFinite(dailyLimits.calories) ? Math.round(dailyLimits.calories).toFixed(0) : '';
        if (proteinLimitInput) proteinLimitInput.value = isFinite(dailyLimits.protein) ? Math.round(dailyLimits.protein).toFixed(0) : '';
        if (fatLimitInput) fatLimitInput.value = isFinite(dailyLimits.fat) ? Math.round(dailyLimits.fat).toFixed(0) : '';
        if (carbsLimitInput) carbsLimitInput.value = isFinite(dailyLimits.carbs) ? Math.round(dailyLimits.carbs).toFixed(0) : '';

        // --- Загрузка ВСЕЙ Истории --- //
        fullHistory = []; // Начинаем с пустого массива
        const historyString = localStorage.getItem('fullHistory');
        if (historyString) {
            try {
                const parsedHistory = JSON.parse(historyString);
                if (Array.isArray(parsedHistory)) {
                    // Добавим более строгую проверку каждого элемента
                    fullHistory = parsedHistory.filter(item =>
                        typeof item === 'object' && item !== null && item.id && item.date && item.time &&
                        item.hasOwnProperty('name') &&
                        item.hasOwnProperty('protein') && typeof getNumericTotal(item.protein, null) === 'number' &&
                        item.hasOwnProperty('fat') && typeof getNumericTotal(item.fat, null) === 'number' &&
                        item.hasOwnProperty('carbs') && typeof getNumericTotal(item.carbs, null) === 'number' &&
                        item.hasOwnProperty('calories') && typeof getNumericTotal(item.calories, null) === 'number' &&
                        item.hasOwnProperty('weight') && typeof getNumericTotal(item.weight, null) === 'number'
                    ).map(item => ({ // Гарантируем, что числовые поля - это числа
                         ...item,
                         protein: getNumericTotal(item.protein),
                         fat: getNumericTotal(item.fat),
                         carbs: getNumericTotal(item.carbs),
                         calories: getNumericTotal(item.calories),
                         weight: getNumericTotal(item.weight) // Добавим вес сюда
                    }));
                } else {
                     localStorage.removeItem('fullHistory'); // Удаляем поврежденные данные
                     fullHistory = [];
                }
            } catch (e) {
                localStorage.removeItem('fullHistory'); // Удаляем поврежденные данные
                fullHistory = []; // Сбрасываем при ошибке
            }
        }

        // --- Расчет итогов ТЕКУЩЕГО дня на основе загруженной истории --- //
        calculateDailyTotals();

        // Загружаем данные с вступительной страницы, если они есть
        const userNutritionData = JSON.parse(localStorage.getItem('userNutritionData') || '{}');
        if (userNutritionData.calorieLimit) {
            document.getElementById('calories-limit').value = userNutritionData.calorieLimit;
            document.getElementById('protein-limit').value = userNutritionData.proteinLimit;
            document.getElementById('fat-limit').value = userNutritionData.fatLimit;
            document.getElementById('carbs-limit').value = userNutritionData.carbsLimit;
            
            // Если данные были загружены с вступительной страницы, сохраняем их как лимиты
            dailyLimits.calories = parseInt(userNutritionData.calorieLimit) || 0;
            dailyLimits.protein = parseInt(userNutritionData.proteinLimit) || 0;
            dailyLimits.fat = parseInt(userNutritionData.fatLimit) || 0;
            dailyLimits.carbs = parseInt(userNutritionData.carbsLimit) || 0;
            
            // Сохраняем лимиты в localStorage
            localStorage.setItem('dailyLimits', JSON.stringify(dailyLimits));
            
            // Если передан вес, сохраняем его в историю веса
            if (userNutritionData.weight) {
                const today = new Date().toISOString().split('T')[0];
                const weightEntry = {
                    date: today,
                    weight: parseFloat(userNutritionData.weight)
                };
                
                // Проверяем, есть ли уже запись за сегодня
                const weightHistoryData = JSON.parse(localStorage.getItem('weightHistory') || '[]');
                const todayEntryIndex = weightHistoryData.findIndex(entry => entry.date === today);
                
                if (todayEntryIndex === -1) {
                    // Если нет записи за сегодня, добавляем новую
                    weightHistoryData.push(weightEntry);
                    localStorage.setItem('weightHistory', JSON.stringify(weightHistoryData));
                    
                    // Если функция рендеринга истории веса доступна, обновляем таблицу
                    if (typeof renderWeightHistory === 'function') {
                        renderWeightHistory();
                    }
                }
            }
            
            // Удаляем данные из localStorage, чтобы они не загружались повторно
            localStorage.removeItem('userNutritionData');
            
            // Обновляем отображение остатков
            updateSummary();
        }
    }

    // --- Функции модальных окон --- //
    let confirmCallback = null; // Переменная для хранения колбэка подтверждения

    function showConfirmationModal(message, onConfirm) {
         if (!confirmationModal || !modalMessage) return;
        modalMessage.textContent = message; // Сообщение уже должно быть переведено перед вызовом
        confirmCallback = onConfirm;
        confirmationModal.classList.remove('is-notice');

        // Переводим кнопки при показе окна
        translateConfirmationModal();

        confirmationModal.classList.add('show');
        requestAnimationFrame(() => {
             if (confirmationModal) confirmationModal.classList.add('visible');
        });
    }

    function showInfoModal(message) {
         if (!confirmationModal || !modalMessage) return;
        modalMessage.textContent = message; // Сообщение уже должно быть переведено перед вызовом
        confirmCallback = null;
        confirmationModal.classList.add('is-notice');

        // Переводим кнопки при показе окна
        translateConfirmationModal();

        confirmationModal.classList.add('show');
        requestAnimationFrame(() => {
             if (confirmationModal) confirmationModal.classList.add('visible');
        });
    }

    // Функция для скрытия модального окна
    function hideConfirmationModal() {
         if (!confirmationModal) return;
        closeModal(confirmationModal); // Используем новую функцию закрытия
        confirmCallback = null; // Сбрасываем колбэк
    }

    // --- Обработчики событий модального окна --- //
    if (modalConfirmBtn) {
        modalConfirmBtn.addEventListener('click', () => {
            if (typeof confirmCallback === 'function') {
                try {
                     confirmCallback(); // Вызываем сохраненный колбэк
                 } catch (e) {
                 }
            }
            hideConfirmationModal(); // Скрываем окно
        });
    }

    if (modalCancelBtn) {
        modalCancelBtn.addEventListener('click', hideConfirmationModal); // Просто закрываем окно
    }

    if (modalOkBtn) {
        modalOkBtn.addEventListener('click', hideConfirmationModal); // Просто закрываем окно
    }

    if (confirmationModal) {
        confirmationModal.addEventListener('click', (event) => {
            if (event.target === confirmationModal) { // Клик был на сам фон, а не на контент
                hideConfirmationModal();
            }
        });
    }

     // --- Обработчики событий --- //

     // Вспомогательная функция для получения положительного числа из поля ввода
     function getPositiveNumberInput(inputElement, allowZero = false) {
         if (!inputElement) return null; // Проверка на существование элемента
         const value = parseFloat(inputElement.value);
         const limit = allowZero ? 0 : Number.EPSILON; // Используем EPSILON для проверки > 0
         let isValid = !isNaN(value) && value >= limit;

         if (!isValid) {
             let messageKey = '';
             if (inputElement === weightInput) {
                 messageKey = 'Пожалуйста, введите корректный вес продукта (положительное число больше 0).';
             } else {
                 messageKey = 'Пожалуйста, введите корректные значения БЖУ на 100г (неотрицательные числа).';
             }
             // Заменяем стандартный alert на кастомный диалог
             showInfoModal(getTranslation(messageKey));
             return null;
         }
         return value;
     }

     // Обработчик нажатия на кнопку "Добавить"
     if (addProductBtn) {
         addProductBtn.addEventListener('click', () => {
            // Используем getTranslation для имени по умолчанию
             const productName = productNameInput?.value.trim() || getTranslation('Продукт');

             // Получаем и валидируем числовые значения из полей ввода
             const protein100 = getPositiveNumberInput(protein100Input, true);
             const fat100 = getPositiveNumberInput(fat100Input, true);
             const carbs100 = getPositiveNumberInput(carbs100Input, true);
             const weight = getPositiveNumberInput(weightInput, false); // Вес должен быть > 0
             const finalWeight = Math.round(weight); // Добавлено: округляем вес

             // Проверка, что все значения получены
             if (protein100 === null || fat100 === null || carbs100 === null || weight === null) {
                 return; // Прерываем выполнение (alert уже показан)
             }

             // Расчет БЖУ и калорий для съеденного веса
             const protein = (protein100 / 100) * weight;
             const fat = (fat100 / 100) * weight;
             const carbs = (carbs100 / 100) * weight;
             // Стандартная формула расчета калорий: Белки*4 + Жиры*9 + Углеводы*4
             const finalProtein = Math.round(protein);
             const finalFat = Math.round(fat);
             const finalCarbs = Math.round(carbs);
             const finalCalories = Math.round(protein * 4 + fat * 9 + carbs * 4);

             // Формируем объект для записи в ИСТОРИЮ
             const now = new Date();
             const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
             const date = getTodayDateString();
             const id = Date.now().toString();

             const historyItem = { id, name: productName,
                                   protein: finalProtein, fat: finalFat, carbs: finalCarbs, calories: finalCalories,
                                   weight: finalWeight, // Добавлено: сохраняем вес
                                   date, time };

             // 1. Добавляем запись в ОБЩУЮ историю
             fullHistory.push(historyItem);

             // 2. Обновляем итоги ТЕКУЩЕГО дня
             dailyTotals.protein += finalProtein;
             dailyTotals.fat += finalFat;
             dailyTotals.carbs += finalCarbs;
             dailyTotals.calories += finalCalories;
             dailyTotals.items.push(historyItem); // Добавляем и во временный массив сегодняшних items

             // Обновляем отображение на странице и сохраняем данные
             updateSummary();

             // Очистка полей ввода
             if (productNameInput) productNameInput.value = '';
             if (protein100Input) protein100Input.value = '';
             if (fat100Input) fat100Input.value = '';
             if (carbs100Input) carbs100Input.value = '';
             if (weightInput) weightInput.value = '';

             if (productNameInput) productNameInput.focus();
         });
     }

    // Обработчик нажатия на кнопку "Сохранить лимит"
    if (saveLimitBtn) {
        saveLimitBtn.addEventListener('click', () => {
             const rawCalories = parseFloat(caloriesLimitInput?.value);
             const rawProtein = parseFloat(proteinLimitInput?.value);
             const rawFat = parseFloat(fatLimitInput?.value);
             const rawCarbs = parseFloat(carbsLimitInput?.value);

             const hasCalories = !isNaN(rawCalories) && rawCalories >= 0;
             const hasProtein = !isNaN(rawProtein) && rawProtein >= 0;
             const hasFat = !isNaN(rawFat) && rawFat >= 0;
             const hasCarbs = !isNaN(rawCarbs) && rawCarbs >= 0;

             const nutrientsCount = [hasProtein, hasFat, hasCarbs].filter(Boolean).length;
             const validationMessage = getTranslation('Для сохранения необходимо ввести калории и минимум два из трёх макронутриентов (БЖУ)');

             if (!hasCalories || nutrientsCount < 2) {
                 showInfoModal(validationMessage);
                 return;
             }

             let caloriesLimit = hasCalories ? Math.round(rawCalories) : Infinity;
             let proteinLimit = hasProtein ? Math.round(rawProtein) : Infinity;
             let fatLimit = hasFat ? Math.round(rawFat) : Infinity;
             let carbsLimit = hasCarbs ? Math.round(rawCarbs) : Infinity;

             // Рассчитываем недостающее значение, если необходимо
             if (hasProtein && hasFat && hasCarbs && !hasCalories) {
                 caloriesLimit = Math.round(proteinLimit * 4 + fatLimit * 9 + carbsLimit * 4);
                  if (caloriesLimitInput) caloriesLimitInput.value = caloriesLimit.toFixed(0);
             } else if (hasCalories && hasFat && hasCarbs && !hasProtein) {
                 const caloriesForProtein = caloriesLimit - fatLimit * 9 - carbsLimit * 4;
                 proteinLimit = Math.round(Math.max(0, caloriesForProtein / 4));
                  if (proteinLimitInput) proteinLimitInput.value = proteinLimit.toFixed(0);
             } else if (hasCalories && hasProtein && hasCarbs && !hasFat) {
                 const caloriesForFat = caloriesLimit - proteinLimit * 4 - carbsLimit * 4;
                 fatLimit = Math.round(Math.max(0, caloriesForFat / 9));
                  if (fatLimitInput) fatLimitInput.value = fatLimit.toFixed(0);
             } else if (hasCalories && hasProtein && hasFat && !hasCarbs) {
                 const caloriesForCarbs = caloriesLimit - proteinLimit * 4 - fatLimit * 9;
                 carbsLimit = Math.round(Math.max(0, caloriesForCarbs / 4));
                  if (carbsLimitInput) carbsLimitInput.value = carbsLimit.toFixed(0);
             }

             // Сохраняем лимиты
             dailyLimits.calories = caloriesLimit;
             dailyLimits.protein = proteinLimit;
             dailyLimits.fat = fatLimit;
             dailyLimits.carbs = carbsLimit;

             updateLimitPlaceholders(); // Обновляем плейсхолдеры
             updateSummary(); // Обновляем интерфейс и сохраняем данные

             const savedMessage = getTranslation('Лимиты сохранены!');
             showInfoModal(savedMessage);
        });
    }

    // Обработчик нажатия на кнопку "Очистить лимиты"
    if (clearLimitBtn) {
        clearLimitBtn.addEventListener('click', () => {
             const clearConfirmMessage = getTranslation('Вы уверены, что хотите очистить все установленные лимиты? Съеденные продукты останутся в истории.');

             showConfirmationModal(
                 clearConfirmMessage,
                 () => {
                     dailyLimits = { calories: Infinity, protein: Infinity, fat: Infinity, carbs: Infinity };
                     if (caloriesLimitInput) caloriesLimitInput.value = '';
                     if (proteinLimitInput) proteinLimitInput.value = '';
                     if (fatLimitInput) fatLimitInput.value = '';
                     if (carbsLimitInput) carbsLimitInput.value = '';
                     updateLimitPlaceholders();
                     updateSummary();
                     const clearedMessage = getTranslation('Лимиты успешно очищены.');
                     showInfoModal(clearedMessage);
                 }
             );
        });
    }

    // Обработчик нажатия на кнопку "Начать новый день"
    if (resetDayBtn) {
        resetDayBtn.addEventListener('click', () => {
             const resetConfirmMessage = getTranslation('Вы уверены, что хотите сбросить счетчики текущего дня? История сохранится.');

             showConfirmationModal(
                 resetConfirmMessage,
                 () => {
                     dailyTotals = { protein: 0, fat: 0, carbs: 0, calories: 0, items: [] };
                     updateSummary();
                     const resetSuccessMessage = getTranslation('Счетчики текущего дня успешно сброшены!');
                     showInfoModal(resetSuccessMessage);
                 }
             );
        });
    }

    // Обработка удаления записи из истории
     if (historyTbody) {
         historyTbody.addEventListener('click', (event) => {
             const targetButton = event.target.closest('.delete-btn');
             if (targetButton) {
                 const idToRemove = targetButton.dataset.id;
                 const indexToRemove = fullHistory.findIndex(item => item.id === idToRemove);

                 if (indexToRemove !== -1) {
                     const deleteConfirmMessage = getTranslation('Вы уверены, что хотите удалить эту запись из истории?');
                     showConfirmationModal(
                         deleteConfirmMessage,
                         () => {
                             const removedItemDate = fullHistory[indexToRemove].date;
                             fullHistory.splice(indexToRemove, 1);

                             const todayDate = getTodayDateString();
                             if (removedItemDate === todayDate) {
                                 calculateDailyTotals(); // Пересчитываем итоги только если удалили сегодняшнюю запись
                             }
                             updateSummary(); // Обновляем интерфейс
                             // showInfoModal(getTranslation('Запись удалена.')); // Опциональное уведомление
                         }
                     );
                 }
             }
         });
     }

    // Функция для экспорта истории в CSV формат
    function exportHistoryToCSV() {
        if (fullHistory.length === 0) {
            showInfoModal(getTranslation('История приема пищи пуста. Нечего экспортировать.'));
            return;
        }

        // Заголовки столбцов (первая строка CSV)
        const csvHeaders = [
            getTranslation('НАЗВАНИЕ'),
            getTranslation('БЕЛКИ (Г)'),
            getTranslation('ЖИРЫ (Г)'),
            getTranslation('УГЛЕВОДЫ (Г)'),
            getTranslation('КАЛОРИИ (ККАЛ)'),
            getTranslation('ВЕС (Г)'), // Добавляем заголовок веса в CSV
            getTranslation('ДАТА'),
            getTranslation('ВРЕМЯ')
        ];

        // Формируем строки данных
        const rows = fullHistory.map(item => {
            const formattedDate = getDateFormatter(false)(item.date);
            return [
                item.name,
                Math.round(item.protein),
                Math.round(item.fat),
                Math.round(item.carbs),
                Math.round(item.calories),
                item.weight, // Добавлено: вес в CSV
                formattedDate,
                item.time
            ];
        });

        // Сортируем записи по дате и времени (от новых к старым)
         rows.sort((a, b) => {
             const dateA = parseFormattedDate(a[5], a[6]);
             const dateB = parseFormattedDate(b[5], b[6]);
              if (isNaN(dateA) || isNaN(dateB)) return 0;
             return dateB.getTime() - dateA.getTime();
         });

        rows.unshift(csvHeaders);

        let csvContent = rows.map(row => {
            return row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';');
        }).join('\r\n');

        const BOM = '\uFEFF';
        csvContent = BOM + csvContent;

        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const fileName = `food_journal_${dateStr}.csv`;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Вспомогательная функция для парсинга ОТФОРМАТИРОВАННОЙ даты/времени для сортировки CSV
    function parseFormattedDate(dateStr, timeStr) {
         if (!dateStr || !timeStr) return new Date(NaN);
         try {
            let day, month, year, hours, minutes;
            const timeParts = timeStr.split(':');
             hours = parseInt(timeParts[0], 10);
             minutes = parseInt(timeParts[1], 10);

             if (dateStr.includes('.')) { // Русский формат ДД.ММ.ГГГГ
                 const dateParts = dateStr.split('.');
                 day = parseInt(dateParts[0], 10);
                 month = parseInt(dateParts[1], 10) - 1;
                 year = parseInt(dateParts[2], 10);
             } else if (dateStr.includes('/')) { // Американский формат ММ/ДД/ГГГГ
                 const dateParts = dateStr.split('/');
                 month = parseInt(dateParts[0], 10) - 1;
                 day = parseInt(dateParts[1], 10);
                 year = parseInt(dateParts[2], 10);
             } else {
                  return new Date(NaN);
             }

             if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hours) || isNaN(minutes)) {
                 return new Date(NaN);
             }
             return new Date(year, month, day, hours, minutes);
         } catch (e) {
             return new Date(NaN);
         }
    }

    // Обработчик нажатия на кнопку экспорта
     if (exportHistoryBtn) {
        exportHistoryBtn.addEventListener('click', exportHistoryToCSV);
     }

    // Обработчик ввода текста в поле поиска истории
     if (historySearch) {
        historySearch.addEventListener('input', function() {
            updateSummary();
        });
     }

    // Обработчики для кнопки информации
    if (infoBtn) {
        infoBtn.addEventListener('click', () => {
             if (infoCloseBtn) infoCloseBtn.textContent = getTranslation('ОК');
            translateInfoModalStaticContent(); // Переводим контент при открытии

             if (infoModal) {
                 openModal(infoModal); // Используем новую функцию открытия
             }
        });
    }

    if (infoCloseBtn) {
        infoCloseBtn.addEventListener('click', () => {
             if (infoModal) {
                closeModal(infoModal); // Закрываем через новую функцию
            }
        });
    }

    if (infoModal) {
        infoModal.addEventListener('click', (event) => {
            if (event.target === infoModal) {
                closeModal(infoModal); // Закрываем через новую функцию
            }
        });
    }

    // Функция для управления фейдом в инфо-окне
    function updateInfoFade() {
        if (!infoTextElement) return;
        const scrollThreshold = 1;
        const isScrollable = infoTextElement.scrollHeight > infoTextElement.clientHeight;
        const isScrolledToBottom = infoTextElement.scrollHeight - infoTextElement.scrollTop - infoTextElement.clientHeight <= scrollThreshold;

        if (isScrollable && !isScrolledToBottom) {
            infoTextElement.classList.add('fade-bottom');
        } else {
            infoTextElement.classList.remove('fade-bottom');
        }
    }

    if (infoTextElement) {
        infoTextElement.addEventListener('scroll', updateInfoFade);
    }

    // Обновляет отображение текущей выбранной даты в навигации
    function updateDateDisplay() {
         if (!currentDateDisplay) return;

        if (selectedDate) {
             if (historyDateInput) historyDateInput.value = selectedDate;
            // --- ИСПОЛЬЗУЕМ НОВУЮ ФУНКЦИЮ ВМЕСТО ПРЯМОЙ ПРОВЕРКИ ---
            currentDateDisplay.textContent = getDateFormatter(true)(selectedDate);
            updateNavigationButtonsState();
        } else {
            currentDateDisplay.textContent = getTranslation('Все дни');
             if (historyDateInput) historyDateInput.value = '';
             if (prevDayBtn) prevDayBtn.disabled = true;
             if (nextDayBtn) nextDayBtn.disabled = true;
        }
    }

    // Обновляет состояние кнопок навигации
    function updateNavigationButtonsState() {
        if (!prevDayBtn || !nextDayBtn) return;

        if (!selectedDate) {
             prevDayBtn.disabled = true;
             nextDayBtn.disabled = true;
            return;
        }

        const availableDates = [...new Set(fullHistory.map(item => item.date))].sort();
        if (availableDates.length === 0 || !availableDates.includes(selectedDate)) {
            prevDayBtn.disabled = true;
            nextDayBtn.disabled = true;
            return;
        }

        const currentDateIndex = availableDates.indexOf(selectedDate);
        prevDayBtn.disabled = currentDateIndex <= 0;
        nextDayBtn.disabled = currentDateIndex >= availableDates.length - 1;
    }

    // Переход к предыдущему дню
    function goToPrevDay() {
        if (!selectedDate) return;
        const availableDates = [...new Set(fullHistory.map(item => item.date))].sort();
        const currentIndex = availableDates.indexOf(selectedDate);
        if (currentIndex > 0) {
            setSelectedDate(availableDates[currentIndex - 1]);
            // Добавляем обновление input поля даты, отображения даты и состояния кнопок
            if (historyDateInput) historyDateInput.value = availableDates[currentIndex - 1];
            updateDateDisplay();
            updateNavigationButtonsState();
        }
    }

    // Переход к следующему дню
    function goToNextDay() {
        if (!selectedDate) return;
        const availableDates = [...new Set(fullHistory.map(item => item.date))].sort();
        const currentIndex = availableDates.indexOf(selectedDate);
        if (currentIndex >= 0 && currentIndex < availableDates.length - 1) {
            setSelectedDate(availableDates[currentIndex + 1]);
            // Добавляем обновление input поля даты, отображения даты и состояния кнопок
            if (historyDateInput) historyDateInput.value = availableDates[currentIndex + 1];
            updateDateDisplay();
            updateNavigationButtonsState();
        }
    }

    // Установка выбранной даты для фильтрации
    function setSelectedDate(date) {
         const newSelectedDate = (typeof date === 'string' && date) ? date : null;
        if (selectedDate === newSelectedDate) return;
        selectedDate = newSelectedDate;
        
        // Обновляем input поля даты, если выбрана конкретная дата
        if (historyDateInput && selectedDate) {
            historyDateInput.value = selectedDate;
        } else if (historyDateInput) {
            historyDateInput.value = '';
        }
        
        updateSummary(); // Обновляем таблицу с историей
        updateDateDisplay(); // Обновляем отображение текущей даты
        updateNavigationButtonsState(); // Обновляем состояние кнопок навигации
    }

    // --- Инициализация при загрузке страницы --- //
    loadTheme();     // Загружаем и применяем тему ПЕРЕД остальной инициализацией
    loadData();      // Загружаем данные
    loadWeightHistory(); // Загружаем историю веса

    // Инициализация языка и контролов
    currentLang = localStorage.getItem('appLanguage') || 'ru';
    document.documentElement.lang = currentLang;
    updateLangControlState(); // Устанавливаем начальное состояние контрола

    translateUI();   // Применяем переводы (должно быть после загрузки темы, чтобы title кнопок темы перевелись)
    updateSummary(); // Первоначальное обновление интерфейса

    // Обработчики для навигации по дням
     if (prevDayBtn) {
        prevDayBtn.addEventListener('click', goToPrevDay);
     }
     if (nextDayBtn) {
        nextDayBtn.addEventListener('click', goToNextDay);
     }
     if (allDaysBtn) {
        allDaysBtn.addEventListener('click', () => setSelectedDate(null));
     }

    // Генерирует сообщение об отсутствии записей для указанной даты
    function generateNoEntriesMessage(dateValue) {
         if (!dateValue) return "";
         // --- ИСПОЛЬЗУЕМ НОВУЮ ФУНКЦИЮ ВМЕСТО ПРЯМОЙ ПРОВЕРКИ ---
         const formattedDate = getDateFormatter(true)(dateValue);
          const baseMessageKey = 'На дату %DATE% нет записей.';
          const baseMessage = getTranslation(baseMessageKey);
          // Заменяем плейсхолдер %DATE% отформатированной датой
          return baseMessage.replace('%DATE%', formattedDate);
    }

    // Выбор даты через календарь
     if (historyDateInput) {
        historyDateInput.addEventListener('change', function() {
            const dateValue = this.value;
            if (dateValue) {
                const hasEntriesForDate = fullHistory.some(item => item.date === dateValue);
                if (hasEntriesForDate) {
                    setSelectedDate(dateValue);
                } else {
                    const message = generateNoEntriesMessage(dateValue);
                    showInfoModal(message);
                    this.value = selectedDate || ''; // Возвращаем старое значение
                    updateDateDisplay(); // Обновляем отображение текста
                }
            } else {
                 setSelectedDate(null); // Если дата очищена
            }
        });
     }

    // Открытие календаря при клике на контейнер даты
    const datePickerTrigger = document.getElementById('date-picker-trigger');
     if (datePickerTrigger && historyDateInput) {
         datePickerTrigger.addEventListener('click', function() {
             try {
                 if (historyDateInput.showPicker) {
                     historyDateInput.showPicker();
                 } else {
                     historyDateInput.focus();
                     historyDateInput.click();
                 }
             } catch (e) {
                 historyDateInput.focus(); // Фоллбэк
             }
         });
     }

    // --- Новые функции для трекинга веса ---

    // Загрузка истории веса из localStorage
    function loadWeightHistory() {
        try {
            const storedWeightHistory = localStorage.getItem('weightHistory');
            if (storedWeightHistory) {
                const parsedHistory = JSON.parse(storedWeightHistory);
                if (Array.isArray(parsedHistory)) {
                    // Простая валидация записей + добавление ID если отсутствует для старых записей
                    weightHistory = parsedHistory.map((item, index) => ({
                        id: item.id || Date.now().toString() + index, // Гарантируем наличие ID
                        date: item.date,
                        weight: typeof item.weight === 'number' ? item.weight : 0
                    })).filter(item => item.date && typeof item.weight === 'number');
                } else {
                    weightHistory = [];
                }
            } else {
                weightHistory = [];
            }
        } catch (e) {
            weightHistory = [];
            localStorage.removeItem('weightHistory');
        }
    }
    // Сохранение истории веса в localStorage
    function saveWeightHistory() {
        try {
            localStorage.setItem('weightHistory', JSON.stringify(weightHistory));
        } catch (e) {
            // Используем кастомную модалку вместо alert
            showInfoModalAlert(getTranslation('Не удалось сохранить данные. Возможно, хранилище переполнено.'));
        }
    }

    // Удаляем старую функцию addWeightHistoryRow, так как рендеринг будет внутри renderWeightHistory
    /*
    function addWeightHistoryRow(item) { ... }
    */

    // Рендер (перерисовка) таблицы истории веса
    function renderWeightHistory() {
        if (!weightHistoryTbody) return;
        weightHistoryTbody.innerHTML = ''; // Очищаем таблицу

        // УБИРАЕМ СОРТИРОВКУ, записи будут рендериться в порядке массива

        // Если история пуста, показываем сообщение
        if (weightHistory.length === 0) {
            const emptyMessage = getTranslation('История веса пуста.', 'История веса пуста.');
            weightHistoryTbody.innerHTML = `<tr><td colspan="3">${emptyMessage}</td></tr>`;
            return;
        }

        // Добавляем строки в таблицу (теперь в НАЧАЛО)
        weightHistory.forEach(item => {
            const row = weightHistoryTbody.insertRow(0); // Вставляем в НАЧАЛО (индекс 0)!
            row.dataset.id = item.id;

            const dateCell = row.insertCell();
            dateCell.textContent = getDateFormatter(false)(item.date);

            const weightCell = row.insertCell();
            weightCell.textContent = `${item.weight.toFixed(1)} ${getTranslation('кг')}`;

            const actionCell = row.insertCell();
            const deleteButton = document.createElement('button');
            deleteButton.innerHTML = '<i data-feather="trash-2"></i>';
            deleteButton.classList.add('btn', 'btn-danger', 'delete-weight-btn');
            deleteButton.title = getTranslation('Удалить запись о весе');
            deleteButton.setAttribute('aria-label', getTranslation('Удалить запись о весе'));
            actionCell.appendChild(deleteButton);
        });

        feather.replace(); // Обновляем иконки Feather ОДИН раз после цикла
    }

    // Обработчик сохранения веса
    function handleSaveWeight() {
        const weightValue = parseFloat(currentWeightInput?.value);
        const dateValue = measurementDateInput?.value;

        // Валидация
        if (isNaN(weightValue) || weightValue <= 0) {
            showInfoModalAlert(getTranslation('Пожалуйста, введите корректный вес (положительное число).'));
            return;
        }
        if (!dateValue) {
            showInfoModalAlert(getTranslation('Пожалуйста, выберите дату замера.'));
            return;
        }

        const weightEntry = {
            id: Date.now().toString(),
            date: dateValue,
            weight: parseFloat(weightValue.toFixed(1)) // Сохраняем с 1 знаком после запятой
        };

        weightHistory.push(weightEntry); // Добавляем в конец массива

        saveWeightHistory(); // Сохраняем в localStorage
        renderWeightHistory(); // Обновляем таблицу

        // Очищаем поля
        if (currentWeightInput) currentWeightInput.value = '';
        // Не очищаем дату, чтобы было удобнее вводить замеры подряд

        showInfoModalAlert(getTranslation('Вес успешно сохранен!')); // Используем кастомную модалку
    }

    // Функция обработки клика на кнопку удаления веса (вызывается из делегирования)
    function handleDeleteWeightClick(button) {
        const row = button.closest('tr'); // Находим ближайшую строку
        if (!row) return;
        const entryId = row.dataset.id;

        if (!entryId) {
            console.error('Не удалось найти ID записи для удаления');
            return;
        }

        const entryIndex = weightHistory.findIndex(entry => entry.id === entryId);

        if (entryIndex === -1) {
            console.error('Не удалось найти запись о весе для удаления в массиве:', entryId);
            return;
        }

        const message = getTranslation('Вы уверены, что хотите удалить эту запись о весе?');
        showConfirmationModal(message, () => {
            // Удаляем запись из массива
            weightHistory.splice(entryIndex, 1);
            // Сохраняем обновленную историю
            saveWeightHistory();
            // Удаляем строку из таблицы DOM
            row.remove();
            // Показываем уведомление
            showInfoModalAlert(getTranslation('Запись о весе удалена.'));
            // Если история стала пуста, отображаем сообщение
            if (weightHistory.length === 0 && weightHistoryTbody) {
                const emptyMessage = getTranslation('История веса пуста.', 'История веса пуста.'); // Добавляем fallback
                weightHistoryTbody.innerHTML = `<tr><td colspan="3">${emptyMessage}</td></tr>`;
            }
        });
    }

    // Удаляем старую функцию handleDeleteWeight(event), если она еще где-то осталась
    /*
    function handleDeleteWeight(event) { ... }
    */

    // --- Инициализация при загрузке страницы --- //
    // ... (пропускаем неизмененный код инициализации: loadTheme, loadData и т.д.) ...
    loadTheme();
    loadData();
    loadWeightHistory();
    // Устанавливаем язык до перевода
    currentLang = localStorage.getItem('appLanguage') || 'ru';
    document.documentElement.lang = currentLang;
    updateLangControlState();

    translateUI();
    updateSummary(); // Включает renderWeightHistory

    // --- Добавляем обработчики для секции веса --- (ИСПРАВЛЕНО)
    if (saveWeightBtn) {
        saveWeightBtn.addEventListener('click', handleSaveWeight);
    }

    // Делегирование событий для кнопки удаления веса (ИСПРАВЛЕНО)
    if (weightTrackingSection) {
        weightTrackingSection.addEventListener('click', (event) => {
            // Ищем кнопку удаления, по которой кликнули
            const deleteButton = event.target.closest('.delete-weight-btn');
            if (deleteButton) {
                // Вызываем новую функцию обработки клика
                handleDeleteWeightClick(deleteButton);
            }
        });
    }

    // Устанавливаем сегодняшнюю дату по умолчанию для поля замера веса
    if (measurementDateInput) {
        measurementDateInput.value = getTodayDateString();
    }

    // ... (остальной код файла: feather.replace, document.title)

    // Инициализация кнопки советов
    const goalTipsBtn = document.getElementById('goal-tips-trigger');
    if (goalTipsBtn) {
        goalTipsBtn.addEventListener('click', showGoalTips);
        console.log('Обработчик для кнопки советов добавлен');
    }
}); // Конец addEventListener('DOMContentLoaded')

