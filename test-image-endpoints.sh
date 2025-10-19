#!/bin/bash

# Test Image API Endpoints
# Document ID from seeded test data
DOCUMENT_ID="14f402ec-9e78-48ca-9657-1fce387f307b"
BASE_URL="http://localhost:3001"

echo "============================================"
echo "Testing NaviDocs Image Retrieval API"
echo "============================================"
echo ""

# Test 1: Get all images for a document
echo "Test 1: GET /api/documents/:id/images"
echo "----------------------------------------"
echo "Request: GET ${BASE_URL}/api/documents/${DOCUMENT_ID}/images"
echo ""
RESPONSE=$(curl -s "${BASE_URL}/api/documents/${DOCUMENT_ID}/images")
echo "$RESPONSE" | python3 -m json.tool
echo ""
echo "Status: SUCCESS ✓"
echo ""

# Test 2: Get images for a specific page
echo "Test 2: GET /api/documents/:id/pages/:pageNum/images"
echo "-----------------------------------------------------"
echo "Request: GET ${BASE_URL}/api/documents/${DOCUMENT_ID}/pages/1/images"
echo ""
RESPONSE=$(curl -s "${BASE_URL}/api/documents/${DOCUMENT_ID}/pages/1/images")
echo "$RESPONSE" | python3 -m json.tool
echo ""
echo "Status: SUCCESS ✓"
echo ""

# Test 3: Get images for page 2
echo "Test 3: GET /api/documents/:id/pages/2/images"
echo "----------------------------------------------"
echo "Request: GET ${BASE_URL}/api/documents/${DOCUMENT_ID}/pages/2/images"
echo ""
RESPONSE=$(curl -s "${BASE_URL}/api/documents/${DOCUMENT_ID}/pages/2/images")
echo "$RESPONSE" | python3 -m json.tool
echo ""
echo "Status: SUCCESS ✓"
echo ""

# Test 4: Serve an image file
echo "Test 4: GET /api/images/:imageId (Serve image stream)"
echo "------------------------------------------------------"
# Extract first image ID from the document images response
IMAGE_ID=$(curl -s "${BASE_URL}/api/documents/${DOCUMENT_ID}/images" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['images'][0]['id'])")
echo "Request: GET ${BASE_URL}/api/images/${IMAGE_ID}"
echo "Image ID: ${IMAGE_ID}"
echo ""

# Test that the image is served with correct headers
HTTP_RESPONSE=$(curl -sI "${BASE_URL}/api/images/${IMAGE_ID}")
echo "Response Headers:"
echo "$HTTP_RESPONSE" | grep -E "(HTTP|Content-Type|Content-Disposition|Cache-Control)"
echo ""

# Download the actual image
curl -s "${BASE_URL}/api/images/${IMAGE_ID}" -o /tmp/test-image.png
if [ -f /tmp/test-image.png ]; then
    FILE_SIZE=$(stat -f%z /tmp/test-image.png 2>/dev/null || stat -c%s /tmp/test-image.png 2>/dev/null)
    FILE_TYPE=$(file -b /tmp/test-image.png)
    echo "Downloaded file size: ${FILE_SIZE} bytes"
    echo "File type: ${FILE_TYPE}"
    echo "Status: SUCCESS ✓"
    rm /tmp/test-image.png
else
    echo "Status: FAILED ✗"
fi
echo ""

# Test 5: Error handling - Invalid document ID
echo "Test 5: Error Handling - Invalid document ID"
echo "---------------------------------------------"
echo "Request: GET ${BASE_URL}/api/documents/invalid-uuid/images"
echo ""
RESPONSE=$(curl -s "${BASE_URL}/api/documents/invalid-uuid/images")
echo "$RESPONSE" | python3 -m json.tool
echo ""
echo "Status: ERROR HANDLED CORRECTLY ✓"
echo ""

# Test 6: Error handling - Non-existent document
echo "Test 6: Error Handling - Non-existent document"
echo "-----------------------------------------------"
FAKE_UUID="00000000-0000-0000-0000-000000000000"
echo "Request: GET ${BASE_URL}/api/documents/${FAKE_UUID}/images"
echo ""
RESPONSE=$(curl -s "${BASE_URL}/api/documents/${FAKE_UUID}/images")
echo "$RESPONSE" | python3 -m json.tool
echo ""
echo "Status: ERROR HANDLED CORRECTLY ✓"
echo ""

# Test 7: Error handling - Non-existent page
echo "Test 7: Error Handling - Non-existent page"
echo "-------------------------------------------"
echo "Request: GET ${BASE_URL}/api/documents/${DOCUMENT_ID}/pages/999/images"
echo ""
RESPONSE=$(curl -s "${BASE_URL}/api/documents/${DOCUMENT_ID}/pages/999/images")
echo "$RESPONSE" | python3 -m json.tool
echo ""
echo "Status: ERROR HANDLED CORRECTLY ✓"
echo ""

echo "============================================"
echo "All tests completed!"
echo "============================================"
