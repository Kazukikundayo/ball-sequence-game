// GitHub Issues API を使った共有ランキングシステム
class GitHubRankingSystem {
    constructor() {
        this.isOnline = navigator.onLine;
        this.syncInProgress = false;
        
        // オフライン/オンライン状態の監視
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncRankingsFromGitHub();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }
    
    // GitHub Issues API ヘッダーの取得
    getApiHeaders() {
        const token = getGitHubToken();
        if (!token) {
            console.warn('GitHub token not set. Using anonymous API (rate limited)');
            return {
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            };
        }
        
        return {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };
    }
    
    // ランキング用Issueの取得または作成
    async findOrCreateRankingIssue() {
        try {
            const url = `${GITHUB_CONFIG.apiBaseUrl}/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/issues`;
            
            // 既存のIssueを検索
            const searchResponse = await fetch(`${url}?state=open&labels=ranking`, {
                headers: this.getApiHeaders()
            });
            
            if (searchResponse.ok) {
                const issues = await searchResponse.json();
                const rankingIssue = issues.find(issue => 
                    issue.title === GITHUB_CONFIG.rankingIssueTitle
                );
                
                if (rankingIssue) {
                    GITHUB_CONFIG.rankingIssueNumber = rankingIssue.number;
                    return rankingIssue;
                }
            }
            
            // 新しいIssueを作成
            const createResponse = await fetch(url, {
                method: 'POST',
                headers: this.getApiHeaders(),
                body: JSON.stringify({
                    title: GITHUB_CONFIG.rankingIssueTitle,
                    body: this.generateInitialIssueBody(),
                    labels: ['ranking', 'game-data']
                })
            });
            
            if (createResponse.ok) {
                const newIssue = await createResponse.json();
                GITHUB_CONFIG.rankingIssueNumber = newIssue.number;
                return newIssue;
            } else {
                throw new Error(`Failed to create ranking issue: ${createResponse.status}`);
            }
        } catch (error) {
            console.error('Error finding or creating ranking issue:', error);
            throw error;
        }
    }
    
    // 初期Issue本文の生成
    generateInitialIssueBody() {
        return `# 🏆 Ball Sequence Game Rankings

このIssueは5x5グリッドパネルゲームのランキングデータを保存するために使用されます。

## 現在のランキング

\`\`\`json
{
  "rankings": [],
  "lastUpdated": "${new Date().toISOString()}",
  "version": "1.0"
}
\`\`\`

---
⚠️ **注意**: このIssueは自動で更新されます。手動での編集は避けてください。`;
    }
    
    // GitHubからランキングデータを取得
    async fetchRankingsFromGitHub() {
        try {
            if (!this.isOnline) {
                throw new Error('オフライン状態です');
            }
            
            const issue = await this.findOrCreateRankingIssue();
            const rankings = this.parseRankingsFromIssue(issue.body);
            
            // ローカルストレージにも保存（バックアップ）
            localStorage.setItem('github_rankings_backup', JSON.stringify(rankings));
            localStorage.setItem('github_rankings_last_sync', Date.now().toString());
            
            return rankings;
        } catch (error) {
            console.error('GitHub ランキング取得エラー:', error);
            
            // フォールバック: ローカルバックアップを使用
            const backup = localStorage.getItem('github_rankings_backup');
            if (backup) {
                console.log('ローカルバックアップからランキングを復元しました');
                return JSON.parse(backup);
            }
            
            return { rankings: [], lastUpdated: new Date().toISOString(), version: "1.0" };
        }
    }
    
    // Issue本文からランキングデータを解析
    parseRankingsFromIssue(issueBody) {
        try {
            const jsonMatch = issueBody.match(/```json\s*(\{[\s\S]*?\})\s*```/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[1]);
            }
        } catch (error) {
            console.error('ランキングデータの解析エラー:', error);
        }
        
        return { rankings: [], lastUpdated: new Date().toISOString(), version: "1.0" };
    }
    
    // GitHubにランキングデータを保存
    async saveRankingsToGitHub(rankingData) {
        try {
            if (!this.isOnline) {
                throw new Error('オフライン状態です');
            }
            
            if (this.syncInProgress) {
                console.log('同期中のため、保存をスキップします');
                return false;
            }
            
            this.syncInProgress = true;
            
            const issue = await this.findOrCreateRankingIssue();
            const updatedBody = this.generateUpdatedIssueBody(rankingData);
            
            const url = `${GITHUB_CONFIG.apiBaseUrl}/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/issues/${GITHUB_CONFIG.rankingIssueNumber}`;
            
            const response = await fetch(url, {
                method: 'PATCH',
                headers: this.getApiHeaders(),
                body: JSON.stringify({
                    body: updatedBody
                })
            });
            
            if (response.ok) {
                // バックアップも更新
                localStorage.setItem('github_rankings_backup', JSON.stringify(rankingData));
                localStorage.setItem('github_rankings_last_sync', Date.now().toString());
                console.log('GitHubランキングを更新しました');
                return true;
            } else {
                throw new Error(`Failed to update ranking issue: ${response.status}`);
            }
        } catch (error) {
            console.error('GitHubランキング保存エラー:', error);
            return false;
        } finally {
            this.syncInProgress = false;
        }
    }
    
    // 更新されたIssue本文の生成
    generateUpdatedIssueBody(rankingData) {
        return `# 🏆 Ball Sequence Game Rankings

このIssueは5x5グリッドパネルゲームのランキングデータを保存するために使用されます。

## 現在のランキング

\`\`\`json
${JSON.stringify(rankingData, null, 2)}
\`\`\`

---
⚠️ **注意**: このIssueは自動で更新されます。手動での編集は避けてください。
最終更新: ${new Date().toLocaleString('ja-JP')}`;
    }
    
    // 新しいスコアをランキングに追加
    async addScore(playerName, finalTime, accuracy, mistakes) {
        try {
            // まず最新のランキングを取得
            const currentRankings = await this.fetchRankingsFromGitHub();
            
            const newEntry = {
                playerName: playerName,
                finalTime: finalTime,
                accuracy: accuracy,
                mistakes: mistakes,
                timestamp: new Date().toISOString(),
                date: new Date().toLocaleDateString('ja-JP')
            };
            
            // ランキングに追加
            currentRankings.rankings.push(newEntry);
            
            // スコア順でソート（時間が短い順）
            currentRankings.rankings.sort((a, b) => a.finalTime - b.finalTime);
            
            // 最大数を超えた場合は削除
            if (currentRankings.rankings.length > GITHUB_CONFIG.maxRankings) {
                currentRankings.rankings = currentRankings.rankings.slice(0, GITHUB_CONFIG.maxRankings);
            }
            
            currentRankings.lastUpdated = new Date().toISOString();
            
            // GitHubに保存
            const saved = await this.saveRankingsToGitHub(currentRankings);
            
            if (!saved) {
                // GitHubに保存できない場合はローカルに保存
                console.log('GitHubに保存できませんでした。ローカルストレージに保存します。');
                this.saveToLocalStorage(currentRankings);
            }
            
            return currentRankings;
        } catch (error) {
            console.error('スコア追加エラー:', error);
            
            // フォールバック: ローカルストレージのみ使用
            const localRankings = this.getLocalRankings();
            const newEntry = {
                playerName: playerName,
                finalTime: finalTime,
                accuracy: accuracy,
                mistakes: mistakes,
                timestamp: new Date().toISOString(),
                date: new Date().toLocaleDateString('ja-JP')
            };
            
            localRankings.push(newEntry);
            localRankings.sort((a, b) => a.finalTime - b.finalTime);
            
            if (localRankings.length > 50) {
                localRankings.splice(50);
            }
            
            this.saveToLocalStorage({ rankings: localRankings, lastUpdated: new Date().toISOString() });
            return { rankings: localRankings, lastUpdated: new Date().toISOString() };
        }
    }
    
    // ローカルストレージからランキングを取得
    getLocalRankings() {
        const rankingsData = localStorage.getItem('rankings');
        return rankingsData ? JSON.parse(rankingsData) : [];
    }
    
    // ローカルストレージにランキングを保存
    saveToLocalStorage(rankingData) {
        localStorage.setItem('rankings', JSON.stringify(rankingData.rankings));
        localStorage.setItem('rankings_backup', JSON.stringify(rankingData));
    }
    
    // GitHub同期状態の確認
    async syncRankingsFromGitHub() {
        if (!this.isOnline || this.syncInProgress) {
            return false;
        }
        
        try {
            console.log('GitHubからランキングを同期中...');
            const gitHubRankings = await this.fetchRankingsFromGitHub();
            const localRankings = this.getLocalRankings();
            
            // マージ処理（重複除去とソート）
            const merged = this.mergeRankings(gitHubRankings.rankings, localRankings);
            
            const mergedData = {
                rankings: merged,
                lastUpdated: new Date().toISOString(),
                version: "1.0"
            };
            
            // 両方に保存
            this.saveToLocalStorage(mergedData);
            await this.saveRankingsToGitHub(mergedData);
            
            console.log('ランキング同期完了');
            return true;
        } catch (error) {
            console.error('ランキング同期エラー:', error);
            return false;
        }
    }
    
    // ランキングのマージ
    mergeRankings(githubRankings, localRankings) {
        const all = [...githubRankings, ...localRankings];
        const uniqueMap = new Map();
        
        // 重複除去（同じプレイヤー名と時間の組み合わせ）
        all.forEach(entry => {
            const key = `${entry.playerName}_${entry.finalTime}_${entry.timestamp}`;
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, entry);
            }
        });
        
        const merged = Array.from(uniqueMap.values());
        merged.sort((a, b) => a.finalTime - b.finalTime);
        
        return merged.slice(0, GITHUB_CONFIG.maxRankings);
    }
}

// グローバルインスタンス
const githubRanking = new GitHubRankingSystem();