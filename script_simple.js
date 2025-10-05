// ゲーム状態管理
let gameState = {
    isPlaying: false,
    startTime: null,
    currentNumber: 1,
    score: 0,
    totalBalls: 20,
    timer: null,
    elapsedTime: 0,
    timeoutTimer: null,  // 5秒タイムアウト用タイマー
    timeoutStartTime: null,  // タイムアウト開始時刻
    wrongClicks: 0,      // 間違ったクリック数
    penaltyTime: 0       // ペナルティ時間（秒）
};

// ボールのサイズとカラーと形状の定義
const ballSizes = ['small', 'medium', 'large', 'xlarge', 'xxlarge']; // 5種類に拡張
const ballColors = ['red', 'blue', 'yellow', 'green', 'orange', 'pink', 'gray', 'brown', 'purple', 'lightpink'];
const ballShapes = ['circle', 'triangle', 'square', 'diamond']; // 図形の種類を追加

// サイズごとの実際のピクセルサイズ（配置計算用） - 5種類に拡張
const sizePixels = {
    'small': 100,   // 小サイズ
    'medium': 150,  // 中サイズ
    'large': 200,   // 大サイズ
    'xlarge': 400,  // 特大サイズ
    'xxlarge': 500  // 超特大サイズ
};

// モバイル向けサイズ調整
function getActualBallSize(size) {
    if (window.innerWidth <= 480) {
        const mobileSizes = { 
            'small': 60, 'medium': 80, 'large': 100, 'xlarge': 120, 'xxlarge': 140
        };
        return mobileSizes[size];
    } else if (window.innerWidth <= 768) {
        const tabletSizes = { 
            'small': 70, 'medium': 100, 'large': 130, 'xlarge': 160, 'xxlarge': 180
        };
        return tabletSizes[size];
    }
    return sizePixels[size];
}

// DOM要素の取得
const elements = {
    startBtn: document.getElementById('start-btn'),
    resetBtn: document.getElementById('reset-btn'),
    musicBtn: document.getElementById('music-btn'),
    timer: document.getElementById('timer'),
    nextNumber: document.getElementById('next-number'),
    score: document.getElementById('score'),
    gameArea: document.getElementById('game-area'),
    result: document.getElementById('result'),
    finalTime: document.getElementById('final-time'),
    actualTime: document.getElementById('actual-time'),
    penaltyTime: document.getElementById('penalty-time'),
    accuracyRate: document.getElementById('accuracy-rate'),
    finalGrade: document.getElementById('final-grade'),
    playAgainBtn: document.getElementById('play-again-btn'),
    backgroundMusic: document.getElementById('background-music'),
    clickSound: document.getElementById('click-sound'),
    clearSound: document.getElementById('clear-sound')
};

// デバッグ用：要素の存在確認
console.log('DOM Elements check:', {
    startBtn: !!elements.startBtn,
    gameArea: !!elements.gameArea,
    timer: !!elements.timer,
    backgroundMusic: !!elements.backgroundMusic
});

// 音楽状態管理
const musicState = {
    isPlaying: false,
    volume: 0.5
};

// 星空パーティクル初期化
function initStarryBackground() {
    const particlesContainer = document.getElementById('particles-background');
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#fd79a8', '#a29bfe', '#fd63f6', '#55a3ff', '#00b894'];
    
    for (let i = 0; i < 80; i++) {
        const particle = document.createElement('div');
        
        // ランダムな位置
        const x = Math.random() * 100;
        const y = Math.random() * 120 - 20; // 画面外上部からも開始
        
        // ランダムなサイズ（4-8px）
        const size = Math.random() * 4 + 4;
        
        // ランダムなアニメーション遅延（0-10秒の範囲）
        const delay = Math.random() * 10;
        
        // ランダムなアニメーション時間（5-8秒）
        const duration = Math.random() * 3 + 5;
        
        // ランダムな色
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        particle.style.cssText = `
            position: absolute;
            left: ${x}%;
            top: ${y}%;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            border-radius: 50%;
            animation: simpleParticleTwinkle ${duration}s linear ${delay}s infinite;
            opacity: 0.8;
        `;
        
        particlesContainer.appendChild(particle);
    }
    
    // CSS for particle animation
    if (!document.querySelector('#particle-animation')) {
        const style = document.createElement('style');
        style.id = 'particle-animation';
        style.textContent = `
            @keyframes simpleParticleTwinkle {
                0% { opacity: 0.8; transform: translateY(-50px); }
                100% { opacity: 0.2; transform: translateY(calc(100vh + 50px)); }
            }
        `;
        document.head.appendChild(style);
    }
}

// ゲームエリア内の星空初期化
function initGameAreaStars() {
    const gameArea = document.getElementById('game-area');
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#fd79a8'];
    
    for (let i = 0; i < 35; i++) {
        const particle = document.createElement('div');
        particle.className = 'game-particle';
        
        // ゲームエリア内のランダムな位置
        const x = Math.random() * 95 + 2.5;
        const y = Math.random() * 110 - 10; // 画面外上部からも開始
        
        // 小さめのサイズ（2-4px）
        const size = Math.random() * 2 + 2;
        
        // ランダムなアニメーション遅延（0-8秒）
        const delay = Math.random() * 8;
        
        // ランダムなアニメーション時間（6-9秒）
        const duration = Math.random() * 3 + 6;
        
        // ランダムな色
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        particle.style.cssText = `
            position: absolute;
            left: ${x}%;
            top: ${y}%;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            border-radius: 50%;
            animation: gameAreaParticleFall ${duration}s linear ${delay}s infinite;
            opacity: 0.4;
            pointer-events: none;
            z-index: 1;
        `;
        
        gameArea.appendChild(particle);
    }
}

// 音楽再生の共通関数
function playBackgroundMusic() {
    if (!elements.backgroundMusic) {
        console.log('音楽ファイルが見つかりません。');
        return Promise.reject(new Error('Audio element not found'));
    }
    
    console.log('Starting music playback...');
    
    return elements.backgroundMusic.play()
        .then(() => {
            musicState.isPlaying = true;
            elements.musicBtn.textContent = '🔇 音楽OFF';
            elements.musicBtn.classList.remove('muted');
            console.log('Music playing successfully');
        })
        .catch((error) => {
            console.error('音楽の再生に失敗しました:', error);
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

// クリック音を再生
function playClickSound() {
    try {
        elements.clickSound.currentTime = 0; // 音声を最初から再生
        elements.clickSound.volume = 0.7; // 音量設定
        const playPromise = elements.clickSound.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log('Click sound play failed:', error.message);
            });
        }
    } catch (error) {
        console.log('Click sound error:', error.message);
    }
}

// ゲーム開始
function startGame() {
    console.log('startGame() called, current state:', gameState.isPlaying);
    
    if (gameState.isPlaying) {
        console.log('Game already in progress, returning');
        return;
    }
    
    // クリア音を停止
    if (elements.clearSound) {
        elements.clearSound.pause();
        elements.clearSound.currentTime = 0;
    }
    
    gameState.isPlaying = true;
    gameState.startTime = Date.now();
    gameState.currentNumber = 1;
    gameState.score = 0;
    gameState.elapsedTime = 0;
    gameState.wrongClicks = 0;      // 間違ったクリック数リセット
    gameState.penaltyTime = 0;      // ペナルティ時間リセット
    
    // UI更新
    elements.startBtn.disabled = true;
    elements.result.style.display = 'none';
    updateUI();
    
    // ボール生成とタイマー開始を先に実行
    generateBalls();
    startTimer();
    startTimeoutTimer();
    
    // 音楽は後から試行（失敗してもゲームに影響なし）
    if (!musicState.isPlaying) {
        playBackgroundMusic()
            .then(() => {
                console.log('Background music started with game');
                if (elements.backgroundMusic) {
                    elements.backgroundMusic.volume = musicState.volume * 0.7;
                }
            })
            .catch((error) => {
                console.log('Background music failed (normal in many browsers):', error.message);
            });
    } else {
        if (elements.backgroundMusic) {
            elements.backgroundMusic.volume = musicState.volume * 0.7;
        }
    }
}

// ボール生成（重なり防止機能付き）
function generateBalls() {
    elements.gameArea.innerHTML = '';
    
    const availableWidth = elements.gameArea.clientWidth - 40;
    const availableHeight = elements.gameArea.clientHeight - 40;
    
    console.log(`Generating ${gameState.totalBalls} balls in area: ${availableWidth} x ${availableHeight}`);
    
    const placedBalls = [];
    const maxAttempts = 100;
    
    // ボール情報を生成（番号、サイズ、色、形状）
    const ballsData = [];
    for (let i = 1; i <= gameState.totalBalls; i++) {
        const randomSize = ballSizes[Math.floor(Math.random() * ballSizes.length)];
        const randomColor = ballColors[Math.floor(Math.random() * ballColors.length)];
        const randomShape = ballShapes[Math.floor(Math.random() * ballShapes.length)];
        ballsData.push({
            number: i,
            size: randomSize,
            color: randomColor,
            shape: randomShape,
            actualSize: Math.min(getActualBallSize(randomSize), availableWidth * 0.4, availableHeight * 0.4)
        });
    }
    
    // サイズ順でソート（大きいボールを先に配置）
    ballsData.sort((a, b) => b.actualSize - a.actualSize);
    
    for (let ballData of ballsData) {
        const ball = document.createElement('div');
        ball.className = 'ball';
        ball.dataset.number = ballData.number;
        
        ball.classList.add(`size-${ballData.size}`, `color-${ballData.color}`, `shape-${ballData.shape}`);
        
        // ダイヤモンド形状の場合、数字を囲むdivを追加
        if (ballData.shape === 'diamond') {
            const content = document.createElement('div');
            content.className = 'ball-content';
            content.textContent = ballData.number;
            ball.appendChild(content);
        } else {
            ball.textContent = ballData.number;
        }
        
        let positioned = false;
        let attempts = 0;
        
        while (!positioned && attempts < maxAttempts) {
            // ランダム配置
            const x = Math.random() * (availableWidth - ballData.actualSize) + 20;
            const y = Math.random() * (availableHeight - ballData.actualSize) + 20;
            
            // 他のボールとの重複チェック（より厳密に）
            const hasOverlap = placedBalls.some(placedBall => {
                // 2つのボールの中心間距離を計算
                const ballCenterX = x + ballData.actualSize / 2;
                const ballCenterY = y + ballData.actualSize / 2;
                const placedCenterX = placedBall.x;
                const placedCenterY = placedBall.y;
                
                const distance = Math.sqrt(
                    Math.pow(ballCenterX - placedCenterX, 2) + Math.pow(ballCenterY - placedCenterY, 2)
                );
                
                // より大きな安全距離を確保
                const maxSize = Math.max(ballData.actualSize, placedBall.size);
                const minSize = Math.min(ballData.actualSize, placedBall.size);
                const baseSafeDistance = (ballData.actualSize + placedBall.size) / 2;
                const extraSafeDistance = maxSize * 0.4 + minSize * 0.3; // より大きな安全距離
                const safeDistance = baseSafeDistance + extraSafeDistance;
                
                return distance < safeDistance;
            });
            
            if (!hasOverlap) {
                // 配置成功
                ball.style.left = x + 'px';
                ball.style.top = y + 'px';
                
                // ボールクリックイベント
                ball.addEventListener('click', () => handleBallClick(ballData.number, ball));
                
                elements.gameArea.appendChild(ball);
                
                // 配置済みリストに追加
                placedBalls.push({
                    x: x + ballData.actualSize / 2,
                    y: y + ballData.actualSize / 2,
                    size: ballData.actualSize
                });
                
                positioned = true;
                console.log(`Ball ${ballData.number} placed at (${x.toFixed(1)}, ${y.toFixed(1)}) with size ${ballData.size}`);
            }
            
            attempts++;
        }
        
        // 配置に失敗した場合は小さいサイズで強制配置
        if (!positioned) {
            const minSize = getActualBallSize('small');
            const x = Math.random() * (availableWidth - minSize) + 20;
            const y = Math.random() * (availableHeight - minSize) + 20;
            
            ball.style.left = x + 'px';
            ball.style.top = y + 'px';
            ball.classList.remove(`size-${ballData.size}`);
            ball.classList.add('size-small');
            
            ball.addEventListener('click', () => handleBallClick(ballData.number, ball));
            elements.gameArea.appendChild(ball);
            
            console.log(`Ball ${ballData.number} force placed at minimum size`);
        }
    }
}

// ボールクリック処理
function handleBallClick(number, ballElement) {
    if (!gameState.isPlaying) return;
    
    if (number === gameState.currentNumber) {
        // 正解
        playSuccessSound();
        ballElement.classList.add('correct', 'selected');
        
        // タイムアウト警告を停止
        clearTimeoutWarning();
        
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
        } else {
            // 次のボール用のタイムアウトタイマーを開始
            startTimeoutTimer();
        }
    } else {
        // 不正解
        gameState.wrongClicks++;
        gameState.penaltyTime += 2; // ペナルティ +2秒
        
        playErrorSound();
        ballElement.classList.add('wrong');
        setTimeout(() => {
            ballElement.classList.remove('wrong');
        }, 600);
        
        console.log(`間違ったクリック: ${gameState.wrongClicks}回, ペナルティ時間: ${gameState.penaltyTime}秒`);
    }
}

// 効果音を再生する関数
function playSuccessSound() {
    try {
        elements.clickSound.currentTime = 0; // 音声を最初から再生
        elements.clickSound.volume = 0.7; // 音量設定
        const playPromise = elements.clickSound.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log('Click sound play failed:', error.message);
            });
        }
    } catch (error) {
        console.log('Click sound error:', error.message);
    }
}

function playErrorSound() {
    console.log('Error sound');
}

// クリア音を再生する関数
function playClearSound() {
    try {
        elements.clearSound.currentTime = 0; // 音声を最初から再生
        elements.clearSound.volume = 0.8; // 音量設定（少し大きめ）
        elements.clearSound.play().catch(error => {
            console.log('クリア音の再生に失敗:', error);
        });
    } catch (error) {
        console.log('クリア音エラー:', error);
    }
}

// パーティクル効果（簡易版）
function createParticleExplosion(ballElement) {
    console.log('Particle explosion for ball:', ballElement.textContent);
}

function createRippleEffect(ballElement) {
    console.log('Ripple effect for ball:', ballElement.textContent);
}

// タイマー関連
function startTimer() {
    gameState.timer = setInterval(() => {
        gameState.elapsedTime = (Date.now() - gameState.startTime) / 1000;
        updateUI();
    }, 10);
}

function stopTimer() {
    if (gameState.timer) {
        clearInterval(gameState.timer);
        gameState.timer = null;
    }
}

// UI更新
function updateUI() {
    const totalTime = gameState.elapsedTime + gameState.penaltyTime;
    elements.timer.textContent = totalTime.toFixed(2);
    elements.nextNumber.textContent = gameState.currentNumber;
    elements.score.textContent = `${gameState.score}/${gameState.totalBalls}`;
    
    const progress = gameState.score / gameState.totalBalls;
    const hue = progress * 120; // 0 (red) to 120 (green)
    elements.score.style.color = `hsl(${hue}, 100%, 50%)`;
}

// タイムアウト機能
function startTimeoutTimer() {
    clearTimeout(gameState.timeoutTimer);
    gameState.timeoutStartTime = Date.now();
    
    console.log(`Starting timeout timer for ball ${gameState.currentNumber}`);
    
    gameState.timeoutTimer = setTimeout(() => {
        if (gameState.isPlaying) {
            console.log(`2 seconds passed, highlighting ball ${gameState.currentNumber}`);
            highlightCurrentBall();
        }
    }, 2000); // テスト用に2秒に短縮
}

function highlightCurrentBall() {
    // 現在のボールを見つけて点滅させる
    const currentBalls = elements.gameArea.querySelectorAll('.ball');
    currentBalls.forEach(ball => {
        const ballNumber = parseInt(ball.textContent);
        if (ballNumber === gameState.currentNumber) {
            ball.classList.add('timeout-warning');
            console.log(`Ball ${ballNumber} is now blinking (timeout warning)`);
        }
    });
}

function clearTimeoutWarning() {
    // 点滅を停止
    const currentBalls = elements.gameArea.querySelectorAll('.ball');
    currentBalls.forEach(ball => {
        ball.classList.remove('timeout-warning');
    });
    clearTimeout(gameState.timeoutTimer);
    console.log('Timeout warning cleared');
}

// ゲーム終了
function endGame() {
    gameState.isPlaying = false;
    stopTimer();
    clearTimeoutWarning(); // タイムアウト機能も停止
    
    console.log('Game completed!');
    
    // クリア音を再生
    playClearSound();
    
    // 正答率計算
    const totalAttempts = gameState.totalBalls + gameState.wrongClicks;
    const accuracy = ((gameState.totalBalls / totalAttempts) * 100).toFixed(1);
    
    // 評価計算
    let grade = 'EXCELLENT!';
    if (gameState.wrongClicks > 0) {
        if (gameState.wrongClicks <= 2) {
            grade = 'GREAT!';
        } else if (gameState.wrongClicks <= 5) {
            grade = 'GOOD!';
        } else {
            grade = 'OK';
        }
    }
    
    // 結果表示
    const totalTime = gameState.elapsedTime + gameState.penaltyTime;
    elements.actualTime.textContent = gameState.elapsedTime.toFixed(2);
    elements.penaltyTime.textContent = gameState.penaltyTime.toFixed(2);
    elements.finalTime.textContent = totalTime.toFixed(2);
    elements.accuracyRate.textContent = accuracy;
    elements.finalGrade.textContent = grade;
    
    elements.result.style.display = 'block';
    elements.startBtn.disabled = false;
    
    console.log(`ゲーム結果: 実時間${gameState.elapsedTime.toFixed(2)}秒, ペナルティ${gameState.penaltyTime}秒, 合計${totalTime.toFixed(2)}秒, 正答率${accuracy}%, 間違い${gameState.wrongClicks}回`);
    
    // 音楽の音量を元に戻す
    if (musicState.isPlaying && elements.backgroundMusic) {
        setTimeout(() => {
            elements.backgroundMusic.volume = musicState.volume;
        }, 2000);
    }
}

// ゲームリセット
function resetGame() {
    // クリア音を停止
    if (elements.clearSound) {
        elements.clearSound.pause();
        elements.clearSound.currentTime = 0;
    }
    
    gameState.isPlaying = false;
    gameState.currentNumber = 1;
    gameState.score = 0;
    gameState.elapsedTime = 0;
    gameState.wrongClicks = 0;      // 間違ったクリック数リセット
    gameState.penaltyTime = 0;      // ペナルティ時間リセット
    
    stopTimer();
    clearTimeoutWarning(); // タイムアウト機能も停止
    
    elements.gameArea.innerHTML = '';
    elements.result.style.display = 'none';
    elements.startBtn.disabled = false;
    
    // ゲームエリアの星を再生成
    initGameAreaStars();
    
    updateUI();
}

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing game...');
    
    // 星空背景を初期化
    initStarryBackground();
    
    // ゲームエリア内の星空も初期化
    initGameAreaStars();
    
    // イベントリスナーの設定
    elements.startBtn.addEventListener('click', function() {
        console.log('Start button clicked');
        startGame();
    });
    elements.resetBtn.addEventListener('click', resetGame);
    elements.musicBtn.addEventListener('click', toggleBackgroundMusic);
    elements.playAgainBtn.addEventListener('click', () => {
        elements.result.style.display = 'none';
        resetGame();
        startGame();
    });
    
    // 初期UI更新
    updateUI();
    
    console.log('Game initialized successfully');
});