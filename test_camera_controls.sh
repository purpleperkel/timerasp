#!/bin/bash

# Camera Controls Test Script
# Tests if v4l2-ctl commands work for your camera

echo "========================================"
echo "Camera Controls Test"
echo "========================================"
echo ""

# Find video device
echo "🔍 Finding video device..."
for device in /dev/video*; do
    if v4l2-ctl --device="$device" --all 2>/dev/null | grep -q "Video Capture"; then
        VIDEO_DEVICE="$device"
        echo "✅ Found video capture device: $VIDEO_DEVICE"
        break
    fi
done

if [ -z "$VIDEO_DEVICE" ]; then
    echo "❌ No video capture device found"
    exit 1
fi

echo ""
echo "📋 Current Camera Controls:"
v4l2-ctl --device="$VIDEO_DEVICE" --list-ctrls | grep -E "(brightness|contrast|saturation|exposure)"

echo ""
echo "========================================"
echo "Testing Camera Control Changes"
echo "========================================"
echo ""

# Test brightness
echo "🔆 Testing Brightness Control..."
echo "   Current value:"
v4l2-ctl --device="$VIDEO_DEVICE" --get-ctrl=brightness

echo "   Setting to 150..."
if v4l2-ctl --device="$VIDEO_DEVICE" --set-ctrl=brightness=150 2>&1; then
    echo "   ✅ Brightness set successfully"
    echo "   New value:"
    v4l2-ctl --device="$VIDEO_DEVICE" --get-ctrl=brightness
else
    echo "   ❌ Failed to set brightness"
fi

echo ""
echo "🎨 Testing Contrast Control..."
echo "   Current value:"
v4l2-ctl --device="$VIDEO_DEVICE" --get-ctrl=contrast 2>/dev/null || echo "   (contrast not available)"

if v4l2-ctl --device="$VIDEO_DEVICE" --get-ctrl=contrast 2>/dev/null; then
    echo "   Setting to 40..."
    if v4l2-ctl --device="$VIDEO_DEVICE" --set-ctrl=contrast=40 2>&1; then
        echo "   ✅ Contrast set successfully"
        echo "   New value:"
        v4l2-ctl --device="$VIDEO_DEVICE" --get-ctrl=contrast
    else
        echo "   ❌ Failed to set contrast"
    fi
fi

echo ""
echo "🌈 Testing Saturation Control..."
echo "   Current value:"
v4l2-ctl --device="$VIDEO_DEVICE" --get-ctrl=saturation 2>/dev/null || echo "   (saturation not available)"

if v4l2-ctl --device="$VIDEO_DEVICE" --get-ctrl=saturation 2>/dev/null; then
    echo "   Setting to 70..."
    if v4l2-ctl --device="$VIDEO_DEVICE" --set-ctrl=saturation=70 2>&1; then
        echo "   ✅ Saturation set successfully"
        echo "   New value:"
        v4l2-ctl --device="$VIDEO_DEVICE" --get-ctrl=saturation
    else
        echo "   ❌ Failed to set saturation"
    fi
fi

echo ""
echo "========================================"
echo "Test Complete"
echo "========================================"
echo ""
echo "💡 If controls failed to set:"
echo "   1. Your camera might not support that control"
echo "   2. Check device permissions: ls -la $VIDEO_DEVICE"
echo "   3. Ensure you're in the 'video' group: groups"
echo ""
echo "🔧 To add yourself to video group:"
echo "   sudo usermod -a -G video $USER"
echo "   Then log out and back in"
