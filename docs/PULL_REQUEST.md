## Change

Import the authorized second-round QA2 handoff on top of merged PR #1. All five episode JSON files are copied byte-for-byte from bluey_v5_codex_ready_QA2.zip, including revised timestamps and QA notes; every reviewStatus remains draft.

S103–S105 each increase from 12 to 18 vocabulary cards. Totals are now 28 scenes, 88 vocabulary cards and 47 phrases. Source hashes, the supplied citation-aware Python validator, QA report and changelog are updated to this release. Schema and frontend behavior are unchanged.

## Validation

- Supplied Python checker with full JSON Schema validation: 0 errors, 0 warnings.
- 23 Node tests passed: original integrity/semantic/progress checks plus QA2 totals, no citation artifacts and a negative test proving the zero-dependency Python checker rejects nested citation markers.
- 20 Chromium/Playwright scenarios passed against the revised data, covering all five games, switching, missing content/audio, TTS, storage failures and layout. Refreshed screenshots are in docs/screenshots/.
- CI includes the new QA2 tests. Remote CI results are not yet verified.

Existing limitations remain: no real MP3s were supplied, actual audio/timestamps and physical iPad Safari are not verified. Browser media tests use synthetic silent WAV responses. No Pages settings or deployment changes are included.

See README.md for deployment and docs/TEST_RESULTS.md for evidence and the physical iPad checklist.
