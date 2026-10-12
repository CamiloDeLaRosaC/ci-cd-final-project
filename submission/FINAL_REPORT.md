# Final implementation and validation report

## Outcome

Local implementation complete. Remote GitHub Actions execution and OpenShift deployment are blocked, not claimed as successful. Eight final grading artifacts remain dependent on actual hosting/cluster access; see SUBMISSION.md.

## Repository inspection

The starting workspace contained the separate Python TDD/BDD project, no JavaScript starter and no root Git repository. That work was preserved. Created `ci-cd-final-project`, initialized a local Git repository on `main`, and found no configured remote. A connected GitHub repository search for `ci-cd-final-project` returned no matches. No remote repository was created, no source was pushed, and no cloud resource was modified. Git changes remain uncommitted.

## Implemented files

- `src/app.js`, `src/server.js`: validated CRUD product catalog, integer-cent prices, name filtering, JSON errors, health endpoint, configuration and graceful shutdown.
- `tests/app.test.js`: isolated Jest/Supertest HTTP tests, including storage failure handling.
- `package.json`, `package-lock.json`, `eslint.config.js`, `jest.config.js`: actual npm-resolved dependencies, linting and coverage-enforced tests.
- `.github/workflows/workflow.yml`: push/PR checkout, Node 24, npm ci, ESLint, Jest and manifest validation; contents-read permissions.
- `.tekton/tasks.yml`: cleanup and unit-test grading tasks.
- `.tekton/support-tasks.yml`: cloning, validation, OpenShift image building and deployment tasks.
- `.tekton/pipeline.yml`, `.tekton/pipelinerun.yml`: six-stage ordered pipeline and configurable PVC-backed execution.
- `k8s/pvc.yml`, `k8s/pipeline-access.yml`, `k8s/application.yml`: storage, namespace-local RBAC, service account, ImageStream, restricted application Deployment, Service and TLS Route.
- `Dockerfile`, `.dockerignore`, `.gitignore`, `.env.example`: non-root multi-stage image and build hygiene.
- `scripts/validate.js`, `scripts/render-run.js`, `scripts/collect-evidence.sh`: local checks, real URL/commit configuration and genuine cluster evidence collection.
- `README.md`, `submission/SUBMISSION.md`, this report and authentic local command logs.

## Actual local results

| Validation | Actual result |
| --- | --- |
| npm dependency installation | Successful; real lockfile generated |
| npm ci | Successful clean installation |
| ESLint | PASS, exit 0; no lint errors |
| Jest | PASS, exit 0; 1 suite, 14 tests |
| Coverage | src/app.js: 100% statements, branches, functions and lines |
| YAML/reference validation | PASS, 16 resources; workflow triggers/commands, dependency order, task/parameter/workspace references, PVC, resource names, image result mapping and security settings |
| Embedded shell syntax | PASS, all 6 Tekton scripts plus evidence collection shell script |
| Local startup | PASS, real server listened on port 8080 |
| Local health | PASS, actual HTTP response: {"status":"ok"} |
| Local business smoke check | PASS, POST product and GET product returned matching actual data |
| Secret-pattern inspection | No private-key/GitHub-token/AWS-key patterns found in 36 candidate Git files; not a comprehensive secret detector |
| GitHub Actions | Not executed; hosted repository/run unavailable |
| OpenShift | Not executed; oc/kubectl and kubeconfig unavailable |
| Container build | Not executed; Docker/Podman unavailable |

The coverage result applies to the application module configured from the outset, not server process signal handling. The startup/shutdown module was separately exercised by starting the real process and stopping it with SIGINT. Local HTTP output is not deployment evidence.

## Runtime troubleshooting and reproducibility

Node/npm were not on PATH. Located Node 24.21.0 in the application-bundled runtime and invoked npm through Corepack with temporary cache directories. Native Jest resolution initially failed because macOS library validation rejected the resolver native module's signing identity. Installed the matching WebAssembly resolver into local node_modules without changing package.json/package-lock.json and ran the real Jest suite with `NAPI_RS_FORCE_WASI=1`. No tests or coverage thresholds were disabled; the tests initially detected a missing error branch, which was covered by a meaningful storage-failure regression test.

Standard Node on Linux/GitHub/OpenShift should use normal `npm ci`, `npm run lint`, `npm test`, `npm run validate`; that external execution remains pending. To reproduce specifically in this signed local runtime, after npm ci:

```sh
npm install --force --no-save --package-lock=false @unrs/resolver-binding-wasm32-wasi
NAPI_RS_FORCE_WASI=1 npm test
```

The platform override installs a WASM module intended for the resolver's documented fallback; it does not bypass macOS code signing. All packages remain in the project-local node_modules. Installation also reported 19 moderate advisories; the full dependency audit needs separate review before production use. The production-only audit reported 0 vulnerabilities; its authentic output is preserved in production-audit.json. No forced dependency audit fixes were performed.

## Evidence files

Real local outputs: npm-install.txt, npm-ci.txt, dependency-update.txt, jest-runtime-workaround.txt, lint.txt, test.txt, validate.txt, production-audit.json, local-application-logs.txt, local-health.json, local-created-product.json, local-read-product.json.

The four requested screenshots and `oc-pipelines-app-logs.txt` do not exist because the corresponding real external runs do not exist. The local server log uses a different filename deliberately. Required screenshot screens and exact target names are documented in README. Run scripts/collect-evidence.sh only after genuine cluster execution. Do not submit local files as proof of remote runs.

## Remaining external work

Host this source in the authorized GitHub account, configure the real origin, push it and verify Actions. Configure an authorized OpenShift context, inspect the supported Tekton API/CLI image versions and cluster build policy, validate against the API server, apply resources, run the pipeline with the real repository URL and pushed commit SHA, verify PVC/task/run/deployment/Route states, then collect genuine screenshots/logs and actual GitHub file URLs. No placeholder URLs are presented as final evidence.

README contains exact reproduction/deployment commands. The PipelineRun URL intentionally starts empty and scripts/render-run.js refuses to render it without a real URL and full commit SHA. The application Deployment's pending-build image is configuration only and is replaced during deployment using the actual built image digest. Server-side schema validation, registry access, storage binding, image pulling and external route reachability cannot be certified locally.
