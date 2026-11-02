# Bluey V5 — Second-round Gemini JSON QA (S101–S105)

## Result: STRUCTURAL PASS — AUDIO NOT INDEPENDENTLY VERIFIED

These are the revised five episode JSONs supplied in the latest upload. They are **not** the older versions included in the first handoff pack. Structural checks were run on the files and the project schema; no MP3 audio was available for independent waveform/dialogue verification. All five `reviewStatus` values remain `draft`.

| Episode | Scenes | Vocab | Phrases | AI cite markers removed | Newly added vocab since first pack |
|---|---:|---:|---:|---:|---|
| s101 | 7 | 18 | 10 | 21 | 0 |
| s102 | 6 | 16 | 10 | 18 | 0 |
| s103 | 5 | 18 | 9 | 17 | 6 |
| s104 | 5 | 18 | 9 | 17 | 6 |
| s105 | 5 | 18 | 9 | 17 | 6 |
| **TOTAL** | **28** | **88** | **47** | **90** | **18** |

## Cleanup applied

- Removed AI-style citation markers such as `[cite: 3]` from story summaries, Chinese phrase translations, game instructions and QA notes. **In addition, three QA notes had their references to earlier malformed `mm:ss` typos rewritten in ordinary language (no change to any numeric timestamp).**
- Kept the Gemini-revised `audioStartSec`/`audioEndSec` values, all scenes, vocab, phrases, game configurations and `draft` statuses intact.
- Kept JSON paths `audio/s101.mp3`–`audio/s105.mp3` for GitHub Pages.
- The user confirmed the target MP3s are the same files previously supplied to Gemini, renamed. We did not compare file hashes or media durations in this handoff.
- The validator now fails on any future embedded AI `[cite: N]` artifacts.

## Newly added vocabulary

- **s101**: No new terms (previous 18 terms retained).
- **s102**: No new terms (previous 18 terms retained).
- **s103**: pet bird, strategy, orange juice, catch, yard, tap
- **s104**: master, order, sprayer, banjo, fix, secret
- **s105**: dinner time, jump, river, island, hungry, hurry up

## Remaining acceptance items (must be checked in live app)

1. **Actual MP3 metadata:** compare declared 438/439 seconds to uploaded GitHub MP3s; ensure each sought clip is inside actual duration.
2. **Audio-content quality:** sample/check `source: heard` lines against the real clip; the text and times reflect Gemini output, not independent audit.
3. **Runtime iPad Safari:** no autoplay, audio selection through a real tap, TTS fallback, and correct segment stop on `timeupdate`/seek.
4. **Dynamic categories:** do not leave V4's S101-only filter category buttons fixed across episodes.
5. **Unfinished episodes:** S106–S152 may stream MP3s when present, but must not display stale S101–S105 teaching content.
6. **Security and correctness:** use relative audio URLs; dynamic text must be inserted using safe DOM APIs (`textContent`) rather than concatenated `innerHTML` with inline `onclick`.
7. **Source distinction:** heard clips refer to MP3, practice uses TTS, `reviewStatus` remains `draft` until validation.

## Verification command

```bash
python scripts/validate_episodes.py
```

This checks format, JSON schema when `jsonschema` is installed, time ranges, game types and stray citation markers. It cannot assess speech accuracy without audio input.
