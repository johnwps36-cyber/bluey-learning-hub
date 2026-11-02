# Bluey Learning Hub V5

沿用 V4 可愛介面與香港繁體中文的 Vanilla HTML/CSS/JavaScript 靜態網站，支援 S101–S105 的原始教材及五款遊戲。沒有框架、後端、API key 或付費服務。

## 開啟及部署

在 repository 根目錄執行：

```sh
python3 -m http.server 8000
```

以瀏覽器經 HTTP 開啟這個 server，入口是 `index.html`；不要直接雙擊用 `file:` 載入，否則不能可靠地 fetch JSON。先撳聲音啟動按鈕，再撳播放器 ▶；切集後由使用者主動播放，避免依賴 Safari 自動播放。原聲片段及電腦讀音亦由點擊觸發。

GitHub Pages 部署：

1. 審核 PR 並合併到 `main`。
2. 將你有權使用的錄音放入 `audio/s101.mp3` 至 `audio/s152.mp3`。本次附件沒有 MP3，先上傳 S101–S105；檔名及大小寫必須一致。
3. Repository → **Settings → Pages → Deploy from a branch → main → /(root) → Save**。
4. 等待 Pages deployment 成功，再以實體 iPad Safari 完成 [手動驗收清單](docs/TEST_RESULTS.md#ipad-safari-手動驗收清單)。

單一目標網站 URL：**https://johnwps36-cyber.github.io/bluey-learning-hub/**

這是預期部署地址；本次未改 Pages 設定、未合併或發布，也未證實該 URL 已上線。音訊、JSON、CSS 及 JavaScript 全部使用同站相對路徑，支援 repository 子路徑。沒有要求 iPad 每次手動選本機 MP3。

## 原始教材保持不變

最新來源是 `bluey_v5_codex_ready.zip`；`docs/CODEX_START_HERE.md` 及 `docs/QA_REPORT.md` 按原檔保存。五份 `episodes/s101.json`–`s105.json`、schema、原附 Python 驗證腳本及 V4 參考檔都按原始 bytes 匯入，沒有改寫、補字或更改 reviewStatus。`tests/source-hashes.json` 記錄 SHA-256，測試會核對來源完整性。早期 S101／S102 練習資料已由最新供應資料替換；歷史可於 Git 提交中查看。

| 集數 | 教材名 | 分段 | 生字 | 句子 | 遊戲 |
| --- | --- | ---: | ---: | ---: | --- |
| S101 | The Magic Xylophone | 7 | 18 | 10 | freeze |
| S102 | Hospital | 6 | 16 | 10 | hospital |
| S103 | Keepy Uppy | 5 | 12 | 9 | balloon |
| S104 | Daddy Robot | 5 | 12 | 9 | robot |
| S105 | Shadowlands | 5 | 12 | 9 | shadow |

合計 28 分段、70 生字、47 句，全部維持 `draft`。來源聲稱曾核對部分音訊，本次沒有 MP3 可獨立確認；UI 不會將 `heard` 標籤當作已獨立核實。原 QA 的 `00:67`、`01:92`、`00:94` 保持原文，尤其 `01:92` 不會擅自換算。S103–S105 各有 12 張生字卡，不會為湊數而添加內容。

全 52 集均可選。S106–S152 未有 JSON 時顯示「教材準備中」，仍可播放本集 MP3；不會沿用上一集資料。音檔 404、JSON 404、HTTP／網絡／格式錯誤均有提示。

## 互動與遊戲

保留 V4 木琴音效、0.65／0.8／1.0 倍速、退後 5 秒、分段停止、閃卡、分類、四選項測驗、句子點讀與 freeze 舞台。

- `heard` 生字／句子提供原音及獨立電腦讀音按鈕；原音失敗或尚待 QA 時，可直接選電腦讀音。`practice` 只使用裝置 TTS。
- 原音片段必須先取得實際 metadata，且完整起迄時間均在音檔長度內。越界會停止並提示，不會偷偷截短；資料標示時長與實際長度不同亦會提醒，不能據此判斷對白已核實。
- 沒有 TTS API／英文聲線時會顯示提示，仍可使用播放器及其他互動。英語聲線優先 en-AU，再 en-GB／en-US，最後系統可用英文聲線。
- 切集立即停止舊播放器及 TTS、清除音效、片段、測驗計時器、遊戲動畫及橋樑計時器，並取消舊 fetch／忽略過期回應。

五個遊戲各有成功流程及重玩：

| 類型 | 玩法 | 主要 config |
| --- | --- | --- |
| freeze | 完成指定次數的定格＋解凍，再輪到下一位 | `turnLimit`；保留 V4 合成木琴音效，沒有新增外部音效素材 |
| hospital | 照 X 光、玩具針、用芝士逐隻引出肚內動物 | `patientName`, `tools`, `bellyItems` |
| balloon | 開始後拍五下，不能跌到地面；可開風扇，失敗可重試 | `gravity`, `windEnabled`；紅氣球對應本次資料 |
| robot | 跟指令操作，失控時按紅鼻哥掣，再完成餘下指令 | `commands`, `malfunctionMode`, `offSwitch` |
| shadow | 沿樹影前進，等巴士／雲開啟四秒影子橋，避陽光到野餐墊 | `movingBridges`；安全區、危險區及目標對應本次來源設定 |

`generic` 保留簡單共用完成練習。遊戲程式不會修改教材 JSON。

## 學習進度

使用 localStorage key `bluey-learning-progress-v1`，按集數保存點讀過的生字、答對過的不同生字及遊戲過關次數，重新整理仍保留。星星分別表示有點讀、有答對及有遊戲過關；不是對語言能力的評估。資料只保存在本機瀏覽器，沒有帳戶或跨裝置同步。儲存被停用／容量不足時退回本次使用的記憶體，並在介面說明；不會阻止學習。

## 目錄

- `index.html`, `styles.css`, `app.js`：原版面、樣式與按集數載入／播放邏輯。
- `games.js`, `progress.js`：遊戲生命週期及按集數儲存進度。
- `episodes/`, `episode.schema.json`：原始五集資料及契約。
- `episode-validator.js`：瀏覽器／Node 共用 schema 欄位及跨欄位檢查。
- `scripts/validate_episodes.py`：原附零依賴驗證腳本；有 jsonschema 時亦完整驗證 JSON Schema 2020-12。
- `scripts/validate-episodes.cjs`, `tests/`：資料檢查、來源 bytes、進度及瀏覽器回歸。
- `reference/bluey_v4_s101.html.txt`：附件的 V4 原檔，與 root 原始檔相同；原始 CSS 亦保留於 styles.css 開頭。
- `docs/`：最新交接文件／原始 QA 報告、測試結果、PR 說明與截圖。`CODEX_HANDOFF.md` 及 `GEMINI_EPISODE_BRIEF.md` 是早期參考文件。

## 驗證

需要 Python 3、Node.js 20+：

```sh
python3 scripts/validate_episodes.py
node scripts/validate-episodes.cjs
node --test tests/validation.test.cjs
```

完整 schema 驗證可安裝 `jsonschema==4.26.0`；沒有時原附 Python 腳本會清楚列出僅執行標準庫檢查。GitHub Actions 同時執行完整資料檢查、Node 測試及瀏覽器測試。

瀏覽器測試需要 Playwright 與 Chromium。可在 checkout 外安裝測試工具：

```sh
npm install --prefix /tmp/bluey-test-tools --no-package-lock playwright@1.62.1
/tmp/bluey-test-tools/node_modules/.bin/playwright install chromium
```

從 repository 的父目錄啟動 server，以測試 GitHub Pages 子路徑：

```sh
python3 -m http.server 8001 --bind 127.0.0.1
```

在 repository 根目錄另開終端：

```sh
NODE_PATH=/tmp/bluey-test-tools/node_modules \
BASE_URL=http://127.0.0.1:8001/bluey-learning-hub/ \
node tests/browser.cjs
```

雲端預裝 Playwright 的 module 路徑為 `/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules`。瀏覽器優先 `CHROMIUM_PATH`，其次系統 `/usr/bin/chromium`，否則用 Playwright 安裝的 Chromium。`BASE_URL` 保留末尾 `/`。

測試使用生成的 30 秒無聲 WAV 和 byte-range 回應驗證控制及越界處理，不是劇集錄音；不會提交假 MP3。截圖輸出至忽略的 `test-results/`，本次審核截圖保存在 `docs/screenshots/`。完整證據及未執行項目見 [TEST_RESULTS.md](docs/TEST_RESULTS.md)。

新增教材時依 schema 檢查 id／檔名／音檔路徑、時間、來源標記及重複內容；先分析實際錄音再標 heard。不要自動產生其餘 47 集作上線前提。密鑰及 token 不可放入前端或 Git。

回退可經新的 PR revert 本次相關提交；原始 V4 及歷史提交仍保留可供核對。
