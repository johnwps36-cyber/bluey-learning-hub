# Bluey Learning Hub V5 — Codex 開發交接指令

## 背景
這是現有 S101 專用單頁 HTML（V4）的漸進式升級，不是重新設計。請以同時提供的 `bluey v4 s1.html.txt` 作為唯一現有程式基礎。

使用者目標：一個 GitHub Pages 網站供 iPad Safari 使用。全部 MP3 已存在，會放在 GitHub repo 的 `audio/s101.mp3` 至 `audio/s152.mp3`；網頁必須無須再選擇/上傳本地 MP3，選集後即可透過同站相對路徑播放。教學內容將由 Gemini 產生，每集一個 JSON，陸續匯入。使用者希望沿用 V4 的可愛介面、廣東話繁體中文、慢速播放、原聲分段、閃卡、聽音測驗、句子點讀、主題遊戲。

## V4 事實
- V4 已有 52 集下拉選單，現時 MP3 路徑為 `bluey_mp3s/s101.mp3` 格式。
- 但 `vocabList` 32 項、`phrases` 16 項、6 個原音分段及神奇木琴遊戲全部寫死為 S101；切集不更新內容。
- iPad 聲音解鎖、speechSynthesis、0.65 / 0.8 / 1.0 倍速、退後 5 秒、片段停止功能已存在，應保留並回歸測試。程式顯示『完全解鎖』並不代表所有 iOS 版本保證可自動播放。
- S101 目前時間軸和示例台詞沒有經現成 MP3 核實，標為待校對；不得把示例當作已驗證原聲。

## 工作順序（分 PR / 小步提交）
1. 建立 Vanilla HTML/CSS/JS 靜態網站，優先原生 Web API，暫不導入框架/付費服務/後端。將 V4 轉為 `index.html` + `app.js` + `styles.css`，保持版面、功能和 iPad Safari 觸控尺寸。
2. 把 S101 原有 vocab、phrases、scenes 及 game 搬到 `episodes/s101.json`，保留原始資料，但明確標註 `reviewStatus: "needs_audio_verification"`。除程式需要的格式調整，不要擅自改教材內容。
3. 實作以 `episodeId` 驅動的渲染；切集須同步切換標題、音訊、場景按鈕、生字、分類、題庫、句子及遊戲。立即停止舊音訊、重設 clipStopTime、計時器、測驗狀態等，避免音軌交錯。媒體播放可能受 iOS 使用者手勢限制，應提供明確可點擊播放 UI。
4. 使用 `./audio/${id}.mp3` 和 `./episodes/${id}.json` 等 GitHub Pages 兼容相對路徑（不能假設部署在 domain root）。`fetch` 失敗要可理解地顯示，不可靜默失敗。
5. 未有 JSON 的集數仍可選集播放音訊，教材區顯示「教材準備中」，而非沿用 S101 卡片或遊戲。音檔未有則顯示適當提示。所有 52 集保持可選。
6. 定義及驗證共用每集 JSON 契約：id, titleEn, titleZh, audio, reviewStatus, scenes, vocab, phrases, game。對 timestamps、空陣列、長字詞、HTML 內容做安全/邊界處理。不要直接將 Gemini 的原始內容拼到 onclick 字串；用安全 DOM API 或事件綁定。
7. 建立資料驗證腳本：檢查 JSON 語法、id 與音檔路徑、排序/範圍、重複卡片、缺字段、原音句與練習句標籤。考慮 `durationSec=null` 未核實的情況。
8. 主題遊戲設計成可重用組件：`freeze`, `hospital`, `balloon`, `robot`, `shadow`, `generic`。先確保 freeze 可用，再為 S102 開發 hospital 的最小版本，不用一次開發 52 種獨立遊戲。`game.type` 決定模板，並可用 `game.config` 調整。
9. 用桌面瀏覽器及 iPad Safari 手動測試清單驗證：首次音訊啟動、音量、播放/暫停、切集後播音、速度、前後切換、時段重播、閃卡發音、測驗、旋轉/窄屏、網絡慢/音檔 404、JSON 404、刷新頁面、無 JavaScript error。
10. 加入 `README.md`：專案目錄、以 `python -m http.server` 本地測試方式、GitHub Pages Settings -> Pages -> Deploy from branch -> main -> /(root)，並記錄單一網站 URL。不要把任何 Gemini API key / GitHub token 放在前端或提交到 Repo。

## 首輪交付驗收
- S101 教材功能與 V4 同等可用，切換後內容正確、不串集。
- S102 有 JSON 時載入 S102；無 JSON 時仍播 S102 MP3，顯示「教材準備中」。
- S103 至 S152 未有教材時不誤顯示 S101 資料。
- 完全不再要求 iPad 每次手動揀 MP3。
- GitHub Pages 靜態部署可用；沒有後端或額外訂閱。
- 提供已修改檔案、測試結果、殘餘問題；優先開 Pull Request 給使用者審核。

## 參考資料
另有 `GEMINI_EPISODE_BRIEF.md`、`episode.schema.json` 可用作資料生成契約。先以 S101 / S102 作垂直切片，通過後再擴展 52 集。
