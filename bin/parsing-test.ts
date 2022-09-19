#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import getConfig from '../lambda/config';
import { RaitaStack } from '../lib/raita-stack';

const app = new cdk.App();
// TODO: DECIDE IF SPECIFY ACCOUNT HERE.
// TODO: region now comes unelegantly from within lambda folder
const env = { region: getConfig().region };
new RaitaStack(app, 'Raita', { env });
