'use strict';
let audioCtx = null, isSlowMode = true, currentQuizTarget = null, clipStopTime = null;
  function ensureAudioContext() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AC();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    // 播放一個極短無聲 Buffer 解鎖 iPad Safari 限制
    const buf = audioCtx.createBuffer(1, 1, 22050);
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.connect(audioCtx.destination);
    src.start(0);

    const b = document.getElementById('unlockBanner');
    b.classList.add('unlocked');
    b.textContent = "✅ 已嘗試啟動聲音；請撳播放，並檢查裝置音量。";
  }

  function unlockAllAudio() {
    ensureAudioContext();
    playXyloTone(523.25, 0);
    playXyloTone(659.25, 0.12);
    playXyloTone(783.99, 0.24);
    speakEnglish("Let's play Bluey!");
  }

  function playXyloTone(freq, delay = 0) {
    ensureAudioContext();
    const now = audioCtx.currentTime + delay;
    const osc1 = audioCtx.createOscillator(), osc2 = audioCtx.createOscillator(), gain = audioCtx.createGain();
    osc1.type = 'sine'; osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now); osc2.frequency.setValueAtTime(freq * 3, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.9, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc1.connect(gain); osc2.connect(gain); gain.connect(audioCtx.destination);
    activeVoices.push(osc1, osc2);
    osc1.onended = () => { activeVoices = activeVoices.filter(x => x !== osc1 && x !== osc2); };
    osc1.start(now); osc2.start(now); osc1.stop(now + 0.65); osc2.stop(now + 0.65);
  }

  // 優先使用 iPad / 手機原生系統語音 (零延遲、唔怕跨網域被擋)
  function speakEnglish(text) {
    ensureAudioContext();
    const rate = isSlowMode ? 0.68 : 0.98;
    showToast(`${isSlowMode ? '🐢 慢速' : '🐰 原速'}: "${text}"`);

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-AU';
      u.rate = rate;
      u.pitch = 1.05;
      const voices = window.speechSynthesis.getVoices();
      const enVoice = voices.find(v => v.lang.includes('en-AU') || v.lang.includes('en-GB') || v.lang.includes('en-US'));
      if (enVoice) u.voice = enVoice;
      window.speechSynthesis.speak(u);
    }
  }


  function hitXylo(freq, name) {
    playXyloTone(freq, 0);
    showToast(`🎵 叮！ (${name})`);
  }

  function triggerFreeze(freezeNow) {
    const dad = document.getElementById('dadAvatar'), status = document.getElementById('stageStatus');
    if (freezeNow) {
      playXyloTone(1046.50, 0);
      dad.classList.add('frozen'); dad.textContent = "🥶";
      status.textContent = "❄️ 爸爸定格咗！";
      speakEnglish("Freeze!");
    } else {
      playXyloTone(659.25, 0);
      dad.classList.remove('frozen'); dad.textContent = "🐕";
      status.textContent = "🕺 爸爸恢復跳舞！";
      speakEnglish("Unfreeze!");
    }
  }

  function setSpeed(slow) {
    isSlowMode = slow;
    document.getElementById('btnSlow').classList.toggle('active', slow);
    document.getElementById('btnFast').classList.toggle('active', !slow);
    playXyloTone(slow ? 523.25 : 783.99, 0);
  }

  function playPhrase(idx) {
    playXyloTone(880, 0);
    speakEnglish(phrases[idx].en);
  }

  function showToast(text) {
    const t = document.getElementById('toastMsg');
    t.textContent = text; t.classList.add('show');
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }


// Episode state is replaced atomically; late fetches and timers cannot restore old content.
const player = document.getElementById('mainPlayer');
const epSelect = document.getElementById('epSelect');
let episode = null, vocabList = [], phrases = [], requestId = 0, controller = null;
let quizTimer = null, quizAnswered = false, selectedRate = 0.8, activeVoices = [];
let schemaPromise = null;
function getSchema() {
  if (!schemaPromise) schemaPromise = fetch('./episode.schema.json').then(r => {
    if (!r.ok) throw new Error('資料格式載入失敗');
    return r.json();
  }).catch(error => { schemaPromise = null; throw error; });
  return schemaPromise;
}
function node(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}
function button(className, text, action) {
  const el = node('button', className, text); el.type = 'button';
  el.addEventListener('click', action); return el;
}
for (let i = 1; i <= 52; i++) {
  const id = `s1${String(i).padStart(2, '0')}`;
  const option = node('option', '', `🎧 第 ${i} 集 (${id.toUpperCase()})`);
  option.value = id; epSelect.append(option);
}
epSelect.setAttribute('aria-label', '選擇集數');
function resetEpisodeState() {
  player.pause(); clipStopTime = null;
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  for (const osc of activeVoices) { try { osc.stop(); } catch {} }
  activeVoices = [];
  clearTimeout(quizTimer); clearTimeout(window._toastTimer);
  document.getElementById('toastMsg').classList.remove('show');
  currentQuizTarget = null; quizAnswered = false; episode = null; vocabList = []; phrases = [];
  for (const id of ['sceneGrid', 'vocabGrid', 'catTabs', 'quizOptions', 'phraseGrid', 'otherGame']) document.getElementById(id).replaceChildren();
  document.getElementById('quizTargetWord').textContent = '';
  document.getElementById('vocabCountBadge').textContent = '共 0 個';
  document.getElementById('materials').hidden = true;
  document.getElementById('dadAvatar').classList.remove('frozen');
  document.getElementById('dadAvatar').textContent = '🐕';
  document.getElementById('stageStatus').textContent = '🕺 爸爸跳舞中';
}
async function selectEpisode(id) {
  if (!/^s1(0[1-9]|[1-4][0-9]|5[0-2])$/.test(id)) return;
  const token = ++requestId;
  if (controller) controller.abort();
  controller = new AbortController();
  resetEpisodeState(); epSelect.value = id;
  document.querySelector('.header-title').textContent = `🐾 Bluey V5 · ${id.toUpperCase()}`;
  document.getElementById('episodeStatus').textContent = '載入教材中…';
  document.getElementById('mp3StatusBadge').textContent = `${id}.mp3 · 請撳 ▶ 播放`;
  player.src = `./audio/${id}.mp3`; player.load(); player.playbackRate = selectedRate;
  try {
    const response = await fetch(`./episodes/${id}.json`, { signal: controller.signal });
    if (token !== requestId) return;
    if (response.status === 404) { document.getElementById('episodeStatus').textContent = '教材準備中；仍可撳播放器播放本集音檔。'; return; }
    if (!response.ok) throw new Error(`教材下載失敗 (${response.status})`);
    const data = await response.json();
    const schema = await getSchema();
    if (token !== requestId) return;
    const errors = validateEpisode(data, schema, id);
    if (errors.length) throw new Error('教材格式不正確，請先校對 JSON。');
    episode = data; vocabList = data.vocab; phrases = data.phrases;
    document.querySelector('.header-title').textContent = `🐾 ${id.toUpperCase()} · ${data.titleZh || data.titleEn}`;
    document.getElementById('episodeStatus').textContent = data.reviewStatus === 'reviewed' ? '教材已校對。' : '⚠️ 教材及時間軸待音訊校對；「練習」內容並非已核實原聲。';
    for (const note of data.qaNotes) document.getElementById('episodeStatus').append(node('small', 'qa-note', note));
    document.getElementById('materials').hidden = false;
    renderScenes(); renderCategories(); renderVocab(); renderPhrases(); nextQuizQuestion(); renderGame();
  } catch (error) {
    if (token !== requestId || error.name === 'AbortError') return;
    document.getElementById('episodeStatus').textContent = `教材載入失敗：${error.message} 請重新選集再試；音檔可獨立播放。`;
  }
}
player.addEventListener('loadedmetadata', () => { player.playbackRate = selectedRate; });
player.addEventListener('error', () => {
  if (player.error) document.getElementById('mp3StatusBadge').textContent = `${epSelect.value}.mp3 未能載入；請檢查 audio 資料夾及網絡。`;
});
player.addEventListener('timeupdate', () => {
  if (clipStopTime !== null && player.currentTime >= clipStopTime) {
    player.pause(); clipStopTime = null; showToast('⏹️ 片段播放完畢！可以跟住讀一次！');
  }
});
function changePlayerSpeed(rate, btnEl) {
  selectedRate = rate; player.playbackRate = rate;
  document.querySelectorAll('.spd-btn').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  showToast(`📻 故事語速設為 ${rate}x`);
}
function rewindPlayer(sec) {
  if (!player.readyState) return;
  player.currentTime = Math.max(0, player.currentTime - sec);
  showToast(`⏪ 退後 ${sec} 秒`);
}
function playClip(start, end) {
  ensureAudioContext();
  if (!player.readyState || (Number.isFinite(player.duration) && start >= player.duration)) {
    showToast('音檔未就緒或分段時間超出音檔；請先載入音檔並校對時間。'); return;
  }
  const token = requestId;
  clipStopTime = Number.isFinite(player.duration) ? Math.min(end, player.duration) : end;
  player.currentTime = start;
  changePlayerSpeed(0.8, document.getElementById('defaultSpdBtn'));
  player.play().catch(() => {
    if (token === requestId) { clipStopTime = null; showToast('請撳播放器 ▶ 開始播放；如未能載入，請檢查本集音檔。'); }
  });
}
function renderScenes() {
  document.getElementById('sceneHeading').textContent = episode.reviewStatus === 'reviewed' ? '🎬 原音分段' : '🎬 原音分段（時間待校對）';
  const grid = document.getElementById('sceneGrid');
  for (const scene of episode.scenes) {
    const b = button('scene-btn', `${scene.icon} ${scene.labelZh} (${scene.startSec}–${scene.endSec}秒)`, () => playClip(scene.startSec, scene.endSec));
    b.title = scene.summaryZh; grid.append(b);
  }
  if (!episode.scenes.length) grid.append(node('p', '', '本集未有已整理分段。'));
}
function renderCategories() {
  const tabs = document.getElementById('catTabs');
  const labels = {toys:'🧸 玩具', actions:'🏃 動作', body:'👃 身體', turns:'🤝 日常'};
  for (const category of ['all', ...new Set(vocabList.map(v => v.cat))]) {
    const count = category === 'all' ? vocabList.length : vocabList.filter(v => v.cat === category).length;
    const b = button(`cat-tab${category === 'all' ? ' active' : ''}`, `${category === 'all' ? '🌟 全部' : labels[category] || category} (${count})`, () => filterVocab(category, b)); tabs.append(b);
  }
}
function filterVocab(category, b) {
  document.querySelectorAll('.cat-tab').forEach(x => x.classList.remove('active')); b.classList.add('active');
  playXyloTone(659.25); renderVocab(category);
}
function sourceLabel(item) { return item.source === 'heard' ? '原聲核實' : '練習'; }
function playItem(item, text) {
  if (item.source === 'heard' && item.audioStartSec !== null) playClip(item.audioStartSec, item.audioEndSec);
  else { playXyloTone(783.99); speakEnglish(text); }
}
function renderVocab(category = 'all') {
  const items = category === 'all' ? vocabList : vocabList.filter(v => v.cat === category);
  document.getElementById('vocabCountBadge').textContent = `共 ${items.length} 個`;
  const grid = document.getElementById('vocabGrid'); grid.replaceChildren();
  for (const item of items) {
    const b = button('vocab-card', '', () => playItem(item, `${item.word}. ${item.ex}`));
    for (const [cls, text] of [['vocab-tag',item.tag],['vocab-emoji',item.emoji],['vocab-word',item.word],['vocab-zh',item.zh],['vocab-ex',item.ex],['source-label',sourceLabel(item)]]) b.append(node('span',cls,text));
    grid.append(b);
  }
  if (!items.length) grid.append(node('p', '', '本集未有生字。'));
}
function renderPhrases() {
  const grid = document.getElementById('phraseGrid'); grid.replaceChildren();
  for (const item of phrases) {
    const b = button('phrase-card', '', () => playItem(item, item.en));
    const left = node('span','phrase-left'); const text = node('span');
    text.append(node('strong','',item.en),node('span','qa-note',item.zh),node('small','source-label',sourceLabel(item)));
    left.append(node('span','',item.icon),text); b.append(left,node('span','play-badge','🔊')); grid.append(b);
  }
  if (!phrases.length) grid.append(node('p','','本集未有句子。'));
}
function nextQuizQuestion() {
  clearTimeout(quizTimer); quizAnswered = false;
  const grid = document.getElementById('quizOptions'); grid.replaceChildren();
  const options = [...vocabList];
  for (let i = options.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [options[i], options[j]] = [options[j], options[i]]; }
  options.splice(4); currentQuizTarget = options[Math.floor(Math.random() * options.length)] || null;
  document.getElementById('quizTargetWord').textContent = currentQuizTarget ? `${currentQuizTarget.word} (${currentQuizTarget.zh})` : '本集未有題目';
  for (const opt of options) {
    const b = button('quiz-opt', `${opt.emoji} ${opt.word}`, () => checkQuizAnswer(b,opt.word)); grid.append(b);
  }
}
function speakQuizWord() { if (currentQuizTarget) { playXyloTone(587.33); speakEnglish(`Where is ${currentQuizTarget.word}?`); } }
function checkQuizAnswer(b, word) {
  if (!currentQuizTarget || quizAnswered) return;
  if (word === currentQuizTarget.word) {
    quizAnswered = true; b.classList.add('correct'); playXyloTone(523.25); playXyloTone(659.25,0.1); playXyloTone(1046.5,0.2);
    speakEnglish(`Hooray! ${word}!`); const token = requestId;
    quizTimer = setTimeout(() => { if (token === requestId) nextQuizQuestion(); },1500);
  } else { b.classList.add('wrong'); playXyloTone(280); speakEnglish('Try again!'); }
}
function renderGame() {
  const {type, instructionsZh, config} = episode.game;
  document.getElementById('gameInstructions').textContent = instructionsZh;
  document.getElementById('freezeGame').hidden = type !== 'freeze';
  const other = document.getElementById('otherGame'); other.hidden = type === 'freeze'; other.replaceChildren();
  if (type === 'freeze') return;
  const status = node('p','stage-box',type === 'hospital' ? '🐕 病人等緊你幫手！' : '🎯 撳動作，一齊練英文！'); other.append(status);
  const templates = {
    hospital:[['🩺 檢查','Check up','🩺 檢查好喇！'],['🩹 貼膠布','A plaster, please.','🩹 貼好膠布喇！'],['💚 休息','Time to rest.','💚 休息一下，好返啲喇！']],
    balloon:[['🎈 拍氣球','Keep it up!','🎈 再拍一次！']], robot:[['🤖 行一步','Walk!','🤖 行前一步！']], shadow:[['🌳 搵樹蔭','Find the shade!','🌳 搵到樹蔭喇！']], generic:[['⭐ 一齊玩','Let’s play!','⭐ 做得好！']]
  };
  const allowed = templates[type];
  // Config controls repetition only; content never becomes executable HTML or code.
  const repeats = Number.isInteger(config.repeats) ? Math.max(1,Math.min(3,config.repeats)) : 1;
  for (const [label, speech, result] of allowed) other.append(button('big-btn btn-unfreeze', label, () => { status.textContent = result; playXyloTone(659.25); speakEnglish(Array(repeats).fill(speech).join(' ')); }));
}
selectEpisode('s101');
