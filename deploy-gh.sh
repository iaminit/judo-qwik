#!/bin/bash
# Deploy script for GitHub Pages

# 1. Clean previous build
rm -rf github-pages
rm -rf dist

# 2. Build for Static
# Using the existing static adapter
echo "Building client..."
npm run build.client

echo "Building static site..."
npm run build.static

# 3. Prepare github-pages directory
echo "Moving files to github-pages folder..."
mv dist github-pages

# 4. Optional: Add .nojekyll to bypass Jekyll processing on GH Pages
touch github-pages/.nojekyll

echo "✅ Static build ready in 'github-pages' directory."
