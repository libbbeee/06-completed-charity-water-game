// Store the game values in simple variables.
let vitality = 0;
let trashCollected = 0;
let selectedSectionId = 1;
let currentDifficulty = 'medium';

const difficultySettings = {
    easy: { label: 'Easy', bucketGain: 2, cleanCost: 15, fishCost: 10, buildWellCost: 15, cleanupStep: 25, trashItemRange: [1, 2] },
    medium: { label: 'Medium', bucketGain: 1, cleanCost: 20, fishCost: 15, buildWellCost: 20, cleanupStep: 25, trashItemRange: [1, 3] },
    hard: { label: 'Hard', bucketGain: 1, cleanCost: 25, fishCost: 20, buildWellCost: 25, cleanupStep: 20, trashItemRange: [2, 4] }
};

// Get the HTML elements we will update.
const vitalityValue = document.getElementById('vitality-value');
const trashValue = document.getElementById('trash-value');
const fishValue = document.getElementById('fish-value');
const environmentStatus = document.getElementById('environment-status');
const bucketButton = document.getElementById('bucket-button');
const world = document.getElementById('world');
const shopButtons = document.querySelectorAll('.shop-button');
const difficultyButtons = document.querySelectorAll('.difficulty-button');
const cleanWaterCost = document.getElementById('clean-water-cost');
const buyFishCost = document.getElementById('buy-fish-cost');
const buildWellCost = document.getElementById('build-well-cost');
const resetButton = document.getElementById('reset-button');

// Each lake section is stored as an object in an array.
const sectionConfigs = [
    { id: 1, row: 1, col: 2, neighbors: [2, 4], unlocked: true, cleaned: false, cleanliness: 0 },
    { id: 2, row: 1, col: 1, neighbors: [1, 3, 5], unlocked: false, cleaned: false, cleanliness: 0 },
    { id: 3, row: 1, col: 3, neighbors: [2, 6], unlocked: false, cleaned: false, cleanliness: 0 },
    { id: 4, row: 2, col: 1, neighbors: [1, 5], unlocked: false, cleaned: false, cleanliness: 0 },
    { id: 5, row: 2, col: 2, neighbors: [2, 4, 6], unlocked: false, cleaned: false, cleanliness: 0 },
    { id: 6, row: 2, col: 3, neighbors: [3, 5], unlocked: false, cleaned: false, cleanliness: 0 }
];

const trashIcons = ['🗑️', '🧴', '🧷', '🧼', '🥫'];
let lakeSections = [];

// Create the lake section elements inside the world container.
function buildWorld() {
    world.innerHTML = '';
    lakeSections = sectionConfigs.map((config) => {
        const sectionElement = document.createElement('button');
        sectionElement.type = 'button';
        sectionElement.className = 'lake-section section-dirty';
        sectionElement.dataset.sectionId = config.id;
        sectionElement.style.gridRow = config.row;
        sectionElement.style.gridColumn = config.col;

        sectionElement.innerHTML = `
            <span class="section-label">Section ${config.id}</span>
            <div class="section-trash-layer"></div>
            <span class="section-plants">🌿</span>
            <span class="section-fish">🐟</span>
            <div class="section-progress">
                <div class="section-progress-fill"></div>
            </div>
            <div class="section-progress-text">0% Cleared</div>
        `;

        sectionElement.addEventListener('click', () => {
            selectSection(config.id);
        });

        world.appendChild(sectionElement);

        return {
            ...config,
            element: sectionElement,
            trashItems: [],
            fishCount: 0
        };
    });

    updateAllSections();
    zoomOut();
}

// Update the HUD so the player can see the current numbers.
function updateUI() {
    vitalityValue.textContent = vitality;
    trashValue.textContent = trashCollected;
    fishValue.textContent = lakeSections.reduce((sum, section) => sum + section.fishCount, 0);
    updateEnvironment();
}

function getDifficultySettings() {
    return difficultySettings[currentDifficulty];
}

function updateDifficultyButtons() {
    difficultyButtons.forEach((button) => {
        const isActive = button.dataset.difficulty === currentDifficulty;
        button.classList.toggle('active', isActive);
    });
}

function selectDifficulty(difficulty) {
    if (!difficultySettings[difficulty]) {
        return;
    }

    currentDifficulty = difficulty;
    updateDifficultyButtons();
    updateShopPrices();
    setEnvironmentMessage(`${difficultySettings[difficulty].label} mode selected.`, 1800);
}

function updateShopPrices() {
    const settings = getDifficultySettings();

    if (cleanWaterCost) {
        cleanWaterCost.textContent = `Cost: ${settings.cleanCost}💕`;
    }

    if (buyFishCost) {
        buyFishCost.textContent = `Cost: ${settings.fishCost}💕`;
    }

    if (buildWellCost) {
        buildWellCost.textContent = `Cost: ${settings.buildWellCost} Trash`;
    }
}

// Add one vitality point when the bucket is clicked.
function showHeartBurst() {
    const heart = document.createElement('span');
    heart.className = 'heart-burst';
    heart.textContent = '💕';

    const driftX = (Math.random() - 0.5) * 48;
    const driftY = -44 - Math.random() * 18;
    heart.style.setProperty('--drift-x', `${driftX}px`);
    heart.style.setProperty('--drift-y', `${driftY}px`);

    heart.style.left = `${bucketButton.offsetLeft + bucketButton.offsetWidth / 2}px`;
    heart.style.top = `${bucketButton.offsetTop + bucketButton.offsetHeight / 2}px`;

    bucketButton.parentElement.appendChild(heart);

    setTimeout(() => {
        heart.remove();
    }, 700);
}

function earnVitality() {
    vitality += getDifficultySettings().bucketGain;
    updateUI();
    showHeartBurst();

    bucketButton.classList.remove('active');
    void bucketButton.offsetWidth;
    bucketButton.classList.add('active');

    setTimeout(() => {
        bucketButton.classList.remove('active');
    }, 150);
}

// Select a section so the player can clean it.
function selectSection(sectionId) {
    const section = lakeSections.find((item) => item.id === sectionId);

    if (!section || !section.unlocked) {
        return;
    }

    selectedSectionId = sectionId;
    updateAllSections();
}

// Update the look of every section using CSS classes.
function updateAllSections() {
    lakeSections.forEach((section) => {
        const isUnlocked = section.unlocked;
        const isClean = section.cleaned;
        const isSelected = section.id === selectedSectionId;

        section.element.classList.toggle('is-locked', !isUnlocked);
        section.element.classList.toggle('is-selected', isUnlocked && isSelected);
        section.element.classList.toggle('section-dirty', isUnlocked && !isClean);
        section.element.classList.toggle('section-clean', isUnlocked && isClean);
        updateFishDisplay(section);
        updateSectionProgress(section);
    });

    updateUI();
}

// Add random trash pieces to a cleaned section.
function spawnTrashItems(section) {
    const trashLayer = section.element.querySelector('.section-trash-layer');

    if (!trashLayer) {
        return;
    }

    // Clear old trash before placing new pieces.
    trashLayer.innerHTML = '';
    section.trashItems = [];

    const settings = getDifficultySettings();
    const [minItems, maxItems] = settings.trashItemRange;
    const numberOfItems = Math.floor(Math.random() * (maxItems - minItems + 1)) + minItems;

    for (let i = 0; i < numberOfItems; i += 1) {
        const trashItem = document.createElement('div');
        trashItem.className = 'section-trash-item';
        trashItem.textContent = trashIcons[Math.floor(Math.random() * trashIcons.length)];
        trashItem.style.left = `${15 + Math.random() * 70}%`;
        trashItem.style.top = `${20 + Math.random() * 60}%`;

        trashItem.addEventListener('click', (event) => {
            event.stopPropagation();
            removeTrashItem(section, trashItem);
        });

        trashLayer.appendChild(trashItem);
        section.trashItems.push(trashItem);
    }
}

// Remove a trash item when it is clicked.
function removeTrashItem(section, trashItem) {
    trashItem.remove();
    section.trashItems = section.trashItems.filter((item) => item !== trashItem);
    trashCollected += 1;
    updateUI();
}

// Clean the selected section using vitality points.
function cleanSection(sectionId) {
    const section = lakeSections.find((item) => item.id === sectionId);

    if (!section || !section.unlocked || section.cleaned) {
        return;
    }

    const settings = getDifficultySettings();

    if (vitality < settings.cleanCost) {
        setEnvironmentMessage('You need more vitality points to clean this section.');
        return;
    }

    vitality -= settings.cleanCost;
    section.cleanliness = Math.min(100, section.cleanliness + settings.cleanupStep);
    section.element.classList.add('section-cleaning');

    setTimeout(() => {
        section.element.classList.remove('section-cleaning');
    }, 400);

    if (section.cleanliness >= 100) {
        section.cleaned = true;
        spawnTrashItems(section);
        trashCollected += 1;
        unlockNextSection(section.id);
    }

    updateAllSections();
}

// Unlock nearby sections when a section is fully cleaned.
function unlockNextSection(sectionId) {
    const section = lakeSections.find((item) => item.id === sectionId);

    if (!section) {
        return;
    }

    section.neighbors.forEach((neighborId) => {
        const neighbor = lakeSections.find((item) => item.id === neighborId);

        if (neighbor && !neighbor.unlocked) {
            neighbor.unlocked = true;
        }
    });

    zoomOut();
}

// Zoom the world outward as more sections are unlocked.
function zoomOut() {
    const unlockedCount = lakeSections.filter((section) => section.unlocked).length;
    const scale = Math.max(0.72, 1 - (unlockedCount - 1) * 0.08);
    world.style.transform = `scale(${scale})`;
}

// Update the status text with simple beginner-friendly messages.
function updateEnvironment() {
    const cleanedCount = lakeSections.filter((section) => section.cleaned).length;
    const totalCount = lakeSections.length;

    if (cleanedCount === 0) {
        environmentStatus.textContent = 'The first lake section is still dirty and waiting for help.';
    } else if (cleanedCount < totalCount) {
        environmentStatus.textContent = `${cleanedCount} of ${totalCount} lake sections are brighter now.`;
    } else {
        environmentStatus.textContent = 'The whole lake is glowing with life.';
    }
}

function setEnvironmentMessage(message, delay = 2200) {
    environmentStatus.textContent = message;
    clearTimeout(environmentStatus.resetTimeout);
    environmentStatus.resetTimeout = setTimeout(updateEnvironment, delay);
}

function updateFishDisplay(section) {
    const fishIndicator = section.element.querySelector('.section-fish');
    if (!fishIndicator) {
        return;
    }

    if (section.fishCount > 0) {
        fishIndicator.textContent = `🐟 x${section.fishCount}`;
    } else {
        fishIndicator.textContent = '🐟';
    }
}

function updateSectionProgress(section) {
    const progressFill = section.element.querySelector('.section-progress-fill');
    const progressText = section.element.querySelector('.section-progress-text');

    if (!progressFill || !progressText) {
        return;
    }

    const progress = Math.min(100, Math.max(0, section.cleanliness));
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `${progress}% Cleared`;

    if (progress >= 100) {
        progressText.textContent = 'Completed!';
    }
}

function buyFish(sectionId) {
    const section = lakeSections.find((item) => item.id === sectionId);
    const cost = getDifficultySettings().fishCost;

    if (!section || !section.unlocked || !section.cleaned) {
        setEnvironmentMessage('Clean this section first to add fish to the pond.');
        return;
    }

    if (vitality < cost) {
        setEnvironmentMessage('You need more vitality points to buy fish.');
        return;
    }

    vitality -= cost;
    section.fishCount += 1;
    updateFishDisplay(section);
    updateUI();
    setEnvironmentMessage('A new fish is swimming in your pond!');
}

function animateFishHeart(section) {
    const fishIndicator = section.element.querySelector('.section-fish');
    if (!fishIndicator || section.fishCount === 0) {
        return;
    }

    fishIndicator.classList.remove('heart-pulse');
    void fishIndicator.offsetWidth;
    fishIndicator.classList.add('heart-pulse');
}

function startFishEarnings() {
    setInterval(() => {
        let totalFish = 0;

        lakeSections.forEach((section) => {
            if (section.fishCount > 0) {
                totalFish += section.fishCount;
                animateFishHeart(section);
            }
        });

        if (totalFish > 0) {
            vitality += totalFish;
            updateUI();
        }
    }, 6000);
}

// Placeholder function for other upgrades.
function buyUpgrade(upgradeName = 'upgrade') {
    console.log(`${upgradeName} clicked. More features will be added soon.`);
}

// Reset the game back to the starting state.
function resetGame() {
    vitality = 0;
    trashCollected = 0;
    selectedSectionId = 1;

    lakeSections.forEach((section) => {
        section.unlocked = section.id === 1;
        section.cleaned = false;
        section.cleanliness = 0;
        section.trashItems = [];
        section.fishCount = 0;

        const trashLayer = section.element.querySelector('.section-trash-layer');
        if (trashLayer) {
            trashLayer.innerHTML = '';
        }

        updateFishDisplay(section);
    });

    zoomOut();
    updateAllSections();
}

// Connect all of the buttons and interactive items.
function setupEvents() {
    bucketButton.addEventListener('click', earnVitality);

    shopButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const upgradeName = button.dataset.upgrade;

            if (upgradeName === 'Clean Water') {
                cleanSection(selectedSectionId);
            } else if (upgradeName === 'Buy Fish') {
                buyFish(selectedSectionId);
            } else {
                buyUpgrade(upgradeName);
            }
        });
    });

    difficultyButtons.forEach((button) => {
        button.addEventListener('click', () => {
            selectDifficulty(button.dataset.difficulty);
        });
    });

    resetButton.addEventListener('click', resetGame);
}

// Start the game.
buildWorld();
setupEvents();
updateDifficultyButtons();
updateShopPrices();
startFishEarnings();
updateUI();
