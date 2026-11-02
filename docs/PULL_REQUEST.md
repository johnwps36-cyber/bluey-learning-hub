## Change

V4 changed only the audio when switching episodes and left S101 material visible. This incremental V5 upgrade preserves the existing layout and controls, loads episode-specific JSON/audio, and clears old playback, TTS, quiz timers, game animation and lesson data on selection changes.

The latest handoff's five episode JSON files are imported byte-for-byte unchanged, including all draft status, wording and QA notes. SHA-256 integrity tests protect them. S101–S105 contain 28 scenes, 70 vocabulary cards and 47 phrases. All 52 episodes remain selectable; S106–S152 show 教材準備中 while keeping that episode's audio player.

Five playable, restartable games use the supplied configs: freeze turns, hospital tools/items, falling balloon with wind, robot commands/malfunction/off switch, and timed shadow bridges. Per-episode learning progress persists locally and degrades to session memory if storage is denied/full.

Heard items offer separate original-clip and TTS buttons without claiming independent verification. Clips require actual metadata and the complete range must fit the loaded audio; no silent truncation. Practice items use TTS only. Stale fetch and playback-promise errors cannot overwrite newer state. No framework, backend, credentials or subscription.

## Validation

- Supplied Python checker: 0 errors, 6 preserved warnings; full JSON Schema 2020-12 validation enabled.
- 20 Node tests passed, including source bytes, V4 baseline, semantic validation and storage failures.
- 20 Chromium/Playwright scenarios passed: all five games, all 47 missing lessons, switching races, timer cleanup, network/schema failures, XSS-safe text, media controls, real-duration boundaries, TTS fallback, denied storage and narrow/iPad-sized viewports.
- Screenshots: [overview](https://github.com/johnwps36-cyber/bluey-learning-hub/blob/feat/bluey-v5-episodes/docs/screenshots/s101-overview.png), [freeze](https://github.com/johnwps36-cyber/bluey-learning-hub/blob/feat/bluey-v5-episodes/docs/screenshots/s101-game.png), [hospital](https://github.com/johnwps36-cyber/bluey-learning-hub/blob/feat/bluey-v5-episodes/docs/screenshots/s102-game.png), [balloon](https://github.com/johnwps36-cyber/bluey-learning-hub/blob/feat/bluey-v5-episodes/docs/screenshots/s103-game.png), [robot](https://github.com/johnwps36-cyber/bluey-learning-hub/blob/feat/bluey-v5-episodes/docs/screenshots/s104-game.png), [shadow](https://github.com/johnwps36-cyber/bluey-learning-hub/blob/feat/bluey-v5-episodes/docs/screenshots/s105-game.png). See [TEST_RESULTS.md](https://github.com/johnwps36-cyber/bluey-learning-hub/blob/feat/bluey-v5-episodes/docs/TEST_RESULTS.md) for full evidence.
- CI now runs Python, Node and browser checks and uploads screenshots. Remote CI execution is not yet verified.

No MP3s were supplied. Playback tests use synthetic silent WAV responses with byte ranges. Actual episode audio/timestamps and physical iPad Safari remain unverified; all five datasets stay draft.

## Deployment

Review and merge, add authorized audio/s101.mp3 through audio/s105.mp3, then configure Pages → Deploy from branch → main → /(root). Target: https://johnwps36-cyber.github.io/bluey-learning-hub/ . Complete the README's physical iPad Safari checklist before acceptance. Pages settings were not changed and no deployment is claimed.
