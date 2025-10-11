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
    // 新しいUI要素
    startScreen: document.getElementById('start-screen'),
    mainStartBtn: document.getElementById('main-start-btn'),
    gameInfo: document.getElementById('game-info'),
    
    // 既存の要素
    resetBtn: document.getElementById('reset-btn'),
    musicBtn: document.getElementById('music-btn'),
    timer: document.getElementById('timer'),
    nextNumber: document.getElementById('next-number'),
    score: document.getElementById('score'),
    bestScore: document.getElementById('best-score'),
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
    rankingBtn: document.getElementById('ranking-btn')
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

// ベストスコア初期化（ゲーム開始時に呼ばれる）
async function initializeBestScore() {
    try {
        // ローカルベストスコアを取得
        getLocalBestScore();
        
        // ベストスコア表示も更新
        updateBestScoreDisplay();
        
        // GitHub接続がある場合、バックグラウンドで最新データを取得
        const githubToken = localStorage.getItem('github_token');
        if (githubToken && typeof githubRanking !== 'undefined') {
            // タイムアウト付きでGitHub記録を取得
            Promise.race([
                getGitHubBestScore(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('初期化タイムアウト')), 2000))
            ]).then(githubBest => {
                if (githubBest) {
                    const currentLocal = parseFloat(localStorage.getItem('localBestScore') || 'Infinity');
                    if (githubBest < currentLocal) {
                        localStorage.setItem('localBestScore', githubBest.toString());
                        console.log('GitHub記録でローカルベスト更新:', githubBest);
                        updateBestScoreDisplay(); // 表示も更新
                    }
                }
            }).catch(error => {
                console.log('GitHub記録初期化失敗（問題なし）:', error.message);
            });
        }
    } catch (error) {
        console.error('ベストスコア初期化エラー:', error);
    }
}

// ベストスコア表示更新
function updateBestScoreDisplay() {
    const bestScore = getLocalBestScore();
    if (elements.bestScore) {
        if (bestScore !== null) {
            elements.bestScore.textContent = bestScore.toFixed(2);
        } else {
            elements.bestScore.textContent = '--';
        }
    }
}

// ゲーム開始
async function startGame() {
    if (gameState.isPlaying) {
        return;
    }
    
    if (elements.clearSound) {
        elements.clearSound.pause();
        elements.clearSound.currentTime = 0;
    }
    
    // ベストスコアを事前に取得してキャッシュ
    await initializeBestScore();
    
    // UI切り替え：スタート画面を非表示、ゲーム情報を表示
    if (elements.startScreen) {
        elements.startScreen.style.display = 'none';
    }
    if (elements.gameInfo) {
        elements.gameInfo.style.display = 'block';
    }
    
    gameState.isPlaying = true;
    gameState.startTime = Date.now();
    gameState.currentNumber = 1;
    gameState.score = 0;
    gameState.elapsedTime = 0;
    gameState.wrongClicks = 0;
    gameState.penaltyTime = 0;
    
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

// 新記録判定（ローカルキャッシュとGitHubの両方をチェック）
async function checkIfNewRecord(newScore) {
    try {
        // まずローカルキャッシュから最高記録を取得
        const localBest = getLocalBestScore();
        let isNewRecord = false;
        
        // ローカルでの新記録判定
        if (!localBest || newScore.finalScore < localBest) {
            isNewRecord = true;
            console.log('ローカル新記録:', newScore.finalScore, 'vs 旧記録:', localBest);
        }
        
        // GitHub同期がある場合の判定
        const githubToken = localStorage.getItem('github_token');
        if (githubToken && typeof githubRanking !== 'undefined') {
            try {
                // GitHub上の最高記録も確認（ただしタイムアウト付き）
                const githubBest = await Promise.race([
                    getGitHubBestScore(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('タイムアウト')), 3000))
                ]);
                
                if (githubBest && newScore.finalScore < githubBest) {
                    isNewRecord = true;
                    console.log('反射神経新記録:', newScore.finalScore, 'vs 反射神経記録:', githubBest);
                }
            } catch (error) {
                console.log('反射神経記録取得失敗、ローカル判定を使用:', error.message);
            }
        }
        
        // 新記録の場合、ローカルキャッシュを更新
        if (isNewRecord) {
            localStorage.setItem('localBestScore', newScore.finalScore.toString());
        }
        
        return isNewRecord;
        
    } catch (error) {
        console.error('新記録判定エラー:', error);
        return false;
    }
}

// ローカルベストスコア取得
function getLocalBestScore() {
    const stored = localStorage.getItem('localBestScore');
    if (stored) return parseFloat(stored);
    
    // ローカルランキングからも確認
    const rankingData = JSON.parse(localStorage.getItem('gameRanking') || '{"rankings":[]}');
    if (rankingData.rankings && rankingData.rankings.length > 0) {
        const best = Math.min(...rankingData.rankings.map(r => r.finalScore));
        localStorage.setItem('localBestScore', best.toString());
        return best;
    }
    
    return null;
}

// GitHubベストスコア取得
async function getGitHubBestScore() {
    if (typeof githubRanking === 'undefined') return null;
    
    try {
        const rankings = await githubRanking.getRankings();
        if (rankings && rankings.length > 0) {
            return Math.min(...rankings.map(r => r.finalScore));
        }
    } catch (error) {
        console.error('GitHub記録取得エラー:', error);
    }
    
    return null;
}

async function showNameInputForm() {
    // 新記録判定
    const isNewRecord = await checkIfNewRecord(gameState.lastScore);
    
    let message = `🎉 ゲームクリアおめでとうございます！ 🎉\n\n⏱️ クリア時間: ${gameState.lastScore.finalScore.toFixed(2)}秒\n🎯 正解率: ${gameState.lastScore.accuracy}%`;
    
    if (isNewRecord) {
        message += `\n\n🏆 新記録です！おめでとうございます！ 🏆`;
    }
    
    message += `\n\n🏆 ランキングに登録しますか？\n名前を入力してください（キャンセルでスキップ）:`;
    
    const playerName = prompt(message);
    
    if (playerName && playerName.trim()) {
        gameState.lastScore.playerName = playerName.trim();
        await saveRanking(gameState.lastScore);
    } else if (isNewRecord) {
        // 新記録の場合は自動保存
        gameState.lastScore.playerName = 'Anonymous';
        await saveRanking(gameState.lastScore);
        alert('新記録のため自動保存されました！');
    }
}

// ランキング保存（GitHub Issues API 連携版）
async function saveRanking(newScore) {
    try {
        // プレイヤー名を取得
        let playerName = newScore.playerName;
        if (!playerName || playerName.trim() === '') {
            playerName = prompt('プレイヤー名を入力してください（反射神経ランキング用）:', 'Player');
            if (!playerName || playerName.trim() === '') {
                playerName = 'Anonymous';
            }
        }

        // GitHub トークンが設定されているかチェック
        const githubToken = localStorage.getItem('github_token');
        
        if (githubToken && typeof githubRanking !== 'undefined') {
            console.log('反射神経ランキングに保存中...');
            
            try {
                const githubResult = await githubRanking.addScore(
                    playerName,
                    newScore.finalScore,
                    newScore.accuracy,
                    newScore.wrongClicks
                );
                
                console.log('反射神経ランキング保存成功');
                showRanking(true, '反射神経ランキングに登録されました！⚡');
                return;
                
            } catch (githubError) {
                console.warn('GitHub保存失敗、ローカル保存に切り替え:', githubError);
                alert('GitHub保存に失敗しました。ローカルに保存します。\nエラー: ' + githubError.message);
            }
        } else {
            console.log('GitHub トークンが未設定、またはgithubRankingが利用できません');
        }
        
        // フォールバック: ローカルストレージに保存
        saveToLocalStorageOnly(newScore, playerName);
        showRanking(false, 'ローカルランキングに保存されました');
        
    } catch (error) {
        console.error('ランキング保存エラー:', error);
        alert('ランキングの保存に失敗しました: ' + error.message);
    }
}

// ローカルストレージのみに保存（フォールバック用）
function saveToLocalStorageOnly(newScore, playerName) {
    try {
        let rankingData = JSON.parse(localStorage.getItem('gameRanking')) || {
            rankings: [],
            lastUpdated: new Date().toISOString(),
            totalPlayers: 0
        };
        
        const newRanking = {
            id: Date.now(),
            playerName: playerName,
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
        rankingData.rankings = rankingData.rankings.slice(0, 20); // 50から20に変更（表示は10位だが予備も保持）
        rankingData.lastUpdated = new Date().toISOString();
        rankingData.totalPlayers = rankingData.rankings.length;
        
        localStorage.setItem('gameRanking', JSON.stringify(rankingData));
        
        console.log('ローカルランキング保存完了:', newRanking);
        
    } catch (error) {
        console.error('ローカルランキング保存エラー:', error);
    }
}

// ランキング表示（GitHub連携対応版）
async function showRanking(isGitHubMode = null, message = '') {
    try {
        let rankingData;
        let dataSource = '';
        
        // GitHub トークンが設定されているかチェック
        const githubToken = localStorage.getItem('github_token');
        
        if (githubToken && typeof githubRanking !== 'undefined' && isGitHubMode !== false) {
            try {
                console.log('反射神経ランキングを取得中...');
                const gitHubData = await githubRanking.fetchRankingsFromGitHub();
                rankingData = gitHubData;
                dataSource = '⚡ 反射神経ランキング';
                console.log('反射神経ランキング取得成功');
            } catch (error) {
                console.warn('反射神経ランキング取得失敗、ローカルデータを使用:', error);
                const localData = JSON.parse(localStorage.getItem('gameRanking')) || { rankings: [] };
                rankingData = { rankings: localData.rankings || [] };
                dataSource = '💾 ローカルランキング (オンライン接続失敗)';
            }
        } else {
            // ローカルデータのみ使用
            const localData = JSON.parse(localStorage.getItem('gameRanking')) || { rankings: [] };
            rankingData = { rankings: localData.rankings || [] };
            dataSource = githubToken ? '💾 ローカルランキング' : '💾 ローカルランキング (反射神経設定未完了)';
        }
        
        let rankingHTML = '<div class="ranking-display">';
        
        // メッセージがあれば表示
        if (message) {
            rankingHTML += `<div class="ranking-message">${message}</div>`;
        }
        
        rankingHTML += `<h2>🏆 ${dataSource}</h2>`;
        
        // ランキング設定ボタンと同期ボタン
        rankingHTML += '<div class="github-controls">';
        rankingHTML += '<button onclick="showGitHubSetup()" class="github-setup-btn">⚙️ ランキング設定</button>';
        
        if (githubToken && typeof githubRanking !== 'undefined') {
            rankingHTML += '<button onclick="testGitHubSync()" class="sync-btn">🔄 同期テスト</button>';
        }
        
        rankingHTML += '</div>';
        
        if (!rankingData.rankings || rankingData.rankings.length === 0) {
            rankingHTML += '<p>まだランキングデータがありません。<br>ゲームをプレイしてスコアを記録してください。</p>';
        } else {
            rankingHTML += '<table class="ranking-table">';
            rankingHTML += '<thead><tr><th>順位</th><th>名前</th><th>反応時間⚡</th><th>正確性</th><th>日時</th></tr></thead>';
            rankingHTML += '<tbody>';
            
            const topRankings = rankingData.rankings.slice(0, 10); // 20位から10位に変更
            topRankings.forEach((ranking, index) => {
                const playDate = ranking.date || new Date(ranking.playDate || ranking.timestamp).toLocaleDateString('ja-JP');
                const finalTime = ranking.finalTime || ranking.finalScore;
                rankingHTML += `
                    <tr class="${index < 3 ? 'top-rank' : ''}">
                        <td>${index + 1}</td>
                        <td>${ranking.playerName}</td>
                        <td>${finalTime.toFixed(2)}秒</td>
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
        
        // フォールバック: 基本的なローカルランキング表示
        const localData = JSON.parse(localStorage.getItem('gameRanking')) || { rankings: [] };
        showBasicLocalRanking(localData);
    }
}

// 基本的なローカルランキング表示（フォールバック用）
function showBasicLocalRanking(rankingData) {
    let rankingHTML = '<div class="ranking-display">';
    rankingHTML += '<h2>🏆 ローカルランキング（エラー復旧版）</h2>';
    
    if (rankingData.rankings.length === 0) {
        rankingHTML += '<p>まだランキングデータがありません。</p>';
    } else {
        rankingHTML += '<table class="ranking-table">';
        rankingHTML += '<thead><tr><th>順位</th><th>名前</th><th>時間</th><th>正解率</th><th>日時</th></tr></thead>';
        rankingHTML += '<tbody>';
        
        const topRankings = rankingData.rankings.slice(0, 10); // 20位から10位に変更
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
    
    const overlay = document.createElement('div');
    overlay.className = 'ranking-overlay';
    overlay.innerHTML = rankingHTML;
    document.body.appendChild(overlay);
}

// GitHub同期テスト
async function testGitHubSync() {
    try {
        console.log('GitHub同期テスト開始');
        
        const token = localStorage.getItem('github_token');
        if (!token) {
            alert('GitHub トークンが設定されていません。先にトークンを設定してください。');
            return;
        }
        
        if (typeof githubRanking === 'undefined') {
            alert('GitHub連携システムが読み込まれていません。ページを再読み込みしてください。');
            return;
        }
        
        const syncBtn = document.querySelector('.sync-btn');
        if (syncBtn) {
            syncBtn.textContent = '🔄 同期中...';
            syncBtn.disabled = true;
        }
        
        // テスト用のダミーデータでGitHub API接続をテスト
        const testResult = await githubRanking.fetchRankingsFromGitHub();
        
        alert('✅ GitHub API接続テスト成功！\n共有ランキング機能が利用可能です。');
        
        // ランキングを再表示
        closeRanking();
        showRanking(true);
        
    } catch (error) {
        console.error('GitHub同期テストエラー:', error);
        alert('❌ GitHub API接続テスト失敗\n\nエラー: ' + error.message + '\n\n以下を確認してください:\n1. トークンが正しく設定されているか\n2. インターネット接続\n3. GitHubリポジトリへのアクセス権限');
    } finally {
        const syncBtn = document.querySelector('.sync-btn');
        if (syncBtn) {
            syncBtn.textContent = '🔄 同期テスト';
            syncBtn.disabled = false;
        }
    }
}

// GitHub設定画面を表示
function showGitHubSetup() {
    try {
        let setupHTML = '<div class="github-setup">';
        setupHTML += '<h3>⚡ 反射神経ランキング設定</h3>';
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
        
        // 既存のトークンがあれば表示
        const currentToken = localStorage.getItem('github_token');
        const tokenValue = currentToken ? currentToken : '';
        setupHTML += `<input type="password" id="github-token" placeholder="ghp_xxxxxxxxxxxxxxxxxx" value="${tokenValue}">`;
        setupHTML += '<br>';
        setupHTML += '<button onclick="saveGitHubToken()" class="save-token-btn">💾 保存</button>';
        setupHTML += '<button onclick="clearGitHubToken()" class="clear-token-btn">🗑️ 削除</button>';
        setupHTML += '<button onclick="testGitHubConnection()" class="test-btn">🔧 接続テスト</button>';
        setupHTML += '</div>';
        
        setupHTML += '<div class="token-status">';
        if (currentToken) {
            setupHTML += '<p class="token-ok">✅ トークンが設定されています</p>';
            setupHTML += '<p class="status-info">💡 トークンは自動的に保存されます</p>';
            
            // GitHub連携システムの状態をチェック
            if (typeof githubRanking !== 'undefined') {
                setupHTML += '<p class="status-ok">✅ GitHub連携システム: 正常</p>';
            } else {
                setupHTML += '<p class="status-error">❌ GitHub連携システム: 読み込みエラー</p>';
            }
            
            if (typeof GITHUB_CONFIG !== 'undefined') {
                setupHTML += '<p class="status-ok">✅ GitHub設定: 正常</p>';
                setupHTML += `<p class="status-info">📂 リポジトリ: ${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}</p>`;
            } else {
                setupHTML += '<p class="status-error">❌ GitHub設定: 読み込みエラー</p>';
            }
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

// GitHub接続テスト
async function testGitHubConnection() {
    try {
        const tokenInput = document.getElementById('github-token');
        const token = tokenInput.value.trim() || localStorage.getItem('github_token');
        
        if (!token) {
            alert('❌ トークンを入力または設定してください。');
            return;
        }
        
        const testBtn = document.querySelector('.test-btn');
        if (testBtn) {
            testBtn.textContent = '🔧 テスト中...';
            testBtn.disabled = true;
        }
        
        // GitHub API の基本的な接続テスト
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (response.ok) {
            const userData = await response.json();
            alert(`✅ GitHub API接続成功！\n\nユーザー: ${userData.login}\n共有ランキング機能が利用可能です。`);
        } else {
            const errorData = await response.text();
            alert(`❌ GitHub API接続失敗\n\nステータス: ${response.status}\nエラー: ${errorData}\n\nトークンの権限を確認してください。`);
        }
        
    } catch (error) {
        console.error('GitHub接続テストエラー:', error);
        alert(`❌ GitHub接続テストでエラーが発生しました:\n\n${error.message}\n\nインターネット接続を確認してください。`);
    } finally {
        const testBtn = document.querySelector('.test-btn');
        if (testBtn) {
            testBtn.textContent = '🔧 接続テスト';
            testBtn.disabled = false;
        }
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
    
    // UI切り替え：ゲーム情報を非表示、スタート画面を表示
    if (elements.gameInfo) {
        elements.gameInfo.style.display = 'none';
    }
    if (elements.startScreen) {
        elements.startScreen.style.display = 'flex';
    }
    
    elements.result.style.display = 'none';
    elements.gameArea.innerHTML = '';
    
    updateUI();
}

// イベントリスナーの設定
document.addEventListener('DOMContentLoaded', () => {
    // GitHub トークンの初期化
    initializeGitHubToken();
    
    // ベストスコア表示の初期化
    updateBestScoreDisplay();
    
    // 新しいメインスタートボタン
    if (elements.mainStartBtn) {
        elements.mainStartBtn.addEventListener('click', startGame);
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
            resetGame(); // スタート画面に戻る
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

// GitHub トークンの初期化
function initializeGitHubToken() {
    try {
        const storedToken = localStorage.getItem('github_token');
        if (storedToken && typeof setGitHubToken === 'function') {
            setGitHubToken(storedToken);
            console.log('GitHub トークンを自動読み込みしました');
        }
    } catch (error) {
        console.error('GitHub トークン初期化エラー:', error);
    }
}