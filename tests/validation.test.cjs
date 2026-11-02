const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const validate = require('../episode-validator.js');
const schema = require('../episode.schema.json');
const original = require('../episodes/s101.json');
const copy = () => structuredClone(original);
test('both supplied episode data files conform', () => {
  for (const id of ['s101','s102']) assert.deepEqual(validate(require(`../episodes/${id}.json`),schema,id),[]);
});
test('S101 preserves V4 learning content and scene times', () => {
  const v4 = fs.readFileSync('bluey v4 s1.html.txt','utf8');
  for (const [variable,key] of [['vocabList','vocab'],['phrases','phrases']]) {
    const literal = v4.match(new RegExp(`const ${variable} = (\\[.*?\\n  \\]);`,'s'))[1];
    const values = JSON.parse(JSON.stringify(vm.runInNewContext(literal)));
    assert.deepEqual(original[key].map(({source,audioStartSec,audioEndSec,...item})=>item),values);
  }
  const times = [...v4.matchAll(/playClip\((\d+), (\d+)\)/g)].map(m=>[+m[1],+m[2]]);
  assert.deepEqual(original.scenes.map(s=>[s.startSec,s.endSec]),times);
});
for (const [name,mutate] of [
  ['missing field',d=>delete d.game],['extra field',d=>d.extra=true],
  ['wrong audio',d=>d.audio='audio/s102.mp3'],['bad id',d=>d.id='s153'],
  ['overlap',d=>d.scenes[1].startSec=0],['reversed range',d=>d.scenes[0].endSec=0],
  ['exceeds known duration',d=>d.durationSec=20],['duplicate card',d=>d.vocab.push(d.vocab[0])],
  ['invalid source',d=>d.vocab[0].source='guessed'],['practice timestamps',d=>{d.vocab[0].audioStartSec=1;d.vocab[0].audioEndSec=2}],
  ['half timestamp',d=>d.phrases[0].audioEndSec=2],['unknown game',d=>d.game.type='unsafe'],
]) test(`reject ${name}`,()=>{const d=copy();mutate(d);assert(validate(d,schema,'s101').length>0)});
test('empty arrays and unknown duration are supported',()=>{const d=copy(); d.scenes=[];d.vocab=[];d.phrases=[];assert.deepEqual(validate(d,schema,'s101'),[])});
test('heard timestamps can be absent; known ranges stay bounded',()=>{const d=copy();d.vocab[0].source='heard';assert.deepEqual(validate(d,schema,'s101'),[]);d.durationSec=500;d.vocab[0].audioStartSec=490;d.vocab[0].audioEndSec=501;assert(validate(d,schema,'s101').length>0)});
