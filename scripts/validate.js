const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const yaml = require('js-yaml');

const root = path.resolve(__dirname, '..');
const read = file => yaml.load(fs.readFileSync(path.join(root, file), 'utf8'));
const documents = [];
for (const folder of ['.tekton', 'k8s']) {
  for (const file of fs.readdirSync(path.join(root, folder)).filter(name => name.endsWith('.yml'))) {
    yaml.loadAll(fs.readFileSync(path.join(root, folder, file), 'utf8'), doc => {
      assert(doc?.apiVersion && doc.kind && doc.metadata, `${folder}/${file}: resource fields`);
      assert(!doc.metadata.namespace, 'Use the explicitly selected namespace consistently');
      documents.push(doc);
    });
  }
}
const workflow = read('.github/workflows/workflow.yml');
assert('push' in workflow.on && 'pull_request' in workflow.on);
assert.deepEqual(workflow.permissions, { contents: 'read' });
const steps = workflow.jobs.validate.steps;
for (const command of ['npm ci', 'npm run lint', 'npm test']) {
  assert(steps.some(step => step.run === command), `Missing workflow command: ${command}`);
}
assert(steps.some(step => step.uses?.startsWith('actions/checkout@')));
assert(steps.some(step => step.uses?.startsWith('actions/setup-node@') && step.with['node-version'] === '24'));
assert(steps.every(step => !step['continue-on-error']));
const tasks = new Map(documents.filter(doc => doc.kind === 'Task').map(doc => [doc.metadata.name, doc]));
const pipeline = documents.find(doc => doc.kind === 'Pipeline');
const run = documents.find(doc => doc.kind === 'PipelineRun');
const completed = new Set();
for (const task of pipeline.spec.tasks) {
  const definition = tasks.get(task.taskRef.name);
  assert(definition, `Unknown Task: ${task.taskRef.name}`);
  for (const dependency of task.runAfter || []) assert(completed.has(dependency), `Invalid order: ${dependency}`);
  for (const binding of task.workspaces || []) {
    assert(definition.spec.workspaces.some(item => item.name === binding.name));
    assert(pipeline.spec.workspaces.some(item => item.name === binding.workspace));
  }
  for (const param of task.params || []) assert(definition.spec.params.some(item => item.name === param.name));
  completed.add(task.name);
}
assert.deepEqual([...completed], ['cleanup', 'clone', 'validate', 'tests', 'build', 'deploy']);
assert(tasks.get('cleanup').spec.steps[0].script.includes('/source/node_modules'));
assert(tasks.get('unit-tests').spec.steps[0].script.includes('npm ci'));
assert(tasks.get('unit-tests').spec.steps[0].script.includes('npm test'));
assert.equal(run.spec.pipelineRef.name, pipeline.metadata.name);
assert.equal(run.spec.taskRunTemplate.serviceAccountName, 'ci-cd-pipeline');
assert.equal(run.spec.workspaces[0].name, pipeline.spec.workspaces[0].name);
const pvc = documents.find(doc => doc.kind === 'PersistentVolumeClaim');
assert.equal(run.spec.workspaces[0].persistentVolumeClaim.claimName, pvc.metadata.name);
const deployment = documents.find(doc => doc.kind === 'Deployment');
const service = documents.find(doc => doc.kind === 'Service');
const route = documents.find(doc => doc.kind === 'Route');
assert.deepEqual(service.spec.selector, deployment.spec.template.metadata.labels);
assert.equal(route.spec.to.name, service.metadata.name);
assert.equal(deployment.spec.template.spec.securityContext.runAsNonRoot, true);
assert.equal(deployment.spec.template.spec.containers[0].securityContext.allowPrivilegeEscalation, false);
assert.equal(service.spec.ports[0].targetPort, deployment.spec.template.spec.containers[0].ports[0].containerPort);
assert.equal(tasks.get('build-image').spec.results[0].name, 'image');
assert.equal(pipeline.spec.tasks.at(-1).params[0].value, '$(tasks.build.results.image)');
assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'))).lockfileVersion, 3);
console.log(`PASS: ${documents.length} YAML resources; workflow commands; ordered Task references; workspaces; PVC; security and service mappings.`);
console.log('Cluster API/schema compatibility and external executions require server-side verification.');
