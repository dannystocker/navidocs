#!/bin/bash

echo "=== REDIS GOLDEN INDEX VALIDATION ==="
echo ""

echo "Checking Golden Index namespace..."
file_count=$(redis-cli SCARD 'navidocs:remediated_2025:index')
echo "Files in Golden Index: $file_count"
echo ""

echo "Checking total remediated_2025 keys..."
total_keys=$(redis-cli KEYS 'navidocs:remediated_2025:*' | wc -l)
echo "Total keys in remediated_2025 namespace: $total_keys"
echo ""

echo "Sample: First 10 index members..."
redis-cli SMEMBERS 'navidocs:remediated_2025:index' | head -10
echo ""

echo "Testing sample file retrieval (restore_chaos.sh)..."
restore_script=$(redis-cli --raw GET 'navidocs:remediated_2025:file:restore_chaos.sh' | wc -c)
echo "restore_chaos.sh size: $restore_script bytes"

if [ "$restore_script" -gt "10000" ]; then
    echo "✅ Sample file retrieval successful"
else
    echo "⚠️ Sample file retrieval issue (expected >10000 bytes, got $restore_script)"
fi

echo ""
echo "Golden Index Health Check..."
if [ "$file_count" -eq "986" ]; then
    echo "✅ Golden Index intact (986/986 files)"
else
    echo "⚠️ Golden Index count: $file_count/986"
fi
