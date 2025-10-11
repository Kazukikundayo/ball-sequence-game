// GitHub Pages用共有ランキングシステム設定
const GITHUB_CONFIG = {
    // リポジトリ情報（実際の値に変更してください）
    owner: 'kazukikundayo',
    repo: 'ball-sequence-game',
    
    // GitHub Personal Access Token（環境変数として設定推奨）
    // 実際のトークンは以下のコメントアウト部分を参考に設定してください
    // token: 'your_github_personal_access_token_here',
    
    // ランキング用Issue設定
    rankingIssueTitle: '🏆 Ball Sequence Game Rankings',
    rankingIssueNumber: null, // 初回実行時に自動設定
    
    // API設定
    apiBaseUrl: 'https://api.github.com',
    
    // ランキング設定
    maxRankings: 100, // 最大ランキング数
    
    // Personal Access Token取得手順:
    // 1. GitHub.com にログイン
    // 2. Settings → Developer settings → Personal access tokens → Tokens (classic)
    // 3. "Generate new token (classic)" をクリック
    // 4. Note: "Ball Sequence Game Rankings"
    // 5. Expiration: "No expiration" または適切な期間
    // 6. Select scopes: "repo" にチェック（public repository の場合は "public_repo" のみでも可）
    // 7. "Generate token" をクリック
    // 8. 生成されたトークンをコピーして、下記のtokenフィールドに設定
};

// トークン設定用のヘルパー関数
function setGitHubToken(token) {
    GITHUB_CONFIG.token = token;
    localStorage.setItem('github_token', token);
}

// トークンの取得
function getGitHubToken() {
    // 設定されたトークンまたはlocalStorageから取得
    const configToken = GITHUB_CONFIG.token;
    const storedToken = localStorage.getItem('github_token');
    
    // 両方存在する場合はconfigを優先、そうでなければstorageから
    const token = configToken || storedToken;
    
    // configに設定されていない場合はstorageの値をconfigにも設定
    if (!configToken && storedToken) {
        GITHUB_CONFIG.token = storedToken;
    }
    
    return token;
}

// トークンの削除
function clearGitHubToken() {
    GITHUB_CONFIG.token = null;
    localStorage.removeItem('github_token');
}