#!/usr/bin/env python3
"""Bluey V5 episode static validation, using only the Python standard library.
Run from any directory: python scripts/validate_episodes.py
Optionally installs `jsonschema` for complete schema validation, but not needed to run.
This cannot verify any dialogue/timestamp against actual MP3 audio.
"""
from pathlib import Path
import json
import re
from collections import Counter

ROOT = Path(__file__).resolve().parent.parent
EPISODES = ROOT / "episodes"
ALLOWED_GAME_TYPES = {"freeze", "hospital", "balloon", "robot", "shadow", "generic"}
REQUIRED = {"id", "titleEn", "titleZh", "audio", "durationSec", "reviewStatus", "scenes", "vocab", "phrases", "game", "qaNotes"}

try:
    from jsonschema import Draft202012Validator
    validator = Draft202012Validator(json.loads((ROOT / "episode.schema.json").read_text(encoding="utf-8")))
except ImportError:
    validator = None

errors = []
warnings = []
total = {"scenes": 0, "vocab": 0, "phrases": 0}
for path in sorted(EPISODES.glob("*.json")):
    try:
        ep = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as exc:
        errors.append(f"{path.name}: invalid JSON: {exc}")
        continue
    code = path.stem
    if set(ep) != REQUIRED:
        errors.append(f"{code}: top-level fields missing={sorted(REQUIRED-set(ep))}, unexpected={sorted(set(ep)-REQUIRED)}")
        continue
    if validator:
        for err in validator.iter_errors(ep):
            errors.append(f"{code}: schema: {err.json_path}: {err.message}")
    if not re.fullmatch(r's1(?:0[1-9]|[1-4][0-9]|5[0-2])', code):
        errors.append(f"{code}: not valid S1xx episode number")
    if ep['id'] != code: errors.append(f"{code}: id mismatch {ep['id']}")
    if ep['audio'] != f"audio/{code}.mp3": errors.append(f"{code}: audio path mismatch {ep['audio']}")
    if ep['reviewStatus'] not in ("draft", "needs_audio_verification", "reviewed"):
        errors.append(f"{code}: invalid reviewStatus")
    if ep['reviewStatus'] == "reviewed":
        warnings.append(f"{code}: marked reviewed; ensure human or other independent audio verification completed")
    dur = ep['durationSec']
    if dur is not None and (not isinstance(dur, (int,float)) or dur <= 0):
        errors.append(f"{code}: invalid durationSec")
    prev = None
    for i,scene in enumerate(ep['scenes']):
        try:
            a,b = scene['startSec'],scene['endSec']
            if a < 0 or a >= b or (dur is not None and b > dur): errors.append(f"{code}: scenes[{i}] range invalid")
            if prev is not None and a != prev: errors.append(f"{code}: scenes[{i}] gap/overlap (prev end={prev}, start={a})")
            prev = b
        except (KeyError,TypeError): errors.append(f"{code}: scenes[{i}] missing timestamp")
    if ep['scenes'] and ep['scenes'][0]['startSec'] != 0: warnings.append(f"{code}: scenes do not start at 0")
    if dur is not None and ep['scenes'] and ep['scenes'][-1]['endSec'] != dur:
        warnings.append(f"{code}: scenes do not reach durationSec")
    for section,english_key in [('vocab','word'),('phrases','en')]:
        seen = Counter()
        for i,item in enumerate(ep[section]):
            seen[str(item.get(english_key, '')).casefold().strip()]+=1
            a,b=item.get('audioStartSec'),item.get('audioEndSec')
            source=item.get('source')
            if source not in ('heard','practice'):
                errors.append(f"{code}: {section}[{i}] invalid source")
            if source == 'practice' and (a is not None or b is not None):
                errors.append(f"{code}: {section}[{i}] practice has timestamps")
            if source == 'heard' and (a is None or b is None):
                errors.append(f"{code}: {section}[{i}] heard lacks timestamps")
            if a is not None:
                if not isinstance(a,(int,float)) or not isinstance(b,(int,float)) or a < 0 or a >= b or (dur is not None and b > dur):
                    errors.append(f"{code}: {section}[{i}] timestamp out of bounds or invalid")
        for value,count in seen.items():
            if value and count > 1: warnings.append(f"{code}: duplicate {section} text: {value}")
        total[section]+=len(ep[section])
    total['scenes']+=len(ep['scenes'])
    if len(ep['vocab']) < 15:
        warnings.append(f"{code}: {len(ep['vocab'])} vocab cards, below suggested 15-25; not a deployment blocker")
    if ep['game']['type'] not in ALLOWED_GAME_TYPES: errors.append(f"{code}: unsupported game type")
    def check_for_citations(obj, location=''):
        if isinstance(obj, dict):
            for key, value in obj.items():
                check_for_citations(value, f'{location}.{key}' if location else key)
        elif isinstance(obj, list):
            for j, value in enumerate(obj):
                check_for_citations(value, f'{location}[{j}]')
        elif isinstance(obj, str) and re.search(r'\[cite\s*:\s*\d+\]', obj, re.I):
            errors.append(f'{code}: residual AI citation marker in {location}')
    check_for_citations(ep)
    for note in ep['qaNotes']:
        for raw_m,raw_s in re.findall(r'(?<!\d)(\d{2}):(\d{2})(?!\d)', note):
            if int(raw_s) >= 60: warnings.append(f"{code}: nonstandard mm:ss '{raw_m}:{raw_s}' in qaNotes")
    print(f"{code.upper():5} {ep['titleEn']:22} scenes={len(ep['scenes'])} vocab={len(ep['vocab'])} phrases={len(ep['phrases'])} status={ep['reviewStatus']}")
print(f"TOTAL scenes={total['scenes']} vocab={total['vocab']} phrases={total['phrases']}")
print(f"{'Schema (jsonschema) enabled' if validator else 'Only standard-library checks (install jsonschema for full schema validation)'}")
print(f"ERRORS={len(errors)} WARNINGS={len(warnings)}")
for msg in errors: print('ERROR:',msg)
for msg in warnings: print('WARN:',msg)
raise SystemExit(1 if errors else 0)
