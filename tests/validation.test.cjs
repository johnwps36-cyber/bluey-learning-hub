const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const {create,KEY} = require('../progress.js');
const validate = require('../episode-validator.js');
const schema = require('../episode.schema.json');
const original = require('../episodes/s101.json');
const copy = () => structuredClone(original);
test('all five supplied episode files conform', () => {
  for (const id of ['s101','s102','s103','s104','s105']) assert.deepEqual(validate(require(`../episodes/${id}.json`),schema,id),[]);
});
test('all imported source files are byte-for-byte unchanged', () => {
  for(const [path,hash] of Object.entries(require('./source-hashes.json'))) assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex'),hash,path);
});
test('V4 visual baseline and original file remain intact',()=>{
  const baseline=fs.readFileSync('reference/bluey_v4_s101.html.txt','utf8');
  assert.equal(fs.readFileSync('bluey v4 s1.html.txt','utf8'),baseline);
  assert(fs.readFileSync('styles.css','utf8').startsWith(baseline.match(/<style>(.*?)<\/style>/s)[1].replace(/\r\n/g,'\n').trim()));
});
for (const [name,mutate] of [
  ['missing field',d=>delete d.game],['extra field',d=>d.extra=true],
  ['wrong audio',d=>d.audio='audio/s102.mp3'],['bad id',d=>d.id='s153'],
  ['overlap',d=>d.scenes[1].startSec=0],['reversed range',d=>d.scenes[0].endSec=0],
  ['exceeds known duration',d=>d.durationSec=20],['duplicate card',d=>d.vocab.push(d.vocab[0])],
  ['invalid source',d=>d.vocab[0].source='guessed'],['practice timestamps',d=>{d.vocab[0].source='practice';d.vocab[0].audioStartSec=1;d.vocab[0].audioEndSec=2}],
  ['half timestamp',d=>d.phrases[0].audioEndSec=2],['unknown game',d=>d.game.type='unsafe'],
]) test(`reject ${name}`,()=>{const d=copy();mutate(d);assert(validate(d,schema,'s101').length>0)});
test('empty arrays and unknown duration are supported',()=>{const d=copy(); d.scenes=[];d.vocab=[];d.phrases=[];assert.deepEqual(validate(d,schema,'s101'),[])});
test('heard timestamps can be absent; known ranges stay bounded',()=>{const d=copy();d.vocab[0].source='heard';assert.deepEqual(validate(d,schema,'s101'),[]);d.durationSec=500;d.vocab[0].audioStartSec=490;d.vocab[0].audioEndSec=501;assert(validate(d,schema,'s101').length>0)});

test('per-episode progress persists and deduplicates',()=>{
  const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
  const p=create(()=>storage);p.record('s101','seenWords','freeze');p.record('s101','seenWords','freeze');p.record('s101','quizWords','freeze');p.record('s101','game');
  assert.deepEqual(create(()=>storage).get('s101'),{seenWords:['freeze'],quizWords:['freeze'],gameWins:1});assert.equal(p.get('s102').gameWins,0);assert(p.isPersistent());
});
test('denied storage getter and quota failure retain session progress',()=>{
  for(const storage of [()=>{throw new Error('denied')},()=>({getItem:()=>null,setItem:()=>{throw new Error('quota')}})]){
    const p=create(storage);p.record('s102','game');assert.equal(p.get('s102').gameWins,1);assert.equal(p.isPersistent(),false);
  }
});
test('corrupt and untrusted stored data is handled and bounded',()=>{
  const map=new Map([[KEY,'{']]),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};const p=create(()=>storage);assert.equal(p.get('s101').gameWins,0);p.record('s101','game');assert(p.isPersistent());
  map.set(KEY,JSON.stringify({version:1,episodes:{s101:{seenWords:[3,'x','x'],gameWins:1e9},s999:{gameWins:5}}}));
  const q=create(()=>storage);assert.deepEqual(q.get('s101').seenWords,['x']);assert.equal(q.get('s101').gameWins,999);assert.equal(q.get('s999').gameWins,0);q.record('__proto__','game');
});
