#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AwsBlogServerlessStack } from '../lib/aws-blog-serverless-stack';

const app = new cdk.App();
new AwsBlogServerlessStack(app, 'AwsBlogServerlessStack');
