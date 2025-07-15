#!/bin/bash

# Create a zip named threadcub-extension.zip with all necessary files
zip -r threadcub-extension.zip . -x "*.DS_Store" -x "*.git*" -x "*node_modules*" -x "*.zip"

echo "✅ Extension zipped as threadcub-extension.zip"
