# Working title @raita/raita

- [Getting started](#getting-started)
- [Setup](#setup)
- [Scripts](#scripts)
- [Tools](#tools)

## Getting started

## Setup

### Frontend

Instructions for running the frontend locally are in the [Frontend README](/frontend/README.md).

### Local dev

Check node version. You can use `nvm use` to automatically set the right version.
Run ` npm i` and `npm run prisma:generate`

### Pipeline

Bootstrap CDK for the AWS account, if that has not been done yet: `ENVIRONMENT=dev BRANCH=main STACK_ID=main cdk bootstrap`. ENVIRONMENT and BRANCH don't really matter here, but the stack requires you to set them.

In the pipeline deployment **AWS account** and **region** are set based on the AWS profile used to deploy the
pipeline - either use your cli default profile or specify the profile with --profile flag when deploying the pipeline. Remember to update ~/.aws/config before running bootstrap so that it'll use the right region.

There are three variables that determine how the pipeline and the application itself are deployed to the AWS Account. These variables are listed below in format [ENVIRONMENT VARIABLE] --> [deduced stack variable]

- **ENVIRONMENT --> env**: Required environment variable that determines stack **env**. Allowed values `dev` and `prod`. Determines the stack resource performance characteristics and also how other environment variables, BRANCH and STACK_ID work. Also sets removalPolicy for stack resources.
- **BRANCH --> branch**: Required environment variable that determines **branch** variable which controls from which Github branch source code is pulled for the deployment. The value must correspond to a branch that exists in Github repository. Note: If ENVIRONMENT is `prod`, the branch is always fixed to follow production branch and this environment variable is ignored. If ENVIRONMENT is anything else than `prod`, BRANCH must be given.
- **STACK_ID --> stackId**: Required environment variable that determines **stackId** which gives name to the stack and is basis for naming of the stack resources. Production branch and development main branch are special cases where the **STACK_ID** name must match with the **BRANCH**. The STACK_ID can only contain alphanumeric characters and hyphens.

Note! Naming of certain AWS resources must be globally unique, these resources in Raita Stack include buckets and domains (OpenSearch, UserPool, API Gateway). Current naming scheme does not support using the same stackId in multiple AWS Accounts. Using the same name will lead into naming collisions and thus deployment failure.

To set up a new pipeline, run the deployment script `pipeline:deploy` providing environment, branch and stackId as command line arguments with optionally also providing your AWS profile (here environment, branch and stackid correspond to variables explained above):

    npm run pipeline:deploy --environment=dev --branch=feature/RAITA-07-test --stackid=mytestbranch
    npm run pipeline:deploy --environment=dev --branch=feature/RAITA-07-test --stackid=mytestbranch -- --profile myFavouriteAWSProfile

The script will deploy CodePipeline, which will automatically set up the environment. The pipeline will automatically update itself and deploy any changes made to the app based on changes in the defined version control branch.

Note! `pipeline:synth` script is used by the pipeline in the build step: If you update the `pipeline:synth` script name, you need to have the old script available for at least one commit in the followed branch or you have to rerun the deployment script by hand.

Note! A valid GitHub token with the scopes `admin:repo_hook, public_repo, repo:status, repo_deployment` is required to be in place in AWS Secrets Manager. Refer to `.lib/raita-pipeline.ts` for authenticationToken name to be set. Set the token as plaintext value.
Note! If you only update the value of the github token in Secrets Manager, you have to reconnect Github with the CodePipeline. AWS CodePipeline -> Pipeline -> {name_of_pipeline} -> edit pipeline : Edit Source stage and follow the instructions.

Note! If deployment fails to Internal Failure, check that you have GitHub token in _Secrets Manager_!

Reference for pipeline setup: https://docs.aws.amazon.com/cdk/v2/guide/cdk_pipeline.html

## Accessing dev environment RAITA-api directly via bastion host

In development environment it is possible to call Raita-api directly via bastion host connection.

For local frontend development the recommended way is to route api requests from the frontend to this bastion host pipe. Instructions for this are in the [Frontend README](/frontend/README.md).

### Installations

Install AWS CLI and Session Manager plugin. Example for MacOS:

```
brew install awscli
brew install --cask session-manager-plugin
```

### Connecting to main development stack Raita-api

Copy `.env.bastion.example` as `.env.bastion` and fill the parameters. Refresh your local AWS access credentials in ~/.aws/credentials (if you haven't done so already) and run

```
./bastion-raita-api-main-pipe.sh
```

This will set up a pipe to the bastion host using AWS SSM on localhost:3001. These are then piped to the Raita-API ALB. If you get "Forbidden"-error, you need to refresh your credentials in `~/.aws/credentials`. For this to keep working, `bastion-backend-pipe.sh` locally needs to be up and running.

### Connecting to feature stack Raita-api

Go to AWS console > EC2 > Select bastion instance > Connect > Session Manager > Connect
Run following script in the window that opens for the EC2:

```
sudo socat TCP4-LISTEN:3003,reuseaddr,fork TCP:ALB_DNS:80
```

where you replace ALB_DNS with the Raita-api ALB DNS name. For ALB, you can get this from AWS console under EC2 > Load Balancers > Select your ALB > DNS name in the Description.

Once you have your connection set up, locally on your computer run

```
./bastion-raita-api-feature-pipe.sh
```

and then you can connect to bastion host using AWS SSM on localhost:3003. These are then piped to the feature ALB. For this to keep working, both the socat on the bastion and `bastion-raita-api-feature-pipe.sh` locally need to be up and running.

Note! If someone else is also doing this, there might be a conflict with the port listening using socat ("Address already in use"). In such case, use a different port for socat instead of 3003. In this case, you also need to update the "portNumber" value in `bastion-feat-backend-pipe.sh`.

#### Fixing socat problems

If for some reason socat is not working for a specific piping, you can set it up again by hand. Connect to the EC2 with SSM and run following after adding values as instructed below:

```
nohup sudo socat TCP4-LISTEN:LISTEN_PORT_TO_FIX,reuseaddr,fork TCP:DNS_TO_REDIRECT:PORT_TO_PIPE &
```

where `LISTEN_PORT_TO_FIX` is the port you want to listen on (e.g. 3004), `DNS_TO_REDIRECT` is where you want to redirect to and `PORT_TO_PIPE` is port in the receiving end. With ALB, the port that ALB listens to is port 80 and DNS is the DNS of the ALB (check AWS console).

## Scripts

- prisma:create-schema
  Create the prisma schema from scratch. This will initialize a new postgres database with docker and create tables with the flyway migration scripts. The Prisma client will inspect the database and create the schema from that. Requires sudo permissions.

  Prisma does not support table inheritance so this will remove the id definitions from mittaus tables with inheritance. Those need to be fixed by hand if this script is rerun. TODO: how to fix this.

- prisma:generate
  Generate the prisma client library based on Prisma schema file. This needs to be run along with npm install and whenever Prisma schema changes.

- graphql:codegen
  Generate types for Apollo server. This needs to be rerun whenever the .graphql files are changed.

## Tests

TODO: describe backend tests

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

All status checks and a review need to pass to be able to merge the PR. For production updates, make a PR from `main` to `prod`. After the production update has gone through the pipeline, invalidate the CloudFront cache manually.

### Commit naming

Conventional commits (see: https://www.conventionalcommits.org/en/v1.0.0/), with the addition of a ticketing issue (if applicable/available).
E.g.

```
feat(api)!: RAITA-12345 Awesome new feature

Remade API to be more awesome, but with breaking changes
```

### Possible problems

If you make changes on the CDK stack files under /lib folder, in some occasions it can
fail the update on Cloudformation.

One known example of this was after separating a single lambda function into two, without
modifying the original listener target group, it led into a conflict when updating.
The original target group couldn't be overwritten and it always led to failure.
In the end the only way to get it work, was to remove all references of the old target group
on the stack template. (Cloudformation -> Failed stack -> template tab) and updating that
stack with the modified template. This removed the old target group and its dependencies.
After this the pipeline could be updated succesfully, and it created all the resources correctly.
Some references:
https://aws.amazon.com/premiumsupport/knowledge-center/cloudformation-update-rollback-failed/
https://aws.amazon.com/premiumsupport/knowledge-center/failing-stack-updates-deleted/
https://www.youtube.com/watch?v=GwbDjuy00Jw
