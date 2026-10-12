#!/bin/sh
set -eu
: "${NAMESPACE:?Set NAMESPACE to the verified OpenShift project}"
: "${PIPELINE_RUN:?Set PIPELINE_RUN to the actual run name}"
mkdir -p submission
oc whoami
oc get pvc oc-pipelines-pvc -n "$NAMESPACE" -o yaml > submission/pvc-status.yml
oc get pipeline oc-final -n "$NAMESPACE" -o yaml > submission/pipeline-status.yml
oc get pipelinerun "$PIPELINE_RUN" -n "$NAMESPACE" -o yaml > submission/pipelinerun-status.yml
oc rollout status deployment/ci-cd-final-project -n "$NAMESPACE" --timeout=180s
oc logs deployment/ci-cd-final-project -n "$NAMESPACE" --timestamps > submission/oc-pipeline-application-logs.txt
oc get deployment ci-cd-final-project -n "$NAMESPACE" -o yaml > submission/deployment-status.yml
host=$(oc get route ci-cd-final-project -n "$NAMESPACE" -o jsonpath='{.spec.host}')
curl --fail --silent --show-error "https://$host/health" > submission/deployed-health.json
echo 'Actual cluster outputs collected. Capture the four requested console screenshots manually.'
