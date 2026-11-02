const fs = require('node:fs');
const path = require('node:path');
const validate = require('../episode-validator.js');
const root = path.join(__dirname, '..');
const schema = JSON.parse(fs.readFileSync(path.join(root, 'episode.schema.json')));
let failed = false;
for (const name of fs.readdirSync(path.join(root, 'episodes')).filter(n => n.endsWith('.json'))) {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(root, 'episodes', name)));
    const errors = validate(data, schema, path.basename(name, '.json'));
    if (errors.length) throw new Error(errors.join('; '));
    console.log(`PASS ${name}: ${data.vocab.length} vocab, ${data.phrases.length} phrases, ${data.reviewStatus}`);
  } catch (e) { failed = true; console.error(`FAIL ${name}: ${e.message}`); }
}
if (failed) process.exitCode = 1;
