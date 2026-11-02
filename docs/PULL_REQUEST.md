## Change

Selecting another episode in V4 changed only the MP3 while leaving S101 learning content visible. V5 now loads the selected episode's schema-validated JSON and audio together, clears previous content/playback/timers immediately, and ignores stale responses. Missing lesson JSON displays 教材準備中 while retaining the selected episode's audio player.

Preserves the V4 layout, synthesis engine, speed controls, rewind, vocabulary, quiz, phrases and freeze game. S101 retains all 32 vocabulary items, 16 phrases and 6 scene ranges, marked needs_audio_verification. S102 is explicitly a small practice draft with a minimal hospital game, pending real audio analysis. All 52 episodes remain selectable. No framework, backend or API keys; paths work under the GitHub Pages repository subpath.

## Validation

- 16 Node tests passed: schema/semantic failures, empty data, timestamps and exact V4 content preservation.
- Both episode files validated independently with JSON Schema Draft 2020-12.
- 11 Chromium/Playwright scenarios passed: S101/S102, all 50 missing episodes, missing S102 JSON, stale fetches, timer cleanup, malformed JSON, HTTP failures, schema-download recovery, safe text rendering, long text, media controls/clip stops, and portrait/landscape layouts.
- Media controls use synthetic silent WAV responses with byte ranges; no actual recordings were supplied. Real episode timing/audio and physical iPad Safari remain unverified.

## Deployment

See README.md and docs/TEST_RESULTS.md. After review and merge, add authorized audio/s101.mp3 and audio/s102.mp3, configure Pages → Deploy from branch → main → /(root), then perform the documented iPad Safari checks. Pages settings were not changed and deployment has not been claimed.
