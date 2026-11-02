const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.BASE_URL || 'http://127.0.0.1:8001/bluey-learning-hub/';
const s102 = require('../episodes/s102.json');
const wav = Buffer.alloc(44 + 8000*2*30);
wav.write('RIFF'); wav.writeUInt32LE(wav.length-8,4); wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(8000,24);wav.writeUInt32LE(16000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(wav.length-44,40);
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 let count=0;
 async function check(name,fn) {
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try {await fn(page);assert.deepEqual(errors,[]);console.log(`PASS ${++count}: ${name}`);}finally{await context.close()}
 }
 async function loaded(p) {await p.goto(base);await p.waitForFunction(()=>document.querySelectorAll('.vocab-card').length===32)}
 async function audio(p) {
  await p.route('**/audio/*.mp3',r=>{
   const range=r.request().headers().range;
   if(range){const match=/bytes=(\d+)-(\d*)/.exec(range);const start=+match[1],end=match[2]?Math.min(+match[2],wav.length-1):wav.length-1;
    return r.fulfill({status:206,contentType:'audio/wav',headers:{'Accept-Ranges':'bytes','Content-Range':`bytes ${start}-${end}/${wav.length}`},body:wav.subarray(start,end+1)});}
   return r.fulfill({contentType:'audio/wav',headers:{'Accept-Ranges':'bytes'},body:wav});
  });
 }
 try {
 await check('S101 parity, 52 choices, frozen stage, speech and categories',async p=>{
  await loaded(p); assert.equal(await p.locator('#epSelect option').count(),52);assert.equal(await p.locator('.phrase-card').count(),16);assert.equal(await p.locator('.scene-btn').count(),6);
  await p.locator('#unlockBanner').click();await p.locator('.cat-tab').nth(1).click();assert.equal(await p.locator('.vocab-card').count(),8);
  await p.locator('.vocab-card').first().click();await p.locator('#btnFast').click();assert.equal(await p.evaluate(()=>isSlowMode),false);
  await p.locator('.btn-freeze').click();assert(await p.locator('#dadAvatar').evaluate(e=>e.classList.contains('frozen')));
  await p.locator('#freezeGame .btn-unfreeze').click();assert(!(await p.locator('#dadAvatar').evaluate(e=>e.classList.contains('frozen'))));
  assert(await p.locator('#episodeStatus').textContent().then(s=>s.includes('待音訊校對')));
 });
 await check('S102 has independent content, hospital game, quiz and return to S101',async p=>{
  await loaded(p);await p.selectOption('#epSelect','s102');await p.waitForFunction(()=>document.querySelectorAll('.vocab-card').length===4);
  assert.equal(await p.locator('.phrase-card').count(),2);assert.equal(await p.locator('#freezeGame').isVisible(),false);
  await p.locator('#otherGame button').first().click();assert.match(await p.locator('#otherGame .stage-box').textContent(),/檢查好/);
  await p.evaluate(()=>{const b=[...document.querySelectorAll('.quiz-opt')].find(b=>b.textContent.includes(currentQuizTarget.word));b.click()});assert.equal(await p.locator('.quiz-opt.correct').count(),1);
  await p.selectOption('#epSelect','s101');await p.waitForFunction(()=>document.querySelectorAll('.vocab-card').length===32);
  const targetAfterSwitch = await p.locator('#quizTargetWord').textContent();await p.waitForTimeout(1600);assert.equal(await p.locator('#quizTargetWord').textContent(),targetAfterSwitch);assert.equal(await p.locator('.quiz-opt').count(),4);assert.match(await p.locator('.header-title').textContent(),/S101/);
 });
 await check('all 50 missing episodes clear S101 data; S102 JSON 404 remains audio-selectable',async p=>{
  await loaded(p);
  for(let n=3;n<=52;n++) {const id=`s1${String(n).padStart(2,'0')}`;await p.selectOption('#epSelect',id);await p.waitForFunction(()=>document.querySelector('#episodeStatus').textContent.includes('教材準備中'));assert.equal(await p.locator('.vocab-card').count(),0);assert.equal(await p.locator('#materials').isVisible(),false);assert.match(await p.locator('audio').getAttribute('src'),new RegExp(id));}
  await p.route('**/episodes/s102.json',r=>r.fulfill({status:404}));await p.selectOption('#epSelect','s102');await p.waitForFunction(()=>document.querySelector('#episodeStatus').textContent.includes('教材準備中'));assert.match(await p.locator('audio').getAttribute('src'),/s102/);
 });
 await check('late responses never overwrite a newer selection',async p=>{
  await loaded(p); await p.route('**/episodes/s102.json',async r=>{await new Promise(resolve=>setTimeout(resolve,350));await r.fulfill({json:s102}).catch(()=>{})});
  await p.selectOption('#epSelect','s102');await p.selectOption('#epSelect','s103');await p.waitForTimeout(600);assert.match(await p.locator('.header-title').textContent(),/S103/);assert.equal(await p.locator('.vocab-card').count(),0);
 });
 await check('malformed JSON, invalid schema, and server errors are visible',async p=>{
  await loaded(p);
  for(const body of ['{','{}']){await p.route('**/episodes/s102.json',r=>r.fulfill({contentType:'application/json',body}));await p.selectOption('#epSelect','s102');await p.waitForFunction(()=>document.querySelector('#episodeStatus').textContent.includes('載入失敗'));assert.equal(await p.locator('.vocab-card').count(),0);await p.selectOption('#epSelect','s101');await p.waitForFunction(()=>document.querySelectorAll('.vocab-card').length===32)}
  await p.route('**/episodes/s102.json',r=>r.fulfill({status:503}));await p.selectOption('#epSelect','s102');await p.waitForFunction(()=>document.querySelector('#episodeStatus').textContent.includes('503'));
 });
 await check('schema download errors can recover on reselect',async p=>{
  await p.route('**/episode.schema.json',r=>r.fulfill({status:503}));await p.goto(base);await p.waitForFunction(()=>document.querySelector('#episodeStatus').textContent.includes('載入失敗'));
  assert.equal(await p.locator('.vocab-card').count(),0);await p.unroute('**/episode.schema.json');await p.selectOption('#epSelect','s102');await p.waitForFunction(()=>document.querySelectorAll('.vocab-card').length===4);
 });
 await check('HTML, quotes, long text and empty arrays render safely',async p=>{
  const evil=structuredClone(s102);evil.vocab[0].word=`<img src=x onerror="window.pwned=true">'`+'Long'.repeat(80);evil.vocab[0].ex='" onclick="alert(1)';evil.phrases[0].en='<script>window.pwned=true</script>';
  await p.route('**/episodes/s102.json',r=>r.fulfill({json:evil}));await loaded(p);await p.selectOption('#epSelect','s102');await p.waitForFunction(()=>document.querySelectorAll('.vocab-card').length===4);
  assert.equal(await p.locator('#vocabGrid img, #phraseGrid script').count(),0);await p.locator('.vocab-card').first().click();assert.equal(await p.evaluate(()=>window.pwned),undefined);
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const empty={...s102,vocab:[],phrases:[],scenes:[]};await p.route('**/episodes/s102.json',r=>r.fulfill({json:empty}));await p.reload();await p.waitForFunction(()=>document.querySelectorAll('.vocab-card').length===32);await p.selectOption('#epSelect','s102');await p.waitForFunction(()=>document.querySelector('#quizTargetWord').textContent==='本集未有題目');
 });
 await check('real missing media shows a useful message',async p=>{await loaded(p);await p.waitForFunction(()=>document.querySelector('#mp3StatusBadge').textContent.includes('未能載入'))});
 await check('synthetic audio: native play/pause, speed, rewind, clip stop/replay and switching',async p=>{
  await audio(p);await loaded(p);await p.waitForFunction(()=>document.querySelector('audio').readyState>0);
  await p.locator('#unlockBanner').click();await p.evaluate(()=>player.play());await p.waitForFunction(()=>!document.querySelector('audio').paused);
  for(const [i,rate] of [[0,0.65],[1,0.8],[2,1]]){await p.locator('.spd-btn').nth(i).click();assert.equal(await p.locator('audio').evaluate(e=>e.playbackRate),rate)}
  await p.evaluate(()=>{player.pause();player.currentTime=10;});await p.waitForFunction(()=>!document.querySelector('audio').seeking);await p.locator('.spd-btn').nth(3).click();assert.equal(await p.locator('audio').evaluate(e=>e.currentTime),5);
  await p.evaluate(()=>playClip(1,1.3));await p.waitForFunction(()=>document.querySelector('audio').paused);assert.equal(await p.evaluate(()=>clipStopTime),null);
  await p.evaluate(()=>playClip(1,2));await p.selectOption('#epSelect','s102');await p.waitForFunction(()=>document.querySelectorAll('.vocab-card').length===4);assert.equal(await p.evaluate(()=>clipStopTime),null);assert(await p.locator('audio').evaluate(e=>e.paused));assert.match(await p.locator('audio').getAttribute('src'),/s102/);
 });
 await check('heard timestamps use audio clip while practice uses speech',async p=>{
  const d=structuredClone(s102);d.vocab[0].source='heard';d.vocab[0].audioStartSec=1;d.vocab[0].audioEndSec=2;
  await audio(p);await p.route('**/episodes/s102.json',r=>r.fulfill({json:d}));await loaded(p);await p.selectOption('#epSelect','s102');await p.waitForFunction(()=>document.querySelectorAll('.vocab-card').length===4);await p.waitForFunction(()=>document.querySelector('audio').readyState>0);
  await p.locator('.vocab-card').first().click();assert.equal(await p.evaluate(()=>clipStopTime),2);
 });
 await check('reload, narrow portrait and landscape preserve layout',async p=>{
  await loaded(p);for(const viewport of [{width:320,height:700},{width:1024,height:768},{width:768,height:1024}]){await p.setViewportSize(viewport);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))}
  await p.reload();await p.waitForFunction(()=>document.querySelectorAll('.vocab-card').length===32);
  fs.mkdirSync('test-results',{recursive:true});await p.screenshot({path:'test-results/s101.png',fullPage:true});
 });
 console.log(`${count} browser scenarios passed. Synthetic WAV fixtures only; no real episode audio or iPad Safari verification.`);
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
