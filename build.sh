#!/bin/bash
rm -rf layers/nodejs.zip
cd layers/nodejs
rm -rf layers/nodejs/node_modules
rm -rf layers/nodejs/*.json
npm init -y
npm install --save aws-sdk 
npm install --saev uuid
cd ..
zip -r --quiet nodejs.zip nodejs
cd ..
