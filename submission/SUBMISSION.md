# Option 1 — Submission status

Repository: https://github.com/CamiloDeLaRosaC/ci-cd-final-project
Visibility: public, explicitly authorized by the owner. Public URL accessibility is verified separately.

| Task | Points | Verified deliverable | Status |
| --- | ---: | --- | --- |
| 1 | 2 | https://github.com/CamiloDeLaRosaC/ci-cd-final-project/blob/main/README.md | COMPLETE — published |
| 2 | 4 | https://github.com/CamiloDeLaRosaC/ci-cd-final-project/blob/main/.github/workflows/workflow.yml | COMPLETE — published and executed successfully |
| 3 | 4 | https://github.com/CamiloDeLaRosaC/ci-cd-final-project/blob/main/.tekton/tasks.yml | COMPLETE — published; cluster verification pending |
| 4 | 2 | submission/oc-pipelines-console-pvc-details.png | BLOCKED — no OpenShift context; screenshot absent |
| 5 | 2 | submission/cicd-github-validate.png and submission/github-actions-success.txt | COMPLETE — real successful Actions run and all-step logs |
| 6 | 2 | submission/oc-pipelines-oc-final.png | BLOCKED — OpenShift pipeline screenshot absent |
| 7 | 2 | submission/oc-pipelines-oc-green.png | BLOCKED — OpenShift PipelineRun not executed |
| 8 | 2 | submission/oc-pipeline-application-logs.txt | BLOCKED — no deployed OpenShift application logs |

## Verified GitHub Actions execution

https://github.com/CamiloDeLaRosaC/ci-cd-final-project/actions/runs/38189172899

Commit: ecd3c8f1e63a55f305f21ce08227ca94ab9ac251. Status: completed. Conclusion: success. The screenshot shows the real validate job and its checkout, Node setup, dependency installation, ESLint, Jest and manifest-validation steps. github-actions-run.json and github-actions-steps.json retain API-verified status/steps. github-actions-success.txt is the authentic downloaded job log.

## Verified local checks

ESLint passed; Jest 14/14 tests passed with 100% coverage of src/app.js; 16 YAML resources passed structural checks; production audit reported 0 vulnerabilities. Local startup, health and CRUD smoke checks passed.

OpenShift and server-side Tekton schema validation remain pending. No OpenShift screenshots or logs have been fabricated. See README for exact commands and manual screenshot targets.

## Exact grading-rubric alignment
PVC requests 1Gi with storageClassName skills-network-learner. Pipeline stage labels are cleanup, git-clone, eslint, jest, buildah, deploy. Application defaults to port 8000 and prints SERVICERUNNING in its startup banner. These configurations do not prove cluster execution; Questions 5–8 still require genuine lab screenshots/logs.
