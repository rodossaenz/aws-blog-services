#!/bin/bash
find . -type f -name '*.js' -not -path "./node_modules/*" -delete
find . -type f -name '*.d.ts' -not -path "./node_modules/*" -delete
find . -type f -name '*.zip' -not -path "./node_modules/*" -delete