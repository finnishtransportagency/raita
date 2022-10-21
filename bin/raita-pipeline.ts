#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { RaitaPipelineStack } from '../lib/raita-pipeline';
import { RaitaStack } from '../lib/raita-stack';

const app = new cdk.App();

// new RaitaPipelineStack(app, 'RAITA', {
//   env: {
//     account: process.env.CDK_DEFAULT_ACCOUNT,
//     region: process.env.CDK_DEFAULT_REGION,
//   },
// });

new RaitaStack(app, 'OS-DEBUG', {
  raitaEnv: 'dev',
  stackId: 'OS-DEBUG',
});

app.synth();
