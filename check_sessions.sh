#!/bin/bash

# Session and Video Diagnostic Script
# Checks if sessions have matching videos

echo "========================================"
echo "Session & Video Linking Diagnostic"
echo "========================================"
echo ""

cd ~/timelapsepi/timelapse_data

echo "📁 Image Sessions:"
if [ -d "images" ]; then
    for dir in images/*/; do
        if [ -d "$dir" ]; then
            session=$(basename "$dir")
            if [ "$session" != "preview" ]; then
                frame_count=$(ls -1 "$dir"frame_*.jpg 2>/dev/null | wc -l)
                echo "  • $session ($frame_count frames)"
            fi
        fi
    done
else
    echo "  ⚠️  images/ directory not found"
fi

echo ""
echo "🎥 Compiled Videos:"
if [ -d "videos" ]; then
    for video in videos/*.mp4; do
        if [ -f "$video" ]; then
            name=$(basename "$video" .mp4)
            size=$(du -h "$video" | cut -f1)
            echo "  • $name ($size)"
        fi
    done
    
    video_count=$(ls -1 videos/*.mp4 2>/dev/null | wc -l)
    if [ $video_count -eq 0 ]; then
        echo "  ⚠️  No videos found"
    fi
else
    echo "  ⚠️  videos/ directory not found"
fi

echo ""
echo "🔗 Checking Links:"
if [ -d "images" ]; then
    for dir in images/*/; do
        if [ -d "$dir" ]; then
            session=$(basename "$dir")
            if [ "$session" != "preview" ]; then
                video_file="videos/${session}.mp4"
                if [ -f "$video_file" ]; then
                    echo "  ✅ $session → has video"
                else
                    frame_count=$(ls -1 "$dir"frame_*.jpg 2>/dev/null | wc -l)
                    if [ $frame_count -gt 0 ]; then
                        echo "  ⚠️  $session → no video (but has $frame_count frames)"
                    fi
                fi
            fi
        fi
    done
fi

echo ""
echo "🗑️  Preview Folder Check:"
if [ -d "images/preview" ]; then
    frame_count=$(ls -1 "images/preview/"frame_*.jpg 2>/dev/null | wc -l)
    echo "  ⚠️  Preview folder exists with $frame_count frames"
    echo "     (This folder should be ignored in UI)"
else
    echo "  ✅ No preview folder found"
fi

echo ""
echo "========================================"
echo "Diagnostic Complete"
echo "========================================"
echo ""
echo "💡 Tips:"
echo "• Sessions without videos can be compiled via UI"
echo "• Preview folder is automatically ignored"
echo "• Session names should match: YYYYMMDD_HHMMSS"
