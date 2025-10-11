// ゲーム状態管理
let gameState = {
    isPlaying: false,
    startTime: null,
    currentNumber: 1,
    score: 0,
    totalBalls: 25, // 20 → 25に変更（5x5グリッド）
    timer: null,
    elapsedTime: 0,
    timeoutTimer: null,  // 5秒タイムアウト用タイマー
    timeoutStartTime: null,  // タイムアウト開始時刻
    wrongClicks: 0,      // 間違ったクリック数
    penaltyTime: 0,       // ペナルティ時間（秒）
    lastScore: null      // 最後のスコア（ランキング用）
};

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
    clearSound: document.getElementById('clear-sound'),
    // モバイル用要素
    timerMobile: document.getElementById('timer-mobile'),
    nextNumberMobile: document.getElementById('next-number-mobile'),
    scoreMobile: document.getElementById('score-mobile'),
    startBtnMobile: document.getElementById('start-btn-mobile'),
    resetBtnMobile: document.getElementById('reset-btn-mobile'),
    musicBtnMobile: document.getElementById('music-btn-mobile'),
    // ランキング用要素
    rankingBtn: document.getElementById('ranking-btn'),
    rankingBtnMobile: document.getElementById('ranking-btn-mobile')
};

// デバッグ用：要素の存在確認
console.log('DOM Elements check:', {
    startBtn: !!elements.startBtn,
    gameArea: !!elements.gameArea,
    timer: !!elements.timer,
    backgroundMusic: !!elements.backgroundMusic,
    clickSound: !!elements.clickSound,
    result: !!elements.result,
    actualTime: !!elements.actualTime,
    penaltyTime: !!elements.penaltyTime,
    finalTime: !!elements.finalTime
});

// 音楽状態管理
const musicState = {
    isPlaying: false,
    volume: 0.5
};

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

// 5x5グリッドパネル生成
function generateBalls() {
    console.log('Creating 5x5 grid panels...');
    
    elements.gameArea.innerHTML = '';
    
    // 1-25の数字をランダムに配置
    const numbers = Array.from({length: 25}, (_, i) => i + 1);
    
    // Fisher-Yatesアルゴリズムでランダムにシャッフル
    for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    
    // カラーパレット定義
    const colors = [
        { name: 'red', gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)' },
        { name: 'blue', gradient: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)' },
        { name: 'yellow', gradient: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)' },
        { name: 'green', gradient: 'linear-gradient(135deg, #55efc4 0%, #2ecc71 100%)' },
        { name: 'pink', gradient: 'linear-gradient(135deg, #fd79a8 0%, #e84393 100%)' },
        { name: 'grey', gradient: 'linear-gradient(135deg, #bdc3c7 0%, #95a5a6 100%)' },
        { name: 'brown', gradient: 'linear-gradient(135deg, #d4a574 0%, #8b4513 100%)' }
    ];
    
    // 5x5グリッドにパネルを配置
    for (let i = 0; i < 25; i++) {
        const panel = document.createElement('div');
        panel.className = 'number-panel';
        panel.textContent = numbers[i];
        panel.dataset.number = numbers[i];
        
        // ランダムな色を選択
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        // パネルのスタイル
        panel.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            background: ${randomColor.gradient};
            color: white;
            font-size: clamp(16px, 4vw, 24px);
            font-weight: bold;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 2px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        `;
        
        // ホバー効果のためのイベントリスナー
        panel.addEventListener('mouseenter', function() {
            if (!this.classList.contains('clicked')) {
                this.style.transform = 'scale(1.05)';
                this.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.3)';
            }
        });
        
        panel.addEventListener('mouseleave', function() {
            if (!this.classList.contains('clicked')) {
                this.style.transform = 'scale(1)';
                this.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
            }
        });
        
        // クリックイベント
        panel.addEventListener('click', () => handleBallClick(numbers[i], panel));
        
        elements.gameArea.appendChild(panel);
    }
    
    console.log('Grid panels created: 25 panels');
}

// ボールクリック処理（簡素化版）
function handleBallClick(number, ballElement) {
    console.log(`=== クリック処理 ===`);
    console.log(`クリックされた数字: ${number}, 期待する数字: ${gameState.currentNumber}`);
    console.log(`ゲーム中: ${gameState.isPlaying}`);
    
    if (!gameState.isPlaying) {
        console.log('❌ ゲーム中ではありません');
        return;
    }
    
    if (number === gameState.currentNumber) {
        console.log('✅ 正解！');
        
        // 音を再生
        playSuccessSound();
        
        // パネルの見た目を変更
        ballElement.classList.add('correct', 'selected');
        
        // タイムアウト警告を停止
        clearTimeoutWarning();
        
        // パネルを非表示にするアニメーション
        setTimeout(() => {
            ballElement.style.transform = 'scale(0) rotate(360deg)';
            ballElement.style.opacity = '0';
            ballElement.style.pointerEvents = 'none';
            ballElement.style.visibility = 'hidden';
        }, 400);
        
        gameState.score++;
        gameState.currentNumber++;
        
        updateUI();
        
        // ゲーム完了チェック
        if (gameState.currentNumber > gameState.totalBalls) {
            console.log('🎉 ゲーム完了！');
            endGame();
        } else {
            // 次のボール用のタイムアウトタイマーを開始
            startTimeoutTimer();
        }
    } else {
        console.log('❌ 不正解');
        // 不正解
        gameState.wrongClicks++;
        gameState.penaltyTime += 2;
        
        playErrorSound();
        ballElement.classList.add('wrong');
        setTimeout(() => {
            ballElement.classList.remove('wrong');
        }, 600);
        
        console.log(`間違ったクリック: ${gameState.wrongClicks}回, ペナルティ時間: ${gameState.penaltyTime}秒`);
    }
}

// 効果音を再生する関数（簡素化版）
function playSuccessSound() {
    console.log('=== playSuccessSound 開始 ===');
    
    const clickSound = document.getElementById('click-sound');
    console.log('clickSound:', clickSound);
    
    if (!clickSound) {
        console.error('❌ click-sound要素が見つかりません');
        return;
    }
    
    try {
        clickSound.volume = 0.7;
        clickSound.currentTime = 0;
        
        // ブラウザによってはユーザーインタラクション後でないと音が再生されない
        const playPromise = clickSound.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('✅ 音声再生成功！');
                })
                .catch(error => {
                    console.error('❌ 音声再生失敗:', error.name, error.message);
                    if (error.name === 'NotAllowedError') {
                        console.error('🔇 ブラウザが音声再生をブロックしています。ユーザーがページを操作した後に音が再生されます。');
                    }
                });
        }
    } catch (error) {
        console.error('❌ 音声再生でエラー:', error);
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
    
    // デスクトップ用UI更新
    if (elements.timer) elements.timer.textContent = totalTime.toFixed(2);
    if (elements.nextNumber) elements.nextNumber.textContent = gameState.currentNumber;
    if (elements.score) elements.score.textContent = `${gameState.score}/${gameState.totalBalls}`;
    
    // モバイル用UI更新
    if (elements.timerMobile) elements.timerMobile.textContent = totalTime.toFixed(1);
    if (elements.nextNumberMobile) elements.nextNumberMobile.textContent = gameState.currentNumber;
    if (elements.scoreMobile) elements.scoreMobile.textContent = `${gameState.score}/${gameState.totalBalls}`;
    
    const progress = gameState.score / gameState.totalBalls;
    const hue = progress * 120; // 0 (red) to 120 (green)
    if (elements.score) elements.score.style.color = `hsl(${hue}, 100%, 50%)`;
}

// タイムアウト機能
function startTimeoutTimer() {
    clearTimeout(gameState.timeoutTimer);
    gameState.timeoutStartTime = Date.now();
    
    console.log(`Starting timeout timer for panel ${gameState.currentNumber}`);
    
    gameState.timeoutTimer = setTimeout(() => {
        if (gameState.isPlaying) {
            console.log(`5 seconds passed, highlighting panel ${gameState.currentNumber}`);
            highlightCurrentBall();
        }
    }, 5000); // 5秒に設定
}

function highlightCurrentBall() {
    // 現在のパネルを見つけて点滅させる
    const currentPanels = elements.gameArea.querySelectorAll('.number-panel');
    currentPanels.forEach(panel => {
        const panelNumber = parseInt(panel.dataset.number);
        if (panelNumber === gameState.currentNumber && !panel.classList.contains('clicked')) {
            panel.classList.add('timeout-warning');
            console.log(`Panel ${panelNumber} is now blinking (timeout warning)`);
        }
    });
}

function clearTimeoutWarning() {
    // 点滅を停止
    const currentPanels = elements.gameArea.querySelectorAll('.number-panel');
    currentPanels.forEach(panel => {
        panel.classList.remove('timeout-warning');
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
    
    console.log('=== 結果画面表示処理開始 ===');
    
    // 結果要素を直接取得
    const resultElement = document.getElementById('result');
    console.log('result element:', resultElement);
    
    if (!resultElement) {
        console.error('❌ result要素が見つかりません！');
        return;
    }
    
    // 各要素に値を設定
    const actualTimeElement = document.getElementById('actual-time');
    const penaltyTimeElement = document.getElementById('penalty-time');
    const finalTimeElement = document.getElementById('final-time');
    const accuracyRateElement = document.getElementById('accuracy-rate');
    const finalGradeElement = document.getElementById('final-grade');
    
    if (actualTimeElement) actualTimeElement.textContent = gameState.elapsedTime.toFixed(2);
    if (penaltyTimeElement) penaltyTimeElement.textContent = gameState.penaltyTime.toFixed(2);
    if (finalTimeElement) finalTimeElement.textContent = totalTime.toFixed(2);
    if (accuracyRateElement) accuracyRateElement.textContent = accuracy;
    if (finalGradeElement) finalGradeElement.textContent = grade;
    
    // 結果画面を表示
    resultElement.style.display = 'block';
    resultElement.style.visibility = 'visible';
    resultElement.style.opacity = '1';
    resultElement.style.zIndex = '9999';
    
    console.log('✅ 結果画面表示完了');
    console.log('display:', resultElement.style.display);
    console.log('visibility:', resultElement.style.visibility);
    console.log('opacity:', resultElement.style.opacity);
    
    elements.startBtn.disabled = false;
    
    console.log(`ゲーム結果: 実時間${gameState.elapsedTime.toFixed(2)}秒, ペナルティ${gameState.penaltyTime}秒, 合計${totalTime.toFixed(2)}秒, 正答率${accuracy}%, 間違い${gameState.wrongClicks}回`);
    
    // ランキング候補として保存（名前入力待ち）
    gameState.lastScore = {
        clearTime: gameState.elapsedTime,
        accuracy: parseFloat(accuracy),
        wrongClicks: gameState.wrongClicks,
        penaltyTime: gameState.penaltyTime,
        finalScore: totalTime,
        playDate: new Date().toISOString(),
        difficulty: "5x5"
    };
    
    // クリア画面を少し表示してから名前入力フォームを表示
    setTimeout(() => {
        showNameInputForm();
    }, 2000); // 2秒後に名前入力
    
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
    
    // パネルを新しい配置で再生成
    generateBalls();
    
    elements.result.style.display = 'none';
    elements.startBtn.disabled = false;
    
    updateUI();
}

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing game...');
    
    // 重要な要素の存在確認
    console.log('=== 重要な要素の確認 ===');
    console.log('result element:', elements.result);
    console.log('clickSound element:', elements.clickSound);
    console.log('gameArea element:', elements.gameArea);
    console.log('startBtn element:', elements.startBtn);
    
    // 音声ファイルの存在確認
    if (elements.clickSound) {
        console.log('Click sound src:', elements.clickSound.src);
        console.log('Click sound readyState:', elements.clickSound.readyState);
    }
    
    // 音声ファイルをプリロード
    if (elements.clickSound) {
        elements.clickSound.load();
        console.log('Click sound loaded');
    }
    
    // イベントリスナーの設定
    elements.startBtn.addEventListener('click', function() {
        console.log('Start button clicked');
        startGame();
    });
    elements.resetBtn.addEventListener('click', resetGame);
    elements.musicBtn.addEventListener('click', toggleBackgroundMusic);
    
    // モバイル用ボタンのイベントリスナー
    if (elements.startBtnMobile) {
        elements.startBtnMobile.addEventListener('click', function() {
            console.log('Mobile start button clicked');
            startGame();
        });
    }
    if (elements.resetBtnMobile) {
        elements.resetBtnMobile.addEventListener('click', resetGame);
    }
    if (elements.musicBtnMobile) {
        elements.musicBtnMobile.addEventListener('click', toggleBackgroundMusic);
    }
    if (elements.rankingBtnMobile) {
        elements.rankingBtnMobile.addEventListener('click', showRanking);
    }
    
    // ランキングボタンのイベントリスナー
    if (elements.rankingBtn) {
        elements.rankingBtn.addEventListener('click', showRanking);
    }
    
    // テスト音ボタンのイベントリスナー
    const testSoundBtn = document.getElementById('test-sound-btn');
    if (testSoundBtn) {
        testSoundBtn.addEventListener('click', function() {
            console.log('🔊 テスト音ボタンがクリックされました');
            playSuccessSound();
        });
    }
    
    elements.playAgainBtn.addEventListener('click', () => {
        elements.result.style.display = 'none';
        resetGame();
        startGame();
    });
    
    // 初期UI更新
    updateUI();
    
    console.log('Game initialized successfully');
});

// ============ ランキング機能 ============

// 名前入力フォームを表示
function showNameInputForm() {
    const playerName = prompt(`🎉 ゲームクリアおめでとうございます！ 🎉\n\n⏱️ クリア時間: ${gameState.lastScore.finalScore.toFixed(2)}秒\n🎯 正解率: ${gameState.lastScore.accuracy}%\n\n🏆 ランキングに登録しますか？\n名前を入力してください（キャンセルでスキップ）:`);
    
    if (playerName && playerName.trim()) {
        gameState.lastScore.playerName = playerName.trim();
        saveRanking(gameState.lastScore);
    } else {
        console.log('ランキング登録をスキップしました');
    }
}

// ランキングデータを読み込み
async function loadRanking() {
    try {
        const response = await fetch('./ranking.json');
        if (!response.ok) {
            throw new Error('ランキングファイルが見つかりません');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('ランキング読み込みエラー:', error);
        // 初期データを返す
        return {
            rankings: [],
            lastUpdated: new Date().toISOString(),
            totalPlayers: 0
        };
    }
}

// ランキングデータを保存（ローカルストレージ版 - JSONファイル直接書き込みはブラウザで制限されるため）
async function saveRanking(newScore) {
    try {
        // ローカルストレージからランキングデータを取得
        let rankingData = JSON.parse(localStorage.getItem('gameRanking')) || {
            rankings: [],
            lastUpdated: new Date().toISOString(),
            totalPlayers: 0
        };
        
        // 新しいスコアを追加
        const newRanking = {
            id: Date.now(),
            playerName: newScore.playerName,
            clearTime: newScore.clearTime,
            accuracy: newScore.accuracy,
            wrongClicks: newScore.wrongClicks,
            penaltyTime: newScore.penaltyTime,
            finalScore: newScore.finalScore,
            playDate: newScore.playDate,
            difficulty: newScore.difficulty
        };
        
        rankingData.rankings.push(newRanking);
        
        // スコア順にソート（短い時間が上位）
        rankingData.rankings.sort((a, b) => a.finalScore - b.finalScore);
        
        // トップ50のみ保持
        rankingData.rankings = rankingData.rankings.slice(0, 50);
        
        // 更新情報を設定
        rankingData.lastUpdated = new Date().toISOString();
        rankingData.totalPlayers = rankingData.rankings.length;
        
        // ローカルストレージに保存
        localStorage.setItem('gameRanking', JSON.stringify(rankingData));
        
        console.log('ランキング保存完了:', newRanking);
        
        // ランキング表示
        showRanking();
        
    } catch (error) {
        console.error('ランキング保存エラー:', error);
        alert('ランキングの保存に失敗しました。');
    }
}

// ランキングを表示
function showRanking() {
    const rankingData = JSON.parse(localStorage.getItem('gameRanking')) || { rankings: [] };
    
    let rankingHTML = '<div class="ranking-display">';
    rankingHTML += '<h2>🏆 ランキング TOP 20</h2>';
    
    if (rankingData.rankings.length === 0) {
        rankingHTML += '<p>まだランキングデータがありません。</p>';
    } else {
        rankingHTML += '<table class="ranking-table">';
        rankingHTML += '<thead><tr><th>順位</th><th>名前</th><th>時間</th><th>正解率</th><th>日時</th></tr></thead>';
        rankingHTML += '<tbody>';
        
        const topRankings = rankingData.rankings.slice(0, 20);
        topRankings.forEach((ranking, index) => {
            const playDate = new Date(ranking.playDate).toLocaleDateString('ja-JP');
            rankingHTML += `
                <tr class="${index < 3 ? 'top-rank' : ''}">
                    <td>${index + 1}</td>
                    <td>${ranking.playerName}</td>
                    <td>${ranking.finalScore.toFixed(2)}秒</td>
                    <td>${ranking.accuracy.toFixed(1)}%</td>
                    <td>${playDate}</td>
                </tr>
            `;
        });
        
        rankingHTML += '</tbody></table>';
    }
    
    rankingHTML += '<button onclick="closeRanking()" class="close-ranking-btn">閉じる</button>';
    rankingHTML += '</div>';
    
    // ランキング表示用のオーバーレイを作成
    const overlay = document.createElement('div');
    overlay.className = 'ranking-overlay';
    overlay.innerHTML = rankingHTML;
    document.body.appendChild(overlay);
}

// ランキング表示を閉じる
function closeRanking() {
    const overlay = document.querySelector('.ranking-overlay');
    if (overlay) {
        document.body.removeChild(overlay);
    }
}