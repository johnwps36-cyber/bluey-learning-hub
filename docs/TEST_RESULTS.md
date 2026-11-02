# V5 S101／S102 驗證結果

執行日期：2026-11-02。環境：Linux、Node.js 24.19.0、Python 3.12.14、Chromium 154、Playwright 1.62.1。

## 已執行並通過

- `node scripts/validate-episodes.cjs`：S101／S102 兩份資料通過 schema 欄位及跨欄位檢查。
- Python `jsonschema` 4.26.0、Draft202012Validator：原始 schema 本身及兩份 JSON 通過正式 JSON Schema 2020-12 驗證。
- `node --test tests/validation.test.cjs`：16 tests，16 passed，0 failed／skipped。包含從 V4 直接抽取資料的對照、原始 32／16／6 保留、缺欄位、額外欄位、路徑與 id、越界／重疊／反向時間、重複卡片、source、practice／heard timestamps、未知遊戲及空陣列。
- `tests/browser.cjs`：11 個瀏覽器情境全部通過，所有情境無 pageerror。經 `/bluey-learning-hub/` 子路徑載入。

瀏覽器情境：

1. S101 原有數量、52 選項、聲音啟動狀態、分類、閃卡點讀、TTS 快慢、freeze／unfreeze。
2. S102 獨立 4 生字／2 句、hospital 動作、正確答題，切回 S101 後舊答題計時器不串集。
3. 實際逐一選取 S103–S152：教材準備中、無 S101 卡片或遊戲、音檔 src 正確。另模擬 S102 JSON 404。
4. 延遲 S102 回應再切到 S103，不會被舊教材覆蓋。
5. JSON 語法錯誤、schema 錯誤及 HTTP 503 有可理解提示，舊教材已清除。
6. schema 下載失敗時顯示錯誤；網絡恢復後重新選集可重試成功。
7. HTML 標記、引號、超長字詞以文字顯示，沒有 HTML 注入、窄屏溢出；空資料不使測驗崩潰。
8. 真實缺音檔 404 顯示提示。
9. 生成的無聲 WAV 測試原生播放／暫停、0.65／0.8／1.0 速度、退後 5 秒、片段停止／重播、切集停止舊播放。測試提供 byte ranges 才能準確模擬媒體 seek。
10. 帶已核實來源標籤及時間的測試資料走原音片段播放。
11. 重新整理、320px 窄屏、768×1024 直向、1024×768 橫向均無橫向溢出。

## 限制與未執行項目

未收到任何實際 MP3 或 Gemini 分析完成的 S102 JSON，故未驗證真實原音、時長、分段準確性、實際發聲音量／TTS 聲線或音質。S101 保留 V4 資料，全部待音訊校對；S102 只是明確標記的練習草稿，不是完成的劇集教材。UI 不會要求每次揀本地檔案。

沒有實體 iPad／Safari 可用。Chromium 的觸控 viewport 和頭無瀏覽器測試不代表 iPad Safari 已通過。實際 iPad 音訊首次啟動、權限、手勢與靜音開關需要人工檢查。

未設定／發布 GitHub Pages，未執行 production URL 驗收。沒有合併至 main。

## iPad Safari 手動驗收清單

以下全部 **待執行**，上線前由持有實際錄音及 iPad 的人確認：

- [ ] 首次開站：點聲音啟動，再點原生播放；檢查音量及裝置靜音，聽到正確音檔。
- [ ] 原生播放／暫停、0.65／0.8／1.0 倍速、退後 5 秒。
- [ ] S101→S102→S101，切集即停止上一集；新集點播放可出聲。
- [ ] 校對 S101 六段與真實音檔長度，含結尾；重播段落到終點自動暫停。
- [ ] 閃卡、原聲／練習標籤、句子點讀、TTS 快慢與聽音測驗。
- [ ] S101 freeze 木琴與定格／解凍；S102 hospital 三個動作。
- [ ] 直向／橫向、窄屏、觸控按鈕與長文字。
- [ ] 慢網絡快速切集，不出現上一集教材或聲音。
- [ ] 缺 MP3、缺 JSON、JSON 格式錯誤的提示；未備教材仍可播本集錄音。
- [ ] 重新整理可載入 S101；Safari Web Inspector 無未處理 JavaScript error。
