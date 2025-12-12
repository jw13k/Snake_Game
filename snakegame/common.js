// --- 공통 설정 및 오디오 처리 (Common Settings & Audio) ---

// Audio Context
let audioCtx = null;
let globalVolume = 0.5;

// 오디오 시스템 초기화 함수
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// 효과음 재생 함수 (type: 'eat', 'damage', 'gameover', 'levelup')
function playSound(type) {
    if (!audioCtx || globalVolume <= 0) return;

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const baseVolume = globalVolume;

    if (type === 'eat') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3 * baseVolume, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'damage') {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.3 * baseVolume, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2);
    } else if (type === 'gameover') {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
        oscillator.frequency.linearRampToValueAtTime(50, audioCtx.currentTime + 1);
        gainNode.gain.setValueAtTime(0.5 * baseVolume, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 1);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 1);
    } else if (type === 'levelup') {
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
        oscillator.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1 * baseVolume, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
    }
}
// --- STAGE CONFIGURATION (Managed in Common for Global Access) ---
const STAGE_CONFIG = {
    1: {
        id: 1,
        name: 'SOLDIER',
        type: 'score',
        target: 100, // Win Condition: Score 100
        baseImage: 'image/soldier_1.png',
        defeatImage: 'image/soldier_1_defeat.png',
        detectLoop: null,
        phases: [
            { threshold: 30, image: 'image/soldier_1_hurt1.png' },
            { threshold: 60, image: 'image/soldier_1_hurt2.png' },
            { threshold: 90, image: 'image/soldier_1_hurt3.png' }
        ]
    },
    2: {
        id: 2,
        name: 'BOSS',
        type: 'wave',
        target: 10, // Win Condition: Wave 10
        baseImage: 'image/boss_1.png',
        defeatImage: 'image/boss_1_defeat.png',
        detectLoop: { wave: 2, maxHits: 3 },
        phases: [
            { threshold: 5, image: 'image/boss_1_hurt1.png' },
            { threshold: 8, image: 'image/boss_1_hurt2.png' }
        ]
    },
    3: {
        id: 3,
        name: 'SOLDIER',
        type: 'score',
        target: 200,
        baseImage: 'image/soldier_1.png',
        defeatImage: 'image/soldier_1_defeat.png',
        detectLoop: null,
        phases: [
            { threshold: 40, image: 'image/soldier_1_hurt1.png' },
            { threshold: 70, image: 'image/soldier_1_hurt2.png' }
        ]
    },
    4: {
        id: 4,
        name: 'BOSS',
        type: 'wave',
        target: 15,
        baseImage: 'image/boss_1.png',
        defeatImage: 'image/boss_1_defeat.png',
        detectLoop: { wave: 2, maxHits: 3 },
        phases: [
            { threshold: 8, image: 'image/boss_1_hurt1.png' },
            { threshold: 12, image: 'image/boss_1_hurt2.png' }
        ]
    },
    5: {
        id: 5,
        name: 'SOLDIER',
        type: 'score',
        target: 200,
        baseImage: 'image/soldier_1.png',
        defeatImage: 'image/soldier_1_defeat.png',
        detectLoop: null,
        phases: [
            { threshold: 40, image: 'image/soldier_1_hurt1.png' },
            { threshold: 70, image: 'image/soldier_1_hurt2.png' }
        ]
    },
    6: {
        id: 6,
        name: 'BOSS',
        type: 'wave',
        target: 15,
        baseImage: 'image/boss_1.png',
        defeatImage: 'image/boss_1_defeat.png',
        detectLoop: { wave: 2, maxHits: 4 },
        phases: [
            { threshold: 8, image: 'image/boss_1_hurt1.png' },
            { threshold: 11, image: 'image/boss_1_hurt2.png' },
            { threshold: 14, image: 'image/boss_1_hurt3.png' }
        ]
    }
};
