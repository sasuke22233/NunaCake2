// Основной скрипт для конструктора тортов
// Данные импортируются из data.js

// Глобальные переменные
let layerCount = 3;
let selectedLayers = [];
let selectedCreams = [];
let selectedFillings = []; // Массив начинок для каждого слоя
let currentModalType = '';
let currentModalIndex = 0;

let currentIngredients = [];

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация глобальных переменных
    selectedLayers = new Array(layerCount).fill(null);
    selectedCreams = new Array(layerCount - 1).fill(null);
    selectedFillings = new Array(layerCount).fill('none'); // По умолчанию "без начинки"
    updateLayerCountDisplay();
    
    setupMobileMenu();
    setupEventListeners();
    loadPopularCakes();
    animateOnScroll();
    
    // Инициализация конструктора (только если конструктор есть на странице)
    if (document.querySelector('.cake-constructor')) {
        startConstructor();
    }
    
    // Проверяем, есть ли предзаполненные данные для конструктора
    checkPrefillData();
});

// Функция для загрузки популярных тортов из базы данных
function loadPopularCakes() {
    const grid = document.getElementById('popularCakesGrid');
    if (!grid) return;
    
    // Добавляем параметр для предотвращения кэширования
    const cacheBuster = Date.now();
    
    popularCakes.forEach(cake => {
        const card = document.createElement('div');
        card.className = 'cake-card';
        card.setAttribute('data-cake', cake.id);
        
        card.innerHTML = `
            <div class="cake-image">
                <img src="${cake.image}?v=${cacheBuster}" alt="${cake.name}">
            </div>
            <div class="cake-info">
                <h3>${cake.name}</h3>
                <div class="cake-meta">
                    <span class="difficulty">${cake.difficulty}</span>
                    <span class="time">${cake.time}</span>
                </div>
                <button class="btn btn-small">Рецепт</button>
            </div>
        `;
        
        grid.appendChild(card);
    });
    
    // Перенастраиваем обработчики событий для новых карточек
    setupEventListeners();
}



// Настройка мобильного меню
function setupMobileMenu() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Обработчики для карточек популярных тортов
    document.querySelectorAll('.cake-card').forEach(card => {
        // Удаляем существующие обработчики, чтобы избежать дублирования
        card.removeEventListener('click', card._clickHandler);
        card._clickHandler = function(e) {
            // Проверяем, что клик не по кнопке
            if (!e.target.classList.contains('btn')) {
                const cakeType = this.getAttribute('data-cake');
                showRecipeModal(cakeType);
            }
        };
        card.addEventListener('click', card._clickHandler);
        
        // Обработчик для кнопки рецепта
        const recipeBtn = card.querySelector('.btn');
        if (recipeBtn) {
            recipeBtn.removeEventListener('click', recipeBtn._clickHandler);
            recipeBtn._clickHandler = function(e) {
                e.stopPropagation();
                const cakeType = card.getAttribute('data-cake');
                showRecipeModal(cakeType);
            };
            recipeBtn.addEventListener('click', recipeBtn._clickHandler);
        }
    });

    // Обработчик для закрытия модального окна с рецептом
    const recipeModalClose = document.querySelector('#recipeModal .close');
    if (recipeModalClose) {
        recipeModalClose.addEventListener('click', function() {
            document.getElementById('recipeModal').style.display = 'none';
        });
    }

    // Обработчик для закрытия модального окна с рецептом при клике вне его
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('recipeModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Обработчики для модальных окон конструктора (только если конструктор есть на странице)
    if (document.querySelector('.cake-constructor')) {
        // Обработчик для закрытия модального окна выбора ингредиентов
        window.addEventListener('click', function(event) {
            const modal = document.getElementById('ingredientModal');
            if (event.target === modal) {
                closeIngredientModal();
            }
        });
    
        // Обработчик для закрытия модального окна с ингредиентами
        window.addEventListener('click', function(event) {
            const modal = document.getElementById('ingredientsModal');
            if (event.target === modal) {
                closeIngredientsModal();
            }
        });
    }

    // Обработчики для навигации
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
}



// Изменение количества коржей
function changeLayers(delta) {
    const newCount = layerCount + delta;
    if (newCount >= 2 && newCount <= 6) {
        layerCount = newCount;
        selectedLayers = new Array(layerCount).fill(null);
        selectedCreams = new Array(layerCount - 1).fill(null);
        selectedFillings = new Array(layerCount).fill('none'); // По умолчанию "без начинки"
        updateLayerCountDisplay();
        
        // Скрываем кнопку рецепта и нижнюю секцию при изменении количества слоев
        const recipeButtonContainer = document.getElementById('recipeButtonContainer');
        const bottomSection = document.getElementById('bottomSection');
        if (recipeButtonContainer) recipeButtonContainer.style.display = 'none';
        if (bottomSection) bottomSection.style.display = 'none';
        
        // Обновляем эскиз если конструктор уже запущен
        if (document.getElementById('constructorMain').style.display !== 'none') {
            updateCakeSketch();
            updateCompositionPanel();
        }
    }
}

// Обновление отображения количества коржей
function updateLayerCountDisplay() {
    const layerCountElement = document.getElementById('layerCount');
    if (layerCountElement) {
        layerCountElement.textContent = layerCount;
    }
}

// Запуск конструктора
function startConstructor() {
    const settings = document.getElementById('cakeSettings');
    const main = document.getElementById('constructorMain');
    
    if (settings && main) {
        settings.style.display = 'none';
        main.style.display = 'block';
        
        // Обновляем эскиз и панель состава
        updateCakeSketch();
        updateCompositionPanel();
        
        // Проверяем, завершен ли торт (для предзаполненных тортов)
        // Не скрываем кнопку рецепта, если торт уже завершен
        const recipeButtonContainer = document.getElementById('recipeButtonContainer');
        const bottomSection = document.getElementById('bottomSection');
        
        if (recipeButtonContainer && recipeButtonContainer.style.display === 'block') {
            // Кнопка рецепта уже показана - торт предзаполнен и завершен
        } else {
            checkCakeCompletion();
        }
        
        // Плавно прокручиваем к конструктору
        setTimeout(() => {
            main.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 100);
    }
}

// Обновление эскиза торта
function updateCakeSketch() {
    const sketch = document.getElementById('cakeSketch');
    if (!sketch) return;
    
    sketch.innerHTML = '';
    
    for (let i = 0; i < layerCount; i++) {
        // Добавляем корж
        const layerSlot = document.createElement('div');
        layerSlot.className = 'cake-layer-slot';
        layerSlot.onclick = () => showIngredientModal('layer', i);
        
        if (selectedLayers[i]) {
            const layer = layers.find(l => l.id === selectedLayers[i]);
            if (layer) {
                const img = document.createElement('img');
                img.src = layer.image;
                img.alt = layer.name;
                layerSlot.appendChild(img);
                layerSlot.classList.add('selected');
            }
        } else {
            layerSlot.innerHTML = '<div class="placeholder"></div>';
        }
        
        sketch.appendChild(layerSlot);
        
        // Добавляем начинку и крем (кроме последнего коржа)
        if (i < layerCount - 1) {
            // Добавляем начинку
            const fillingSlot = document.createElement('div');
            fillingSlot.className = 'filling-slot';
            fillingSlot.onclick = () => showIngredientModal('filling', i);
            
            if (selectedFillings[i]) {
                const filling = fillings.find(f => f.id === selectedFillings[i]);
                if (filling) {
                    const img = document.createElement('img');
                    img.src = filling.image;
                    img.alt = filling.name;
                    fillingSlot.appendChild(img);
                    fillingSlot.classList.add('selected');
                }
            } else {
                fillingSlot.innerHTML = '<div class="placeholder"></div>';
            }
            
            sketch.appendChild(fillingSlot);
            
            // Добавляем крем
            const creamSlot = document.createElement('div');
            creamSlot.className = 'cream-slot';
            creamSlot.onclick = () => showIngredientModal('cream', i);
            
            if (selectedCreams[i]) {
                const cream = creams.find(c => c.id === selectedCreams[i]);
                if (cream) {
                    const img = document.createElement('img');
                    img.src = cream.image;
                    img.alt = cream.name;
                    creamSlot.appendChild(img);
                    creamSlot.classList.add('selected');
                }
            } else {
                creamSlot.innerHTML = '<div class="placeholder"></div>';
            }
            
            sketch.appendChild(creamSlot);
        }
    }
}

// Показать модальное окно выбора ингредиентов
function showIngredientModal(type, index) {
    currentModalType = type;
    currentModalIndex = index;
    
    const modal = document.getElementById('ingredientModal');
    const title = document.getElementById('modalTitle');
    const ingredientGrid = document.getElementById('ingredientGrid');
    
    if (!modal || !title || !ingredientGrid) return;
    
    // Устанавливаем заголовок в зависимости от типа
    if (type === 'layer') {
        title.textContent = 'Выберите корж';
    } else if (type === 'cream') {
        title.textContent = 'Выберите крем';
    } else if (type === 'filling') {
        title.textContent = 'Выберите начинку';
    }
    
    // Получаем список ингредиентов
    if (type === 'layer') {
        currentIngredients = layers;
    } else if (type === 'cream') {
        currentIngredients = creams;
    } else if (type === 'filling') {
        currentIngredients = fillings;
    }
    
    // Проверяем данные
    if (!currentIngredients || currentIngredients.length === 0) {
        console.error('Нет данных для выбора:', type);
        return;
    }
    
    // Очищаем сетку
    ingredientGrid.innerHTML = '';
    
    // Создаем элементы ингредиентов
    const fragment = document.createDocumentFragment();
    
    currentIngredients.forEach((ingredient) => {
        const item = document.createElement('div');
        item.className = 'ingredient-item';
        
        // Проверяем, является ли этот ингредиент текущим выбором
        let isSelected = false;
        if (type === 'layer') {
            isSelected = selectedLayers[currentModalIndex] === ingredient.id;
        } else if (type === 'cream') {
            isSelected = selectedCreams[currentModalIndex] === ingredient.id;
        } else if (type === 'filling') {
            isSelected = selectedFillings[currentModalIndex] === ingredient.id;
        }
        
        if (isSelected) {
            item.classList.add('selected');
        }
        
        item.innerHTML = `
            <img src="${ingredient.image}" alt="${ingredient.name}" loading="lazy">
            <div class="item-name">${ingredient.name}</div>
            <div class="item-description">${ingredient.description}</div>
            <button class="ingredients-btn">
                <i class="fas fa-list"></i> Ингредиенты
            </button>
            <button class="select-btn">${isSelected ? 'Выбрано' : `Выбрать ${type === 'layer' ? 'корж' : type === 'cream' ? 'крем' : 'начинку'}`}</button>
        `;
        
        // Добавляем обработчик клика для кнопки выбора
        const selectBtn = item.querySelector('.select-btn');
        selectBtn.onclick = (e) => {
            e.stopPropagation();
            selectIngredient(ingredient);
        };
        
        // Добавляем обработчик клика для кнопки ингредиентов
        const ingredientsBtn = item.querySelector('.ingredients-btn');
        ingredientsBtn.onclick = (e) => {
            e.stopPropagation();
            showIngredientsModal(type, ingredient.name);
        };
        
        fragment.appendChild(item);
    });
    
    ingredientGrid.appendChild(fragment);
    
    // Добавляем поддержку горизонтальной прокрутки курсором
    addHorizontalScrollSupport(ingredientGrid);
    
    // Показываем модальное окно
    modal.style.display = 'block';
    
    // Оптимизация загрузки изображений
    const images = ingredientGrid.querySelectorAll('img');
        let loadedImages = 0;
    
        images.forEach(img => {
            if (img.complete) {
                loadedImages++;
            } else {
            img.addEventListener('load', () => {
                    loadedImages++;
            });
        }
    });
}

// Выбор ингредиента
function selectIngredient(ingredient) {
    if (currentModalType === 'layer') {
        selectedLayers[currentModalIndex] = ingredient.id;
    } else if (currentModalType === 'cream') {
        selectedCreams[currentModalIndex] = ingredient.id;
    } else if (currentModalType === 'filling') {
        selectedFillings[currentModalIndex] = ingredient.id; // Сохраняем выбранную начинку
    }
    
    closeIngredientModal();
    updateCakeSketch();
    updateCompositionPanel();
    
    // Проверяем, заполнен ли весь торт
    checkCakeCompletion();
}

// Закрыть модальное окно выбора ингредиентов
function closeIngredientModal() {
    const modal = document.getElementById('ingredientModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Обновление панели состава торта
function updateCompositionPanel() {
    const list = document.getElementById('compositionList');
    if (!list) return;
    
    list.innerHTML = '';
    
    let itemIndex = 1;
    
    // Добавляем выбранные коржи
    selectedLayers.forEach((layerId, index) => {
        if (layerId) {
            const layer = layers.find(l => l.id === layerId);
            if (layer) {
                const item = createCompositionItem(layer, `Корж ${index + 1}`, itemIndex);
                list.appendChild(item);
                itemIndex++;
            }
        }
    });
    
    // Добавляем выбранные начинки и кремы
    for (let i = 0; i < selectedCreams.length; i++) {
        // Добавляем начинку
        if (selectedFillings[i]) {
            const filling = fillings.find(f => f.id === selectedFillings[i]);
            if (filling) {
                const item = createCompositionItem(filling, `Начинка ${i + 1}`, itemIndex);
                list.appendChild(item);
                itemIndex++;
            }
        }
        
        // Добавляем крем
        if (selectedCreams[i]) {
            const cream = creams.find(c => c.id === selectedCreams[i]);
            if (cream) {
                const item = createCompositionItem(cream, `Крем ${i + 1}`, itemIndex);
                list.appendChild(item);
                itemIndex++;
            }
        }
    }
}

// Создание элемента состава торта
function createCompositionItem(ingredient, type, number) {
    const item = document.createElement('div');
    item.className = 'composition-item selected';
    
    item.innerHTML = `
        <div class="composition-number">${number}</div>
        <div class="composition-info">
            <div class="composition-name">${ingredient.name}</div>
            <div class="composition-type">${type}</div>
        </div>
    `;
    
    return item;
}

// Проверка завершения торта
function checkCakeCompletion() {
    const allLayersSelected = selectedLayers.every(layer => layer !== null);
    const allCreamsSelected = selectedCreams.every(cream => cream !== null);
    const allFillingsSelected = selectedFillings.slice(0, selectedCreams.length).every(filling => filling !== null);
    

    
    if (allLayersSelected && allCreamsSelected && allFillingsSelected) {
        // Показываем кнопку рецепта
        const recipeButtonContainer = document.getElementById('recipeButtonContainer');
        if (recipeButtonContainer) {
            recipeButtonContainer.style.display = 'block';
        }
        
        // Скрываем панель ингредиентов (она появится только после нажатия "Рецепт")
        const bottomSection = document.getElementById('bottomSection');
        if (bottomSection) {
            bottomSection.style.display = 'none';
        }
    } else {
        // Скрываем кнопку рецепта если торт не завершен
        const recipeButtonContainer = document.getElementById('recipeButtonContainer');
        if (recipeButtonContainer) {
            recipeButtonContainer.style.display = 'none';
        }
        
        // Скрываем панель ингредиентов
        const bottomSection = document.getElementById('bottomSection');
        if (bottomSection) {
            bottomSection.style.display = 'none';
        }
    }
}

// Обновление панели ингредиентов
function updateIngredientsPanel() {
    const list = document.getElementById('ingredientsList');
    if (!list) return;
    
    list.innerHTML = '';
    
    // Добавляем точные количества ингредиентов
    const diameter = parseInt(document.getElementById('diameterSelect').value) || 18;
    const multiplier = ingredientCalculator.sizeMultipliers[diameter] || 1;
    
    const ingredients = [
        { name: 'Мука пшеничная высшего сорта', amount: `${Math.round(200 * multiplier)}г` },
        { name: 'Сахар-песок', amount: `${Math.round(150 * multiplier)}г` },
        { name: 'Яйца категории А', amount: `${Math.round(3 * multiplier)} шт` },
        { name: 'Сливочное масло 82.5%', amount: `${Math.round(100 * multiplier)}г` },
        { name: 'Молоко 3.2%', amount: `${Math.round(200 * multiplier)}мл` },
        { name: 'Разрыхлитель теста', amount: `${Math.round(1 * multiplier)} ч.л.` },
        { name: 'Ванильный экстракт', amount: `${Math.round(1 * multiplier)} ч.л.` },
        { name: 'Соль', amount: `${Math.round(0.5 * multiplier)} ч.л.` },
        { name: 'Сахарная пудра (для крема)', amount: `${Math.round(100 * multiplier)}г` },
        { name: 'Сливки 33-35%', amount: `${Math.round(300 * multiplier)}мл` }
    ];
    
    ingredients.forEach(ingredient => {
        const item = createIngredientItem(ingredient, '');
        list.appendChild(item);
    });
}

// Создание элемента ингредиента
function createIngredientItem(ingredient, type) {
    const item = document.createElement('div');
    item.className = 'ingredient-item';
    
    item.innerHTML = `
        <div class="ingredient-info">
            <div class="ingredient-name">${ingredient.name}</div>
            <div class="ingredient-type">${ingredient.amount}</div>
        </div>
    `;
    
    return item;
}



// Генерация рецепта
function generateRecipe() {
    let recipe = '<h4>Приготовление коржей:</h4><ol>';
    
    // Рецепт для коржей
    recipe += `
        <li>Разогрейте духовку до 180°C, смажьте формы маслом</li>
        <li>Смешайте муку, сахар и разрыхлитель в большой миске</li>
        <li>Взбейте яйца с сахаром до пышности (около 5 минут)</li>
        <li>Добавьте молоко и растопленное масло, продолжая взбивать</li>
        <li>Соедините сухие и жидкие ингредиенты, аккуратно перемешивая</li>
        <li>Разделите тесто на ${layerCount} равных частей</li>
        <li>Выпекайте каждый корж 25-30 минут до готовности</li>
        <li>Остудите коржи на решетке</li>
    `;
    
    recipe += '</ol><h4>Приготовление кремов:</h4><ol>';
    
    // Рецепт для кремов
    recipe += `
        <li>Взбейте сливочное масло с сахарной пудрой до пышности</li>
        <li>Добавьте ароматизаторы и красители по вкусу</li>
        <li>Взбивайте до получения однородной массы</li>
        <li>При необходимости добавьте немного молока для нужной консистенции</li>
    `;
    
    // Рецепт для начинки
    if (selectedFillings[0]) { // Используем selectedFillings[0] для первого слоя
        const filling = fillings.find(f => f.id === selectedFillings[0]);
        if (filling) {
            recipe += '</ol><h4>Приготовление начинки:</h4><ol>';
            recipe += `
                <li>Подготовьте выбранное конфи или мармелад</li>
                <li>При необходимости разогрейте для лучшей консистенции</li>
                <li>Остудите до комнатной температуры перед использованием</li>
            `;
        }
    }
    
    recipe += '</ol><h4>Сборка торта:</h4><ol>';
    
    // Инструкции по сборке
    recipe += `
        <li>Убедитесь, что коржи полностью остыли</li>
        <li>Промажьте каждый корж кремом равномерным слоем</li>
        ${selectedFillings[0] ? '<li>Добавьте слой начинки между первым коржем и кремом</li>' : ''}
        <li>Сложите коржи друг на друга в правильном порядке</li>
        <li>Покройте боковые стороны и верх торта кремом</li>
        <li>Украсьте торт по желанию (фрукты, шоколад, орехи)</li>
        <li>Охладите в холодильнике 2-3 часа перед подачей</li>
    `;
    
    recipe += '</ol>';
    
    return recipe;
}

// Показать рецепт для созданного торта
function showRecipe() {
    const content = document.getElementById('recipeContent');
    const bottomSection = document.getElementById('bottomSection');
    if (!content || !bottomSection) return;
    
    // Показываем нижнюю секцию с ингредиентами и рецептом
    bottomSection.style.display = 'block';
    
    // Обновляем панели ингредиентов и рецепта
    updateIngredientsPanel();
    
    const recipe = generateRecipe();
    content.innerHTML = recipe;
    
    // Прокручиваем к рецепту
    content.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Добавляем анимацию появления
    content.style.opacity = '0';
    content.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        content.style.transition = 'all 0.5s ease';
        content.style.opacity = '1';
        content.style.transform = 'translateY(0)';
    }, 100);
}

// Показать модальное окно с описанием популярного торта
function showRecipeModal(cakeType) {
    const cake = cakeData[cakeType];
    if (!cake) return;
    
    const modal = document.getElementById('recipeModal');
    const title = document.getElementById('modalTitle');
    const cakeDescription = document.getElementById('cakeDescription');
    
    if (!modal || !title || !cakeDescription) return;
    
    title.textContent = cake.name;
    
    // Добавляем изображение торта в модальное окно, если есть
    const modalImage = document.getElementById('modalImage');
    if (modalImage && cake.image) {
        const cacheBuster = Date.now();
        modalImage.src = `${cake.image}?v=${cacheBuster}`;
        modalImage.alt = cake.name;
        modalImage.style.display = 'block';
    }
    
    // Показываем описание торта
    cakeDescription.textContent = cake.description || 'Описание торта будет добавлено позже.';
    
    // Настраиваем обработчик для кнопки открытия конструктора
    const openConstructorBtn = document.getElementById('openConstructorBtn');
    if (openConstructorBtn) {
        openConstructorBtn.onclick = () => {
            openConstructorWithCake(cakeType);
        };
    }
    
    modal.style.display = 'block';
}

// Открыть конструктор с предзаполненными данными для выбранного торта
function openConstructorWithCake(cakeType) {
    const cake = cakeData[cakeType];
    if (!cake) return;
    
    // Получаем выбранные значения
    const layerCount = parseInt(document.getElementById('layerCountSelect').value);
    const diameter = parseInt(document.getElementById('diameterSelect').value);
    
    // Сохраняем данные для передачи в конструктор
    sessionStorage.setItem('prefillCakeType', cakeType);
    sessionStorage.setItem('prefillLayerCount', layerCount);
    sessionStorage.setItem('prefillDiameter', diameter);
    
    // Закрываем модальное окно
    document.getElementById('recipeModal').style.display = 'none';
    
    // Переходим на страницу конструктора
    window.location.href = 'constructor.html';
}

// Проверить и применить предзаполненные данные для конструктора
function checkPrefillData() {
    const prefillCakeType = sessionStorage.getItem('prefillCakeType');
    const prefillLayerCount = sessionStorage.getItem('prefillLayerCount');
    const prefillDiameter = sessionStorage.getItem('prefillDiameter');
    
    if (prefillCakeType && prefillLayerCount && prefillDiameter) {
        // Очищаем данные из sessionStorage
        sessionStorage.removeItem('prefillCakeType');
        sessionStorage.removeItem('prefillLayerCount');
        sessionStorage.removeItem('prefillDiameter');
        
        // Применяем предзаполненные данные
        prefillConstructor(prefillCakeType, parseInt(prefillLayerCount), parseInt(prefillDiameter));
    }
}

// Предзаполнить конструктор данными для выбранного торта
function prefillConstructor(cakeType, layerCount, diameter) {
    // Устанавливаем количество слоев
    if (layerCount >= 2 && layerCount <= 6) {
        // Находим и устанавливаем количество слоев в интерфейсе
        const layerCountElement = document.getElementById('layerCount');
        if (layerCountElement) {
            // Устанавливаем правильное количество слоев
            while (layerCount !== parseInt(layerCountElement.textContent)) {
                if (parseInt(layerCountElement.textContent) < layerCount) {
                    changeLayers(1);
            } else {
                    changeLayers(-1);
                }
            }
        }
    }
    
    // Устанавливаем диаметр
    const diameterSelect = document.getElementById('diameterSelect');
    if (diameterSelect) {
        diameterSelect.value = diameter;
    }
    
    // Предзаполняем слои и кремы в зависимости от типа торта
    prefillCakeComponents(cakeType, layerCount);
    
    // Автоматически запускаем конструктор
    setTimeout(() => {
        startConstructor();
    }, 100);
}

// Предзаполнить компоненты торта в зависимости от типа
function prefillCakeComponents(cakeType, targetLayerCount) {
    const cake = cakeData[cakeType];
    if (!cake || !cake.components) return;
    
    // Предзаполняем слои
    cake.components.layers.forEach((layerId, index) => {
        if (index < targetLayerCount) {
            selectedLayers[index] = layerId;
        }
    });
    
    // Предзаполняем кремы
    cake.components.creams.forEach((creamId, index) => {
        if (index < targetLayerCount - 1) {
            selectedCreams[index] = creamId;
        }
    });
    
    // Предзаполняем начинки
    cake.components.fillings.forEach((fillingId, index) => {
        if (index < targetLayerCount) {
            selectedFillings[index] = fillingId;
        }
    });
}

// Анимация при прокрутке
function animateOnScroll() {
    const elements = document.querySelectorAll('.cake-card, .section-title');
    elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < window.innerHeight - elementVisible) {
            element.classList.add('animate');
        }
    });
}

// Обработчик прокрутки для анимаций
window.addEventListener('scroll', animateOnScroll);



// Показать модальное окно с ингредиентами
function showIngredientsModal(type, itemName) {
    const modal = document.getElementById('ingredientsModal');
    const title = document.getElementById('ingredientsModalTitle');
    const ingredientsList = document.getElementById('ingredientsModalList');
    
    if (!modal || !title || !ingredientsList) {
        console.error('Не удалось найти необходимые элементы модального окна');
        return;
    }
    
    title.textContent = `Ингредиенты для ${itemName}`;
    
    // Очищаем список
    ingredientsList.innerHTML = '';
    
    // Получаем данные об ингредиентах в зависимости от типа
    let ingredientsData = [];
    if (type === 'layer') {
        // Для коржей ищем конкретный корж по имени
        const layer = layers.find(l => l.name === itemName);
        if (layer && layer.ingredients) {
            // Преобразуем массив ингредиентов в нужный формат
            ingredientsData = layer.ingredients.map(ingredient => ({
                name: ingredient.charAt(0).toUpperCase() + ingredient.slice(1), // Первая буква заглавная
                amount: getLayerIngredientAmount(ingredient, layer.id)
            }));
        }
    } else if (type === 'cream') {
        // Для кремов ищем конкретный крем по имени
        const cream = creams.find(c => c.name === itemName);
        if (cream && cream.ingredients) {
            // Преобразуем массив ингредиентов в нужный формат
            ingredientsData = cream.ingredients.map(ingredient => ({
                name: ingredient.charAt(0).toUpperCase() + ingredient.slice(1), // Первая буква заглавная
                amount: getCreamIngredientAmount(ingredient, cream.id)
            }));
        }
    } else if (type === 'filling') {
        // Для начинок ищем конкретную начинку по имени
        const filling = fillings.find(f => f.name === itemName);
        if (filling && filling.ingredients) {
            if (filling.id === 'none') {
                // Для "Без начинки" показываем специальное сообщение
                ingredientsData = [
                    { name: 'Дополнительные ингредиенты не требуются', amount: '-' }
                ];
            } else {
                // Преобразуем массив ингредиентов в нужный формат
                ingredientsData = filling.ingredients.map(ingredient => ({
                    name: ingredient.charAt(0).toUpperCase() + ingredient.slice(1), // Первая буква заглавная
                    amount: getIngredientAmount(ingredient, filling.id)
                }));
            }
        }
    }
    
    // Добавляем ингредиенты
    ingredientsData.forEach(ingredient => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="ingredient-name">${ingredient.name}</span>
            <span class="ingredient-amount">${ingredient.amount}</span>
        `;
        ingredientsList.appendChild(li);
    });
    
    // Показываем модальное окно
    modal.style.display = 'block';
}

// Функция для получения количества ингредиента в зависимости от типа начинки
function getIngredientAmount(ingredient, fillingId) {
    const amounts = {
        'strawberry-jam': {
            'клубника': '500г',
            'сахар': '300г',
            'лимонный сок': '2 ст.л.',
            'пектин': '1 ч.л.'
        },
        'cherry-jam': {
            'вишня': '500г',
            'сахар': '300г',
            'лимонный сок': '2 ст.л.',
            'корица': '0.5 ч.л.'
        },
        'raspberry-jam': {
            'малина': '500г',
            'сахар': '300г',
            'лимонный сок': '2 ст.л.',
            'пектин': '1 ч.л.'
        },
        'apricot-jam': {
            'абрикосы': '500г',
            'сахар': '300г',
            'лимонный сок': '2 ст.л.',
            'ваниль': '1 ч.л.'
        },
        'orange-marmalade': {
            'апельсины': '4 шт',
            'сахар': '400г',
            'лимонный сок': '2 ст.л.',
            'цедра': '2 ст.л.'
        },
        'chocolate-ganache': {
            'темный шоколад': '200г',
            'сливки': '200мл',
            'сливочное масло': '50г'
        },
        'caramel-sauce': {
            'сахар': '200г',
            'сливки': '200мл',
            'сливочное масло': '100г',
            'соль': '0.5 ч.л.'
        },
        'lemon-curd': {
            'лимонный сок': '100мл',
            'цедра лимона': '2 ст.л.',
            'яйца': '3 шт',
            'сахар': '150г',
            'сливочное масло': '100г'
        },
        'blueberry-compote': {
            'черника': '400г',
            'сахар': '200г',
            'лимонный сок': '1 ст.л.',
            'корица': '0.5 ч.л.'
        },
        'apple-cinnamon': {
            'яблоки': '4 шт',
            'сахар': '150г',
            'корица': '1 ч.л.',
            'мускатный орех': '0.25 ч.л.',
            'лимонный сок': '1 ст.л.'
        }
    };
    
    return amounts[fillingId]?.[ingredient] || 'по вкусу';
}

// Функция для получения количества ингредиента в зависимости от типа крема
function getCreamIngredientAmount(ingredient, creamId) {
    const amounts = {
        'chocolate': {
            'темный шоколад': '200г',
            'сливочное масло': '200г',
            'сахарная пудра': '150г',
            'сливки': '100мл'
        },
        'vanilla': {
            'сливочное масло': '200г',
            'сахарная пудра': '150г',
            'ванильный экстракт': '2 ч.л.',
            'молоко': '50мл'
        },
        'strawberry': {
            'клубничное пюре': '200г',
            'сливочное масло': '200г',
            'сахарная пудра': '150г',
            'лимонный сок': '1 ст.л.'
        },
        'coffee': {
            'крепкий кофе': '100мл',
            'сливочное масло': '200г',
            'сахарная пудра': '150г',
            'кофейный ликер': '2 ст.л.'
        },
        'cherry': {
            'вишневое пюре': '200г',
            'сливочное масло': '200г',
            'сахарная пудра': '150г',
            'лимонный сок': '1 ст.л.'
        },
        'lemon': {
            'лимонный сок': '100мл',
            'цедра лимона': '2 ст.л.',
            'сливочное масло': '200г',
            'сахарная пудра': '150г'
        },
        'raspberry': {
            'малиновое пюре': '200г',
            'сливочное масло': '200г',
            'сахарная пудра': '150г',
            'лимонный сок': '1 ст.л.'
        },
        'caramel': {
            'карамельный соус': '150мл',
            'сливочное масло': '200г',
            'сахарная пудра': '100г',
            'соль': '0.5 ч.л.'
        },
        'mint': {
            'мятный экстракт': '2 ч.л.',
            'сливочное масло': '200г',
            'сахарная пудра': '150г',
            'зеленый краситель': '2-3 капли'
        },
        'hazelnut': {
            'фундучная паста': '100г',
            'сливочное масло': '200г',
            'сахарная пудра': '150г',
            'ваниль': '1 ч.л.'
        },
        'coconut': {
            'кокосовое молоко': '100мл',
            'сливочное масло': '200г',
            'сахарная пудра': '150г',
            'кокосовая стружка': '50г'
        },
        'orange': {
            'апельсиновый сок': '100мл',
            'цедра апельсина': '2 ст.л.',
            'сливочное масло': '200г',
            'сахарная пудра': '150г'
        },
        'blueberry': {
            'черничное пюре': '200г',
            'сливочное масло': '200г',
            'сахарная пудра': '150г',
            'лимонный сок': '1 ст.л.'
        },
        'pistachio': {
            'фисташковая паста': '100г',
            'сливочное масло': '200г',
            'сахарная пудра': '150г',
            'ваниль': '1 ч.л.'
        }
    };
    
    return amounts[creamId]?.[ingredient] || 'по вкусу';
}

// Функция для получения количества ингредиента в зависимости от типа коржа
function getLayerIngredientAmount(ingredient, layerId) {
    const amounts = {
        'chocolate': {
            'мука': '200г',
            'какао': '50г',
            'яйца': '3 шт',
            'сахар': '150г',
            'молоко': '200мл',
            'масло': '100г'
        },
        'vanilla': {
            'мука': '200г',
            'яйца': '3 шт',
            'сахар': '150г',
            'молоко': '200мл',
            'масло': '100г',
            'ваниль': '1 ч.л.'
        },
        'red-velvet': {
            'мука': '200г',
            'какао': '30г',
            'яйца': '3 шт',
            'пахта': '200мл',
            'масло': '100г',
            'краситель': '2 ч.л.'
        },
        'carrot': {
            'мука': '200г',
            'морковь': '200г',
            'яйца': '3 шт',
            'сахар': '150г',
            'масло': '100г',
            'специи': '1 ч.л.'
        },
        'almond': {
            'миндальная мука': '200г',
            'яйца': '3 шт',
            'сахар': '150г',
            'масло': '100г',
            'миндаль': '50г'
        },
        'coconut': {
            'мука': '200г',
            'кокосовая стружка': '100г',
            'яйца': '3 шт',
            'сахар': '150г',
            'кокосовое молоко': '200мл'
        },
        'lemon': {
            'мука': '200г',
            'яйца': '3 шт',
            'сахар': '150г',
            'лимонный сок': '100мл',
            'цедра лимона': '2 ст.л.',
            'масло': '100г'
        },
        'coffee': {
            'мука': '200г',
            'яйца': '3 шт',
            'сахар': '150г',
            'крепкий кофе': '200мл',
            'масло': '100г',
            'какао': '30г'
        },
        'banana': {
            'мука': '200г',
            'бананы': '3 шт',
            'яйца': '3 шт',
            'сахар': '150г',
            'масло': '100г',
            'корица': '1 ч.л.'
        },
        'apple': {
            'мука': '200г',
            'яблоки': '2 шт',
            'яйца': '3 шт',
            'сахар': '150г',
            'масло': '100г',
            'корица': '1 ч.л.'
        },
        'hazelnut': {
            'мука': '200г',
            'фундук': '100г',
            'яйца': '3 шт',
            'сахар': '150г',
            'масло': '100г',
            'ваниль': '1 ч.л.'
        },
        'orange': {
            'мука': '200г',
            'апельсины': '2 шт',
            'яйца': '3 шт',
            'сахар': '150г',
            'масло': '100г',
            'цедра': '2 ст.л.'
        }
    };
    
    return amounts[layerId]?.[ingredient] || 'по вкусу';
}

// Закрыть модальное окно с ингредиентами
function closeIngredientsModal() {
    const modal = document.getElementById('ingredientsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Добавить поддержку горизонтальной прокрутки курсором
function addHorizontalScrollSupport(container) {
    let isScrolling = false;
    let startX, startScrollLeft;
    
    container.addEventListener('mousedown', (e) => {
        isScrolling = true;
        startX = e.pageX - container.offsetLeft;
        startScrollLeft = container.scrollLeft;
        container.style.cursor = 'grabbing';
        e.preventDefault();
    });
    
    container.addEventListener('mousemove', (e) => {
        if (!isScrolling) return;
        
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 2;
        container.scrollLeft = startScrollLeft - walk;
    });
    
    container.addEventListener('mouseup', () => {
        isScrolling = false;
        container.style.cursor = 'grab';
    });
    
    container.addEventListener('mouseleave', () => {
        isScrolling = false;
        container.style.cursor = 'grab';
    });
    
    // Поддержка прокрутки колесиком мыши
    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
    });
}