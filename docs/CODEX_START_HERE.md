# Codex task — Upgrade Bluey V4 to V5 using five second-round revised and cleaned episode JSON files

## Inputs
- `reference/bluey_v4_s101.html.txt`: existing working S101 V4 single-file source. Treat it as the functional/visual baseline.
- `episodes/s101.json` through `episodes/s105.json`: second-round Gemini-revised content (AI citation artifacts only have been removed); **do not replace/rewrite**.
- `episode.schema.json`: canonical data contract.
- `QA_REPORT.md`: structural validation results and limits.
- `scripts/validate_episodes.py`: repeatable zero-dependency data checker; uses `jsonschema` additionally if installed.

## Goal
Produce a **static, framework-free** GitHub Pages app with an editable HTML/CSS/JS frontend and one episode JSON per file. iPad Safari must be able to open one URL, select episode S101–S152, and play existing server-hosted MP3s without selecting/uploading local files. Preserve the V4 visual identity and controls where practical.

## Implement now
1. Build `index.html`, `styles.css`, `app.js`. Keep original V4 UI: iPad audio unlock with honest messaging, story player (0.65/0.8/1x, seek back 5s), flashcards, category tabs, quiz, phrase player and theme game slot.
2. Load `./episodes/s101.json` ... `./episodes/s105.json` based on selector. Display all 52 S101–S152 options; S106–S152 should still allow MP3 playback, but show a clear “教材準備中” message instead of stale content.
3. Load `./audio/s101.mp3` ... `./audio/s152.mp3` by relative paths for GitHub Pages project URL (`/repo-name/`), not domain root. Never use the old `bluey_mp3s/` path.
4. On episode change: pause previous player; cancel any active clip, pending timers and TTS; reset flashcards, quiz, game and loading/error state; then render the chosen episode. Handle fetch race conditions and 404 gracefully.
5. For `source: "heard"` with timestamps, implement an original-MP3 clip button; for `source: "practice"`, implement native speechSynthesis TTS only. Allow user to choose TTS if a clip fails or pending QA. Listen for actual audio metadata and check segment end <= media duration. Do NOT assert timestamps are already independently verified.
6. Implement FIVE distinct games from five JSON game types: freeze/xylophone, hospital, balloon, robot and shadow. Use reusable component patterns and `game.config`; a simple complete playable loop for each is preferred over a polished static placeholder.
7. Use safe DOM building / event binding to avoid injecting data into `onclick` string code. Use `localStorage` for basic learning progress per episode, with graceful fallback when disabled.
8. Add scripts/QA to test data schema, pages loading, episode switching, 404 JSON and audio, timestamp boundaries, iPad Safari tap-to-play restrictions, voice availability, quiz pool of 4 options, layout at iPad widths.
9. Keep a `README.md` with local testing and GitHub Pages instructions, and use a PR with screenshots/testing evidence. Do not commit credentials or create paid services.

## Important details
- Source inputs include no MP3 files. User will upload existing MP3s into GitHub `audio/`. Test app with placeholders or local files and report real-audio limitations transparently.
- The `reviewStatus` of all five JSONs is `draft`. Do not set it to `reviewed` automatically.
- Compare output against V4 to avoid unintentionally losing core behaviors.
- Do **not** overwrite five supplied JSONs or auto-generate 47 missing episode datasets as a prerequisite.
- Run `python scripts/validate_episodes.py`, and manually verify iPad Safari before acceptance.

## QA2 update (latest files)
- This ZIP **supersedes** `bluey_v5_codex_ready.zip` (first-round data). The revised five files have been included in `episodes/`.
- There are 88 vocab cards and 47 phrases, across 28 story segments. Each of S103, S104, S105 now contains 18 vocab cards.
- 90 stray generated citation markers were removed from user-facing text and QA notes; please do not reintroduce them.
- Gemini changed numerous `heard` timestamps. Do not replace them with previous versions; leave reviewStatus as `draft` until real MP3 audio verification.
- The JSON handoff deliberately includes no MP3s. User supplies `audio/s101.mp3` ... etc on GitHub.
