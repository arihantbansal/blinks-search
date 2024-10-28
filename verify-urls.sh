#!/bin/bash

# Function to check if a URL is valid (returns 200 OK)
check_url() {
    local url="$1"
    # Skip if URL is empty
    if [ -z "$url" ]; then
        return 1
    fi    # <-- Changed '}' to 'fi'
    
    # Use curl to check URL
    # -L: follow redirects
    # -s: silent mode
    # -f: fail silently on HTTP errors
    # -o /dev/null: discard output
    # --connect-timeout 5: timeout after 5 seconds
    if curl -L -s -f -o /dev/null --connect-timeout 5 "$url"; then
        return 0
    else
        return 1
    fi
}

# Extract all icon URLs from the JSON file using jq
echo "Extracting URLs from JSON file..."
urls=$(jq -r '.[] | select(.icon != null) | .icon' blinks-data.json)

# Initialize counters
total=0
valid=0
invalid=0

# Check each URL
echo "Checking URLs..."
while IFS= read -r url; do
    ((total++))
    if check_url "$url"; then
        echo "✅ Valid: $url"
        ((valid++))
    else
        echo "❌ Invalid: $url"
        ((invalid++))
    fi
done <<< "$urls"

# Print summary
echo -e "\nSummary:"
echo "Total URLs checked: $total"
echo "Valid URLs: $valid"
echo "Invalid URLs: $invalid"
