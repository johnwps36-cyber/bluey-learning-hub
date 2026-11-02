'use strict';
let audioCtx = null, isSlowMode = true, currentQuizTarget = null, clipStopTime = null;
  function ensureAudioContext() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { document.getElementById('voiceStatus').textContent = '這個瀏覽器未支援木琴音效；仍可使用播放器。'; return null; }
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => showToast('請再撳一次啟動聲音。'));
    const buf = audioCtx.createBuffer(1, 1, 22050), src = audioCtx.createBufferSource();
    src.buffer = buf; src.connect(audioCtx.destination); src.start(0);
    const b = document.getElementById('unlockBanner'); b.classList.add('unlocked');
    b.textContent = '✅ 已嘗試啟動聲音；請撳播放，並檢查裝置音量。';
    return audioCtx;
  }

  function unlockAllAudio() {
    ensureAudioContext();
    playXyloTone(523.25, 0);
    playXyloTone(659.25, 0.12);
    playXyloTone(783.99, 0.24);
    speakEnglish("Let's play Bluey!");
  }

  function playXyloTone(freq, delay = 0) {
    if (!ensureAudioContext()) return;
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

  // TTS is an explicit alternative to the supplied, independently unverified clip.
  function updateVoiceStatus() {
    const status = document.getElementById('voiceStatus');
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) { status.textContent = '這個瀏覽器未提供讀音功能；可使用原劇播放器。'; return; }
    const english = speechSynthesis.getVoices().some(v => /^en[-_]/i.test(v.lang));
    status.textContent = english ? '電腦讀音優先使用澳洲英語聲線。' : '裝置暫未列出英文聲線，會嘗試系統讀音；如無聲，請在裝置設定下載英文聲線。';
  }
  function speakEnglish(text) {
    clipRequest++;
    player.pause(); clipStopTime = null;
    const rate = isSlowMode ? 0.68 : 0.98;
    showToast(`${isSlowMode ? '🐢 慢速' : '🐰 原速'}: "${text}"`);
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) { updateVoiceStatus(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text), token = requestId;
    currentUtterance = u; u.lang = 'en-AU'; u.rate = rate; u.pitch = 1.05;
    const voices = speechSynthesis.getVoices();
    const voice = ['en-AU','en-GB','en-US'].map(lang => voices.find(v => v.lang === lang)).find(Boolean) || voices.find(v => /^en[-_]/i.test(v.lang));
    if (voice) u.voice = voice;
    u.onerror = event => { if (token === requestId && !['canceled','interrupted'].includes(event.error)) document.getElementById('voiceStatus').textContent = '電腦讀音未能播放；請檢查英文聲線、音量及 Safari 聲音設定。'; };
    u.onend = () => { if (currentUtterance === u) currentUtterance = null; };
    updateVoiceStatus(); speechSynthesis.speak(u);
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
    if (gameSession) gameSession.freeze(freezeNow);
  }

  function setSpeed(slow) {
    isSlowMode = slow;
    document.getElementById('btnSlow').classList.toggle('active', slow);
    document.getElementById('btnFast').classList.toggle('active', !slow);
    playXyloTone(slow ? 523.25 : 783.99, 0);
  }

  function playPhrase(idx) {
    if (phrases[idx]) playItem(phrases[idx], phrases[idx].en);
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
let gameSession = null, currentUtterance = null, clipRequest = 0;
const progress = BlueyProgress.create(() => window.localStorage);
function updateProgress() {
  const id = epSelect.value, record = progress.get(id);
  const validWords = new Set(vocabList.map(v => v.word));
  const seen = record.seenWords.filter(w => validWords.has(w)).length;
  const quiz = record.quizWords.filter(w => validWords.has(w)).length;
  const stars = Number(seen > 0) + Number(quiz > 0) + Number(record.gameWins > 0);
  document.getElementById('starsDisplay').textContent = '⭐'.repeat(stars) + '☆'.repeat(3-stars);
  document.getElementById('progressSummary').textContent = `${id.toUpperCase()} · 點讀過 ${seen}/${vocabList.length} 個生字 · 答啱過 ${quiz} 個生字 · 遊戲過關 ${record.gameWins} 次${progress.isPersistent() ? '（本機儲存）' : '（只限本次使用；瀏覽器未能儲存）'}`;
}
function recordProgress(kind, word) { if (!episode) return; progress.record(episode.id, kind, word); updateProgress(); }
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
  clipRequest++;
  player.pause(); clipStopTime = null;
  if (gameSession) { gameSession.destroy(); gameSession = null; }
  currentUtterance = null;
  document.getElementById('mediaNotice').textContent = '';
  if (window.speechSynthesis) window.speechSynthesis.cancel();
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
  document.getElementById('progressSummary').textContent = '';
  document.getElementById('starsDisplay').textContent = '☆☆☆';
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
    document.getElementById('episodeStatus').textContent = data.reviewStatus === 'reviewed' ? '資料標示已校對；本程式沒有獨立核實原音。' : '⚠️ 草稿：原音及時間戳未經獨立核實。「heard」是來源資料標記；可隨時改用電腦讀音。';
    for (const note of data.qaNotes) document.getElementById('episodeStatus').append(node('small', 'qa-note', note));
    document.getElementById('materials').hidden = false;
    renderScenes(); renderCategories(); renderVocab(); renderPhrases(); nextQuizQuestion(); renderGame(); updateProgress(); updateMediaMetadata();
  } catch (error) {
    if (token !== requestId || error.name === 'AbortError') return;
    document.getElementById('episodeStatus').textContent = `教材載入失敗：${error.message} 請重新選集再試；音檔可獨立播放。`;
  }
}
function updateMediaMetadata() {
  if (!episode || !player.readyState || !Number.isFinite(player.duration)) return;
  const declared = episode.durationSec;
  document.getElementById('mediaNotice').textContent = declared !== null && Math.abs(declared-player.duration)>1
    ? `音檔實際長度 ${Math.round(player.duration)} 秒，與教材標示 ${declared} 秒不同；請確認版本及時間偏移。越界片段不會播放，可改用電腦讀音。`
    : '已讀取音檔長度；這不代表對白及時間戳已核實。';
}
player.addEventListener('loadedmetadata', () => { player.playbackRate = selectedRate; updateMediaMetadata(); });
player.addEventListener('play', () => { if (window.speechSynthesis) speechSynthesis.cancel(); });
player.addEventListener('error', () => {
  if (player.error) { clipStopTime = null; document.getElementById('mp3StatusBadge').textContent = `${epSelect.value}.mp3 未能載入；請檢查 audio 資料夾及網絡。`; document.getElementById('mediaNotice').textContent = '原音未能載入；生字及句子可撳「電腦讀音」。'; }
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
  const attempt = ++clipRequest;
  player.pause(); clipStopTime = null;
  if (window.speechSynthesis) speechSynthesis.cancel();
  ensureAudioContext();
  if (!player.readyState || !Number.isFinite(player.duration) || !Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start || end > player.duration) {
    clipStopTime = null;
    document.getElementById('mediaNotice').textContent = '片段未能播放：音檔未就緒，或起迄時間超出實際長度。請校對音檔；生字及句子可改用電腦讀音。';
    return;
  }
  const token = requestId;
  if (window.speechSynthesis) speechSynthesis.cancel();
  player.pause();
  try {
    clipStopTime = end; player.currentTime = start;
    changePlayerSpeed(0.8, document.getElementById('defaultSpdBtn'));
    player.play().catch(() => {
      if (token === requestId && attempt === clipRequest) { clipStopTime = null; document.getElementById('mediaNotice').textContent = '原音播放未能開始。請撳播放器 ▶，或改用生字／句子的電腦讀音。'; }
    });
  } catch {
    clipStopTime = null; document.getElementById('mediaNotice').textContent = '未能跳到片段；可改用電腦讀音，並檢查音檔版本。';
  }
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
function sourceLabel(item) { return item.source === 'heard' ? '原聲標記 · 未獨立核實' : '練習 · 電腦讀音'; }
function playItem(item, text) {
  if (item.source === 'heard' && item.audioStartSec !== null) playClip(item.audioStartSec, item.audioEndSec);
  else { playXyloTone(783.99); speakEnglish(text); }
}
function renderVocab(category = 'all') {
  const items = category === 'all' ? vocabList : vocabList.filter(v => v.cat === category);
  document.getElementById('vocabCountBadge').textContent = `共 ${items.length} 個`;
  const grid = document.getElementById('vocabGrid'); grid.replaceChildren();
  for (const item of items) {
    const card = node('article', 'vocab-card');
    const main = button('card-main', '', () => { recordProgress('seenWords',item.word); playItem(item, `${item.word}. ${item.ex}`); });
    for (const [cls, text] of [['vocab-tag',item.tag],['vocab-emoji',item.emoji],['vocab-word',item.word],['vocab-zh',item.zh],['vocab-ex',item.ex],['source-label',sourceLabel(item)]]) main.append(node('span',cls,text));
    main.append(node('span','play-caption',item.source === 'heard' ? '▶ 原音片段' : '🔊 電腦讀音')); card.append(main);
    if(item.source === 'heard') card.append(button('tts-btn','🔊 改用電腦讀音',()=>{recordProgress('seenWords',item.word);speakEnglish(`${item.word}. ${item.ex}`);}));
    grid.append(card);
  }
  if (!items.length) grid.append(node('p', '', '本集未有生字。'));
}
function renderPhrases() {
  const grid = document.getElementById('phraseGrid'); grid.replaceChildren();
  for (const item of phrases) {
    const card = node('article','phrase-card');
    const b = button('card-main phrase-left', '', () => playItem(item, item.en));
    const text = node('span');
    text.append(node('strong','',item.en),node('span','qa-note',item.zh),node('small','source-label',sourceLabel(item)),node('span','play-caption',item.source === 'heard' ? '▶ 原音片段' : '🔊 電腦讀音'));
    b.append(node('span','phrase-icon',item.icon),text);card.append(b);
    if(item.source === 'heard')card.append(button('tts-btn','🔊 電腦讀音',()=>speakEnglish(item.en)));
    grid.append(card);
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
    quizAnswered = true; recordProgress('quizWords',word); b.classList.add('correct'); playXyloTone(523.25); playXyloTone(659.25,0.1); playXyloTone(1046.5,0.2);
    speakEnglish(`Hooray! ${word}!`); const token = requestId;
    quizTimer = setTimeout(() => { if (token === requestId) nextQuizQuestion(); },1500);
  } else { b.classList.add('wrong'); playXyloTone(280); speakEnglish('Try again!'); }
}
function renderGame() {
  const {type, instructionsZh, config} = episode.game;
  document.getElementById('gameInstructions').textContent = instructionsZh;
  document.getElementById('freezeGame').hidden = type !== 'freeze';
  const other = document.getElementById('otherGame'); other.hidden = type === 'freeze'; other.replaceChildren();
  const token = requestId;
  gameSession = BlueyGames.mount({type,config,host:other,freezeHost:document.getElementById('freezeGame'),onSpeak:speakEnglish,onTone:()=>playXyloTone(659.25),onComplete:()=>{if(token===requestId)recordProgress('game');}});
}
if (window.speechSynthesis) speechSynthesis.addEventListener('voiceschanged',updateVoiceStatus);
updateVoiceStatus();
selectEpisode('s101');
