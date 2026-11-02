/* Dependency-free validator for the keywords used by episode.schema.json.
   Unknown schema keywords must be implemented before extending the contract. */
(function (root) {
  'use strict';
  function validateEpisode(data, schema, expectedId) {
    const errors = [];
    function check(value, rule, path) {
      const type = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
      const types = Array.isArray(rule.type) ? rule.type : [rule.type];
      if (rule.type && !types.includes(type)) { errors.push(`${path}: expected ${types.join('/')}`); return; }
      if (rule.enum && !rule.enum.includes(value)) errors.push(`${path}: invalid enum`);
      if (type === 'number' && (!Number.isFinite(value) || (rule.minimum !== undefined && value < rule.minimum) || (rule.exclusiveMinimum !== undefined && value <= rule.exclusiveMinimum))) errors.push(`${path}: out of range`);
      if (type === 'string' && rule.pattern && !new RegExp(rule.pattern).test(value)) errors.push(`${path}: invalid pattern`);
      if (type === 'object') {
        for (const key of rule.required || []) if (!Object.hasOwn(value, key)) errors.push(`${path}.${key}: required`);
        for (const key of Object.keys(value)) {
          if (rule.properties && Object.hasOwn(rule.properties, key)) check(value[key], rule.properties[key], `${path}.${key}`);
          else if (rule.additionalProperties === false) errors.push(`${path}.${key}: unexpected field`);
        }
      }
      if (type === 'array' && rule.items) value.forEach((item, i) => check(item, rule.items, `${path}[${i}]`));
    }
    check(data, schema, 'episode');
    if (errors.length) return errors;
    if (expectedId && data.id !== expectedId) errors.push('id does not match selected episode / filename');
    if (data.audio !== `audio/${data.id}.mp3`) errors.push('audio does not match id');
    let previousEnd = 0;
    for (const scene of data.scenes) {
      if (!Number.isInteger(scene.startSec) || !Number.isInteger(scene.endSec) || scene.startSec >= scene.endSec || scene.startSec < previousEnd) errors.push('scenes must be integer seconds, sorted, non-overlapping, start < end');
      if (data.durationSec !== null && scene.endSec > data.durationSec) errors.push('scene exceeds durationSec');
      previousEnd = scene.endSec;
    }
    for (const [key, textKey] of [['vocab', 'word'], ['phrases', 'en']]) {
      const seen = new Set();
      for (const item of data[key]) {
        const text = item[textKey].trim().toLowerCase();
        if (!text || seen.has(text)) errors.push(`${key}: empty or duplicate card`);
        seen.add(text);
        const a = item.audioStartSec, b = item.audioEndSec;
        if ((a === null) !== (b === null) || (a !== null && a >= b)) errors.push(`${key}: invalid timestamp pair`);
        if (item.source === 'practice' && (a !== null || b !== null)) errors.push(`${key}: practice must have null timestamps`);
        if (data.durationSec !== null && b !== null && b > data.durationSec) errors.push(`${key}: timestamp exceeds durationSec`);
      }
    }
    return errors;
  }
  if (typeof module !== 'undefined') module.exports = validateEpisode;
  else root.validateEpisode = validateEpisode;
})(globalThis);
