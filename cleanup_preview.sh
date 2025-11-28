#!/bin/bash

# Cleanup Preview Folder Script
# Removes the preview folder that was showing up in sessions

echo "🧹 TimelapsePI Cleanup - Remove Preview Folder"
echo ""

PREVIEW_DIR="$HOME/timelapsepi/timelapse_data/images/preview"

if [ -d "$PREVIEW_DIR" ]; then
    echo "📁 Found preview folder at: $PREVIEW_DIR"
    
    # Count frames
    frame_count=$(ls -1 "$PREVIEW_DIR/"frame_*.jpg 2>/dev/null | wc -l)
    echo "   Contains $frame_count preview frames"
    echo ""
    
    read -p "Delete preview folder? (y/N) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$PREVIEW_DIR"
        echo "✅ Preview folder deleted"
        echo ""
        echo "💡 Note: Preview folder will be recreated when you use camera preview"
        echo "   But it will now be hidden from the Saved Sessions list"
    else
        echo "❌ Cancelled - preview folder kept"
    fi
else
    echo "✅ No preview folder found - nothing to clean up"
fi

echo ""
echo "🔄 Restart service to apply changes:"
echo "   sudo systemctl restart timelapsepi"
echo ""
echo "Then refresh your browser (Ctrl+Shift+R)"
