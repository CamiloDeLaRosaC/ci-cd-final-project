# Option 1 — Submission status

No GitHub repository URL or live OpenShift project is configured. Required external evidence is absent; no screenshots, remote logs, deployment states or workflow statuses have been fabricated.

| Task | Points | Required deliverable | Status | Evidence/blocker |
| --- | ---: | --- | --- | --- |
| 1 | 2 | GitHub URL of README.md | BLOCKED | README.md implemented locally; no matching connected repository or remote configured. Actual URL unavailable. |
| 2 | 4 | GitHub URL of .github/workflows/workflow.yml | BLOCKED | Workflow implemented and structurally validated; actual hosted URL unavailable. |
| 3 | 4 | GitHub URL of .tekton/tasks.yml | BLOCKED | Cleanup and unit-tests Tasks implemented; actual hosted URL unavailable. |
| 4 | 2 | submission/oc-pipelines-console-pvc-details.png | BLOCKED | No cluster context or oc/kubectl; PVC manifest prepared but Bound state unknown. Screenshot absent. |
| 5 | 2 | submission/cicd-github-validate.png | BLOCKED | No pushed repository/run. Local lint/tests do not prove a successful GitHub Actions run. Screenshot absent. |
| 6 | 2 | submission/oc-pipelines-oc-final.png | BLOCKED | Pipeline implemented; not applied to a live OpenShift cluster. Screenshot absent. |
| 7 | 2 | submission/oc-pipelines-oc-green.png | BLOCKED | PipelineRun configurable; not executed on a live cluster. Screenshot absent. |
| 8 | 2 | submission/oc-pipelines-app-logs.txt | BLOCKED | Application not deployed to OpenShift. Cluster application logs absent. |

## Implementation status

README, application, lockfile, CI workflow, Tekton tasks/pipeline, configurable PipelineRun, PVC, Deployment, Service, Route, ImageStream, ServiceAccount and namespaced RBAC are prepared. External schema compatibility and deployment: **PENDING VERIFICATION**.

Local results and environment findings are recorded in FINAL_REPORT.md and the accompanying real command logs. `scripts/collect-evidence.sh` retrieves actual cluster outputs once access is configured. Capture screenshots using the real screens described in README. After hosting and successful runs, replace the blocked entries with exact verified URLs and evidence paths. A path naming a missing file does not count as evidence.

## Verified local checks — COMPLETE

- ESLint: exit 0, no errors.
- Jest: 14/14 tests passed; src/app.js coverage 100% in all four metrics.
- YAML/reference checks: 16 resources passed local validation.
- Production dependency audit: 0 vulnerabilities reported.
- Real local startup, health, create/read requests: passed.

These results do not change the eight external grading items from BLOCKED.
