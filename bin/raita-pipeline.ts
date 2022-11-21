#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { getPipelineConfig } from '../lib/config';
import { RaitaPipelineStack } from '../lib/raita-pipeline';

const app = new cdk.App();

new RaitaPipelineStack(app, 'RAITA', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
const tags = getPipelineConfig().tags;
Object.entries(tags).forEach(([key, value]) => Tags.of(app).add(key, value));

app.synth();
