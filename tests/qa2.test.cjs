const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {spawnSync} = require('node:child_process');
const root = path.join(__dirname,'..');
const episodes = ['s101','s102','s103','s104','s105'].map(id=>require(`../episodes/${id}.json`));

test('QA2 imports contain 28 scenes, 88 vocabulary cards, 47 phrases and stay draft',()=>{
  const totals=episodes.reduce((n,ep)=>n.map((v,i)=>v+ep[['scenes','vocab','phrases'][i]].length),[0,0,0]);
  assert.deepEqual(totals,[28,88,47]);
  episodes.forEach(ep=>assert.equal(ep.reviewStatus,'draft'));
  episodes.slice(2).forEach(ep=>assert.equal(ep.vocab.length,18));
});

test('QA2 lesson strings contain no generated citation markers',()=>{
  for(const ep of episodes) assert.doesNotMatch(JSON.stringify(ep),/\[cite\s*:\s*\d+\]/i);
});

test('supplied zero-dependency Python checker rejects nested citation artifacts',()=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'bluey-qa2-'));
  try {
    fs.mkdirSync(path.join(temp,'scripts'));fs.mkdirSync(path.join(temp,'episodes'));
    fs.copyFileSync(path.join(root,'scripts/validate_episodes.py'),path.join(temp,'scripts/validate_episodes.py'));
    fs.copyFileSync(path.join(root,'episode.schema.json'),path.join(temp,'episode.schema.json'));
    const fixture=structuredClone(episodes[0]);fixture.game.config.testOnly={nested:['A [CiTe: 17] artifact']};
    const target=path.join(temp,'episodes/s101.json');fs.writeFileSync(target,JSON.stringify(fixture));
    const run=()=>spawnSync(process.env.PYTHON_BIN || 'python3',['-S',path.join(temp,'scripts/validate_episodes.py')],{encoding:'utf8'});
    const rejected=run();assert.equal(rejected.status,1,rejected.stderr);assert.match(rejected.stdout,/residual AI citation marker in game.config.testOnly.nested\[0\]/);
    delete fixture.game.config.testOnly;fs.writeFileSync(target,JSON.stringify(fixture));
    const accepted=run();assert.equal(accepted.status,0,accepted.stdout+accepted.stderr);assert.match(accepted.stdout,/Only standard-library checks/);
  } finally {fs.rmSync(temp,{recursive:true,force:true});}
});
