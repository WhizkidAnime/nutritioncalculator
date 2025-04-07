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
        if (userData.activityLevel) {
            choicesInstance.setChoiceByValue(String(userData.activityLevel));
            console.log('Активность установлена при инициализации Choices.js:', userData.activityLevel);
        }
    }
    
    // Загружаем тему
    if (typeof window.loadTheme === 'function') {
        window.loadTheme();
    }
    
    // Загружаем переводы
    if (typeof window.translateUI === 'function') {
        window.translateUI();
    }
    
    // Модальное окно для уведомлений
    const alertModal = document.getElementById('alert-modal');
    const alertMessage = document.getElementById('alert-message');
    const alertOkBtn = document.getElementById('alert-ok-btn');
    
    // Секции
    const characterCreation = document.getElementById('character-creation');
    const calculationResults = document.getElementById('calculation-results');
    
    // Функции для работы с модальным окном уведомлений
    function showAlert(message) {
        if (!alertModal || !alertMessage) return;
        alertMessage.textContent = message;
        
        alertModal.classList.add('show');
        requestAnimationFrame(() => {
            if (alertModal) alertModal.classList.add('visible');
        });
    }
    
    function hideAlert() {
        if (!alertModal) return;
        alertModal.classList.remove('visible');
        
        setTimeout(() => {
            if (alertModal) {
                alertModal.classList.remove('show');
            }
        }, 200);
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
    document.getElementById('activity-level').addEventListener('change', function() {
        userData.activityLevel = parseFloat(this.value);
    });
    
    // Обработчик нажатия на кнопку расчета
    calculateBtn.addEventListener('click', function() {
        // Получаем данные из полей
        const age = parseInt(document.getElementById('age').value) || 0;
        const height = parseInt(document.getElementById('height').value) || 0;
        const weight = parseFloat(document.getElementById('weight').value) || 0;
        
        // Получаем выбранную цель
        const selectedGoalBtn = document.querySelector('.goal-btn.selected');
        const goal = selectedGoalBtn ? selectedGoalBtn.getAttribute('data-goal') : '';
        
        // Получаем выбранный пол
        const selectedGenderBtn = document.querySelector('.gender-btn.selected');
        const gender = selectedGenderBtn ? selectedGenderBtn.getAttribute('data-gender') : '';
        
        // Получаем уровень активности
        const activityLevel = parseFloat(document.getElementById('activity-level').value) || 1.55;
        
        // Проверяем, что все данные введены
        if (!goal) {
            showAlert('Выберите цель!');
            return;
        }
        if (!gender) {
            showAlert('Выберите пол!');
            return;
        }
        if (age < 12 || age > 100) {
            showAlert('Введите корректный возраст (от 12 до 100 лет)!');
            return;
        }
        if (height < 100 || height > 250) {
            showAlert('Введите корректный рост (от 100 до 250 см)!');
            return;
        }
        if (weight < 30 || weight > 300) {
            showAlert('Введите корректный вес (от 30 до 300 кг)!');
            return;
        }
        
        // Расчет калорий и БЖУ
        const userData = {
            goal: goal,
            gender: gender,
            age: age,
            height: height,
            weight: weight,
            activityLevel: activityLevel
        };
        
        calculateNutrition(userData);
        
        // Показываем результаты, скрываем форму ввода
        document.getElementById('character-creation').classList.add('hidden');
        document.getElementById('calculation-results').classList.remove('hidden');
    });
    
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
    document.getElementById('info-btn').addEventListener('click', function() {
        // Показываем модальное окно с информацией
        document.getElementById('info-modal').classList.remove('hidden');
    });
    
    // Обработчик закрытия модального окна
    document.getElementById('info-close-btn').addEventListener('click', function() {
        // Скрываем модальное окно
        document.getElementById('info-modal').classList.add('hidden');
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
        
        if (goal === 'lose') {
            adviceHTML = `
                <p data-translation-key="УПОТРЕБЛЯЙТЕ БОЛЬШЕ БЕЛКА ДЛЯ СОХРАНЕНИЯ МЫШЦ">УПОТРЕБЛЯЙТЕ БОЛЬШЕ БЕЛКА ДЛЯ СОХРАНЕНИЯ МЫШЦ</p>
                <p data-translation-key="НЕ ГОЛОДАЙ - СНИЖАЙ КАЛОРИИ ПОСТЕПЕННО">НЕ ГОЛОДАЙ - СНИЖАЙ КАЛОРИИ ПОСТЕПЕННО</p>
                <p data-translation-key="РЕГУЛЯРНО ЗАНИМАЙТЕСЬ СИЛОВЫМИ ТРЕНИРОВКАМИ">РЕГУЛЯРНО ЗАНИМАЙТЕСЬ СИЛОВЫМИ ТРЕНИРОВКАМИ</p>
                <p data-translation-key="ДОБАВЬТЕ КАРДИО ПОСЛЕ СИЛОВОЙ ТРЕНИРОВКИ ИЛИ В ОТДЕЛЬНЫЙ ДЕНЬ НА ЛЕГКОМ ПУЛЬСЕ 30 МИНУТ">ДОБАВЬТЕ КАРДИО ПОСЛЕ СИЛОВОЙ ТРЕНИРОВКИ ИЛИ В ОТДЕЛЬНЫЙ ДЕНЬ НА ЛЕГКОМ ПУЛЬСЕ 30 МИНУТ</p>
            `;
        } else if (goal === 'gain') {
            adviceHTML = `
                <p data-translation-key="НЕ ЗАБЫВАЙ О ПОЛЕЗНЫХ ЖИРАХ (ОРЕХИ, АВОКАДО, РЫБА)">НЕ ЗАБЫВАЙ О ПОЛЕЗНЫХ ЖИРАХ (ОРЕХИ, АВОКАДО, РЫБА)</p>
                <p data-translation-key="ТРЕНИРУЙТЕСЬ ИНТЕНСИВНО 3-5 РАЗ В НЕДЕЛЮ">ТРЕНИРУЙТЕСЬ ИНТЕНСИВНО 3-5 РАЗ В НЕДЕЛЮ</p>
            `;
        } else if (goal === 'maintain') {
            adviceHTML = `
                <p data-translation-key="СЛЕДИТЕ ЗА КАЧЕСТВОМ ПИТАНИЯ">СЛЕДИТЕ ЗА КАЧЕСТВОМ ПИТАНИЯ</p>
                <p data-translation-key="РЕГУЛЯРНО КОНТРОЛИРУЙТЕ ВЕС И ЗАМЕРЫ">РЕГУЛЯРНО КОНТРОЛИРУЙТЕ ВЕС И ЗАМЕРЫ</p>
                <p data-translation-key="СОВМЕЩАЙТЕ КАРДИО И СИЛОВЫЕ ТРЕНИРОВКИ">СОВМЕЩАЙТЕ КАРДИО И СИЛОВЫЕ ТРЕНИРОВКИ</p>
            `;
        }
        
        adviceEl.innerHTML = adviceHTML;
        
        // Если страница уже переведена, применим переводы к новым элементам
        if (typeof window.translateUI === 'function') {
            window.translateUI();
        }
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

/***
 * Отображает советы в зависимости от выбранной цели.
 * @param {string} goal - Выбранная цель ('lose', 'gain', 'maintain').
 */
function showAdviceForGoal(goal) {
    const adviceEl = document.getElementById('advice-content');
    if (!adviceEl) return; // Проверка наличия элемента

    let adviceHTML = '';

    if (goal === 'lose') {
        adviceHTML = `
            <p data-translation-key="УПОТРЕБЛЯЙТЕ БОЛЬШЕ БЕЛКА ДЛЯ СОХРАНЕНИЯ МЫШЦ">УПОТРЕБЛЯЙТЕ БОЛЬШЕ БЕЛКА ДЛЯ СОХРАНЕНИЯ МЫШЦ</p>
            <p data-translation-key="НЕ ГОЛОДАЙ - СНИЖАЙ КАЛОРИИ ПОСТЕПЕННО">НЕ ГОЛОДАЙ - СНИЖАЙ КАЛОРИИ ПОСТЕПЕННО</p>
            <p data-translation-key="РЕГУЛЯРНО ЗАНИМАЙТЕСЬ СИЛОВЫМИ ТРЕНИРОВКАМИ">РЕГУЛЯРНО ЗАНИМАЙТЕСЬ СИЛОВЫМИ ТРЕНИРОВКАМИ</p>
            <p data-translation-key="ДОБАВЬТЕ КАРДИО ПОСЛЕ СИЛОВОЙ ТРЕНИРОВКИ ИЛИ В ОТДЕЛЬНЫЙ ДЕНЬ НА ЛЕГКОМ ПУЛЬСЕ 30 МИНУТ">ДОБАВЬТЕ КАРДИО ПОСЛЕ СИЛОВОЙ ТРЕНИРОВКИ ИЛИ В ОТДЕЛЬНЫЙ ДЕНЬ НА ЛЕГКОМ ПУЛЬСЕ 30 МИНУТ</p>
        `;
    } else if (goal === 'gain') {
        adviceHTML = `
            <p data-translation-key="НЕ ЗАБЫВАЙ О ПОЛЕЗНЫХ ЖИРАХ (ОРЕХИ, АВОКАДО, РЫБА)">НЕ ЗАБЫВАЙ О ПОЛЕЗНЫХ ЖИРАХ (ОРЕХИ, АВОКАДО, РЫБА)</p>
            <p data-translation-key="ТРЕНИРУЙТЕСЬ ИНТЕНСИВНО 3-5 РАЗ В НЕДЕЛЮ">ТРЕНИРУЙТЕСЬ ИНТЕНСИВНО 3-5 РАЗ В НЕДЕЛЮ</p>
        `;
    } else if (goal === 'maintain') {
        adviceHTML = `
            <p data-translation-key="СЛЕДИТЕ ЗА КАЧЕСТВОМ ПИТАНИЯ">СЛЕДИТЕ ЗА КАЧЕСТВОМ ПИТАНИЯ</p>
            <p data-translation-key="РЕГУЛЯРНО КОНТРОЛИРУЙТЕ ВЕС И ЗАМЕРЫ">РЕГУЛЯРНО КОНТРОЛИРУЙТЕ ВЕС И ЗАМЕРЫ</p>
            <p data-translation-key="СОВМЕЩАЙТЕ КАРДИО И СИЛОВЫЕ ТРЕНИРОВКИ">СОВМЕЩАЙТЕ КАРДИО И СИЛОВЫЕ ТРЕНИРОВКИ</p>
        `;
    }

    adviceEl.innerHTML = adviceHTML;
    console.log(`[welcome.js] showAdviceForGoal: Set advice HTML for goal '${goal}'.`);

    // Если страница уже переведена, применим переводы к новым элементам
    if (typeof window.getTranslation === 'function') {
        console.log('[welcome.js] showAdviceForGoal: Translating generated advice content...');
        adviceEl.querySelectorAll('p[data-translation-key]').forEach((pElement, index) => {
            const key = pElement.dataset.translationKey;
            if (key) {
                const currentText = pElement.textContent.trim();
                const translatedText = window.getTranslation(key, currentText); // Используем глобальную функцию
                console.log(`  -> Translating advice #${index + 1}, Key: '${key}', Current: '${currentText}', Target: '${translatedText}'`);
                if (currentText !== translatedText) {
                    pElement.textContent = translatedText;
                }
            }
        });
        console.log('[welcome.js] showAdviceForGoal: Translation finished.');
    } else {
        console.warn('[welcome.js] showAdviceForGoal: window.getTranslation function not found, cannot translate advice.');
    }
} 