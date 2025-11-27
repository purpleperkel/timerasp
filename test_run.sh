#!/bin/bash

# TimelapsePI Quick Test Script
# Run this to test the application without installing as a service

echo "🚀 Starting TimelapsePI in test mode..."
echo ""
echo "This will start the server on port 5000"
echo "Press Ctrl+C to stop"
echo ""
echo "Access the interface at:"
echo "  • http://localhost:5000"
echo "  • http://$(hostname -I | awk '{print $1}'):5000"
echo ""

# Check for Python dependencies
if ! python3 -c "import flask" 2>/dev/null; then
    echo "⚠️  Flask not installed. Installing dependencies..."
    pip3 install --user -r requirements.txt
fi

# Check for ffmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo "⚠️  ffmpeg not found. Install with: sudo apt-get install ffmpeg"
fi

# Check for camera tools
if ! command -v libcamera-still &> /dev/null && ! command -v fswebcam &> /dev/null; then
    echo "⚠️  No camera tools found."
    echo "    Install with: sudo apt-get install libcamera-apps fswebcam"
fi

echo ""
echo "Starting server..."
echo ""

# Run the app
cd "$(dirname "$0")"
python3 app.py
