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

Bootstrap CDK for the AWS account, if that has not been done yet: `ENVIRONMENT=dev BRANCH=main cdk bootstrap`. ENVIRONMENT and BRANCH don't really matter here, but the stack requires you to set them.

In the pipeline deployment **AWS account** and **region** are set based on the AWS profile used to deploy the
pipeline - either use your cli default profile or specify the profile with --profile flag when deploying the pipeline.
TODO: TEST HOW WORKS WITH NPM COMMAND WITH --

There are three variables that determine how the pipeline and the application itself are deployed to the AWS Account. These variables are the following

- ENVIRONMENT: Required environment variable. Allowed values **dev** and **prod**. Determines the stack resource performance characteristics and also how other environment variables, BRANCH and STACK_ID work.
- BRANCH: Determines from which Github branch source code is pulled for the deployment. The value must correspond to a branch that exists in Github repository. If ENVIRONMENT is **prod**, the branch is always fixed to follow production branch and this environment variable is ignored. If ENVIRONMENT is anything else than **prod**, BRANCH must be given.
- STACK_ID: An optional variable. Determines the id for the stack to be deployed for feature brances: STACK_ID is ignored if ENVIRONMENT is prod or BRANCH is set to correspond to development or production branch in Github.

To initalize the pipeline, run pipeline:deploy script providing environment, branch and stackId as command line arguments with optionally also providing your AWS profile:

    npm run pipeline:deploy --environment=dev --branch=main
    npm run pipeline:deploy --environment=dev --branch=feature/RAITA-07-test
    npm run pipeline:deploy --environment=dev --branch=feature/RAITA-07-test --stackid=mytestbranch
    npm run pipeline:deploy --environment=dev --branch=feature/RAITA-07-test --stackid=mytestbranch -- --profile myFavouriteAWSProfile

The script will deploy CodePipeline, which will automatically set up the environment. The pipeline will automatically update itself and deploy any changes made to the app based on .

Note! A valid GitHub token with the scopes `admin:repo_hook, public_repo, repo:status, repo_deployment` is required to be in place in AWS Secrets Manager. Refer to `.lib/raita-pipeline.ts` for authenticationToken name to be set. Set the token as plaintext value.

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
