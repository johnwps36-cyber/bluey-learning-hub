const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.BASE_URL || 'http://127.0.0.1:8001/bluey-learning-hub/';
const data = Object.fromEntries(['s101','s102','s103','s104','s105'].map(id=>[id,require(`../episodes/${id}.json`)]));
const wav = Buffer.alloc(44 + 8000*2*30); // Synthetic silence, not an episode recording.
wav.write('RIFF'); wav.writeUInt32LE(wav.length-8,4); wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(8000,24);wav.writeUInt32LE(16000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(wav.length-44,40);
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : chromium.executablePath()),headless:true,args:['--no-sandbox']});
 let count=0;
 async function check(name,fn) {
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try {await fn(page);assert.deepEqual(errors,[]);console.log(`PASS ${++count}: ${name}`);}finally{await context.close()}
 }
 async function ready(p,id) {
  await p.waitForFunction(({id,count})=>document.querySelectorAll('.vocab-card').length===count&&document.querySelector('.header-title').textContent.includes(id.toUpperCase()),{id,count:data[id].vocab.length});
 }
 async function loaded(p){await p.goto(base);await ready(p,'s101');}
 async function select(p,id){await p.selectOption('#epSelect',id);await ready(p,id);}
 async function winCount(p,id){return p.evaluate(id=>progress.get(id).gameWins,id);}
 async function gameButton(p,label){await p.locator('#otherGame').getByRole('button',{name:label,exact:true}).click();}
 async function audio(p) {
  await p.route('**/audio/*.mp3',r=>{
   const range=r.request().headers().range;
   if(range){const match=/bytes=(\d+)-(\d*)/.exec(range);const start=+match[1],end=match[2]?Math.min(+match[2],wav.length-1):wav.length-1;
    return r.fulfill({status:206,contentType:'audio/wav',headers:{'Accept-Ranges':'bytes','Content-Range':`bytes ${start}-${end}/${wav.length}`},body:wav.subarray(start,end+1)});}
   return r.fulfill({contentType:'audio/wav',headers:{'Accept-Ranges':'bytes'},body:wav});
  });
 }
 async function stubSpeech(p){await p.addInitScript(()=>{window.__spoken=[];if(window.speechSynthesis)speechSynthesis.speak=u=>window.__spoken.push(u.text);});}
 try {
 await check('five supplied episodes render correct scenes, cards, phrases and four-option quizzes',async p=>{
  await loaded(p);assert.equal(await p.locator('#epSelect option').count(),52);
  for(const [id,ep] of Object.entries(data)){
   await select(p,id);assert.equal(await p.locator('.scene-btn').count(),ep.scenes.length);assert.equal(await p.locator('.phrase-card').count(),ep.phrases.length);assert.equal(await p.locator('.quiz-opt').count(),4);
   assert.equal(await p.locator('.cat-tab').count(),1+new Set(ep.vocab.map(v=>v.cat)).size);
   assert.match(await p.locator('#episodeStatus').textContent(),/未經獨立核實/);
   assert.equal(await p.locator('#freezeGame').isVisible(),id==='s101');
  }
 });
 await check('V4 sound controls, categories, xylophone and three-turn freeze loop',async p=>{
  await stubSpeech(p);await loaded(p);await p.locator('#unlockBanner').click();
  await p.locator('.cat-tab').nth(1).click();assert.equal(await p.locator('.vocab-card').count(),data.s101.vocab.filter(v=>v.cat===data.s101.vocab[0].cat).length);
  await p.locator('#btnFast').click();assert.equal(await p.evaluate(()=>isSlowMode),false);await p.locator('#btnSlow').click();assert.equal(await p.evaluate(()=>isSlowMode),true);
  await p.locator('.xylo-key').first().click();
  for(let i=0;i<3;i++){await p.locator('.btn-freeze').click();assert(await p.locator('#dadAvatar').evaluate(e=>e.classList.contains('frozen')));await p.locator('#freezeGame .btn-unfreeze').click();}
  assert.equal(await winCount(p,'s101'),1);assert.match(await p.locator('#freezeGame .game-status').textContent(),/輪到下一位/);
  await p.locator('#freezeGame .btn-unfreeze').click();assert.equal(await winCount(p,'s101'),1);
  await p.locator('#freezeGame').getByRole('button',{name:'🔄 再玩／換人'}).click();assert.match(await p.locator('#freezeGame .game-status').textContent(),/0\/3/);
 });
 await check('hospital tools, patient/config items, completion and replay',async p=>{
  await stubSpeech(p);await loaded(p);await select(p,'s102');assert.match(await p.locator('.patient').textContent(),/Telemachus/);
  assert(await p.locator('#otherGame').getByRole('button',{name:'🧀 用芝士引出動物',exact:true}).isDisabled());
  await gameButton(p,'🩻 照 X 光');assert.equal(await p.locator('.belly-items').textContent(),'🐙 🐈 🐭');
  await gameButton(p,'💉 玩具針');for(let i=0;i<3;i++)await gameButton(p,'🧀 用芝士引出動物');
  assert.match(await p.locator('#otherGame .game-status').textContent(),/爸爸好返/);assert.equal(await winCount(p,'s102'),1);
  await gameButton(p,'🔄 再玩一次');assert.match(await p.locator('.belly-items').textContent(),/❓/);assert.equal(await winCount(p,'s102'),1);
 });
 await check('balloon falls, restarts, supports wind, wins at five taps and cleans up on switching',async p=>{
  await loaded(p);await select(p,'s103');await gameButton(p,'▶ 開始');await gameButton(p,'🌬️ 風扇：關');
  await p.waitForFunction(()=>document.querySelector('#otherGame .game-status').textContent.includes('掂地喇'));
  assert.equal(await winCount(p,'s103'),0);await gameButton(p,'🔄 再玩一次');await gameButton(p,'▶ 開始');
  for(let i=0;i<5;i++)await p.getByRole('button',{name:'拍氣球',exact:true}).click({force:true});
  assert.equal(await winCount(p,'s103'),1);await gameButton(p,'🔄 再玩一次');await gameButton(p,'▶ 開始');
  await select(p,'s102');const status=await p.locator('#otherGame .game-status').textContent();await p.waitForTimeout(2300);assert.equal(await p.locator('#otherGame .game-status').textContent(),status);assert.equal(await winCount(p,'s102'),0);
 });
 await check('robot wrong command, malfunction nose switch, completion and replay',async p=>{
  await stubSpeech(p);await loaded(p);await select(p,'s104');await gameButton(p,'🛋️ 休息');assert.match(await p.locator('#otherGame .game-status').textContent(),/再試下/);
  await gameButton(p,'🎒 孭起');await gameButton(p,'🕺 跳舞');assert.match(await p.locator('#otherGame .game-status').textContent(),/失控/);
  await gameButton(p,'🧹 執拾');assert.equal(await winCount(p,'s104'),0);await gameButton(p,'🔴 鼻哥熄機掣');await gameButton(p,'🧹 執拾');await gameButton(p,'🛋️ 休息');assert.equal(await winCount(p,'s104'),1);
  await gameButton(p,'🔄 再玩一次');assert.match(await p.locator('#otherGame .game-status').textContent(),/第 1\/4/);
 });
 await check('shadow sunlight loss, closed/expired bridges, successful route and timer cleanup',async p=>{
  await loaded(p);await select(p,'s105');await gameButton(p,'☀️ 陽光（鱷魚海）');assert.match(await p.locator('#otherGame .game-status').textContent(),/踩到陽光/);assert.equal(await winCount(p,'s105'),0);
  await gameButton(p,'🔄 再玩一次');await p.locator('.shadow-cell').nth(1).click();await p.locator('.shadow-cell').nth(2).click();assert.match(await p.locator('#otherGame .game-status').textContent(),/先等巴士/);
  await gameButton(p,'🚌 等巴士影子');await p.waitForTimeout(4100);assert.match(await p.locator('#otherGame .game-status').textContent(),/再等下一次/);
  await gameButton(p,'☁️ 等雲遮太陽');for(let i=2;i<=4;i++)await p.locator('.shadow-cell').nth(i).click();assert.equal(await winCount(p,'s105'),1);
  await gameButton(p,'🔄 再玩一次');await gameButton(p,'☁️ 等雲遮太陽');await select(p,'s104');const status=await p.locator('#otherGame .game-status').textContent();await p.waitForTimeout(4100);assert.equal(await p.locator('#otherGame .game-status').textContent(),status);
 });
 await check('quiz reset cancels old timer and per-episode progress survives switching and reload',async p=>{
  await stubSpeech(p);await loaded(p);await p.locator('.vocab-card .tts-btn').first().click();
  const answer=await p.evaluate(()=>currentQuizTarget.word);
  await p.evaluate(()=>[...document.querySelectorAll('.quiz-opt')].find(b=>b.textContent.includes(currentQuizTarget.word)).click());
  assert.equal(await p.locator('.quiz-opt.correct').count(),1);assert.deepEqual(await p.evaluate(()=>progress.get('s101').quizWords),[answer]);
  await select(p,'s102');const target=await p.locator('#quizTargetWord').textContent();await p.waitForTimeout(1600);assert.equal(await p.locator('#quizTargetWord').textContent(),target);assert.equal(await p.evaluate(()=>progress.get('s102').seenWords.length),0);
  await p.reload();await ready(p,'s101');assert.equal(await p.evaluate(()=>progress.get('s101').seenWords.length),1);assert.match(await p.locator('#progressSummary').textContent(),/點讀過 1\/18/);
 });
 await check('all 47 missing lessons and mock S102 JSON 404 clear old material, retain audio selection',async p=>{
  await loaded(p);for(let n=6;n<=52;n++){const id=`s1${String(n).padStart(2,'0')}`;await p.selectOption('#epSelect',id);await p.waitForFunction(()=>document.querySelector('#episodeStatus').textContent.includes('教材準備中'));assert.equal(await p.locator('.vocab-card').count(),0);assert.equal(await p.locator('#materials').isVisible(),false);assert.match(await p.locator('audio').getAttribute('src'),new RegExp(id));}
  await p.route('**/episodes/s102.json',r=>r.fulfill({status:404}));await p.selectOption('#epSelect','s102');await p.waitForFunction(()=>document.querySelector('#episodeStatus').textContent.includes('教材準備中'));assert.match(await p.locator('audio').getAttribute('src'),/s102/);
 });
 await check('late fetch cannot overwrite newer episode',async p=>{
  await loaded(p);await p.route('**/episodes/s102.json',async r=>{await new Promise(resolve=>setTimeout(resolve,350));await r.fulfill({json:data.s102}).catch(()=>{})});await p.selectOption('#epSelect','s102');await select(p,'s103');await p.waitForTimeout(600);assert.match(await p.locator('.header-title').textContent(),/S103/);assert.equal(await p.locator('.vocab-card').count(),data.s103.vocab.length);
 });
 await check('malformed JSON, schema errors, HTTP 503 and offline fetch have visible errors',async p=>{
  await loaded(p);for(const body of ['{','{}']){await p.route('**/episodes/s102.json',r=>r.fulfill({contentType:'application/json',body}));await p.selectOption('#epSelect','s102');await p.waitForFunction(()=>document.querySelector('#episodeStatus').textContent.includes('載入失敗'));assert.equal(await p.locator('.vocab-card').count(),0);await select(p,'s101');}
  await p.route('**/episodes/s102.json',r=>r.fulfill({status:503}));await p.selectOption('#epSelect','s102');await p.waitForFunction(()=>document.querySelector('#episodeStatus').textContent.includes('503'));await select(p,'s101');
  await p.route('**/episodes/s102.json',r=>r.abort());await p.selectOption('#epSelect','s102');await p.waitForFunction(()=>document.querySelector('#episodeStatus').textContent.includes('載入失敗'));
 });
 await check('schema download failure recovers on reselect',async p=>{
  await p.route('**/episode.schema.json',r=>r.fulfill({status:503}));await p.goto(base);await p.waitForFunction(()=>document.querySelector('#episodeStatus').textContent.includes('載入失敗'));assert.equal(await p.locator('.vocab-card').count(),0);await p.unroute('**/episode.schema.json');await select(p,'s102');
 });
 await check('HTML, quotes, long content and empty lesson arrays are safe',async p=>{
  const evil=structuredClone(data.s102);evil.vocab[0].word=`<img src=x onerror="window.pwned=true">'`+'Long'.repeat(80);evil.vocab[0].ex='" onclick="alert(1)';evil.phrases[0].en='<script>window.pwned=true</script>';evil.game.config.patientName='<img onerror=alert(1)>';
  await p.route('**/episodes/s102.json',r=>r.fulfill({json:evil}));await loaded(p);await select(p,'s102');assert.equal(await p.locator('#vocabGrid img, #phraseGrid script, #otherGame img').count(),0);await p.locator('.vocab-card .card-main').first().click();assert.equal(await p.evaluate(()=>window.pwned),undefined);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await p.route('**/episodes/s102.json',r=>r.fulfill({json:{...data.s102,vocab:[],phrases:[],scenes:[]}}));await p.reload();await ready(p,'s101');await p.selectOption('#epSelect','s102');await p.waitForFunction(()=>document.querySelector('#quizTargetWord').textContent==='本集未有題目');
 });
 await check('missing media response gives a TTS alternative without claiming verified audio',async p=>{
  await p.route('**/audio/*.mp3',r=>r.fulfill({status:404}));await stubSpeech(p);await loaded(p);await p.waitForFunction(()=>document.querySelector('#mp3StatusBadge').textContent.includes('未能載入'));await p.locator('.vocab-card .card-main').first().click();assert.match(await p.locator('#mediaNotice').textContent(),/電腦讀音/);
  await p.locator('.vocab-card .tts-btn').first().click();assert.equal(await p.evaluate(()=>window.__spoken.length),1);assert.match(await p.locator('.source-label').first().textContent(),/未獨立核實/);
 });
 await check('synthetic media native play/pause, speed, rewind, clip stop/replay and switching',async p=>{
  await audio(p);await loaded(p);await p.waitForFunction(()=>document.querySelector('audio').readyState>0);await p.locator('#unlockBanner').click();await p.evaluate(()=>player.play());await p.waitForFunction(()=>!document.querySelector('audio').paused);
  for(const [i,rate] of [[0,0.65],[1,0.8],[2,1]]){await p.locator('.spd-btn').nth(i).click();assert.equal(await p.locator('audio').evaluate(e=>e.playbackRate),rate)}
  await p.evaluate(()=>{player.pause();player.currentTime=10;});await p.waitForFunction(()=>!document.querySelector('audio').seeking);await p.locator('.spd-btn').nth(3).click();assert.equal(await p.locator('audio').evaluate(e=>e.currentTime),5);
  await p.evaluate(()=>playClip(1,1.3));await p.waitForFunction(()=>document.querySelector('audio').paused);assert.equal(await p.evaluate(()=>clipStopTime),null);
  await p.evaluate(()=>playClip(1,2));await select(p,'s102');assert.equal(await p.evaluate(()=>clipStopTime),null);assert(await p.locator('audio').evaluate(e=>e.paused));assert.match(await p.locator('audio').getAttribute('src'),/s102/);
 });
 await check('metadata boundary, wrong edition duration, practice TTS and heard clip/TTS choice',async p=>{
  const d=structuredClone(data.s102);d.vocab[0].audioStartSec=1;d.vocab[0].audioEndSec=2;
  await stubSpeech(p);await audio(p);await p.route('**/episodes/s102.json',r=>r.fulfill({json:d}));await loaded(p);await select(p,'s102');await p.waitForFunction(()=>document.querySelector('audio').readyState>0);
  assert.match(await p.locator('#mediaNotice').textContent(),/實際長度 30 秒/);await p.locator('.vocab-card .card-main').first().click();assert.equal(await p.evaluate(()=>clipStopTime),2);
  await p.evaluate(()=>playClip(1,31));assert.equal(await p.evaluate(()=>clipStopTime),null);assert(await p.locator('audio').evaluate(e=>e.paused));assert.match(await p.locator('#mediaNotice').textContent(),/超出實際長度/);
  await p.locator('.vocab-card .tts-btn').first().click();assert.equal(await p.evaluate(()=>window.__spoken.length),1);
  const practiceIndex=d.phrases.findIndex(v=>v.source==='practice');assert(practiceIndex>=0);await p.locator('.phrase-card .card-main').nth(practiceIndex).click();assert.equal(await p.evaluate(()=>window.__spoken.length),2);assert.equal(await p.locator('.phrase-card').nth(practiceIndex).locator('.tts-btn').count(),0);
 });
 await check('blocked play promise offers explicit tap/TTS and no stale clip',async p=>{
  await audio(p);await loaded(p);await p.waitForFunction(()=>document.querySelector('audio').readyState>0);await p.evaluate(()=>{player.play=()=>Promise.reject(new DOMException('Gesture required','NotAllowedError'));playClip(1,2);});await p.waitForFunction(()=>document.querySelector('#mediaNotice').textContent.includes('原音播放未能開始'));assert.equal(await p.evaluate(()=>clipStopTime),null);
 });
 await check('late playback rejection cannot overwrite a newer boundary or TTS state',async p=>{
  await stubSpeech(p);await audio(p);await loaded(p);await p.waitForFunction(()=>document.querySelector('audio').readyState>0);
  await p.evaluate(()=>{window.rejectOldPlay=null;player.play=()=>new Promise((_,reject)=>window.rejectOldPlay=reject);playClip(1,2);playClip(1,31);window.rejectOldPlay(new DOMException('aborted','AbortError'));});
  await p.waitForTimeout(50);assert.match(await p.locator('#mediaNotice').textContent(),/超出實際長度/);assert.equal(await p.evaluate(()=>clipStopTime),null);
 });
 await check('storage disabled and voice API absent keep games and quiz usable',async p=>{
  await p.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('denied','SecurityError')}});Object.defineProperty(window,'speechSynthesis',{value:undefined});Object.defineProperty(window,'SpeechSynthesisUtterance',{value:undefined});});
  await loaded(p);await p.locator('.vocab-card .tts-btn').first().click();assert.match(await p.locator('#voiceStatus').textContent(),/未提供讀音/);assert.match(await p.locator('#progressSummary').textContent(),/只限本次使用/);
  await p.locator('.btn-freeze').click();await p.locator('#freezeGame .btn-unfreeze').click();assert.equal(await p.locator('.quiz-opt').count(),4);
 });
 await check('empty voice list has an honest fallback message',async p=>{
  await p.addInitScript(()=>{speechSynthesis.getVoices=()=>[];speechSynthesis.speak=()=>{};});await loaded(p);await p.locator('.vocab-card .tts-btn').first().click();assert.match(await p.locator('#voiceStatus').textContent(),/暫未列出英文聲線/);
 });
 await check('uploaded S101/S102 MP3s load, play, seek and reject overlong scenes',async p=>{
  await loaded(p);await p.locator('#unlockBanner').click();
  for(const [id,duration] of [['s101',382.616],['s102',395.154]]){
   await select(p,id);await p.waitForFunction(({id,duration})=>{const a=document.querySelector('audio');return a.readyState>0&&a.currentSrc.endsWith(`/audio/${id}.mp3`)&&Math.abs(a.duration-duration)<1;},{id,duration});
   await p.evaluate(()=>player.play());await p.waitForFunction(()=>document.querySelector('audio').currentTime>0.1);
   await p.evaluate(()=>{player.pause();playClip(1,1.3);});await p.waitForFunction(()=>document.querySelector('audio').paused&&document.querySelector('audio').currentTime>=1.3);assert.equal(await p.evaluate(()=>clipStopTime),null);
   await p.locator('.scene-btn').last().click();assert.equal(await p.evaluate(()=>clipStopTime),null);assert.match(await p.locator('#mediaNotice').textContent(),/超出實際長度/);assert(await p.locator('audio').evaluate(a=>a.paused));
  }
 });
 await check('reload, iPad widths, all games and screenshot evidence',async p=>{
  await loaded(p);fs.mkdirSync('test-results',{recursive:true});
  for(const viewport of [{width:320,height:700},{width:1024,height:768},{width:768,height:1024}]){
   await p.setViewportSize(viewport);for(const id of Object.keys(data)){await select(p,id);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  }
  await p.reload();await ready(p,'s101');await p.screenshot({path:'test-results/s101.png',fullPage:true});await p.screenshot({path:'test-results/s101-overview.png'});await p.locator('#gameCard').screenshot({path:'test-results/s101-game.png'});
  for(const id of ['s102','s103','s104','s105']){await select(p,id);await p.locator('#gameCard').screenshot({path:`test-results/${id}-game.png`});}
 });
 console.log(`${count} browser scenarios passed. Synthetic fixtures plus uploaded S101/S102 MP3 playback verified; dialogue/timestamps and physical iPad Safari remain unverified.`);
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
