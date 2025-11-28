#!/bin/bash

# TimelapsePI Diagnostic Script
# Checks installation and identifies issues

echo "========================================"
echo "TimelapsePI Diagnostics"
echo "========================================"
echo ""

# Check service status
echo "📊 Service Status:"
systemctl is-active timelapsepi && echo "✅ Service is running" || echo "❌ Service is not running"
echo ""

# Check files exist
echo "📁 File Check:"
[ -f ~/timelapsepi/app.py ] && echo "✅ app.py exists" || echo "❌ app.py missing"
[ -f ~/timelapsepi/templates/index.html ] && echo "✅ index.html exists" || echo "❌ index.html missing"
[ -f ~/timelapsepi/static/js/app.js ] && echo "✅ app.js exists" || echo "❌ app.js missing"
[ -f ~/timelapsepi/timelapsepi-sudoers ] && echo "✅ sudoers file exists" || echo "❌ sudoers file missing"
echo ""

# Check sudo permissions
echo "🔐 Sudo Permissions:"
if [ -f /etc/sudoers.d/timelapsepi ]; then
    echo "✅ Sudoers file installed"
    ls -la /etc/sudoers.d/timelapsepi
    sudo visudo -c -f /etc/sudoers.d/timelapsepi && echo "✅ Sudoers syntax valid" || echo "❌ Sudoers syntax error"
else
    echo "❌ Sudoers file NOT installed"
    echo "   Run: sudo cp ~/timelapsepi/timelapsepi-sudoers /etc/sudoers.d/timelapsepi"
fi
echo ""

# Check if system controls section exists in HTML
echo "🎨 UI Components:"
if grep -q "System Controls" ~/timelapsepi/templates/index.html; then
    echo "✅ System Controls section in HTML"
else
    echo "❌ System Controls section missing from HTML"
fi

if grep -q "videoModal" ~/timelapsepi/templates/index.html; then
    echo "✅ Video preview modal in HTML"
else
    echo "❌ Video preview modal missing from HTML"
fi
echo ""

# Check API endpoints
echo "🔌 API Endpoints (checking app.py):"
grep -q "def shutdown_system" ~/timelapsepi/app.py && echo "✅ Shutdown endpoint exists" || echo "❌ Shutdown endpoint missing"
grep -q "def reboot_system" ~/timelapsepi/app.py && echo "✅ Reboot endpoint exists" || echo "❌ Reboot endpoint missing"
grep -q "def restart_service" ~/timelapsepi/app.py && echo "✅ Restart service endpoint exists" || echo "❌ Restart service endpoint missing"
grep -q "def stream_video" ~/timelapsepi/app.py && echo "✅ Video stream endpoint exists" || echo "❌ Video stream endpoint missing"
echo ""

# Check logs for errors
echo "📋 Recent Logs (last 10 lines):"
sudo journalctl -u timelapsepi -n 10 --no-pager
echo ""

echo "========================================"
echo "Diagnostic Complete"
echo "========================================"
echo ""
echo "If system controls are missing:"
echo "1. Make sure you extracted ALL files from the tar.gz"
echo "2. Run: sudo systemctl restart timelapsepi"
echo "3. Clear your browser cache (Ctrl+Shift+R)"
echo "4. Check the logs above for errors"
