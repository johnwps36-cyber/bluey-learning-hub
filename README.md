# Bluey Learning Hub V5

沿用 V4 可愛介面與香港繁體中文的 Vanilla HTML/CSS/JavaScript 靜態網站。先完成 S101／S102 垂直切片，沒有框架、後端、API key 或付費服務。原始 `bluey v4 s1.html.txt` 保留作回歸基準。

## 本地開啟

需要 Python 3；網站本身無需安裝 npm 套件。在 repository 根目錄執行：

```sh
python3 -m http.server 8000
```

以瀏覽器開啟該 server 的 `index.html`。請經 HTTP 開啟；直接雙擊檔案的 `file:` 模式不能可靠地 fetch JSON。先撳聲音啟動按鈕，再撳播放器 ▶。播放按鈕由使用者主動操作，避免依賴 Safari 自動播放。

## 目錄

- `index.html`, `styles.css`, `app.js`：由 V4 漸進抽出的版面、樣式及互動。
- `episode.schema.json`：附件提供的原始 JSON Schema 2020-12 契約，未修改。
- `episode-validator.js`：瀏覽器／Node 共用檢查，支援目前 schema 使用的欄位規則及跨欄位檢查。
- `episodes/s101.json`：V4 原有 32 生字、16 句、6 分段，內容保留，標記待音訊校對。
- `episodes/s102.json`：4 生字、2 句的工程驗證用練習草稿，hospital 最小遊戲；不是經原音分析的正式教材。
- `audio/s101.mp3` … `audio/s152.mp3`：放入你有權使用的錄音；本次附件及 checkout 均未包含錄音。
- `scripts/validate-episodes.cjs`, `tests/`：資料檢查、V4 對照及瀏覽器回歸測試。
- `docs/`：原始交接指令、Gemini 教材製作指引、驗證結果及 iPad 手測清單。

## 新增／替換教材

1. 按 `docs/GEMINI_EPISODE_BRIEF.md` 分析實際 MP3，不要以劇情記憶填寫原聲或時間。
2. 每集儲存成 `episodes/s1NN.json`，符合 schema，`id` 與檔名一致，`audio` 為 `audio/s1NN.mp3`。全 52 集選單固定可選。
3. `practice` 的時間欄位必須為 null，UI 會標「練習」，使用裝置 TTS。只有核實聽到的文字才標 `heard`；有可靠起迄時間則點讀原音，沒有時間則用 TTS。
4. `durationSec: null` 表示長度未知，並不代表時間已確認。S101 的 V4 分段含 420 秒結尾，原樣保留待校對；已知長度時驗證器會拒絕越界資料，播放器亦會按實際長度限制片段。
5. scenes 必須整數秒、依時間排序、不重疊、起點小於終點。生字／句子不得重複。空陣列可接受並有空狀態。
6. 遊戲由 `game.type` 決定。`freeze` 保留 V4 木琴；`hospital` 提供檢查、貼膠布、休息。其餘 balloon／robot／shadow／generic 是簡單共用動作模板，沒有聲稱完成各集獨立玩法。`config.repeats` 可設 1–3，其他參數暫不使用。
7. 執行資料驗證及測試，再經 PR 審核。不要將密鑰或 token 放進網站／Git。

教材 JSON 404 時顯示「教材準備中」，音訊仍由同站相對路徑載入；其他 HTTP／解析／schema 錯誤會明確顯示。缺音檔或網絡失敗亦有提示。切集立即停止舊音訊及 TTS、清除振盪器、計時器、片段、舊題目和 UI，取消舊 fetch，並忽略過期回應。

## 測試

資料及回歸檢查只需 Node.js 20+：

```sh
node scripts/validate-episodes.cjs
node --test tests/validation.test.cjs
```

瀏覽器測試需要 Playwright 與 Chromium。這個雲端環境已有兩者，可使用已設定的 Node module 路徑。其他機器可將測試工具裝在 checkout 外：

```sh
npm install --prefix /tmp/bluey-test-tools --no-package-lock playwright@1.62.1
# 如未有 Chromium，可用 Playwright 安裝，再把 executable 路徑傳給 CHROMIUM_PATH：
/tmp/bluey-test-tools/node_modules/.bin/playwright install chromium
```

從 `/workspace` 啟動測試 server（測試會經 repository 子路徑載入，驗證 GitHub Pages 路徑相容性）：

```sh
python3 -m http.server 8001 --bind 127.0.0.1 --directory /workspace
```

在 repository 根目錄另開終端執行：

```sh
NODE_PATH=/tmp/bluey-test-tools/node_modules \
CHROMIUM_PATH=/path/to/chromium \
BASE_URL=http://127.0.0.1:8001/bluey-learning-hub/ \
node tests/browser.cjs
```

測試 server 須先啟動。其他路徑用 `BASE_URL` 調整，保留末尾 `/`。瀏覽器測試的播放／seek 使用記憶體生成的 30 秒無聲 WAV（含 byte-range 回應），只測控制行為，絕不是劇集錄音；不會提交假 MP3。完整結果及未執行的 iPad／實際原音檢查見 [TEST_RESULTS.md](docs/TEST_RESULTS.md)。

## GitHub Pages 部署

1. 審核並合併 PR 到 `main`。
2. 上傳合法授權的 MP3 到 `audio/`，先確認 `s101.mp3`、`s102.mp3`。檔名大小寫要完全一致。
3. GitHub repository → **Settings → Pages → Deploy from a branch → main → /(root) → Save**。
4. 等待 GitHub Pages deployment 成功，再以 iPad Safari 開啟網站，完成 [手測清單](docs/TEST_RESULTS.md#ipad-safari-手動驗收清單)。

單一目標網站 URL：**https://johnwps36-cyber.github.io/bluey-learning-hub/**

這是預期部署地址；本次未修改 Pages 設定、合併或發布，也未證實該 URL 已上線。程式使用 `./audio/`、`./episodes/` 及相對資源路徑，支援上述 repository 子路徑。

回退方式：將 Pages 指向上一個已驗證的 main 版本，或以新的 PR revert 本次功能提交。保留的 V4 檔案可作資料核對。
