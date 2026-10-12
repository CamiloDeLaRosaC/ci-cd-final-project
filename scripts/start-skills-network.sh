#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
namespace=$(oc project -q)
if [ "$namespace" != "sn-labs-mildredfiona" ]; then
  echo "Expected sn-labs-mildredfiona; current project is $namespace" >&2
  exit 1
fi
mkdir -p .lab submission
oc get serviceaccount pipeline >/dev/null
oc apply -f k8s/pvc.yml
oc apply -f .tekton/tasks.yml

# Parse manifests using the already installed oc client; no extra Python packages.
oc create --dry-run=client --validate=false -f .tekton/support-tasks.yml -o json > .lab/support.json
oc create --dry-run=client --validate=false -f .tekton/pipeline.yml -o json > .lab/pipeline-source.json
oc create --dry-run=client --validate=false -f .tekton/pipelinerun.yml -o json > .lab/run-source.json
oc get task buildah -n openshift-pipelines -o json > .lab/catalog-buildah.json
export CI_CD_LAB_NAMESPACE="$namespace"
export CI_CD_LAB_REVISION
CI_CD_LAB_REVISION=$(git rev-parse HEAD)
python3 - <<'PY'
import json, os
from pathlib import Path

folder = Path('.lab')
def read(name):
    text = (folder / name).read_text().strip()
    decoder = json.JSONDecoder()
    documents = []
    while text:
        document, end = decoder.raw_decode(text)
        documents.append(document)
        text = text[end:].lstrip()
    if not documents:
        raise ValueError('No JSON documents in ' + name)
    if len(documents) == 1:
        return documents[0]
    items = []
    for document in documents:
        items.extend(document.get('items', [document]))
    return {'apiVersion': 'v1', 'kind': 'List', 'items': items}
def write(name, data):
    (folder / name).write_text(json.dumps(data, indent=2) + '\n')

support = read('support.json')
items = support.get('items', [support])
support_tasks = [item for item in items if item['metadata']['name'] != 'buildah']
write('support-filtered.json', {'apiVersion': 'v1', 'kind': 'List', 'items': support_tasks})

buildah = read('catalog-buildah.json')
buildah = {'apiVersion': buildah['apiVersion'], 'kind': 'Task',
           'metadata': {'name': 'lab-buildah'}, 'spec': buildah['spec']}
params = {item['name'] for item in buildah['spec'].get('params', [])}
results = {item['name'] for item in buildah['spec'].get('results', [])}
assert 'IMAGE' in params, 'Unexpected installed Buildah parameters'
assert {'IMAGE_URL', 'IMAGE_DIGEST'} <= results, 'Unexpected installed Buildah results'
write('buildah.json', buildah)

pipeline = read('pipeline-source.json')
pipeline['metadata'] = {'name': 'oc-final'}
tasks = pipeline['spec']['tasks']
build = next(task for task in tasks if task['name'] == 'buildah')
build['taskRef'] = {'name': 'lab-buildah'}
registry = 'image-registry.openshift-image-registry.svc:5000'
image = registry + '/' + os.environ['CI_CD_LAB_NAMESPACE'] + '/ci-cd-final-project:$(context.pipelineRun.name)'
build['params'] = [{'name': 'IMAGE', 'value': image}]
build['workspaces'][0]['subPath'] = 'source'
deploy = next(task for task in tasks if task['name'] == 'deploy')
deploy['params'] = [{'name': 'image', 'value': '$(tasks.buildah.results.IMAGE_URL)@$(tasks.buildah.results.IMAGE_DIGEST)'}]
write('pipeline.json', pipeline)

run = read('run-source.json')
run['metadata'] = {'generateName': 'oc-final-'}
run['spec']['taskRunTemplate'] = {'serviceAccountName': 'pipeline'}
for param in run['spec']['params']:
    if param['name'] == 'repo-url':
        param['value'] = 'https://github.com/CamiloDeLaRosaC/ci-cd-final-project.git'
    if param['name'] == 'revision':
        param['value'] = os.environ['CI_CD_LAB_REVISION']
write('run.json', run)
PY

oc apply -f .lab/support-filtered.json
oc apply -f .lab/buildah.json
oc create --dry-run=client -f - -o yaml <<'YAML' | oc apply -f -
apiVersion: image.openshift.io/v1
kind: ImageStream
metadata:
  name: ci-cd-final-project
YAML
oc apply --dry-run=server -f .lab/pipeline.json
oc apply -f .lab/pipeline.json
oc create --dry-run=server -f .lab/run.json >/dev/null
run_name=$(oc create -f .lab/run.json -o jsonpath='{.metadata.name}')
printf '%s\n' "$run_name" | tee submission/lab-run-name.txt
echo 'Pipeline created. Actual execution results follow:'
if ! oc wait --for=condition=Succeeded "pipelinerun/$run_name" --timeout=1200s; then
  oc get pipelinerun "$run_name" -o jsonpath='{range .status.conditions[*]}{.type}{"="}{.status}{": "}{.message}{"\n"}{end}'
  oc get taskruns,pods
  command -v tkn >/dev/null && tkn pipelinerun logs "$run_name" --all || true
  exit 1
fi
oc get pvc oc-pipelines-pvc
oc get pipelinerun "$run_name"
oc rollout status deployment/ci-cd-final-project --timeout=180s
oc logs deployment/ci-cd-final-project --timestamps | tee submission/oc-pipeline-application-logs.txt
echo 'Use the OpenShift console to capture the real PVC, pipeline and successful run screenshots.'
