#!/bin/bash

# Check if file exists
if [ ! -f "blinks-data.json" ]; then
    echo "Error: blinks-data.json not found"
    exit 1
fi

# Use jq to find objects without an icon field
jq '.[] | select(has("icon") | not)' blinks-data.json

# Alternative: Print just the titles of objects without icons
# jq '.[] | select(has("icon") | not) | .title' blinks-data.json