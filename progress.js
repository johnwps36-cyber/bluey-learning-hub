/* Versioned, bounded, local-only progress. Storage failure keeps this session usable. */
(function(root) {
  'use strict';
  const KEY = 'bluey-learning-progress-v1';
  function create(getStorage) {
    let storage = null, available = true, records = Object.create(null);
    const list = value => Array.isArray(value) ? [...new Set(value.filter(x => typeof x === 'string' && x.length <= 1000))].slice(0,200) : [];
    try {
      storage = getStorage();
      const saved = JSON.parse(storage.getItem(KEY) || 'null');
      if (saved && saved.version === 1 && saved.episodes && typeof saved.episodes === 'object') {
        for (const [id, record] of Object.entries(saved.episodes)) {
          if (!/^s1(0[1-9]|[1-4][0-9]|5[0-2])$/.test(id) || !record || typeof record !== 'object') continue;
          records[id] = {seenWords:list(record.seenWords), quizWords:list(record.quizWords), gameWins:Number.isInteger(record.gameWins) ? Math.max(0, Math.min(999,record.gameWins)) : 0};
        }
      }
    } catch { available = false; }
    function get(id) {
      const value = records[id] || {seenWords:[],quizWords:[],gameWins:0};
      return {...value, seenWords:[...value.seenWords], quizWords:[...value.quizWords]};
    }
    function record(id, kind, word) {
      if (!/^s1(0[1-9]|[1-4][0-9]|5[0-2])$/.test(id)) return;
      const value = get(id);
      if (kind === 'game') value.gameWins = Math.min(999,value.gameWins + 1);
      else if (['seenWords','quizWords'].includes(kind) && typeof word === 'string' && word.length <= 1000) value[kind] = list([...value[kind], word]);
      else return;
      records[id] = value;
      try {
        if (!storage) throw new Error('unavailable');
        storage.setItem(KEY, JSON.stringify({version:1,episodes:records}));
        available = true;
      } catch { available = false; }
    }
    return {get,record,isPersistent:()=>available};
  }
  if (typeof module !== 'undefined') module.exports = {create,KEY};
  else root.BlueyProgress = {create,KEY};
})(globalThis);
