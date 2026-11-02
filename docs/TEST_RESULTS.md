# V5 五集驗證結果

後續更新：S101／S102 已上傳 main，新增實際 MP3 播放檢查後，瀏覽器共 21 個情境通過。實測長度不符及分段限制見 [AUDIO_CHECK.md](AUDIO_CHECK.md)。以下保留 QA2 匯入時的驗證紀錄。

執行日期：2026-11-02。環境：Linux、Node.js 24.19.0、Python 3.12.14、Chromium 154、Playwright 1.62.1。所有下列測試在目前雲端實例執行；GitHub Actions workflow 已加入，但尚未取得遠端 runner 結果。

## 原始資料與 V4 基準

五份 JSON、schema、原附 Python 驗證腳本及參考 V4 檔案由 `bluey_v5_codex_ready_QA2.zip` 原樣匯入，SHA-256 記錄於 `tests/source-hashes.json`。測試核對全部檔案 bytes，五集教材內容保持不變，reviewStatus 全為 draft。原 root V4 與附件 reference 相同，V4 CSS 經換行正規化後保留於 styles.css 開頭；新功能以額外樣式擴充。

| 集數 | 分段 | 生字 | 句子 | 狀態 |
| --- | ---: | ---: | ---: | --- |
| S101 | 7 | 18 | 10 | draft |
| S102 | 6 | 16 | 10 | draft |
| S103 | 5 | 18 | 9 | draft |
| S104 | 5 | 18 | 9 | draft |
| S105 | 5 | 18 | 9 | draft |
| 合計 | 28 | 88 | 47 | 全部未獨立核實音訊 |

## 自動驗證結果

- `python3 scripts/validate_episodes.py`：**0 errors、0 warnings**；使用 jsonschema 4.26.0 的 Draft202012Validator 完整驗證。
- `node scripts/validate-episodes.cjs`：五集全部通過 schema 關鍵字與跨欄位檢查。
- `node --test --test-reporter=spec tests/validation.test.cjs tests/qa2.test.cjs`：**23 tests、23 passed、0 failed、0 skipped**。包含來源 hashes、V4 CSS／原檔基準、schema／時間邊界、重複卡片及 localStorage 的正常、損壞、權限拒絕、容量不足情況。
- `tests/browser.cjs`：**20 個 Chromium 瀏覽器情境全部通過**；每個情境均檢查沒有未處理的 pageerror。經 `/bluey-learning-hub/` 子路徑載入，觸控 viewport 起始 390×844。
- `git diff --check`：通過。CI YAML 可解析；Playwright 1.62.1 的 registry 版本已確認存在。

QA2 本次驗證沒有提示或錯誤；第一輪的異常時間文字與生字數量提示已由供應方新版資料處理。新增三項 Node 測試核對 QA2 的 28／88／47 總數及 draft 狀態、無生成式引用標記，以及原附 Python checker 在沒有 jsonschema 的標準庫模式下，確實拒絕巢狀 `[cite: N]` 並以非零狀態結束。全部原始 QA2 檔案維持原 bytes。

原始 [QA_REPORT.md](QA_REPORT.md) 的 S102 表格列出 16 個詞彙，但「Newly added vocabulary」段落寫 previous 18；本次以實際 JSON 的 16 為準，不修改來源報告。結構驗證不能確認對白／原聲時間準確。

## 瀏覽器情境

1. 五集各自載入正確場景、生字、句子、分類及四選項題庫，52 集保持可選。
2. V4 聲音啟動 UI、分類、木琴、TTS 快慢、三次 freeze／unfreeze 輪流挑戰；過關只記一次，可重玩。
3. Hospital 按 config 顯示 Telemachus 及三隻肚內動物；X 光、玩具針、芝士、過關及重置。
4. Balloon 跌地失敗、重新開始、風扇、連拍五次過關；切集清除動畫，沒有改動另一集進度。
5. Robot 錯誤指令提示、按次序完成指令、失控、鼻哥熄機、過關及重玩。
6. Shadow 踩陽光失敗、未開橋不可通過、四秒橋樑期限、巴士／雲開橋、成功抵達及切集清除計時器。
7. 正確答題後切集，上一集計時器不會換掉新題目；進度按集數隔離並在重新整理後保留。
8. 實際逐一選取 S106–S152 共 47 集：清除舊卡片及遊戲、顯示教材準備中、音檔 src 對應本集；另模擬 S102 JSON 404。
9. 延遲上一集 fetch 回應不會覆蓋新集數。
10. JSON 語法錯誤、schema 錯誤、HTTP 503 及網絡 abort 均有提示。
11. schema 下載失敗後重新選集可重試成功。
12. HTML、引號及超長教材／config 文字安全顯示，不執行注入內容、不橫向溢出；空教材陣列可用。
13. 真實缺音檔 404 顯示提示，heard 項目仍可改用 TTS，不標成獨立核實原聲。
14. 合成音訊驗證原生播放／暫停、0.65／0.8／1.0 倍速、退後 5 秒、片段停止／重播及切集停止舊播放。
15. 實際 metadata 與聲稱時長不同會提示；片段終點超出實際長度時不截短、不播放；heard 可選片段或 TTS，practice 只用 TTS。
16. 模擬 Safari 類型的 NotAllowedError，提示使用者點播放／用 TTS，沒有遺留 clipStopTime。
17. 上一個播放請求延遲拒絕，不會蓋過新片段的時間越界提示。
18. localStorage 被拒絕及 TTS API 缺失時仍可使用遊戲與測驗，顯示本次使用／缺讀音提示。
19. 聲線清單空白時顯示系統讀音及下載英文聲線提示。
20. 重新整理、320px 窄屏、768×1024 直向、1024×768 橫向；五集均無橫向溢出，並生成截圖。

## 截圖證據

以下為目前程式的 Chromium 截圖，並非 iPad Safari 截圖。

- [S101 介面概覽](screenshots/s101-overview.png)
- [S101 木琴定格](screenshots/s101-game.png)
- [S102 醫院](screenshots/s102-game.png)
- [S103 顛氣球](screenshots/s103-game.png)
- [S104 機械人](screenshots/s104-game.png)
- [S105 影子國度](screenshots/s105-game.png)

## 未驗證項目與部署狀態

附件沒有 MP3。音訊控制測試使用記憶體生成的 30 秒無聲 WAV 及 byte ranges，僅驗證播放器行為、seek 及邊界，沒有提交假劇集錄音。沒有獨立確認對白、實際錄音長度、音質、音量、聲線效果或任何時間戳。來源宣告的 439／438 秒不是本次實測值，改用其他錄音版本亦可能出現偏移。

沒有實體 iPad 或 Safari 可用。Chromium 的觸控 viewport、模擬播放拒絕及聲線缺失測試，不能當作實機 Safari 驗收。原附「先手動驗證 iPad Safari 再驗收」尚未完成，因此本報告只表示開發與自動測試通過。

本次未設定、合併或發布 GitHub Pages，也未確認 production URL。Git push 可用；GitHub API／GraphQL 仍回傳 Forbidden，未能在本次工作階段代建 PR。PR #1 的五集版已合併 main；本次 QA2 更新分支為 `chore/bluey-qa2-data`，可用 [PR 建立頁](https://github.com/johnwps36-cyber/bluey-learning-hub/pull/new/chore/bluey-qa2-data) 審核提交；正文已備於 [PULL_REQUEST.md](PULL_REQUEST.md)。

## iPad Safari 手動驗收清單

以下全部 **待執行**，由持有實際錄音及 iPad 的人於上線前確認：

- [ ] 上傳同版本 S101–S105 MP3，檢查實際長度及開頭偏移，校對原始 QA 提示。
- [ ] 第一次開站：點聲音啟動及原生播放；檢查裝置靜音、音量與真實發聲。
- [ ] 播放／暫停、三個倍速、退後 5 秒、片段停止及重播。
- [ ] 五集前後切換即停止舊聲音，點新集原音可播放，無舊教材或計時器串集。
- [ ] heard 原音片段、TTS 替代及 practice 讀音；檢查 en-AU 聲線及未安裝聲線的提示。
- [ ] 四選項測驗、分類、句子點讀、五款遊戲的成功／失敗／重試。
- [ ] 學習進度重新整理後保留；私密／儲存受限模式仍可操作。
- [ ] 直向、橫向、窄屏、觸控氣球及各遊戲按鈕。
- [ ] 慢網絡連續切集、缺 MP3、缺 JSON、格式錯誤的提示與 TTS 替代。
- [ ] GitHub Pages repository URL 可載入所有相對資源；Safari Web Inspector 無未處理 JavaScript error。
