#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { RaitaPipelineStack } from '../lib/raita-pipeline';

const app = new cdk.App();

new RaitaPipelineStack(app, 'RAITA', {
  env: {
    account: '592798899605',
    region: 'eu-west-1',
  },
});

app.synth();
