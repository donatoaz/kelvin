#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { KelvinStack } from '../lib/kelvin-stack';

const app = new cdk.App();
new KelvinStack(app, 'KelvinStack');
