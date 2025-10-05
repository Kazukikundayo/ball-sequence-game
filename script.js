// ゲーム状態管理
let gameState = {
    isPlaying: false,
    startTime: null,
    currentNumber: 1,
    score: 0,
    totalBalls: 20,
    timer: null,
    elapsedTime: 0
};

// ボールのサイズとカラーの定義 - 9種類のサイズ（100px～900px）
const ballSizes = ['xxs', 'xs', 's', 'sm', 'm', 'ml', 'l', 'xl', 'xxl'];
const ballColors = ['red', 'blue', 'yellow', 'green', 'orange', 'pink'];

// サイズごとの実際のピクセルサイズ（配置計算用）- 100px刻み（100px～900px）
const sizePixels = {
    'xxs': 100,
    'xs': 200,
    's': 300,
    'sm': 400,
    'm': 500,
    'ml': 600,
    'l': 700,
    'xl': 800,
    'xxl': 900
};

// モバイル向けサイズ調整
function getActualBallSize(size) {
    if (window.innerWidth <= 480) {
        const mobileSizes = { 
            'xxs': 60, 'xs': 80, 's': 100, 'sm': 120, 
            'm': 140, 'ml': 160, 'l': 180, 'xl': 200, 'xxl': 220 
        };
        return mobileSizes[size];
    } else if (window.innerWidth <= 768) {
        const tabletSizes = { 
            'xxs': 70, 'xs': 110, 's': 150, 'sm': 190, 
            'm': 230, 'ml': 270, 'l': 310, 'xl': 350, 'xxl': 400 
        };
        return tabletSizes[size];
    }
    return sizePixels[size];
}

// DOM要素の取得
const elements = {
    startBtn: document.getElementById('start-btn'),
    resetBtn: document.getElementById('reset-btn'),
    playAgainBtn: document.getElementById('play-again-btn'),
    musicBtn: document.getElementById('music-btn'),
    gameArea: document.getElementById('game-area'),
    timer: document.getElementById('timer'),
    nextNumber: document.getElementById('next-number'),
    score: document.getElementById('score'),
    result: document.getElementById('result'),
    finalTime: document.getElementById('final-time'),
    backgroundMusic: document.getElementById('background-music')
};

// 音楽の状態管理
let musicState = {
    isPlaying: false,
    volume: 0.3
};

// イベントリスナーの設定
elements.startBtn.addEventListener('click', startGame);
elements.resetBtn.addEventListener('click', resetGame);
elements.playAgainBtn.addEventListener('click', resetGame);
elements.musicBtn.addEventListener('click', toggleBackgroundMusic);

// 音楽制御機能
function initializeMusic() {
    if (elements.backgroundMusic) {
        elements.backgroundMusic.volume = musicState.volume;
        elements.backgroundMusic.loop = true;
        
        // より詳細なログ
        console.log('Initializing music...');
        console.log('Audio element:', elements.backgroundMusic);
        console.log('Audio sources:', Array.from(elements.backgroundMusic.children).map(s => s.src));
        
        // 音楽の読み込み完了を確認
        elements.backgroundMusic.addEventListener('canplaythrough', () => {
            console.log('Background music loaded successfully');
            console.log('Duration:', elements.backgroundMusic.duration);
        });
        
        // 読み込み開始
        elements.backgroundMusic.addEventListener('loadstart', () => {
            console.log('Background music loading started');
        });
        
        // 読み込み中
        elements.backgroundMusic.addEventListener('progress', () => {
            console.log('Background music loading progress...');
        });
        
        // 再生開始
        elements.backgroundMusic.addEventListener('play', () => {
            console.log('Music started playing');
        });
        
        // 一時停止
        elements.backgroundMusic.addEventListener('pause', () => {
            console.log('Music paused');
        });
        
        // エラーハンドリング
        elements.backgroundMusic.addEventListener('error', (e) => {
            console.error('Background music failed to load:', e);
            console.error('Audio error details:', {
                error: e.target.error,
                networkState: e.target.networkState,
                readyState: e.target.readyState,
                src: e.target.src
            });
            // エラーメッセージを表示
            elements.musicBtn.textContent = '❌ 音楽エラー';
            elements.musicBtn.disabled = true;
        });
        
        // 音楽ファイルの読み込みを開始
        elements.backgroundMusic.load();
    } else {
        console.error('Background music element not found!');
    }
}

// 音楽再生の共通関数
function playBackgroundMusic() {
    if (!elements.backgroundMusic) {
        console.log('音楽ファイルが見つかりません。');
        return Promise.reject(new Error('Audio element not found'));
    }
    
    console.log('Starting music playback...');
    console.log('Audio element:', elements.backgroundMusic);
    console.log('Audio src:', elements.backgroundMusic.src);
    
    return elements.backgroundMusic.play()
        .then(() => {
            musicState.isPlaying = true;
            elements.musicBtn.textContent = '🔇 音楽OFF';
            elements.musicBtn.classList.remove('muted');
            console.log('Music playing successfully');
        })
        .catch((error) => {
            console.error('音楽の再生に失敗しました:', error);
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                audioSrc: elements.backgroundMusic.src,
                audioReadyState: elements.backgroundMusic.readyState,
                audioNetworkState: elements.backgroundMusic.networkState
            });
            
            // より詳細なエラー情報
            if (error.name === 'NotAllowedError') {
                console.log('ブラウザの自動再生ポリシーにより音楽を再生できませんでした。');
            } else if (error.name === 'NotSupportedError') {
                console.log('音楽ファイル形式がサポートされていません。');
            }
            throw error;
        });
}

function toggleBackgroundMusic() {
    if (!elements.backgroundMusic) {
        alert('音楽ファイルが見つかりません。background.mp3ファイルを確認してください。');
        return;
    }
    
    console.log('Music toggle clicked, current state:', musicState.isPlaying);
    
    if (musicState.isPlaying) {
        // 音楽を停止
        elements.backgroundMusic.pause();
        musicState.isPlaying = false;
        elements.musicBtn.textContent = '🎵 音楽ON';
        elements.musicBtn.classList.add('muted');
        console.log('Music paused');
    } else {
        // 音楽を再生
        playBackgroundMusic();
    }
}

// ページ読み込み時に音楽の自動再生を試行
function attemptAutoPlay() {
    console.log('Attempting auto-play...');
    if (!elements.backgroundMusic) {
        console.log('No background music element found');
        return;
    }
    
    // ユーザーインタラクション後に自動再生を試行
    const startAutoPlay = () => {
        console.log('User interaction detected, trying auto-play...');
        if (!musicState.isPlaying) {
            // 少し遅延を入れてから再生
            setTimeout(() => {
                playBackgroundMusic()
                    .catch((error) => {
                        console.log('Auto-play failed:', error.message);
                        // 自動再生に失敗した場合は手動再生を促す
                        elements.musicBtn.style.animation = 'pulse 1s infinite';
                    });
            }, 500);
        }
    };
    
    // 複数のイベントでユーザーインタラクションを検知
    const events = ['click', 'touchstart', 'keydown'];
    events.forEach(event => {
        document.addEventListener(event, startAutoPlay, { once: true });
    });
}

// ゲーム開始
function startGame() {
    if (gameState.isPlaying) return;
    
    gameState.isPlaying = true;
    gameState.startTime = Date.now();
    gameState.currentNumber = 1;
    gameState.score = 0;
    gameState.elapsedTime = 0;
    
    // UI更新
    elements.startBtn.disabled = true;
    elements.result.style.display = 'none';
    updateUI();
    
    // ゲーム開始時に音楽を自動再生
    if (!musicState.isPlaying) {
        playBackgroundMusic()
            .then(() => {
                console.log('Background music started with game');
                // ゲーム開始時に音楽の音量を少し下げる（効果音が聞こえやすくするため）
                elements.backgroundMusic.volume = musicState.volume * 0.7;
            })
            .catch((error) => {
                console.log('Game start music failed:', error.message);
                // 音楽再生に失敗しても ゲームは続行
            });
    } else {
        // 既に音楽が再生中の場合は音量調整のみ
        elements.backgroundMusic.volume = musicState.volume * 0.7;
    }
    
    // ボール生成
    generateBalls();
    
    // タイマー開始
    startTimer();
}

// ボール生成
function generateBalls() {
    elements.gameArea.innerHTML = '';
    
    // ゲームエリアの実際の内部サイズを取得（パディングとボーダーを除く）
    const gameAreaStyle = window.getComputedStyle(elements.gameArea);
    const paddingLeft = parseInt(gameAreaStyle.paddingLeft) || 0;
    const paddingTop = parseInt(gameAreaStyle.paddingTop) || 0;
    const paddingRight = parseInt(gameAreaStyle.paddingRight) || 0;
    const paddingBottom = parseInt(gameAreaStyle.paddingBottom) || 0;
    
    const availableWidth = elements.gameArea.clientWidth - paddingLeft - paddingRight;
    const availableHeight = elements.gameArea.clientHeight - paddingTop - paddingBottom;
    
    console.log(`Available space: ${availableWidth} x ${availableHeight}`);
    
    const safeMargin = 25; // 枠からの安全距離をさらに拡大
    
    // 各ボールにランダムサイズを事前割り当て（サイズを画面に合わせて調整）
    const ballData = [];
    for (let i = 1; i <= gameState.totalBalls; i++) {
        const randomSize = ballSizes[Math.floor(Math.random() * ballSizes.length)];
        const randomColor = ballColors[Math.floor(Math.random() * ballColors.length)];
        let pixelSize = getActualBallSize(randomSize);
        
        // 画面サイズに応じてボールサイズを制限（さらに厳しく）
        const maxAllowedSize = Math.min(availableWidth, availableHeight) * 0.15; // 最大15%に縮小
        if (pixelSize > maxAllowedSize) {
            pixelSize = maxAllowedSize;
        }
        
        ballData.push({
            number: i,
            size: randomSize,
            color: randomColor,
            pixelSize: pixelSize,
            originalSize: getActualBallSize(randomSize)
        });
    }
    
    // より大きなボールを優先して配置（大きいものから配置）
    ballData.sort((a, b) => b.pixelSize - a.pixelSize);
    
    const placedBalls = [];
    const gridSize = 100; // グリッドサイズをさらに拡大
    const occupiedCells = new Set();
    
    for (const ball of ballData) {
        let positioned = false;
        let attempts = 0;
        const maxAttempts = 2000; // 試行回数を増加
        
        while (!positioned && attempts < maxAttempts) {
            // 確実に枠内に収まる座標を計算
            const minX = safeMargin;
            const maxX = availableWidth - ball.pixelSize - safeMargin;
            const minY = safeMargin;
            const maxY = availableHeight - ball.pixelSize - safeMargin;
            
            // 配置可能な範囲があるかチェック
            if (maxX <= minX || maxY <= minY) {
                console.log(`No space for ball ${ball.number}, reducing size`);
                ball.pixelSize = Math.max(50, ball.pixelSize * 0.8); // サイズを20%削減
                attempts = 0; // 試行回数をリセット
                continue;
            }
            
            const x = Math.random() * (maxX - minX) + minX;
            const y = Math.random() * (maxY - minY) + minY;
            
            // 他のボールとの重複チェック（さらに厳密に）
            const hasOverlap = placedBalls.some(placedBall => {
                const distance = Math.sqrt(Math.pow(x - placedBall.x, 2) + Math.pow(y - placedBall.y, 2));
                const safeDistance = (ball.pixelSize + placedBall.pixelSize) / 2 + 40; // 安全距離を40pxに拡大
                return distance < safeDistance;
            });
            
            if (!hasOverlap) {
                const ballElement = createBallWithData(ball, { x, y });
                
                // サイズが調整された場合はスタイルを適用
                if (ball.pixelSize !== ball.originalSize) {
                    ballElement.style.width = ball.pixelSize + 'px';
                    ballElement.style.height = ball.pixelSize + 'px';
                    ballElement.style.fontSize = Math.max(0.8, ball.pixelSize / 80) + 'em';
                }
                
                elements.gameArea.appendChild(ballElement);
                placedBalls.push({ 
                    x: x + ball.pixelSize / 2, // 中心座標で保存
                    y: y + ball.pixelSize / 2,
                    pixelSize: ball.pixelSize 
                });
                positioned = true;
                
                console.log(`Ball ${ball.number} placed at (${x.toFixed(1)}, ${y.toFixed(1)}) size: ${ball.pixelSize}px`);
            }
            
            attempts++;
        }
        
        // 配置に失敗した場合の処理
        if (!positioned) {
            console.log(`Failed to place ball ${ball.number} after ${maxAttempts} attempts`);
            // 最小サイズで空いているスペースに強制配置
            const minSize = 60;
            let forcePositioned = false;
            
            // グリッドベースで空いている場所を探す
            for (let gridY = 0; gridY < Math.floor(availableHeight / gridSize) && !forcePositioned; gridY++) {
                for (let gridX = 0; gridX < Math.floor(availableWidth / gridSize) && !forcePositioned; gridX++) {
                    const cellKey = `${gridX},${gridY}`;
                    if (!occupiedCells.has(cellKey)) {
                        const fallbackX = gridX * gridSize + safeMargin;
                        const fallbackY = gridY * gridSize + safeMargin;
                        
                        // 境界チェック
                        if (fallbackX + minSize + safeMargin <= availableWidth && 
                            fallbackY + minSize + safeMargin <= availableHeight) {
                            
                            const ballElement = createBallWithData(ball, { x: fallbackX, y: fallbackY });
                            ballElement.style.width = minSize + 'px';
                            ballElement.style.height = minSize + 'px';
                            ballElement.style.fontSize = '0.8em';
                            
                            elements.gameArea.appendChild(ballElement);
                            placedBalls.push({ 
                                x: fallbackX + minSize / 2,
                                y: fallbackY + minSize / 2,
                                pixelSize: minSize 
                            });
                            
                            occupiedCells.add(cellKey);
                            forcePositioned = true;
                            console.log(`Ball ${ball.number} force placed at grid (${gridX}, ${gridY})`);
                        }
                    }
                }
            }
        }
    }
}
            if (maxX <= minX || maxY <= minY) {
                console.log(`No space for ball ${ball.number}`);
                break;
            }
            
            const x = Math.random() * (maxX - minX) + minX;
            const y = Math.random() * (maxY - minY) + minY;
            
            // 他のボールとの重複チェック
            const hasOverlap = placedBalls.some(placedBall => {
                const distance = Math.sqrt(Math.pow(x - placedBall.x, 2) + Math.pow(y - placedBall.y, 2));
                const safeDistance = (ball.pixelSize + placedBall.pixelSize) / 2 + 8;
                return distance < safeDistance;
            });
            
            if (!hasOverlap) {
                const ballElement = createBallWithData(ball, { x, y });
                
                // サイズが調整された場合はスタイルを適用
                if (ball.pixelSize !== getActualBallSize(ball.size)) {
                    ballElement.style.width = ball.pixelSize + 'px';
                    ballElement.style.height = ball.pixelSize + 'px';
                    ballElement.style.fontSize = (ball.pixelSize / 60) + 'em';
                }
                
                elements.gameArea.appendChild(ballElement);
                placedBalls.push({ 
                    x: x + ball.pixelSize / 2, // 中心座標で保存
                    y: y + ball.pixelSize / 2,
                    pixelSize: ball.pixelSize 
                });
                positioned = true;
                
                console.log(`Ball ${ball.number} placed at (${x.toFixed(1)}, ${y.toFixed(1)}) size: ${ball.pixelSize}px`);
            }
            
            attempts++;
        }
        
        // 配置に失敗した場合の処理
        if (!positioned) {
            console.log(`Failed to place ball ${ball.number} after ${maxAttempts} attempts`);
            // 最小サイズで空いているスペースに強制配置
            const minSize = 80;
            let forcePositioned = false;
            
            // グリッドベースで空いている場所を探す
            for (let gridY = 0; gridY < Math.floor(availableHeight / gridSize) && !forcePositioned; gridY++) {
                for (let gridX = 0; gridX < Math.floor(availableWidth / gridSize) && !forcePositioned; gridX++) {
                    const cellKey = `${gridX},${gridY}`;
                    if (!occupiedCells.has(cellKey)) {
                        const fallbackX = gridX * gridSize + safeMargin;
                        const fallbackY = gridY * gridSize + safeMargin;
                        
                        // 境界チェック
                        if (fallbackX + minSize + safeMargin <= availableWidth && 
                            fallbackY + minSize + safeMargin <= availableHeight) {
                            
                            const ballElement = createBallWithData(ball, { x: fallbackX, y: fallbackY });
                            ballElement.style.width = minSize + 'px';
                            ballElement.style.height = minSize + 'px';
                            ballElement.style.fontSize = '1.0em';
                            
                            elements.gameArea.appendChild(ballElement);
                            placedBalls.push({ 
                                x: fallbackX + minSize / 2,
                                y: fallbackY + minSize / 2,
                                pixelSize: minSize 
                            });
                            
                            occupiedCells.add(cellKey);
                            forcePositioned = true;
                            console.log(`Ball ${ball.number} force placed at grid (${gridX}, ${gridY})`);
                        }
                    }
                }
            }
        }
    }
}

// ボールデータを使ってボール作成
function createBallWithData(ballData, position) {
    const ball = document.createElement('div');
    ball.className = 'ball';
    ball.textContent = ballData.number;
    ball.dataset.number = ballData.number;
    
    ball.classList.add(`size-${ballData.size}`, `color-${ballData.color}`);
    
    ball.style.left = position.x + 'px';
    ball.style.top = position.y + 'px';
    
    // ボールクリックイベント
    ball.addEventListener('click', () => handleBallClick(ballData.number, ball));
    
    return ball;
}

// 指定位置にボール作成
function createBallAtPosition(number, position) {
    const ball = document.createElement('div');
    ball.className = 'ball';
    ball.textContent = number;
    ball.dataset.number = number;
    
    // ランダムなサイズとカラーを割り当て
    const randomSize = ballSizes[Math.floor(Math.random() * ballSizes.length)];
    const randomColor = ballColors[Math.floor(Math.random() * ballColors.length)];
    
    ball.classList.add(`size-${randomSize}`, `color-${randomColor}`);
    
    // サイズ情報を保存（配置計算で使用）
    ball.dataset.size = randomSize;
    
    ball.style.left = position.x + 'px';
    ball.style.top = position.y + 'px';
    
    // ボールクリックイベント
    ball.addEventListener('click', () => handleBallClick(number, ball));
    
    return ball;
}

// シンプルなランダム配置（バックアップ）
function createBallSimple(number, gameAreaRect, ballSize, padding) {
    const ball = document.createElement('div');
    ball.className = 'ball';
    ball.textContent = number;
    ball.dataset.number = number;
    
    // ランダムなサイズとカラーを割り当て
    const randomSize = ballSizes[Math.floor(Math.random() * ballSizes.length)];
    const randomColor = ballColors[Math.floor(Math.random() * ballColors.length)];
    
    ball.classList.add(`size-${randomSize}`, `color-${randomColor}`);
    
    const actualBallSize = sizePixels[randomSize];
    const x = Math.random() * (gameAreaRect.width - actualBallSize - padding * 2) + padding;
    const y = Math.random() * (gameAreaRect.height - actualBallSize - padding * 2) + padding;
    
    ball.style.left = x + 'px';
    ball.style.top = y + 'px';
    
    // ボールクリックイベント
    ball.addEventListener('click', () => handleBallClick(number, ball));
    
    return ball;
}

// ボールクリック処理
function handleBallClick(number, ballElement) {
    if (!gameState.isPlaying) return;
    
    if (number === gameState.currentNumber) {
        // 正解
        playSuccessSound();
        ballElement.classList.add('correct', 'selected');
        
        // パーティクル効果を追加
        createParticleExplosion(ballElement);
        createRippleEffect(ballElement);
        
        // ボールを消去するアニメーション
        setTimeout(() => {
            ballElement.style.transform = 'scale(0) rotate(360deg)';
            ballElement.style.opacity = '0';
            
            // 完全に消去
            setTimeout(() => {
                if (ballElement.parentNode) {
                    ballElement.parentNode.removeChild(ballElement);
                }
            }, 300);
        }, 400);
        
        gameState.score++;
        gameState.currentNumber++;
        
        updateUI();
        
        // ゲーム完了チェック
        if (gameState.currentNumber > gameState.totalBalls) {
            endGame();
        }
    } else {
        // 不正解
        playErrorSound();
        ballElement.classList.add('wrong');
        setTimeout(() => {
            ballElement.classList.remove('wrong');
        }, 600);
    }
}

// パーティクル爆発効果
function createParticleExplosion(ballElement) {
    const rect = ballElement.getBoundingClientRect();
    const gameAreaRect = elements.gameArea.getBoundingClientRect();
    const centerX = rect.left - gameAreaRect.left + rect.width / 2;
    const centerY = rect.top - gameAreaRect.top + rect.height / 2;
    
    // 15個のパーティクルを生成
    for (let i = 0; i < 15; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // ランダムな方向と距離
        const angle = (Math.PI * 2 * i) / 15;
        const distance = 50 + Math.random() * 80;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;
        
        particle.style.left = centerX + 'px';
        particle.style.top = centerY + 'px';
        particle.style.setProperty('--dx', dx + 'px');
        particle.style.setProperty('--dy', dy + 'px');
        
        elements.gameArea.appendChild(particle);
        
        // アニメーション完了後に削除
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 1000);
    }
}

// 波紋効果
function createRippleEffect(ballElement) {
    const rect = ballElement.getBoundingClientRect();
    const gameAreaRect = elements.gameArea.getBoundingClientRect();
    const centerX = rect.left - gameAreaRect.left + rect.width / 2;
    const centerY = rect.top - gameAreaRect.top + rect.height / 2;
    
    const ripple = document.createElement('div');
    ripple.className = 'ripple';
    ripple.style.left = centerX + 'px';
    ripple.style.top = centerY + 'px';
    ripple.style.transform = 'translate(-50%, -50%)';
    
    elements.gameArea.appendChild(ripple);
    
    // アニメーション完了後に削除
    setTimeout(() => {
        if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
        }
    }, 800);
}

// 音響効果（Web Audio API使用）
function playSuccessSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // より豊かな成功音
        const progress = gameState.score / gameState.totalBalls;
        const baseFreq = 440 + (progress * 220); // 進行に応じて音程上昇
        
        oscillator.frequency.setValueAtTime(baseFreq, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 2, audioContext.currentTime + 0.1);
        oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        
        // ハーモニー追加（高進行時）
        if (progress > 0.5) {
            const harmony = audioContext.createOscillator();
            harmony.connect(gainNode);
            harmony.frequency.setValueAtTime(baseFreq * 1.25, audioContext.currentTime);
            harmony.start(audioContext.currentTime + 0.05);
            harmony.stop(audioContext.currentTime + 0.25);
        }
    } catch (e) {
        console.log('Audio not supported');
    }
}

function playErrorSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // より印象的なエラー音
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.1);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
    } catch (e) {
        console.log('Audio not supported');
    }
}

// ゲーム完了時の祝福音
function playCompletionSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // メロディー音符
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, C のオクターブ
        
        notes.forEach((freq, index) => {
            setTimeout(() => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
            }, index * 200);
        });
    } catch (e) {
        console.log('Audio not supported');
    }
}

// タイマー開始
function startTimer() {
    gameState.timer = setInterval(() => {
        gameState.elapsedTime = (Date.now() - gameState.startTime) / 1000;
        elements.timer.textContent = gameState.elapsedTime.toFixed(2);
    }, 10);
}

// タイマー停止
function stopTimer() {
    if (gameState.timer) {
        clearInterval(gameState.timer);
        gameState.timer = null;
    }
}

// UI更新
function updateUI() {
    elements.nextNumber.textContent = gameState.currentNumber;
    elements.score.textContent = `${gameState.score}/${gameState.totalBalls}`;
    
    // プログレッシブ視覚効果
    updateProgressiveEffects();
}

// プログレッシブ視覚効果
function updateProgressiveEffects() {
    const progress = gameState.score / gameState.totalBalls;
    const container = document.querySelector('.container');
    const gameArea = elements.gameArea;
    
    // ゲーム進行に応じて背景の輝度を変更
    if (progress < 0.3) {
        container.style.filter = 'brightness(1)';
        gameArea.style.filter = 'hue-rotate(0deg)';
    } else if (progress < 0.6) {
        container.style.filter = 'brightness(1.1)';
        gameArea.style.filter = 'hue-rotate(30deg)';
    } else if (progress < 0.9) {
        container.style.filter = 'brightness(1.2) saturate(1.2)';
        gameArea.style.filter = 'hue-rotate(60deg)';
    } else {
        container.style.filter = 'brightness(1.3) saturate(1.4)';
        gameArea.style.filter = 'hue-rotate(90deg) brightness(1.1)';
    }
    
    // 進行に応じてボールの輝きを強化
    const balls = elements.gameArea.querySelectorAll('.ball:not(.selected)');
    balls.forEach(ball => {
        if (progress > 0.7) {
            ball.style.boxShadow = `0 4px 8px rgba(0, 0, 0, 0.2), 0 0 ${15 * progress}px rgba(255, 255, 255, 0.3)`;
        }
    });
}

// ゲーム終了
function endGame() {
    gameState.isPlaying = false;
    stopTimer();
    
    // 完了音を再生
    playCompletionSound();
    
    // 結果表示
    elements.finalTime.textContent = gameState.elapsedTime.toFixed(2);
    elements.result.style.display = 'block';
    elements.startBtn.disabled = false;
    
    // 完了アニメーション
    celebrateCompletion();
    
    // 音楽の音量を元に戻す
    if (musicState.isPlaying && elements.backgroundMusic) {
        setTimeout(() => {
            elements.backgroundMusic.volume = musicState.volume;
        }, 2000); // 完了音の後に音量を戻す
    }
}

// 完了お祝いアニメーション
function celebrateCompletion() {
    const balls = elements.gameArea.querySelectorAll('.ball');
    balls.forEach((ball, index) => {
        setTimeout(() => {
            ball.style.animation = 'correctSelection 0.5s ease';
        }, index * 50);
    });
}

// ゲームリセット
function resetGame() {
    gameState.isPlaying = false;
    gameState.currentNumber = 1;
    gameState.score = 0;
    gameState.elapsedTime = 0;
    
    stopTimer();
    
    elements.gameArea.innerHTML = '';
    elements.timer.textContent = '0.00';
    elements.result.style.display = 'none';
    elements.startBtn.disabled = false;
    
    updateUI();
    
    // 音楽の音量を通常に戻す
    if (musicState.isPlaying && elements.backgroundMusic) {
        elements.backgroundMusic.volume = musicState.volume;
    }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    initializeMusic();
    checkMusicFile();
    attemptAutoPlay();
});

// 音楽ファイルの存在確認
async function checkMusicFile() {
    const musicFiles = ['./background.mp3', './background.ogg', './background.wav'];
    let fileFound = false;
    
    for (const file of musicFiles) {
        try {
            const response = await fetch(file, { method: 'HEAD' });
            if (response.ok) {
                console.log(`Music file found: ${file}`);
                fileFound = true;
                break;
            }
        } catch (error) {
            console.log(`Music file not found: ${file}`);
        }
    }
    
    if (!fileFound) {
        console.warn('No music files found. Please add background.mp3, background.ogg, or background.wav to the same directory as index.html');
        elements.musicBtn.textContent = '❌ 音楽ファイルなし';
        elements.musicBtn.disabled = true;
        elements.musicBtn.title = '音楽ファイル（background.mp3）が見つかりません';
    } else {
        elements.musicBtn.title = 'クリックして音楽をON/OFFできます';
    }
}