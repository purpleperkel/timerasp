#!/bin/bash

# Quick Fix Script
# Restarts service and clears cache

echo "🔧 Quick Fix - Refreshing TimelapsePI"
echo ""

# Restart the service
echo "🔄 Restarting TimelapsePI service..."
sudo systemctl restart timelapsepi

# Wait for it to start
sleep 3

# Check status
if systemctl is-active --quiet timelapsepi; then
    echo "✅ Service restarted successfully"
    echo ""
    echo "📱 Next steps:"
    echo "1. Open your browser to http://$(hostname -I | awk '{print $1}'):5000"
    echo "2. Press Ctrl+Shift+R to hard refresh (clear cache)"
    echo "3. You should see 'System Controls' section at the bottom"
    echo ""
    echo "If you still don't see it, run: ./diagnostics.sh"
else
    echo "❌ Service failed to start"
    echo "Check logs: sudo journalctl -u timelapsepi -n 20"
fi
