# CI/CD Final Project

An Express product catalog API with automated ESLint/Jest validation in GitHub Actions and a six-stage Tekton delivery pipeline for Red Hat OpenShift. Prepared for Coursera Option 1 (eight grading deliverables).

## Technology stack

Node.js 24 LTS, Express, ESLint, Jest, Supertest, GitHub Actions, Tekton `v1`, Kubernetes and OpenShift binary Docker builds. `js-yaml` validates manifests locally.

## Install and run

```sh
npm ci
npm start
```

The application listens on `0.0.0.0:8080`. Set `PORT` to change the port. It logs startup/shutdown events as JSON to stdout. No credentials are required for the public sample application.

```sh
curl --fail http://localhost:8080/health
curl --fail -H 'Content-Type: application/json' \
  -d '{"name":"Hat","priceCents":5995}' http://localhost:8080/products
```

Products support POST/GET `/products`, exact-name search (`?name=Hat`), GET/PUT/DELETE `/products/:id`. Prices use integer cents. Invalid payloads return 400, missing records return 404, deletion is idempotent (204). Data is isolated per application instance and stored in memory; restarting the pod clears it. This is an educational single-replica service, with no authentication or durable product database. The PVC stores pipeline source/build artifacts, not product records.

## Local validation

```sh
npm run lint
npm test
npm run validate
```

Jest tests the API over real local HTTP requests, including persistence across requests, isolation, validation, CRUD, filters and malformed JSON. Coverage thresholds are enforced. Manifest validation checks YAML syntax, GitHub Actions commands, task ordering, workspace/parameter names, resource names, security settings and result references. It is not a substitute for validation against a live Kubernetes/Tekton API.

## GitHub Actions

`.github/workflows/workflow.yml` runs on push and pull requests, checks out source without persisting credentials, selects Node 24, runs `npm ci`, `npm run lint`, `npm test` and `npm run validate`. Permissions are limited to `contents: read`; failed commands fail the job. Publish this repository to the actual GitHub account, then inspect the real Actions run. Copy the actual README, workflow and Tekton file URLs into `submission/SUBMISSION.md`; no fabricated URLs are supplied.

## Tekton delivery

Pipeline `oc-final` performs cleanup → clone → dependency/lint/manifest validation → Jest unit tests → image build → deployment/health check. Every stage has explicit dependencies. `.tekton/tasks.yml` contains the graded cleanup and unit-test tasks; `.tekton/support-tasks.yml` supplies the other tasks. Cleanup only removes generated `node_modules`, `coverage` and `dist` directories inside the source subdirectory. It preserves repository files and unrelated PVC data. The clone task verifies the origin and checks out the requested revision without forcing away changes. Run it with a pushed commit SHA using the renderer below.

Image building uses the cluster's OpenShift Build API with a binary Docker BuildConfig, instead of requiring privileged Buildah in a Tekton step. Each run gets a unique BuildConfig/tag. The resulting image digest is passed to deployment. The application image runs as non-root, allows OpenShift's assigned UID, drops capabilities, prevents privilege escalation and uses a read-only root filesystem. No extra SCC grants are included. Cluster build policy must permit Docker builds. CLI/task images and Tekton v1 API support need confirmation against the actual cluster.

## OpenShift deployment

Prerequisites: access to an OpenShift project, `oc`, installed OpenShift Pipelines supporting `tekton.dev/v1`, Build API, internal registry, default StorageClass and permissions to create the supplied namespaced RBAC/resources. An administrator may need to grant those prerequisites. No secrets or credentials are included. The sample supports a public HTTPS GitHub repository. Private repositories require cluster-managed git credentials configured separately.

Set `NAMESPACE` to the actual authorized project before applying anything:

```sh
oc whoami
oc version
oc project "$NAMESPACE"
oc api-resources --api-group=tekton.dev
oc get storageclass
oc apply --dry-run=server -n "$NAMESPACE" -f k8s/pvc.yml
oc apply --dry-run=server -n "$NAMESPACE" -f k8s/pipeline-access.yml
oc apply --dry-run=server -n "$NAMESPACE" -f .tekton/tasks.yml
oc apply --dry-run=server -n "$NAMESPACE" -f .tekton/support-tasks.yml
oc apply --dry-run=server -n "$NAMESPACE" -f .tekton/pipeline.yml
oc apply -n "$NAMESPACE" -f k8s/pvc.yml
oc apply -n "$NAMESPACE" -f k8s/pipeline-access.yml
oc apply -n "$NAMESPACE" -f .tekton/tasks.yml
oc apply -n "$NAMESPACE" -f .tekton/support-tasks.yml
oc apply -n "$NAMESPACE" -f .tekton/pipeline.yml
oc get pvc oc-pipelines-pvc -n "$NAMESPACE"
```

For `WaitForFirstConsumer` storage, the claim may bind after the first TaskRun pod starts. The deployment manifest's pending image is a configuration marker, replaced by the real image from the successful build during the pipeline. Do not deploy it manually before an image exists.

Set `REPO_URL` to the real public HTTPS GitHub repository URL and `REVISION` to its full pushed commit SHA, then:

```sh
node scripts/render-run.js > /tmp/ci-cd-pipelinerun.yml
oc create --dry-run=server -n "$NAMESPACE" -f /tmp/ci-cd-pipelinerun.yml
oc create -n "$NAMESPACE" -f /tmp/ci-cd-pipelinerun.yml
oc get pipelineruns -n "$NAMESPACE"
oc get taskruns -n "$NAMESPACE"
oc get pods -n "$NAMESPACE"
```

Set `PIPELINE_RUN` to the returned run name. Wait for its `Succeeded=True` condition and verify all TaskRuns before claiming success. For ReadWriteOnce storage, schedule pipeline workspace pods on a compatible node using the cluster's Tekton affinity configuration; do not run overlapping pipelines against the same source PVC. Keep the run name short enough that `catalog-$PIPELINE_RUN` is a valid resource name.

```sh
oc wait --for=condition=Succeeded pipelinerun/"$PIPELINE_RUN" -n "$NAMESPACE" --timeout=1800s
NAMESPACE="$NAMESPACE" PIPELINE_RUN="$PIPELINE_RUN" sh scripts/collect-evidence.sh
```

The Route terminates HTTPS at the router and redirects HTTP. The pipeline waits for rollout, checks `/health` inside the running application container and prints actual pod logs. The evidence script also tests the public Route with TLS verification enabled.

## Evidence and deliverables

See `submission/SUBMISSION.md` for the eight exact grading items and their real status. Local logs are evidence of local execution only. The following four screenshots must show real service screens:

- `oc-pipelines-console-pvc-details.png`: OpenShift Storage → PVC details → name and Bound status.
- `cicd-github-validate.png`: GitHub Actions successful run with ESLint and Jest steps visible.
- `oc-pipelines-oc-final.png`: OpenShift Pipelines → `oc-final` overview showing stages.
- `oc-pipelines-oc-green.png`: the real successful PipelineRun with all tasks completed.

`oc-pipelines-app-logs.txt` must come from the deployed application via `oc logs`. Do not rename local server logs to this required evidence file. Console screenshots are captured manually only after genuine successful execution.
