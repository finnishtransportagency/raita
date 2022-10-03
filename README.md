# Working title @raita/raita

- [Getting started](#getting-started)
- [Setup](#setup)
- [Scripts](#scripts)
- [Tools](#tools)

## Getting started

## Setup

### Local dev

Check node version. You can use `nvm use` to automatically set the right version.
Run ` npm i`

### Pipeline

Add a pipeline synth and deployment with matching endings to package.json similar to `synth:pipeline:dev` and `deploy:pipeline:dev`. Set preferred environment name (matching with script name) and branch to deploy from.

- ENVIRONMENT environment variable determines TO BE CONTINUED
- BRANCH environment variable determines the version control branch TO BE CONTINUED

Run the deployment script with credentials for the preferred AWS-account. The script will deploy CodePipeline, which will automatically set up the environment. The pipeline will automatically update itself and deploy any changes made to the app.

Note! A valid GitHub token with the scopes `admin:repo_hook, public_repo, repo:status, repo_deployment` is required to be had in AWS Secrets Manager. Refer to `./lambda/config/index.ts` for authenticationToken name to be set. Set the token as plaintext value.

Reference for pipeline setup: https://docs.aws.amazon.com/cdk/v2/guide/cdk_pipeline.html

## Scripts

## Tools

## Rules

### Branch management and naming

Based on GitLab Flow (see: https://docs.gitlab.com/ee/topics/gitlab_flow.html). Feature branches are branched from `main`.

Feature branchers should be name with the following naming convention:
commit_type/project_code-issue_number-feature_descriptive_name
E.g. `feature/RAITA-12345-awesome-new-feature`
If there is no issue, skip that part.

### Pull Requests

Feature branches are to be merged to `main` via Pull Requests. Use squash merging by default. If you need to retain intermittent commits for some reason, use regular merging in such case.

Naming: commit_type: PROJECT_CODE-ISSUE_NUMBER Description
E.g. `feat: RAITA-12345 Awesome new feature`

All status checks and a review need to pass to be able to merge the PR. For production updates, make a PR from `main` to `prod`.

### Commit naming

Conventional commits (see: https://www.conventionalcommits.org/en/v1.0.0/), with the addition of a ticketing issue (if applicable/available).
E.g.

```
feat(api)!: RAITA-12345 Awesome new feature

Remade API to be more awesome, but with breaking changes
```
