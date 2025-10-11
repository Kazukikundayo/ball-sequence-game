// 5x5グリッドパネルゲーム - 修正版
// ゲーム状態管理
let gameState = {
    isPlaying: false,
    startTime: null,
    currentNumber: 1,
    score: 0,
    totalBalls: 25, // 5x5グリッド
    timer: null,
    elapsedTime: 0,
    timeoutTimer: null,
    timeoutStartTime: null,
    wrongClicks: 0,
    penaltyTime: 0,
    lastScore: null
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
    timerMobile: document.getElementById('timer-mobile'),
    nextNumberMobile: document.getElementById('next-number-mobile'),
    scoreMobile: document.getElementById('score-mobile'),
    startBtnMobile: document.getElementById('start-btn-mobile'),
    resetBtnMobile: document.getElementById('reset-btn-mobile'),
    musicBtnMobile: document.getElementById('music-btn-mobile'),
    rankingBtn: document.getElementById('ranking-btn'),
    rankingBtnMobile: document.getElementById('ranking-btn-mobile')
};

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
    
    return elements.backgroundMusic.play()
        .then(() => {
            musicState.isPlaying = true;
            elements.musicBtn.textContent = '🔇 音楽OFF';
            elements.musicBtn.classList.remove('muted');
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
    
    if (musicState.isPlaying) {
        elements.backgroundMusic.pause();
        musicState.isPlaying = false;
        elements.musicBtn.textContent = '🎵 音楽ON';
        elements.musicBtn.classList.add('muted');
    } else {
        playBackgroundMusic();
    }
}

// クリック音を再生
function playClickSound() {
    try {
        elements.clickSound.currentTime = 0;
        elements.clickSound.volume = 0.7;
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
    if (gameState.isPlaying) {
        return;
    }
    
    if (elements.clearSound) {
        elements.clearSound.pause();
        elements.clearSound.currentTime = 0;
    }
    
    gameState.isPlaying = true;
    gameState.startTime = Date.now();
    gameState.currentNumber = 1;
    gameState.score = 0;
    gameState.elapsedTime = 0;
    gameState.wrongClicks = 0;
    gameState.penaltyTime = 0;
    
    elements.startBtn.disabled = true;
    elements.result.style.display = 'none';
    updateUI();
    
    generateBalls();
    startTimer();
    startTimeoutTimer();
    
    if (!musicState.isPlaying) {
        playBackgroundMusic()
            .then(() => {
                if (elements.backgroundMusic) {
                    elements.backgroundMusic.volume = musicState.volume * 0.7;
                }
            })
            .catch(() => {});
    } else {
        if (elements.backgroundMusic) {
            elements.backgroundMusic.volume = musicState.volume * 0.7;
        }
    }
}

// 5x5グリッドパネル生成
function generateBalls() {
    elements.gameArea.innerHTML = '';
    
    const numbers = Array.from({length: 25}, (_, i) => i + 1);
    
    for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    
    const colors = [
        { name: 'red', gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)' },
        { name: 'blue', gradient: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)' },
        { name: 'yellow', gradient: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)' },
        { name: 'green', gradient: 'linear-gradient(135deg, #55efc4 0%, #2ecc71 100%)' },
        { name: 'pink', gradient: 'linear-gradient(135deg, #fd79a8 0%, #e84393 100%)' },
        { name: 'grey', gradient: 'linear-gradient(135deg, #b2bec3 0%, #636e72 100%)' },
        { name: 'brown', gradient: 'linear-gradient(135deg, #fdcb6e 0%, #e17055 100%)' }
    ];
    
    for (let i = 0; i < 25; i++) {
        const panel = document.createElement('div');
        panel.className = 'ball';
        panel.textContent = numbers[i];
        panel.dataset.number = numbers[i];
        
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        panel.style.background = randomColor.gradient;
        
        panel.addEventListener('click', () => handleBallClick(numbers[i], panel));
        
        panel.addEventListener('mouseenter', function() {
            if (gameState.isPlaying && parseInt(this.dataset.number) === gameState.currentNumber) {
                this.style.transform = 'scale(1.1)';
            }
        });
        
        panel.addEventListener('mouseleave', function() {
            if (gameState.isPlaying && parseInt(this.dataset.number) === gameState.currentNumber) {
                this.style.transform = 'scale(1.0)';
            }
        });
        
        elements.gameArea.appendChild(panel);
    }
}

function handleBallClick(number, ballElement) {
    if (!gameState.isPlaying) {
        return;
    }
    
    if (number === gameState.currentNumber) {
        playClickSound();
        ballElement.style.visibility = 'hidden';
        gameState.currentNumber++;
        gameState.score++;
        
        if (gameState.score === gameState.totalBalls) {
            endGame();
        } else {
            startTimeoutTimer();
        }
    } else {
        gameState.wrongClicks++;
        gameState.penaltyTime += 5;
        ballElement.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            ballElement.style.animation = '';
        }, 500);
    }
    
    updateUI();
}

function startTimer() {
    gameState.timer = setInterval(() => {
        gameState.elapsedTime = (Date.now() - gameState.startTime) / 1000;
        updateUI();
    }, 100);
}

function stopTimer() {
    if (gameState.timer) {
        clearInterval(gameState.timer);
        gameState.timer = null;
    }
}

function updateUI() {
    const displayTime = gameState.elapsedTime.toFixed(2);
    elements.timer.textContent = displayTime;
    elements.nextNumber.textContent = gameState.currentNumber;
    elements.score.textContent = gameState.score;
    
    if (elements.timerMobile) elements.timerMobile.textContent = displayTime;
    if (elements.nextNumberMobile) elements.nextNumberMobile.textContent = gameState.currentNumber;
    if (elements.scoreMobile) elements.scoreMobile.textContent = gameState.score;
}

function startTimeoutTimer() {
    if (gameState.timeoutTimer) {
        clearTimeout(gameState.timeoutTimer);
    }
    
    gameState.timeoutStartTime = Date.now();
    
    gameState.timeoutTimer = setTimeout(() => {
        const currentPanel = document.querySelector(`[data-number="${gameState.currentNumber}"]`);
        if (currentPanel) {
            currentPanel.classList.add('timeout-warning');
        }
    }, 5000);
}

function endGame() {
    gameState.isPlaying = false;
    stopTimer();
    
    if (gameState.timeoutTimer) {
        clearTimeout(gameState.timeoutTimer);
        gameState.timeoutTimer = null;
    }
    
    const actualTime = gameState.elapsedTime;
    const finalTime = actualTime + gameState.penaltyTime;
    const accuracy = ((gameState.totalBalls / (gameState.totalBalls + gameState.wrongClicks)) * 100);
    
    gameState.lastScore = {
        actualTime: actualTime,
        penaltyTime: gameState.penaltyTime,
        finalScore: finalTime,
        accuracy: accuracy,
        wrongClicks: gameState.wrongClicks,
        playDate: new Date().toISOString(),
        difficulty: '5x5 Grid'
    };
    
    playClearSound();
    showResult();
    showNameInputForm();
    
    elements.startBtn.disabled = false;
}

function playClearSound() {
    try {
        if (elements.clearSound) {
            elements.clearSound.currentTime = 0;
            elements.clearSound.volume = 0.8;
            elements.clearSound.play().catch(error => {
                console.log('Clear sound play failed:', error.message);
            });
        }
    } catch (error) {
        console.log('Clear sound error:', error.message);
    }
}

function showResult() {
    if (elements.actualTime) elements.actualTime.textContent = gameState.lastScore.actualTime.toFixed(2);
    if (elements.penaltyTime) elements.penaltyTime.textContent = gameState.lastScore.penaltyTime.toFixed(2);
    if (elements.finalTime) elements.finalTime.textContent = gameState.lastScore.finalScore.toFixed(2);
    if (elements.accuracyRate) elements.accuracyRate.textContent = gameState.lastScore.accuracy.toFixed(1);
    
    let grade = 'D';
    if (gameState.lastScore.finalScore < 15) grade = 'S';
    else if (gameState.lastScore.finalScore < 20) grade = 'A';
    else if (gameState.lastScore.finalScore < 25) grade = 'B';
    else if (gameState.lastScore.finalScore < 30) grade = 'C';
    
    if (elements.finalGrade) elements.finalGrade.textContent = grade;
    
    elements.result.style.display = 'flex';
}

function showNameInputForm() {
    const playerName = prompt(`🎉 ゲームクリアおめでとうございます！ 🎉\n\n⏱️ クリア時間: ${gameState.lastScore.finalScore.toFixed(2)}秒\n🎯 正解率: ${gameState.lastScore.accuracy}%\n\n🏆 ランキングに登録しますか？\n名前を入力してください（キャンセルでスキップ）:`);
    
    if (playerName && playerName.trim()) {
        gameState.lastScore.playerName = playerName.trim();
        saveRanking(gameState.lastScore);
    }
}

// ランキング保存（シンプル版）
function saveRanking(newScore) {
    try {
        let rankingData = JSON.parse(localStorage.getItem('gameRanking')) || {
            rankings: [],
            lastUpdated: new Date().toISOString(),
            totalPlayers: 0
        };
        
        const newRanking = {
            id: Date.now(),
            playerName: newScore.playerName,
            clearTime: newScore.actualTime,
            accuracy: newScore.accuracy,
            wrongClicks: newScore.wrongClicks,
            penaltyTime: newScore.penaltyTime,
            finalScore: newScore.finalScore,
            playDate: newScore.playDate,
            difficulty: newScore.difficulty
        };
        
        rankingData.rankings.push(newRanking);
        rankingData.rankings.sort((a, b) => a.finalScore - b.finalScore);
        rankingData.rankings = rankingData.rankings.slice(0, 50);
        rankingData.lastUpdated = new Date().toISOString();
        rankingData.totalPlayers = rankingData.rankings.length;
        
        localStorage.setItem('gameRanking', JSON.stringify(rankingData));
        
        console.log('ランキング保存完了:', newRanking);
        showRanking();
        
    } catch (error) {
        console.error('ランキング保存エラー:', error);
        alert('ランキングの保存に失敗しました。');
    }
}

// ランキング表示（シンプル版）
function showRanking() {
    try {
        const rankingData = JSON.parse(localStorage.getItem('gameRanking')) || { rankings: [] };
        
        let rankingHTML = '<div class="ranking-display">';
        rankingHTML += '<h2>🏆 ランキング TOP 20</h2>';
        
        // GitHub設定ボタン
        rankingHTML += '<div class="github-controls">';
        rankingHTML += '<button onclick="showGitHubSetup()" class="github-setup-btn">⚙️ GitHub設定</button>';
        rankingHTML += '</div>';
        
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
        
        const existingOverlay = document.querySelector('.ranking-overlay');
        if (existingOverlay) {
            document.body.removeChild(existingOverlay);
        }
        
        const overlay = document.createElement('div');
        overlay.className = 'ranking-overlay';
        overlay.innerHTML = rankingHTML;
        document.body.appendChild(overlay);
        
    } catch (error) {
        console.error('ランキング表示エラー:', error);
        alert('ランキング表示でエラーが発生しました: ' + error.message);
    }
}

// GitHub設定画面を表示
function showGitHubSetup() {
    try {
        let setupHTML = '<div class="github-setup">';
        setupHTML += '<h3>⚙️ GitHub共有ランキング設定</h3>';
        setupHTML += '<p>作成したPersonal Access Tokenを入力してください：</p>';
        
        setupHTML += '<div class="setup-steps">';
        setupHTML += '<h4>設定手順:</h4>';
        setupHTML += '<ol>';
        setupHTML += '<li>GitHub.com にログイン</li>';
        setupHTML += '<li>Settings → Developer settings → Personal access tokens</li>';
        setupHTML += '<li>"Generate new token" をクリック</li>';
        setupHTML += '<li>Scopes: "repo" にチェック</li>';
        setupHTML += '<li>生成されたトークンを下に入力</li>';
        setupHTML += '</ol>';
        setupHTML += '</div>';
        
        setupHTML += '<div class="token-input">';
        setupHTML += '<label for="github-token">GitHub Personal Access Token:</label>';
        setupHTML += '<input type="password" id="github-token" placeholder="ghp_xxxxxxxxxxxxxxxxxx">';
        setupHTML += '<br>';
        setupHTML += '<button onclick="saveGitHubToken()" class="save-token-btn">💾 保存</button>';
        setupHTML += '<button onclick="clearGitHubToken()" class="clear-token-btn">🗑️ 削除</button>';
        setupHTML += '</div>';
        
        const currentToken = localStorage.getItem('github_token');
        setupHTML += '<div class="token-status">';
        if (currentToken) {
            setupHTML += '<p class="token-ok">✅ トークンが設定されています</p>';
        } else {
            setupHTML += '<p class="token-none">❌ トークンが設定されていません</p>';
        }
        setupHTML += '</div>';
        
        setupHTML += '<button onclick="closeGitHubSetup()" class="close-setup-btn">閉じる</button>';
        setupHTML += '</div>';
        
        const existingOverlay = document.querySelector('.github-setup-overlay');
        if (existingOverlay) {
            document.body.removeChild(existingOverlay);
        }
        
        const overlay = document.createElement('div');
        overlay.className = 'github-setup-overlay';
        overlay.innerHTML = setupHTML;
        document.body.appendChild(overlay);
        
    } catch (error) {
        console.error('GitHub設定画面の表示でエラー:', error);
        alert('GitHub設定画面の表示に失敗しました: ' + error.message);
    }
}

// GitHub トークン保存
function saveGitHubToken() {
    try {
        const tokenInput = document.getElementById('github-token');
        const token = tokenInput.value.trim();
        
        if (token) {
            localStorage.setItem('github_token', token);
            alert('✅ GitHubトークンを保存しました！');
            closeGitHubSetup();
        } else {
            alert('❌ 有効なトークンを入力してください。');
        }
    } catch (error) {
        console.error('Token save error:', error);
        alert('トークンの保存中にエラーが発生しました: ' + error.message);
    }
}

// GitHub トークン削除
function clearGitHubToken() {
    if (confirm('GitHub トークンを削除しますか？')) {
        try {
            localStorage.removeItem('github_token');
            alert('✅ GitHub トークンを削除しました。');
            closeGitHubSetup();
        } catch (error) {
            console.error('Token clear error:', error);
            alert('トークンの削除中にエラーが発生しました: ' + error.message);
        }
    }
}

// GitHub設定画面を閉じる
function closeGitHubSetup() {
    try {
        const overlay = document.querySelector('.github-setup-overlay');
        if (overlay) {
            document.body.removeChild(overlay);
        }
    } catch (error) {
        console.error('Error closing GitHub setup:', error);
    }
}

// ランキング表示を閉じる
function closeRanking() {
    try {
        const overlay = document.querySelector('.ranking-overlay');
        if (overlay) {
            document.body.removeChild(overlay);
        }
    } catch (error) {
        console.error('Error closing ranking overlay:', error);
    }
}

// リセット機能
function resetGame() {
    gameState.isPlaying = false;
    stopTimer();
    
    if (gameState.timeoutTimer) {
        clearTimeout(gameState.timeoutTimer);
        gameState.timeoutTimer = null;
    }
    
    gameState.currentNumber = 1;
    gameState.score = 0;
    gameState.elapsedTime = 0;
    gameState.wrongClicks = 0;
    gameState.penaltyTime = 0;
    
    elements.startBtn.disabled = false;
    elements.result.style.display = 'none';
    elements.gameArea.innerHTML = '';
    
    updateUI();
}

// イベントリスナーの設定
document.addEventListener('DOMContentLoaded', () => {
    if (elements.startBtn) {
        elements.startBtn.addEventListener('click', startGame);
    }
    
    if (elements.resetBtn) {
        elements.resetBtn.addEventListener('click', resetGame);
    }
    
    if (elements.musicBtn) {
        elements.musicBtn.addEventListener('click', toggleBackgroundMusic);
    }
    
    if (elements.playAgainBtn) {
        elements.playAgainBtn.addEventListener('click', () => {
            elements.result.style.display = 'none';
            startGame();
        });
    }
    
    // モバイルボタン
    if (elements.startBtnMobile) {
        elements.startBtnMobile.addEventListener('click', startGame);
    }
    
    if (elements.resetBtnMobile) {
        elements.resetBtnMobile.addEventListener('click', resetGame);
    }
    
    if (elements.musicBtnMobile) {
        elements.musicBtnMobile.addEventListener('click', toggleBackgroundMusic);
    }
    
    // ランキングボタン
    if (elements.rankingBtn) {
        elements.rankingBtn.addEventListener('click', showRanking);
    }
    
    if (elements.rankingBtnMobile) {
        elements.rankingBtnMobile.addEventListener('click', showRanking);
    }
    
    // テスト音ボタン
    const testSoundBtn = document.getElementById('test-sound-btn');
    if (testSoundBtn) {
        testSoundBtn.addEventListener('click', function() {
            console.log('🔊 テスト音ボタンがクリックされました');
            playClickSound();
        });
    }
});