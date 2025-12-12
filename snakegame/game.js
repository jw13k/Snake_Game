// --- 게임 로직 (Game Logic) ---

// DOM 요소 (DOM Elements)
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const waveEl = document.getElementById('wave');
const highScoreEl = document.getElementById('high-score');
const finalScoreEl = document.getElementById('final-score-val');

// 화면 및 메뉴 요소 (Screens & Menus)
const settingsModal = document.getElementById('settings-modal'); // 게임 내 설정창
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const pauseScreen = document.getElementById('pause-screen');
const clearScreen = document.getElementById('clear-screen');
const clearScoreVal = document.getElementById('clear-score-val');
const clearRestartBtn = document.getElementById('clear-restart-btn');
const clearMapBtn = document.getElementById('clear-map-btn');
const clearMenuBtn = document.getElementById('clear-menu-btn');
const bossImg = document.getElementById('boss-img');
const playerImg = document.getElementById('player-img');

// 버튼 요소 (Buttons)
const backToMenuBtn = document.getElementById('back-to-menu-btn');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// Pause Menu Buttons
const pauseResumeBtn = document.getElementById('pause-resume-btn');
const pauseSettingsBtn = document.getElementById('pause-settings-btn');
const pauseMenuBtn = document.getElementById('pause-menu-btn');

// 설정 입력 요소 (Settings Inputs - 게임 내 설정)
const volumeSlider = document.getElementById('volume-slider');
const brightnessSlider = document.getElementById('brightness-slider');
const languageSelect = document.getElementById('language-select');
// 게임 내 설정창 닫기 버튼
const closeSettingsBtn = document.getElementById('close-settings-btn');


// 게임 상수 (Game Constants)
const GRID_SIZE = 20;
const TILE_COUNT = canvas.width / GRID_SIZE;
const GAME_SPEED = 100;

// Configs
let currentStageId = 1;

// STAGE_CONFIG is now loaded from common.js

const PLAYER_IMAGES = [
    'image/NEO.png',
    'image/NEO_hurt1.png',
    'image/NEO_hurt2.png',
    'image/NEO_hurt3.png',
    'image/NEO_hurt4.png',
    'image/NEO_defeat.png'
];


// 게임 상태 변수 (Game State)
let score = 0;
let highScore = parseInt(localStorage.getItem('neon-snake-highscore')) || 0;
let gameLoopId = null;
let isGameRunning = false;
let isPaused = false;

// 뱀, 바이러스, 웨이브 데이터
let snake = [];
let viruses = [];
let currentWave = 1;
let velocity = { x: 0, y: 0 };
let nextVelocity = { x: 0, y: 0 };

// Boss & Player State
let bossState = 0; // Only used for Wave 5 Loop Logic (Stage 2 Special) or general phase tracking
let playerDamageLevel = 0; // 0(Normal), 1(Hurt1), 2(Hurt2)
let lastEnemyImgSrc = ''; // To track phase changes for visual effects

// Initialize High Score Display
if (highScoreEl) highScoreEl.innerText = highScore;

// --- 게임 제어 함수 ---

// Get Current Stage Config
function getCurrentStage() {
    return STAGE_CONFIG[currentStageId] || STAGE_CONFIG[1];
}

// Side Image Update Helper (Data-Driven)
function updateSideImages() {
    const stage = getCurrentStage();
    let enemyImgSrc = stage.baseImage;

    // Check Phase Thresholds
    if (stage.type === 'score') {
        // Iterate backwards finding highest met threshold
        // Default to base, then check phases
        for (let i = 0; i < stage.phases.length; i++) {
            if (score >= stage.phases[i].threshold) {
                enemyImgSrc = stage.phases[i].image;
            }
        }
        // If defeat state logic (BossState 3 is forced defeat for visual consistency)
        if (bossState >= 3) enemyImgSrc = stage.defeatImage;

    } else if (stage.type === 'wave') {
        // Wave Based Logic
        // Determine maxHits dynamically
        const maxHits = (stage.detectLoop && stage.detectLoop.maxHits) ? stage.detectLoop.maxHits : 3;

        // Special Case: Boss Defeat Logic
        if (bossState >= maxHits) {
            enemyImgSrc = stage.defeatImage;
        } else {
            // Check phases
            // If DetectLoop is active, we can also map phases to BossState (Hits) if Wave resets?
            // Heuristic: If stage has detectLoop, use bossState for visuals to allow progression during loop.
            // OR check both.
            for (let i = 0; i < stage.phases.length; i++) {
                const p = stage.phases[i];
                // Check Wave Threshold OR BossState Threshold (if reasonable, e.g. < 5)
                // Assuming Phase Thresholds for Loop Stages might be mapped to "Hits" (1, 2, 3...)?
                // But User Config has 5, 8... 8, 12.
                // If we reset Wave, we never reach 8.
                // Let's assume for Loop Stages, we should rely on BossState mapping if configured, 
                // OR just purely Wave. Current User Config for Stage 4 (8, 12) is problematic with Reset.
                // Let's just stick to standard Logic:
                if (currentWave >= p.threshold) {
                    enemyImgSrc = p.image;
                }

                // FORCE: If bossState is high enough, force visuals based on Hit Count (bossState)
                if (stage.detectLoop && bossState > 0) {
                    // Map bossState (1, 2, 3...) to phases array (0, 1, 2...)
                    const phaseIndex = bossState - 1;
                    if (stage.phases[phaseIndex]) {
                        enemyImgSrc = stage.phases[phaseIndex].image;
                    } else if (stage.phases.length > 0) {
                        // Fallback to last phase image if hits exceed phases count
                        enemyImgSrc = stage.phases[stage.phases.length - 1].image;
                    }
                }
            }
        }
    }

    if (bossImg) {
        // [New] Visual Effect on Phase Change
        if (lastEnemyImgSrc && lastEnemyImgSrc !== enemyImgSrc) {
            bossImg.classList.remove('shake-red-effect');
            void bossImg.offsetWidth; // Trigger reflow
            bossImg.classList.add('shake-red-effect');
            setTimeout(() => {
                bossImg.classList.remove('shake-red-effect');
            }, 500);
        }
        lastEnemyImgSrc = enemyImgSrc;
        bossImg.src = enemyImgSrc;
    }

    // Player Image Logic
    if (playerImg) {
        if (isGameRunning === false && (gameOverScreen.classList.contains('active') || clearScreen.classList.contains('active'))) {
            // Don't update side images if game over or clear screen is active (preserve defeat state)
            return;
        }
        // Dynamic Player Image Logic
        // 0: Normal, 1..N: Hurt, Last: Defeat
        const maxHurtIndex = Math.max(0, PLAYER_IMAGES.length - 2);
        const currentIndex = Math.min(playerDamageLevel, maxHurtIndex);
        playerImg.src = PLAYER_IMAGES[currentIndex];
    }
}

// 게임 데이터 초기화 함수
function initGame() {
    // Load Stage ID from Config (setup via menu.js)
    currentStageId = parseInt(localStorage.getItem('neon-snake-current-stage')) || 1;
    const stage = getCurrentStage();

    snake = [
        { x: 10, y: 10 },
        { x: 10, y: 11 },
        { x: 10, y: 12 }
    ];
    velocity = { x: 0, y: -1 };
    nextVelocity = { x: 0, y: -1 };
    score = 0;
    if (scoreEl) scoreEl.innerText = score;
    if (highScoreEl) highScoreEl.innerText = highScore;

    viruses = [];
    currentWave = 1;
    if (waveEl) waveEl.innerText = currentWave;
    spawnVirus(currentWave);

    // Reset States
    bossState = 0;
    playerDamageLevel = 0;

    // Force reset images based on Stage Base Image
    // Force reset images based on Stage Base Image
    if (bossImg) {
        bossImg.src = stage.baseImage;
        lastEnemyImgSrc = stage.baseImage; // Prevent shake on init
    }
    if (playerImg) playerImg.src = PLAYER_IMAGES[0];

    updateSideImages();

    draw();
}

// 게임 시작 함수
function startGame() {
    initAudio();
    isGameRunning = true;
    isPaused = false;

    startScreen.classList.add('hidden');
    startScreen.classList.remove('active');
    gameOverScreen.classList.add('hidden');
    gameOverScreen.classList.remove('active');
    clearScreen.classList.add('hidden');
    clearScreen.classList.remove('active');
    pauseScreen.classList.add('hidden');

    if (gameLoopId) clearInterval(gameLoopId);
    gameLoopId = setInterval(gameLoop, GAME_SPEED);
}

// 일시정지 토글 함수
function togglePause() {
    if (!isGameRunning && gameOverScreen.classList.contains('active')) return;
    if (!isGameRunning && clearScreen.classList.contains('active')) return;
    if (!isGameRunning && startScreen.classList.contains('active')) return;

    if (isPaused) {
        isPaused = false;
        pauseScreen.classList.add('hidden');
        pauseScreen.classList.remove('active');
        gameLoopId = setInterval(gameLoop, GAME_SPEED);
    } else {
        isPaused = true;
        clearInterval(gameLoopId);
        pauseScreen.classList.remove('hidden');
        pauseScreen.classList.add('active');
    }
}

// 게임 오버 처리 함수
function gameOver() {
    playSound('gameover');
    isGameRunning = false;
    clearInterval(gameLoopId);

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('neon-snake-highscore', highScore);
        if (highScoreEl) highScoreEl.innerText = highScore;
    }

    if (finalScoreEl) finalScoreEl.innerText = score;

    if (playerImg) playerImg.src = PLAYER_IMAGES[PLAYER_IMAGES.length - 1]; // Defeat Image (Last one)

    gameOverScreen.classList.remove('hidden');
    gameOverScreen.classList.add('active');
}

// 스테이지 클리어 처리 함수
function gameClear() {
    isGameRunning = false;
    clearInterval(gameLoopId);

    const stage = getCurrentStage();

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('neon-snake-highscore', highScore);
        if (highScoreEl) highScoreEl.innerText = highScore;
    }

    // Unlock Next Stage logic (Generic)
    let unlockedStages = JSON.parse(localStorage.getItem('neon-snake-unlocked-stages')) || [1];
    const maxStageId = Object.keys(STAGE_CONFIG).length; // Auto detect max stage

    if (stage.id < maxStageId) {
        const nextStage = stage.id + 1;
        if (!unlockedStages.includes(nextStage)) {
            unlockedStages.push(nextStage);
            localStorage.setItem('neon-snake-unlocked-stages', JSON.stringify(unlockedStages));
        }
    }

    if (clearScoreVal) clearScoreVal.innerText = score;

    // Show Defeat Image
    const maxHits = (stage.detectLoop && stage.detectLoop.maxHits) ? stage.detectLoop.maxHits : 3;
    bossState = maxHits; // Force defeat state based on config
    if (bossImg) bossImg.src = stage.defeatImage;

    clearScreen.classList.remove('hidden');
    clearScreen.classList.add('active');
}

// 메인으로 나가기
function quitToMenu() {
    isGameRunning = false;
    isPaused = false;
    if (gameLoopId) clearInterval(gameLoopId);

    if (clearScreen) clearScreen.classList.add('hidden');
    if (gameOverScreen) gameOverScreen.classList.add('hidden');

    window.location.href = 'index.html';
}

// 바이러스 생성 함수
function spawnVirus(count) {
    for (let i = 0; i < count; i++) {
        let newVirus = {};
        let validPosition = false;
        let attempts = 0;

        while (!validPosition && attempts < 500) {
            newVirus.x = Math.floor(Math.random() * TILE_COUNT);
            newVirus.y = Math.floor(Math.random() * TILE_COUNT);

            const onSnake = snake.some(s => s.x === newVirus.x && s.y === newVirus.y);
            const onVirus = viruses.some(f => f.x === newVirus.x && f.y === newVirus.y);
            validPosition = !onSnake && !onVirus;
            attempts++;
        }

        if (validPosition) {
            viruses.push(newVirus);
        }
    }
}

// 레벨업 시각 효과
function triggerLevelUpEffect() {
    canvas.style.transition = 'background-color 0.1s, box-shadow 0.1s';
    canvas.style.backgroundColor = '#2a2a2a';
    canvas.style.boxShadow = '0 0 80px rgba(0, 255, 136, 0.5)';

    setTimeout(() => {
        canvas.style.backgroundColor = '';
        canvas.style.boxShadow = '';
    }, 150);
}

// 데미지 시각 효과
function triggerDamageEffect() {
    canvas.style.transition = 'background-color 0.1s, box-shadow 0.1s';
    canvas.style.backgroundColor = '#4a0000';
    canvas.style.boxShadow = '0 0 80px rgba(255, 0, 85, 0.6)';

    // [New] Shake Effect for Canvas
    canvas.classList.remove('shake-red-effect');
    void canvas.offsetWidth; // Trigger reflow
    canvas.classList.add('shake-red-effect');

    // [New] Shake Effect for Player Image
    if (playerImg) {
        playerImg.classList.remove('shake-red-effect');
        void playerImg.offsetWidth;
        playerImg.classList.add('shake-red-effect');
    }

    setTimeout(() => {
        canvas.style.backgroundColor = '';
        canvas.style.boxShadow = '';
        canvas.classList.remove('shake-red-effect');
        if (playerImg) playerImg.classList.remove('shake-red-effect');
    }, 500); // Increased to match animation duration (was 150)
}

// 키보드 입력 처리 함수
function handleInput(e) {
    if (settingsModal && !settingsModal.classList.contains('hidden')) {
        if (e.key === 'Escape') {
            settingsModal.classList.add('hidden');
        }
        return;
    }

    if (e.key === 'Escape') {
        if (isGameRunning || isPaused) {
            togglePause();
        }
        return;
    }

    if (isPaused) return;

    if (e.code === 'Space') {
        e.preventDefault();
        // Start Screen case
        if (!isGameRunning && gameOverScreen.classList.contains('hidden') && clearScreen.classList.contains('hidden')) {
            startGame();
        }
        // Game Over or Clear Screen case
        else if (!isGameRunning && (gameOverScreen.classList.contains('active') || clearScreen.classList.contains('active'))) {
            initGame();
            startGame();
        }
        return;
    }

    if (!isGameRunning) return;

    // 이동 키 처리
    switch (e.key) {
        case 'ArrowUp': case 'w': case 'W':
            if (velocity.y === 1) break;
            nextVelocity = { x: 0, y: -1 };
            break;
        case 'ArrowDown': case 's': case 'S':
            if (velocity.y === -1) break;
            nextVelocity = { x: 0, y: 1 };
            break;
        case 'ArrowLeft': case 'a': case 'A':
            if (velocity.x === 1) break;
            nextVelocity = { x: -1, y: 0 };
            break;
        case 'ArrowRight': case 'd': case 'D':
            if (velocity.x === -1) break;
            nextVelocity = { x: 1, y: 0 };
            break;
    }
}

// 게임 상태 업데이트 함수
function update() {
    velocity = nextVelocity;
    const stage = getCurrentStage();

    const head = {
        x: snake[0].x + velocity.x,
        y: snake[0].y + velocity.y
    };

    if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
        handleDamage();
        return;
    }

    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        handleDamage();
        return;
    }

    snake.unshift(head);

    const virusIndex = viruses.findIndex(f => f.x === head.x && f.y === head.y);

    if (virusIndex !== -1) {
        playSound('eat');
        score += 10;

        // Player Recovery Logic
        if (playerDamageLevel > 0) {
            playerDamageLevel--;
        }
        // Visual Update for Stage 1 (Score Based) happens here immediately
        updateSideImages();

        if (scoreEl) scoreEl.innerText = score;

        if (score > highScore) {
            highScore = score;
            if (highScoreEl) highScoreEl.innerText = highScore;
            localStorage.setItem('neon-snake-highscore', highScore);
        }

        viruses.splice(virusIndex, 1);

        // Win Condition Check for Score Type (Stage 1)
        if (stage.type === 'score') {
            if (score >= stage.target) {
                gameClear();
                return;
            }
        }

        if (viruses.length === 0) {
            playSound('levelup');
            triggerLevelUpEffect();
            currentWave++;

            // Wave Based Logic (Stage 2)
            if (stage.type === 'wave') {
                // Generic Loop Logic (Modulo Based)
                // Trigger when we just CLEARED a multiple of the loop wave
                // Since currentWave was just incremented, we check (currentWave - 1)
                if (stage.detectLoop && (currentWave - 1) > 0 && (currentWave - 1) % stage.detectLoop.wave === 0) {
                    bossState++; // Acts as 'Hits' counter
                    updateSideImages();
                    triggerLevelUpEffect();
                }

                // Win Condition: Max Hits reached OR Target Wave reached
                if ((stage.detectLoop && bossState >= stage.detectLoop.maxHits) || currentWave > stage.target) {
                    gameClear();
                    return;
                }
            }

            if (waveEl) waveEl.innerText = currentWave;
            spawnVirus(currentWave);
        }
    } else {
        snake.pop();
    }
}

// 데미지 처리
function handleDamage() {
    playSound('damage');
    triggerDamageEffect();

    snake.pop();

    // Increase Damage Level
    // Cap at PLAYER_IMAGES.length - 2 (Last Hurt Index)
    playerDamageLevel = Math.min(playerDamageLevel + 1, Math.max(0, PLAYER_IMAGES.length - 2));
    updateSideImages();

    if (score > 0) {
        score = Math.max(0, score - 10);
        if (scoreEl) scoreEl.innerText = score;
    }

    // Snake Damage = Wave Reset to 1 (Penalty)
    // For Score Stage, keeping wave logic for virus spawning speed/count is fine, but maybe just reset wave to 1 too.
    if (currentWave > 1 && snake.length > 0) {
        currentWave = 1;
        if (waveEl) waveEl.innerText = currentWave;
        viruses = [];
        spawnVirus(currentWave);
    }

    if (snake.length === 0) {
        gameOver();
    }
}

// 화면 렌더링 함수
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Viruses
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff0055';
    ctx.fillStyle = '#ff0055';
    viruses.forEach(virus => {
        ctx.fillRect(virus.x * GRID_SIZE, virus.y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2);
    });

    // Draw Snake
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00ff88';

    snake.forEach((segment, index) => {
        if (index === 0) {
            ctx.fillStyle = '#ccffdd';
        } else {
            ctx.fillStyle = '#00ff88';
        }
        ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2);
    });

    ctx.shadowBlur = 0;
}

// 게임 메인 루프
function gameLoop() {
    update();
    if (isGameRunning) {
        draw();
    }
}

// --- 이벤트 리스너 등록 ---
document.addEventListener('keydown', handleInput);
if (startBtn) startBtn.addEventListener('click', startGame);
if (restartBtn) restartBtn.addEventListener('click', () => {
    initGame();
    startGame();
});
if (backToMenuBtn) backToMenuBtn.addEventListener('click', quitToMenu);

// 일시정지 메뉴 이벤트
if (pauseResumeBtn) pauseResumeBtn.addEventListener('click', togglePause);
if (pauseSettingsBtn) pauseSettingsBtn.addEventListener('click', () => {
    if (settingsModal) settingsModal.classList.remove('hidden');
});
if (pauseMenuBtn) pauseMenuBtn.addEventListener('click', quitToMenu);

// Stage Clear Event Listeners
if (clearRestartBtn) clearRestartBtn.addEventListener('click', () => {
    initGame();
    startGame();
});
if (clearMenuBtn) clearMenuBtn.addEventListener('click', quitToMenu);

// Stage Map Button (Added)
if (clearMapBtn) clearMapBtn.addEventListener('click', () => {
    window.location.href = 'index.html?view=stage_map';
});

// 설정 이벤트 (게임 내)
if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => {
    if (settingsModal) settingsModal.classList.add('hidden');
});

if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
        globalVolume = e.target.value / 100;
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
        if (lang === 'ko') {
            if (document.querySelector('.main-title')) document.querySelector('.main-title').innerText = '네온 스네이크';
            // 게임 내 요소 한글화 (필요 시 더 추가)
            if (startBtn) startBtn.innerText = '시작';
        } else {
            if (document.querySelector('.main-title')) document.querySelector('.main-title').innerText = 'NEON SNAKE';
        }
    });
}

// 초기 호출 (게임 화면 진입 시)
initAudio();
initGame();
