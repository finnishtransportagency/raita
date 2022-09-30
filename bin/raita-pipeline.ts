#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { RaitaPipelineStack } from '../lib/raita-pipeline';

const app = new cdk.App();
new RaitaPipelineStack(app);

app.synth();
