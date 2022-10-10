#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { RaitaPipelineStack } from '../lib/raita-pipeline';

const app = new cdk.App();

new RaitaPipelineStack(app, 'RAITA', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

app.synth();
