// --- 메인 메뉴 로직 (Main Menu Logic) ---

// Check URL Params for Direct Navigation
window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'stage_map') {
        const mainMenu = document.getElementById('main-menu');
        const stageSelectScreen = document.getElementById('stage-select-screen');

        mainMenu.classList.add('hidden');
        stageSelectScreen.classList.remove('hidden');
        updateStageMap();
    }
});

// DOM 요소 (DOM Elements)
const settingsModal = document.getElementById('settings-modal');
const mainMenu = document.getElementById('main-menu');
const stageSelectScreen = document.getElementById('stage-select-screen');

const mainStartBtn = document.getElementById('main-start-btn');
const settingsBtn = document.getElementById('main-settings-btn');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const stageBackBtn = document.getElementById('stage-back-btn');

// Stage Nodes
const stageNodes = document.querySelectorAll('.stage-node');

// 설정 입력 요소 (Settings Inputs)
const volumeSlider = document.getElementById('volume-slider');
const brightnessSlider = document.getElementById('brightness-slider');
const languageSelect = document.getElementById('language-select');

// --- 이벤트 리스너 (Menu Interaction) ---

// 메인 화면 시작 버튼 -> 스테이지 선택 화면
mainStartBtn.addEventListener('click', () => {
    mainMenu.classList.add('hidden');
    stageSelectScreen.classList.remove('hidden');
    updateStageMap();
});

// 스테이지 선택 화면 뒤로가기
stageBackBtn.addEventListener('click', () => {
    stageSelectScreen.classList.add('hidden');
    mainMenu.classList.remove('hidden');
});

// 메인 화면 설정 버튼
settingsBtn.addEventListener('click', () => {
    settingsModal.classList.remove('hidden');
});

// 설정창 닫기 버튼
closeSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
});

// --- 스테이지 로직 (Event Delegation) ---
// 스테이지 선택 컨테이너에 이벤트 리스너 등록
const stageMapContainer = document.querySelector('.stage-map-container');
if (stageMapContainer) {
    stageMapContainer.addEventListener('click', (e) => {
        const node = e.target.closest('.stage-node');
        if (node && node.classList.contains('unlocked')) {
            const stageId = parseInt(node.dataset.stage);
            startGame(stageId);
        }
    });
}

function updateStageMap() {
    const unlockedStages = JSON.parse(localStorage.getItem('neon-snake-unlocked-stages')) || [1];

    // Clear existing map (Remove hardcoded HTML to avoid duplicates)
    if (stageMapContainer) {
        stageMapContainer.innerHTML = '';

        // Iterate Config to Generate Nodes (STAGE_CONFIG from common.js)
        Object.values(STAGE_CONFIG).forEach((stage, index) => {
            // Add connecting line if not first node
            if (index > 0) {
                const line = document.createElement('div');
                line.className = 'stage-line';
                stageMapContainer.appendChild(line);
            }

            // Create Stage Node
            const node = document.createElement('div');
            node.className = 'stage-node';
            node.dataset.stage = stage.id;

            // Check Unlock Status
            if (unlockedStages.includes(stage.id)) {
                node.classList.add('unlocked');
            } else {
                node.classList.add('locked');
            }

            // Inner HTML
            node.innerHTML = `
                <div class="stage-icon">${stage.id}</div>
                <div class="stage-label">${stage.name}</div>
            `;

            stageMapContainer.appendChild(node);
        });
    }
}

function startGame(stageId) {
    localStorage.setItem('neon-snake-current-stage', stageId);
    window.location.href = 'game.html';
}

// Settings Logic
if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
        globalVolume = e.target.value / 100;
        // 볼륨 설정 저장 로직이 필요하다면 여기에 추가 (localStorage 등)
    });
}

if (brightnessSlider) {
    brightnessSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        document.body.style.filter = `brightness(${val}%)`;
    });
}

if (languageSelect) {
    languageSelect.addEventListener('change', (e) => {
        const lang = e.target.value;
        // 언어 설정에 따른 텍스트 변경 로직
        if (lang === 'ko') {
            if (document.querySelector('.main-title')) document.querySelector('.main-title').innerText = '네온 스네이크';
            mainStartBtn.innerText = '게임 시작';
            settingsBtn.innerText = '설정';
            if (document.querySelector('.menu-title')) document.querySelector('.menu-title').innerText = '스테이지 선택';
        } else {
            if (document.querySelector('.main-title')) document.querySelector('.main-title').innerText = 'NEON SNAKE';
            mainStartBtn.innerText = 'START GAME';
            settingsBtn.innerText = 'SETTINGS';
            if (document.querySelector('.menu-title')) document.querySelector('.menu-title').innerText = 'SELECT STAGE';
        }
    });
}
