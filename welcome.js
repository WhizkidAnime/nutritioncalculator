document.addEventListener('DOMContentLoaded', function() {
    // Определение элементов страницы
    const goalButtons = document.querySelectorAll('.goal-btn');
    const genderButtons = document.querySelectorAll('.gender-btn');
    const calculateBtn = document.getElementById('calculate-btn');
    const useCalculatorBtn = document.getElementById('use-calculator-btn');
    const recalculateBtn = document.getElementById('recalculate-btn');
    const recalculateHeaderBtn = document.getElementById('recalculate-header-btn');
    const infoBtn = document.getElementById('info-btn');
    const infoModal = document.getElementById('info-modal');
    const infoCloseBtn = document.getElementById('info-close-btn');
    
    // Модальное окно для уведомлений
    const alertModal = document.getElementById('alert-modal');
    const alertMessage = document.getElementById('alert-message');
    const alertOkBtn = document.getElementById('alert-ok-btn');
    
    // Секции
    const characterCreation = document.getElementById('character-creation');
    const calculationResults = document.getElementById('calculation-results');
    
    // --- Переменная для хранения элемента, открывшего модальное окно ---
    let modalTriggerElement = null;
    
    // --- Вспомогательные функции для управления фокусом в модальных окнах ---
    // (Копируем из script.js, так как файлы изолированы)
    
    // Получить все фокусируемые элементы внутри контейнера
    function getFocusableElements(container) {
      return Array.from(
        container.querySelectorAll(
          'button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter(el => !el.disabled && el.offsetWidth > 0 && el.offsetHeight > 0);
    }
    
    // Ловушка фокуса внутри модального окна
    function trapFocus(modalElement, event) {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements(modalElement);
       if (focusableElements.length === 0) {
            event.preventDefault();
            return;
       }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) { // Shift + Tab
        if (document.activeElement === firstElement) {
          lastElement.focus();
          event.preventDefault();
        }
      } else { // Tab
        if (document.activeElement === lastElement) {
          firstElement.focus();
          event.preventDefault();
        }
      }
    }
    
    // Функция для открытия модального окна с управлением фокусом
    function openModal(modalElement) {
        if (!modalElement) return;
        modalTriggerElement = document.activeElement; // Сохраняем элемент

        modalElement.classList.add('show');
        modalElement.setAttribute('aria-hidden', 'false');

        requestAnimationFrame(() => {
            modalElement.classList.add('visible');

            // Фокус на кнопку OK или Close, или первый элемент
            const focusTarget =
                modalElement.querySelector('#alert-ok-btn') || // OK в alert-modal
                modalElement.querySelector('#info-close-btn') || // Close в info-modal
                modalElement.querySelector('.btn') || // Любая кнопка
                (getFocusableElements(modalElement).length > 0 ? getFocusableElements(modalElement)[0] : null);

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
            delete modalElement.focusTrapListener;
        }

        setTimeout(() => {
            modalElement.classList.remove('show');

            // Возвращаем фокус
            if (modalTriggerElement) {
                // Добавляем проверку, существует ли элемент и виден ли он
                if (document.body.contains(modalTriggerElement) && modalTriggerElement.offsetWidth > 0 && modalTriggerElement.offsetHeight > 0) {
                     try {
                        modalTriggerElement.focus();
                     } catch (e) {
                         console.warn('Could not focus trigger element:', e);
                         // Fallback: focus on body or another suitable element if needed
                         document.body.focus();
                     }
                } else {
                    console.warn('Trigger element is no longer available or visible to focus.');
                    document.body.focus(); // Фокусируемся на body как fallback
                }
                modalTriggerElement = null;
            }
        }, 200); // Соответствует времени анимации CSS
    }
    
    // Данные пользователя
    let userData = {
        goal: '',
        gender: '',
        age: 0,
        height: 0,
        weight: 0,
        activityLevel: 1.55
    };
    
    // Сначала загружаем сохраненные данные
    loadSavedData();
    
    // Затем инициализируем Choices.js для селекта активности
    const activityLevelSelect = document.getElementById('activity-level');
    let choicesInstance = null;
    if (activityLevelSelect) {
        // Инициализируем Choices.js для селекта активности
        choicesInstance = new Choices(activityLevelSelect, {
            searchEnabled: false, // Отключаем поиск
            itemSelectText: '', // Убираем текст "Press to select"
            shouldSort: false, // Не сортируем опции
            position: 'bottom', // Явно указываем, что список должен открываться вниз
        });
        
        // Устанавливаем значение активности после инициализации Choices.js
        // Перенесено в loadSavedData
        /*
        if (userData.activityLevel) {
            choicesInstance.setChoiceByValue(String(userData.activityLevel));
            console.log('Активность установлена при инициализации Choices.js:', userData.activityLevel);
        }
        */
    }
    
    // Загружаем тему
    if (typeof window.loadTheme === 'function') {
        window.loadTheme();
    }
    
    // Загружаем переводы
    if (typeof window.translateUI === 'function') {
        window.translateUI();
    }
    
    // Функции для работы с модальным окном уведомлений
    function showAlert(message) {
        if (!alertModal || !alertMessage) return;
        alertMessage.textContent = message;
        openModal(alertModal); // Используем новую функцию
    }
    
    function hideAlert() {
        if (!alertModal) return;
        closeModal(alertModal); // Используем новую функцию
    }
    
    // Обработчики событий модального окна уведомлений
    if (alertOkBtn) {
        alertOkBtn.addEventListener('click', hideAlert);
    }
    
    if (alertModal) {
        alertModal.addEventListener('click', (event) => {
            if (event.target === alertModal) {
                hideAlert();
            }
        });
    }
    
    // Обработчики для кнопок выбора цели
    goalButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Удаляем класс selected у всех кнопок
            goalButtons.forEach(btn => btn.classList.remove('selected'));
            // Добавляем класс selected текущей кнопке
            this.classList.add('selected');
            // Сохраняем выбранную цель
            userData.goal = this.dataset.goal;
        });
    });
    
    // Обработчики для кнопок выбора пола
    genderButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Удаляем класс selected у всех кнопок
            genderButtons.forEach(btn => btn.classList.remove('selected'));
            // Добавляем класс selected текущей кнопке
            this.classList.add('selected');
            // Сохраняем выбранный пол
            userData.gender = this.dataset.gender;
        });
    });
    
    // Обработчик для поля активности
    if (activityLevelSelect) {
        activityLevelSelect.addEventListener('change', function() {
            userData.activityLevel = parseFloat(this.value);
        });
    }
    
    // Обработчик нажатия на кнопку расчета
    if (calculateBtn) {
        calculateBtn.addEventListener('click', function() {
            // Получаем данные из полей
            const ageInput = document.getElementById('age');
            const heightInput = document.getElementById('height');
            const weightInput = document.getElementById('weight');

            const age = parseInt(ageInput?.value) || 0; // Добавляем ?. для безопасности
            const height = parseInt(heightInput?.value) || 0;
            const weight = parseFloat(weightInput?.value) || 0;

            // Получаем выбранную цель
            const selectedGoalBtn = document.querySelector('.goal-btn.selected');
            const goal = selectedGoalBtn ? selectedGoalBtn.getAttribute('data-goal') : '';

            // Получаем выбранный пол
            const selectedGenderBtn = document.querySelector('.gender-btn.selected');
            const gender = selectedGenderBtn ? selectedGenderBtn.getAttribute('data-gender') : '';

            // Получаем уровень активности (берем из userData, т.к. он обновляется при change)
            const activityLevel = userData.activityLevel || 1.55;

            // Проверяем, что все данные введены
            if (!goal) {
                showAlert(getTranslation('Выберите цель!'));
                return;
            }
            if (!gender) {
                showAlert(getTranslation('Выберите пол!'));
                return;
            }
            if (age < 12 || age > 100) {
                showAlert(getTranslation('Введите корректный возраст (от 12 до 100 лет)!'));
                return;
            }
            if (height < 100 || height > 250) {
                showAlert(getTranslation('Введите корректный рост (от 100 до 250 см)!'));
                return;
            }
            if (weight < 30 || weight > 300) {
                showAlert(getTranslation('Введите корректный вес (от 30 до 300 кг)!'));
                return;
            }

            // Расчет калорий и БЖУ
            const currentUserData = {
                goal: goal,
                gender: gender,
                age: age,
                height: height,
                weight: weight,
                activityLevel: activityLevel
            };

            calculateNutrition(currentUserData);

            // Показываем результаты, скрываем форму ввода
            if (characterCreation) characterCreation.classList.add('hidden');
            if (calculationResults) calculationResults.classList.remove('hidden');

            // Устанавливаем фокус на заголовок результатов для скринридеров
            const resultsHeader = calculationResults?.querySelector('h2');
            if (resultsHeader) {
                resultsHeader.setAttribute('tabindex', '-1'); // Делаем фокусируемым программно
                resultsHeader.focus();
            }
        });
    }
    
    // Обработчик для кнопки "Пересчитать"
    const recalculateHandler = function() {
        // Скрываем результаты, показываем форму
        document.getElementById('calculation-results').classList.add('hidden');
        document.getElementById('character-creation').classList.remove('hidden');
    };
    recalculateBtn.addEventListener('click', recalculateHandler);
    recalculateHeaderBtn.addEventListener('click', recalculateHandler);
    
    // Обработчик для кнопки "Начать приключение"
    document.getElementById('use-calculator-btn').addEventListener('click', function() {
        // Читаем сохраненные данные пользователя
        const savedData = localStorage.getItem('savedUserData');
        if (savedData) {
            // Преобразуем сохраненные данные в формат userNutritionData для main page
            const parsedData = JSON.parse(savedData);
            
            // Создаем объект с данными для основной страницы
            const userNutritionData = {
                calorieLimit: parsedData.calorieLimit,
                proteinLimit: parsedData.proteinLimit,
                fatLimit: parsedData.fatLimit,
                carbsLimit: parsedData.carbsLimit,
                weight: parsedData.weight
            };
            
            // Сохраняем данные в localStorage с ключом userNutritionData
            localStorage.setItem('userNutritionData', JSON.stringify(userNutritionData));
        }
        
        // Переходим на главную страницу калькулятора
        window.location.href = 'calculator.html';
    });
    
    // Обработчики для информационного модального окна
    if (infoBtn) {
        infoBtn.addEventListener('click', function() {
            if (infoModal) {
                // Сначала убедимся, что контент переведен, если функция translateInfoModalStaticContent существует
                if (typeof window.translateInfoModalStaticContent === 'function') {
                     window.translateInfoModalStaticContent();
                }
                openModal(infoModal); // Используем новую функцию открытия
            }
        });
    }
    
    // Обработчик закрытия информационного модального окна
    if (infoCloseBtn) {
        infoCloseBtn.addEventListener('click', function() {
            if (infoModal) {
                closeModal(infoModal); // Используем новую функцию закрытия
            }
        });
    }
    
    // Закрытие информационного модального окна по клику вне его
     if (infoModal) {
        infoModal.addEventListener('click', (event) => {
            if (event.target === infoModal) {
                 closeModal(infoModal);
            }
        });
    }
    
    // Закрытие модальных окон по нажатию Escape
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (alertModal && alertModal.classList.contains('show')) {
                hideAlert();
            }
            if (infoModal && infoModal.classList.contains('show')) {
                closeModal(infoModal);
            }
        }
    });
    
    // Функция расчета калорий и макронутриентов
    function calculateNutrition(userData) {
        // Расчет базового обмена веществ (BMR) по формуле Миффлина-Сан Жеора
        let bmr = 0;
        if (userData.gender === 'male') {
            bmr = 10 * userData.weight + 6.25 * userData.height - 5 * userData.age + 5;
        } else {
            bmr = 10 * userData.weight + 6.25 * userData.height - 5 * userData.age - 161;
        }
        
        // Расчет общих затрат энергии (TDEE)
        let tdee = bmr * userData.activityLevel;
        
        // Корректировка для цели
        let calories = 0;
        
        switch(userData.goal) {
            case 'lose':
                calories = tdee - 500; // Дефицит 500 ккал для похудения
                break;
            case 'gain':
                calories = tdee + 500; // Профицит 500 ккал для набора массы
                break;
            case 'maintain':
                calories = tdee; // Поддержание текущего веса
                break;
            default:
                calories = tdee;
        }
        
        // Расчет макронутриентов
        let protein = 0, fat = 0, carbs = 0;
        
        if (userData.goal === 'lose') {
            // Похудение: Больше белка и меньше углеводов
            protein = userData.weight * 2.2; // 2.2г/кг веса
            fat = userData.weight * 1; // 1г/кг веса
            // Остальное - углеводы
            carbs = (calories - (protein * 4 + fat * 9)) / 4;
        } else if (userData.goal === 'gain') {
            // Набор массы: Больше белка и углеводов
            protein = userData.weight * 2; // 2г/кг веса
            fat = userData.weight * 0.8; // 0.8г/кг веса
            // Остальное - углеводы
            carbs = (calories - (protein * 4 + fat * 9)) / 4;
        } else {
            // Поддержание: Сбалансированно
            protein = userData.weight * 1.8; // 1.8г/кг веса
            fat = userData.weight * 0.8; // 0.8г/кг веса
            // Остальное - углеводы
            carbs = (calories - (protein * 4 + fat * 9)) / 4;
        }
        
        // Проверка на отрицательное количество углеводов
        if (carbs < 50) {
            carbs = 50; // Минимум 50г углеводов
            // Пересчитываем жиры, учитывая фиксированный белок и углеводы
            fat = (calories - (protein * 4 + carbs * 4)) / 9;
            
            // Если жиры получились слишком низкими, корректируем белок
            if (fat < 0.3 * userData.weight) {
                fat = 0.3 * userData.weight; // Минимум 0.3г/кг жиров
                protein = (calories - (fat * 9 + carbs * 4)) / 4;
            }
        }
        
        // Округление значений
        calories = Math.round(calories);
        protein = Math.round(protein);
        fat = Math.round(fat);
        carbs = Math.round(carbs);
        
        // Отображение результатов
        document.getElementById('calorie-result').textContent = calories;
        document.getElementById('protein-result').textContent = protein;
        document.getElementById('fat-result').textContent = fat;
        document.getElementById('carbs-result').textContent = carbs;
        
        // Показываем совет в зависимости от цели
        showAdviceForGoal(userData.goal);
        
        // Сохраняем данные в localStorage
        saveUserData(userData, calories, protein, fat, carbs);
        
        return {
            calories: calories,
            protein: protein,
            fat: fat,
            carbs: carbs
        };
    }
    
    // Функция для отображения советов в зависимости от выбранной цели
    function showAdviceForGoal(goal) {
        const adviceEl = document.getElementById('advice-content');
        if (!adviceEl) return; // Проверка наличия элемента
        
        let adviceHTML = '';
        
        // Получаем текущий язык из localStorage
        const currentLang = localStorage.getItem('lang') || 'ru';
        
        if (currentLang === 'ru') {
            // Советы на русском языке
            if (goal === 'lose') {
                adviceHTML = `
                    <p data-translation-key="ДОБАВЬТЕ КАРДИО ПОСЛЕ СИЛОВОЙ ТРЕНИРОВКИ ИЛИ В ОТДЕЛЬНЫЙ ДЕНЬ НА ЛЕГКОМ ПУЛЬСЕ 30 МИНУТ">ДОБАВЬТЕ КАРДИО ПОСЛЕ СИЛОВОЙ ТРЕНИРОВКИ ИЛИ В ОТДЕЛЬНЫЙ ДЕНЬ НА ЛЕГКОМ ПУЛЬСЕ 30 МИНУТ</p>
                    <p data-translation-key="НАЧНИТЕ С ДЕФИЦИТА 200-300 ККАЛ И ПОСТЕПЕННО УВЕЛИЧИВАЙТЕ ДО 500 ККАЛ">НАЧНИТЕ С ДЕФИЦИТА 200-300 ККАЛ И ПОСТЕПЕННО УВЕЛИЧИВАЙТЕ ДО 500 ККАЛ</p>
                    <p data-translation-key="ПЕЙТЕ БОЛЬШЕ ВОДЫ - НЕ МЕНЕЕ 8 СТАКАНОВ В ДЕНЬ">ПЕЙТЕ БОЛЬШЕ ВОДЫ - НЕ МЕНЕЕ 8 СТАКАНОВ В ДЕНЬ</p>
                    <p data-translation-key="ЕШЬТЕ БОЛЬШЕ КЛЕТЧАТКИ ИЗ ОВОЩЕЙ ДЛЯ ЛУЧШЕГО НАСЫЩЕНИЯ">ЕШЬТЕ БОЛЬШЕ КЛЕТЧАТКИ ИЗ ОВОЩЕЙ ДЛЯ ЛУЧШЕГО НАСЫЩЕНИЯ</p>
                    <p data-translation-key="ОГРАНИЧЬТЕ ПОТРЕБЛЕНИЕ ПРОСТЫХ УГЛЕВОДОВ И САХАРА">ОГРАНИЧЬТЕ ПОТРЕБЛЕНИЕ ПРОСТЫХ УГЛЕВОДОВ И САХАРА</p>
                    <p data-translation-key="СЛЕДИТЕ ЗА КАЧЕСТВОМ СНА - ЭТО ВЛИЯЕТ НА ГОРМОНЫ ГОЛОДА">СЛЕДИТЕ ЗА КАЧЕСТВОМ СНА - ЭТО ВЛИЯЕТ НА ГОРМОНЫ ГОЛОДА</p>
                `;
            } else if (goal === 'gain') {
                adviceHTML = `
                    <p data-translation-key="СОЗДАЙТЕ ПРОФИЦИТ КАЛОРИЙ ОКОЛО 300-500 ККАЛ">СОЗДАЙТЕ ПРОФИЦИТ КАЛОРИЙ ОКОЛО 300-500 ККАЛ</p>
                    <p data-translation-key="УВЕЛИЧЬТЕ ПОТРЕБЛЕНИЕ БЕЛКА ДО 1.8-2.2Г НА КГ ВЕСА">УВЕЛИЧЬТЕ ПОТРЕБЛЕНИЕ БЕЛКА ДО 1.8-2.2Г НА КГ ВЕСА</p>
                    <p data-translation-key="ИСПОЛЬЗУЙТЕ БАЗОВЫЕ УПРАЖНЕНИЯ - ПРИСЕДАНИЯ, ЖИМ, ТЯГА">ИСПОЛЬЗУЙТЕ БАЗОВЫЕ УПРАЖНЕНИЯ - ПРИСЕДАНИЯ, ЖИМ, ТЯГА</p>
                    <p data-translation-key="ЕШЬТЕ 4-6 ПРИЕМОВ ПИЩИ В ДЕНЬ">ЕШЬТЕ 4-6 ПРИЕМОВ ПИЩИ В ДЕНЬ</p>
                    <p data-translation-key="ДОБАВЬТЕ КОКТЕЙЛИ С ВЫСОКИМ СОДЕРЖАНИЕМ КАЛОРИЙ МЕЖДУ ПРИЕМАМИ ПИЩИ">ДОБАВЬТЕ КОКТЕЙЛИ С ВЫСОКИМ СОДЕРЖАНИЕМ КАЛОРИЙ МЕЖДУ ПРИЕМАМИ ПИЩИ</p>
                    <p data-translation-key="ОБЕСПЕЧЬТЕ ДОСТАТОЧНЫЙ ОТДЫХ МЕЖДУ ТРЕНИРОВКАМИ">ОБЕСПЕЧЬТЕ ДОСТАТОЧНЫЙ ОТДЫХ МЕЖДУ ТРЕНИРОВКАМИ</p>
                    <p data-translation-key="ПОСТЕПЕННО УВЕЛИЧИВАЙТЕ РАБОЧИЕ ВЕСА НА ТРЕНИРОВКАХ">ПОСТЕПЕННО УВЕЛИЧИВАЙТЕ РАБОЧИЕ ВЕСА НА ТРЕНИРОВКАХ</p>
                `;
            } else if (goal === 'maintain') {
                adviceHTML = `
                    <p data-translation-key="ПОДДЕРЖИВАЙТЕ БАЛАНС КАЛОРИЙ ДЛЯ СОХРАНЕНИЯ ТЕКУЩЕГО ВЕСА">ПОДДЕРЖИВАЙТЕ БАЛАНС КАЛОРИЙ ДЛЯ СОХРАНЕНИЯ ТЕКУЩЕГО ВЕСА</p>
                    <p data-translation-key="ПОТРЕБЛЯЙТЕ ОКОЛО 1.5-1.8Г БЕЛКА НА КГ ВЕСА">ПОТРЕБЛЯЙТЕ ОКОЛО 1.5-1.8Г БЕЛКА НА КГ ВЕСА</p>
                    <p data-translation-key="ВНИМАТЕЛЬНО ОТСЛЕЖИВАЙТЕ ИЗМЕНЕНИЯ ВЕСА, КОРРЕКТИРУЯ КАЛОРИИ">ВНИМАТЕЛЬНО ОТСЛЕЖИВАЙТЕ ИЗМЕНЕНИЯ ВЕСА, КОРРЕКТИРУЯ КАЛОРИИ</p>
                    <p data-translation-key="ВВОДИТЕ РАЗНООБРАЗИЕ В РАЦИОН ДЛЯ ПОЛУЧЕНИЯ ВСЕХ НУТРИЕНТОВ">ВВОДИТЕ РАЗНООБРАЗИЕ В РАЦИОН ДЛЯ ПОЛУЧЕНИЯ ВСЕХ НУТРИЕНТОВ</p>
                    <p data-translation-key="ПЛАНИРУЙТЕ ПРИЕМЫ ПИЩИ ЗАРАНЕЕ ДЛЯ ЛУЧШЕГО КОНТРОЛЯ">ПЛАНИРУЙТЕ ПРИЕМЫ ПИЩИ ЗАРАНЕЕ ДЛЯ ЛУЧШЕГО КОНТРОЛЯ</p>
                `;
            }
        } else {
            // Советы на английском языке
            if (goal === 'lose') {
                adviceHTML = `
                    <p data-translation-key="ДОБАВЬТЕ КАРДИО ПОСЛЕ СИЛОВОЙ ТРЕНИРОВКИ ИЛИ В ОТДЕЛЬНЫЙ ДЕНЬ НА ЛЕГКОМ ПУЛЬСЕ 30 МИНУТ">ADD 30 MINUTES OF LIGHT CARDIO AFTER STRENGTH TRAINING OR ON SEPARATE DAYS</p>
                    <p data-translation-key="НАЧНИТЕ С ДЕФИЦИТА 200-300 ККАЛ И ПОСТЕПЕННО УВЕЛИЧИВАЙТЕ ДО 500 ККАЛ">START WITH A 200-300 CALORIE DEFICIT AND GRADUALLY INCREASE TO 500</p>
                    <p data-translation-key="ПЕЙТЕ БОЛЬШЕ ВОДЫ - НЕ МЕНЕЕ 8 СТАКАНОВ В ДЕНЬ">DRINK MORE WATER - AT LEAST 8 GLASSES A DAY</p>
                    <p data-translation-key="ЕШЬТЕ БОЛЬШЕ КЛЕТЧАТКИ ИЗ ОВОЩЕЙ ДЛЯ ЛУЧШЕГО НАСЫЩЕНИЯ">EAT MORE FIBER FROM VEGETABLES FOR BETTER SATIETY</p>
                    <p data-translation-key="ОГРАНИЧЬТЕ ПОТРЕБЛЕНИЕ ПРОСТЫХ УГЛЕВОДОВ И САХАРА">LIMIT SIMPLE CARBS AND SUGAR INTAKE</p>
                    <p data-translation-key="СЛЕДИТЕ ЗА КАЧЕСТВОМ СНА - ЭТО ВЛИЯЕТ НА ГОРМОНЫ ГОЛОДА">MONITOR SLEEP QUALITY - IT AFFECTS HUNGER HORMONES</p>
                `;
            } else if (goal === 'gain') {
                adviceHTML = `
                    <p data-translation-key="СОЗДАЙТЕ ПРОФИЦИТ КАЛОРИЙ ОКОЛО 300-500 ККАЛ">CREATE A CALORIE SURPLUS OF ABOUT 300-500 KCAL</p>
                    <p data-translation-key="УВЕЛИЧЬТЕ ПОТРЕБЛЕНИЕ БЕЛКА ДО 1.8-2.2Г НА КГ ВЕСА">INCREASE PROTEIN INTAKE TO 1.8-2.2G PER KG OF WEIGHT</p>
                    <p data-translation-key="ИСПОЛЬЗУЙТЕ БАЗОВЫЕ УПРАЖНЕНИЯ - ПРИСЕДАНИЯ, ЖИМ, ТЯГА">USE COMPOUND EXERCISES - SQUATS, BENCH PRESS, DEADLIFTS</p>
                    <p data-translation-key="ЕШЬТЕ 4-6 ПРИЕМОВ ПИЩИ В ДЕНЬ">EAT 4-6 MEALS PER DAY</p>
                    <p data-translation-key="ДОБАВЬТЕ КОКТЕЙЛИ С ВЫСОКИМ СОДЕРЖАНИЕМ КАЛОРИЙ МЕЖДУ ПРИЕМАМИ ПИЩИ">ADD HIGH-CALORIE SHAKES BETWEEN MEALS</p>
                    <p data-translation-key="ОБЕСПЕЧЬТЕ ДОСТАТОЧНЫЙ ОТДЫХ МЕЖДУ ТРЕНИРОВКАМИ">ENSURE ADEQUATE REST BETWEEN WORKOUTS</p>
                    <p data-translation-key="ПОСТЕПЕННО УВЕЛИЧИВАЙТЕ РАБОЧИЕ ВЕСА НА ТРЕНИРОВКАХ">GRADUALLY INCREASE WORKING WEIGHTS IN YOUR TRAINING</p>
                `;
            } else if (goal === 'maintain') {
                adviceHTML = `
                    <p data-translation-key="ПОДДЕРЖИВАЙТЕ БАЛАНС КАЛОРИЙ ДЛЯ СОХРАНЕНИЯ ТЕКУЩЕГО ВЕСА">MAINTAIN CALORIE BALANCE TO PRESERVE CURRENT WEIGHT</p>
                    <p data-translation-key="ПОТРЕБЛЯЙТЕ ОКОЛО 1.5-1.8Г БЕЛКА НА КГ ВЕСА">CONSUME ABOUT 1.5-1.8G OF PROTEIN PER KG OF WEIGHT</p>
                    <p data-translation-key="ВНИМАТЕЛЬНО ОТСЛЕЖИВАЙТЕ ИЗМЕНЕНИЯ ВЕСА, КОРРЕКТИРУЯ КАЛОРИИ">CAREFULLY TRACK WEIGHT CHANGES, ADJUSTING CALORIES AS NEEDED</p>
                    <p data-translation-key="ВВОДИТЕ РАЗНООБРАЗИЕ В РАЦИОН ДЛЯ ПОЛУЧЕНИЯ ВСЕХ НУТРИЕНТОВ">INTRODUCE VARIETY IN YOUR DIET TO GET ALL NUTRIENTS</p>
                    <p data-translation-key="ПЛАНИРУЙТЕ ПРИЕМЫ ПИЩИ ЗАРАНЕЕ ДЛЯ ЛУЧШЕГО КОНТРОЛЯ">PLAN YOUR MEALS IN ADVANCE FOR BETTER CONTROL</p>
                `;
            }
        }
        
        adviceEl.innerHTML = adviceHTML;
        
        // Если страница уже переведена, применим переводы к новым элементам
        if (typeof window.translateUI === 'function') {
            window.translateUI();
        }
        
        console.log(`[welcome.js] showAdviceForGoal: Set advice HTML for goal '${goal}'.`);
    }
    
    // Восстановление сохраненных данных
    function loadSavedData() {
        // Проверяем, есть ли сохраненные данные пользователя
        const savedData = localStorage.getItem('savedUserData');
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                
                // Заполняем форму сохраненными данными
                if (parsedData.gender) {
                    const genderBtn = document.querySelector(`.gender-btn[data-gender="${parsedData.gender}"]`);
                    if (genderBtn) {
                        genderButtons.forEach(btn => btn.classList.remove('selected'));
                        genderBtn.classList.add('selected');
                        userData.gender = parsedData.gender;
                    }
                }
                
                if (parsedData.goal) {
                    const goalBtn = document.querySelector(`.goal-btn[data-goal="${parsedData.goal}"]`);
                    if (goalBtn) {
                        goalButtons.forEach(btn => btn.classList.remove('selected'));
                        goalBtn.classList.add('selected');
                        userData.goal = parsedData.goal;
                    }
                }
                
                if (parsedData.age) {
                    document.getElementById('age').value = parsedData.age;
                    userData.age = parsedData.age;
                }
                
                if (parsedData.height) {
                    document.getElementById('height').value = parsedData.height;
                    userData.height = parsedData.height;
                }
                
                if (parsedData.weight) {
                    document.getElementById('weight').value = parsedData.weight;
                    userData.weight = parsedData.weight;
                }
                
                if (parsedData.activityLevel) {
                    // Сохраняем значение активности в userData
                    userData.activityLevel = parseFloat(parsedData.activityLevel);
                    
                    // Устанавливаем значение в обычный селект (Choices.js будет инициализирован позже)
                    const activitySelect = document.getElementById('activity-level');
                    if (activitySelect) {
                        activitySelect.value = parsedData.activityLevel;
                    }
                }

                // Вызываем отображение результатов в конце, после заполнения формы,
                // на случай если страница была перезагружена с уже видимыми результатами.
                displaySavedResults();

            } catch (e) {
                console.error('Ошибка при загрузке сохраненных данных:', e);
                 localStorage.removeItem('savedUserData'); // Очищаем некорректные данные
            }
        }
    }
    
    // Сохранение данных пользователя
    function saveUserData(userData, calories, protein, fat, carbs) {
        localStorage.setItem('savedUserData', JSON.stringify({
            goal: userData.goal,
            gender: userData.gender,
            age: userData.age,
            height: userData.height,
            weight: userData.weight,
            activityLevel: userData.activityLevel,
            calorieLimit: calories,
            proteinLimit: protein,
            fatLimit: fat,
            carbsLimit: carbs
        }));
    }
    
    // Загружаем сохраненные данные при загрузке страницы
    loadSavedData();

    // Убеждаемся, что модальные окна изначально скрыты для скринридеров
    if (infoModal) infoModal.setAttribute('aria-hidden', 'true');
    if (alertModal) alertModal.setAttribute('aria-hidden', 'true');

    // Инициализация при загрузке
    loadSavedData();
    if (typeof window.loadTheme === 'function') window.loadTheme();
    if (typeof window.translateUI === 'function') window.translateUI();
    displaySavedResults(); // Отображаем сохраненные результаты, если есть
});

/***
 * Отображает сохраненные результаты расчета, если секция видима.
 */
function displaySavedResults() {
    console.log('[welcome.js] displaySavedResults: Function called');
    const savedData = localStorage.getItem('savedUserData');
    // Проверяем, видима ли секция результатов
    const resultsSectionVisible = !document.getElementById('calculation-results')?.classList.contains('hidden');
    console.log('[welcome.js] displaySavedResults: resultsSectionVisible =', resultsSectionVisible);

    if (savedData && resultsSectionVisible) {
        try {
            const parsedData = JSON.parse(savedData);
            console.log('[welcome.js] displaySavedResults: Parsed data from localStorage:', parsedData);

            const calorieResultEl = document.getElementById('calorie-result');
            const proteinResultEl = document.getElementById('protein-result');
            const fatResultEl = document.getElementById('fat-result');
            const carbsResultEl = document.getElementById('carbs-result');

            // Обновляем числовые результаты
            if (parsedData.calorieLimit != null && calorieResultEl) {
                 console.log(`[welcome.js] displaySavedResults: Updating calorie-result. Current: '${calorieResultEl.textContent}', New: '${parsedData.calorieLimit}'`);
                calorieResultEl.textContent = parsedData.calorieLimit;
                 console.log(`[welcome.js] displaySavedResults: Updated calorie-result. Now: '${calorieResultEl.textContent}'`);
            }
            if (parsedData.proteinLimit != null && proteinResultEl) {
                 console.log(`[welcome.js] displaySavedResults: Updating protein-result. Current: '${proteinResultEl.textContent}', New: '${parsedData.proteinLimit}'`);
                proteinResultEl.textContent = parsedData.proteinLimit;
                 console.log(`[welcome.js] displaySavedResults: Updated protein-result. Now: '${proteinResultEl.textContent}'`);
            }
            if (parsedData.fatLimit != null && fatResultEl) {
                 console.log(`[welcome.js] displaySavedResults: Updating fat-result. Current: '${fatResultEl.textContent}', New: '${parsedData.fatLimit}'`);
                fatResultEl.textContent = parsedData.fatLimit;
                 console.log(`[welcome.js] displaySavedResults: Updated fat-result. Now: '${fatResultEl.textContent}'`);
            }
            if (parsedData.carbsLimit != null && carbsResultEl) {
                 console.log(`[welcome.js] displaySavedResults: Updating carbs-result. Current: '${carbsResultEl.textContent}', New: '${parsedData.carbsLimit}'`);
                carbsResultEl.textContent = parsedData.carbsLimit;
                 console.log(`[welcome.js] displaySavedResults: Updated carbs-result. Now: '${carbsResultEl.textContent}'`);
            }

        } catch (e) {
            console.error('[welcome.js] Ошибка при отображении сохраненных результатов:', e);
        }
    } else {
         console.log('[welcome.js] displaySavedResults: No saved data or results section not visible. Skipping update.');
    }
} 