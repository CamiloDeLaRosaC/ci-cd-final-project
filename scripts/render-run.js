const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');
const repo = process.env.REPO_URL;
const revision = process.env.REVISION;
if (!repo || !/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/ci-cd-final-project(?:\.git)?$/.test(repo)) {
  throw new Error('Set REPO_URL to the real HTTPS GitHub URL of ci-cd-final-project');
}
if (!revision || !/^[a-f0-9]{40}$/.test(revision)) throw new Error('Set REVISION to the full pushed Git commit SHA');
const document = yaml.load(fs.readFileSync(path.join(__dirname, '../.tekton/pipelinerun.yml'), 'utf8'));
document.spec.params.find(param => param.name === 'repo-url').value = repo;
document.spec.params.find(param => param.name === 'revision').value = revision;
process.stdout.write(yaml.dump(document));
