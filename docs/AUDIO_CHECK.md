# Uploaded S101/S102 audio check

Checked on 2026-11-02 against main commit `116b954` (Add files via upload).

Both uploaded files are present at the app's expected relative paths. FFprobe identifies standard MP3 audio, 44,100 Hz, stereo. FFmpeg decoded the complete audio streams without reported errors. Browser verification used these actual files through the local static server; the public Pages deployment and physical iPad Safari were not independently checked.

| File | Size (bytes) | Measured duration | JSON durationSec | Out-of-range scene |
| --- | ---: | ---: | ---: | --- |
| audio/s101.mp3 | 3746232 | 382.616 s (about 6:23) | 439 | scene 7, 學識分享救爸爸, 355–439 s |
| audio/s102.mp3 | 3807151 | 395.154 s (about 6:35) | 438 | scene 6, 用芝士引老鼠同貓出嚟, 368–438 s |

All vocabulary/phrase timestamp ranges fit inside the measured lengths. This is a bounds check, not confirmation that the words match their clips. No dialogue or timing accuracy is claimed. The original QA2 JSONs and uploaded MP3s were left unchanged.

The existing player warns about declared-versus-actual duration differences and rejects the two overlong final scenes instead of truncating them. Whole-episode playback and in-range clips work. For word/phrase material, the explicit TTS alternative remains available. Timing correction requires checking the real recording and should be handled separately.

## Automated verification

`tests/browser.cjs`: 21 scenarios passed, including actual S101/S102 MP3 load, progressing playback time, seek/clip stop and safe refusal of the overlong last scenes, with no unhandled pageerrors.

The missing-media scenario now explicitly intercepts MP3 requests with HTTP 404. It previously depended on the repository containing no MP3s and would fail after this legitimate upload. Synthetic WAV fixtures remain isolated to tests that need controlled durations or errors. No frontend behavior changed.

Run through the documented static server:

```sh
NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules node tests/browser.cjs
```

## iPad next step

After the GitHub Pages deployment for the upload succeeds, reload:

https://johnwps36-cyber.github.io/bluey-learning-hub/

Choose S101 or S102 and tap the native player Play button. To isolate a remaining deployment problem, open the recording directly:

- https://johnwps36-cyber.github.io/bluey-learning-hub/audio/s101.mp3
- https://johnwps36-cyber.github.io/bluey-learning-hub/audio/s102.mp3

A direct-file 404 indicates that the Pages deployment has not served the uploaded file yet. Successful direct playback but failure inside the app needs a separate iPad/browser investigation. S103–S105 recordings have not been uploaded in the inspected main tree.
