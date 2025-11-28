#!/bin/bash

# API Endpoint Test Script
# Tests if the camera controls API endpoint works

echo "========================================"
echo "Camera Controls API Test"
echo "========================================"
echo ""

# Get the service
IP=$(hostname -I | awk '{print $1}')
PORT=5000
URL="http://${IP}:${PORT}"

echo "🌐 Testing TimelapsePI at: $URL"
echo ""

# Test 1: Get current controls
echo "📥 Test 1: GET current camera controls"
echo "   URL: ${URL}/api/camera/controls"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "${URL}/api/camera/controls")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_CODE:")

echo "   Status: $HTTP_CODE"
echo "   Response: $BODY"
echo ""

# Test 2: Set camera controls
echo "📤 Test 2: POST camera controls"
echo "   Setting brightness=200, contrast=40, saturation=80"

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"brightness":200,"contrast":40,"saturation":80,"exposure_auto":3}' \
    "${URL}/api/camera/controls")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_CODE:")

echo "   Status: $HTTP_CODE"
echo "   Response: $BODY"
echo ""

# Test 3: Verify changes
echo "🔍 Test 3: Verify changes were applied"
sleep 1

RESPONSE=$(curl -s "${URL}/api/camera/controls")
echo "   New values: $RESPONSE"
echo ""

# Test 4: Check actual v4l2 values
echo "✅ Test 4: Check actual camera values via v4l2-ctl"
for device in /dev/video*; do
    if v4l2-ctl --device="$device" --all 2>/dev/null | grep -q "Video Capture"; then
        echo "   Device: $device"
        v4l2-ctl --device="$device" --get-ctrl=brightness 2>/dev/null | grep -v "unable"
        v4l2-ctl --device="$device" --get-ctrl=contrast 2>/dev/null | grep -v "unable"
        v4l2-ctl --device="$device" --get-ctrl=saturation 2>/dev/null | grep -v "unable"
        break
    fi
done
echo ""

echo "========================================"
echo "Checking Service User"
echo "========================================"
echo ""

# Check what user the service runs as
SERVICE_USER=$(systemctl show -p User timelapsepi | cut -d= -f2)
echo "🔧 Service runs as user: $SERVICE_USER"

# Check if that user is in video group
if groups $SERVICE_USER 2>/dev/null | grep -q video; then
    echo "✅ User $SERVICE_USER is in 'video' group"
else
    echo "❌ User $SERVICE_USER is NOT in 'video' group"
    echo ""
    echo "💡 Fix with:"
    echo "   sudo usermod -a -G video $SERVICE_USER"
    echo "   sudo systemctl restart timelapsepi"
fi

echo ""
echo "📋 Service log (last 10 lines):"
sudo journalctl -u timelapsepi -n 10 --no-pager

echo ""
echo "========================================"
echo "Test Complete"
echo "========================================"
