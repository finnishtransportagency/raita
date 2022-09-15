# Working title @raita/raita

- [Getting started](#getting-started)
- [Setup](#setup)
- [Scripts](#scripts)
- [Tools](#tools)

## Getting started

## Setup

Check node version. You can use `nvm use` to automatically set the right version.
Run ` npm i`

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
