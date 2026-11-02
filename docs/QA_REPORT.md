# Bluey V5 — S101–S105 Data QA

**Scope:** Five Gemini-produced JSON uploads; latest supplied `s101(1).json` used as `episodes/s101.json`. No MP3 files were provided for independent acoustic verification. No changes made to the source content of the five JSONs.

## Structural verification

| Episode | Title | Scenes | Vocabulary | Phrases | Game | Review status | Schema |
|---|---|---:|---:|---:|---|---|---|
| s101 | The Magic Xylophone | 7 | 18 | 10 | freeze | draft | PASS |
| s102 | Hospital | 6 | 16 | 10 | hospital | draft | PASS |
| s103 | Keepy Uppy | 5 | 12 | 9 | balloon | draft | PASS |
| s104 | Daddy Robot | 5 | 12 | 9 | robot | draft | PASS |
| s105 | Shadowlands | 5 | 12 | 9 | shadow | draft | PASS |

**Totals:** 28 scenes, 70 vocabulary cards, 47 phrases. Verified JSON parses and conforms to included JSON schema using `jsonschema`. Episode ID and `audio/s1xx.mp3` paths match; scenes have consistent consecutive ranges; `heard` items include bounded time ranges; `practice` items use null times. No duplicate vocabulary words in an episode and no structural timestamp errors detected.

## Non-blocking observations

1. **S103, S104 and S105** each have 12 vocab cards, whereas the original Gemini content brief requested 15–25. Not a data format error; avoid adding invented audio vocabulary merely to reach a number.
2. **QA note timestamps need formatting fixes:** S101 says `00:67`, S102 says `01:92`, and S103 says `00:94`. Those are not valid `mm:ss` representations. `00:67` and `00:94` may mean absolute second counts 67 and 94 (01:07 and 01:34); `01:92` is ambiguous and **must not be converted without checking the intended timestamp**. The numeric `audioStartSec` / `audioEndSec` values themselves pass structural checks. **Do not assume QA note times match the audio without checking.**
3. The S102–S105 QA notes refer to source files such as `s102_2.mp3`, but the JSON references `audio/s102.mp3`, etc. Ensure the exact same audio edition and beginning offset are used when renaming/uploading; otherwise all timestamps can drift.
4. Gemini claims in its notes to have checked some audio. This report **does not independently confirm** dialogue text or timestamps against the audio; every episode correctly remains in `draft` state.
5. The durations are 439 s for S101 and 438 s for S102–S105 **as declared by Gemini**. Check actual GitHub MP3 file durations before enabling clip playback. A validator cannot infer true duration without inspecting audio.

## Developer handoff

- Keep JSON data as-is. Show `draft` content, but distinguish `heard` clip buttons from `practice` TTS and don't present content as verified.
- When audio segment playback isn't confirmed, always offer TTS as fallback. Confirm the loaded audio metadata duration before seeking to a timestamp.
- Do not trust `reviewStatus` for automatic truth claims; move an episode to `reviewed` only after independent verification.
- Run `python scripts/validate_episodes.py` in CI and locally before every new upload of an episode.
