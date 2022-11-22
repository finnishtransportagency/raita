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

Reference for pipeline setup: https://docs.aws.amazon.com/cdk/v2/guide/cdk_pipeline.html

## Connecting to AWS dev environment endpoints

### Installations

Install AWS CLI and Session Manager plugin. Example for MacOS:

```
brew install awscli
brew install --cask session-manager-plugin
```

### Connecting to development stack resources

#### Connecting to Raita-api

Copy `.env.bastion.example` as `.env.bastion` and fill the parameters. Refresh your local AWS access credentials in ~/.aws/credentials (if you haven't done so already) and run

```
./bastion-raita-api-pipe.sh
```

This will set up a pipe to the bastion host using AWS SSM on localhost:3001. These are then piped to the ALB. If you get "Forbidden"-error, you need to refresh your credentials in `~/.aws/credentials`. For this to keep working, `bastion-backend-pipe.sh` locally needs to be up and running.

#### Connecting to Raita database

Do `.env.bastion` steps above if you have not done so already. Refresh local AWS credentials and run

```
./bastion-database-pipe.sh
```

This will set up a pipe to the bastion host using AWS SSM on localhost:3002. These are then piped to the DB. For this to keep working, `bastion-database-pipe.sh` locally needs to be up and running.

#### Connecting to feature stack Raita-api or Raita database

Go to AWS console > EC2 > Select bastion instance > Connect > Session Manager > Connect
Run following script in the window that opens for the EC2:

```
sudo socat TCP4-LISTEN:8001,reuseaddr,fork TCP:API_OR_DATABASE_DOMAIN:80
```

where you replace API_OR_DATABASE_DOMAIN with the domain of either the Raita-api ALB or database domain. For ALB, you can get this from AWS console under EC2 > Load Balancers > Select your ALB > DNS name in the Description. For database, you can get the information from Amazon OpenSearch Service > Dashboard > > Select your OpenSearch instance > Domain endpoint (VPC)

Once you have your connection set up, locally on your computer run

```
./bastion-feat-backend-pipe.sh
```

and then you can connect to bastion host using AWS SSM on localhost:3003. These are then piped to the feature ALB. For this to keep working, both the socat on the bastion and `bastion-feat-backend-pipe.sh` locally need to be up and running.

Note! If someone else is also doing this, there might be a conflict with the port listening using socat ("Address already in use"). In such case, use a different port for socat instead of 81. In this case, you also need to update the "portNumber" value in `bastion-feat-backend-pipe.sh`.

#### Fixing socat problems

If for some reason socat is not working for a specific piping, you can set it up again by hand. Connect to the EC2 with SSM and run following after adding values as instructed below:

```
nohup sudo socat TCP4-LISTEN:LISTEN_PORT_TO_FIX,reuseaddr,fork TCP:DNS_TO_REDIRECT:PORT_TO_PIPE &
```

where `LISTEN_PORT_TO_FIX` is the port you want to listen on (e.g. 80), `DNS_TO_REDIRECT` is where you want to redirect to and `PORT_TO_PIPE` is port in the receiving end. With ALB, port is 80 for poth and DNS is the DNS of the ALB (check AWS console). For database, port is 5432 for both and DNS can be checked from Parameter Store.

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
