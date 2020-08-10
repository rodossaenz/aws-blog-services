#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AwsBlogServicesStack } from '../lib/aws-blog-services-stack';

const app = new cdk.App();
new AwsBlogServicesStack(app, 'rodosdev-services-stack');