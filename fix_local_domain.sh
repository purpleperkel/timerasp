#!/bin/bash

# Fix timelapsepi.local domain
# Run this script to enable access via timelapsepi.local

echo "🔧 Fixing timelapsepi.local domain..."
echo ""

# Check if Avahi is installed and running
if ! systemctl is-active --quiet avahi-daemon; then
    echo "📦 Installing/starting Avahi daemon..."
    sudo apt-get update
    sudo apt-get install -y avahi-daemon avahi-utils
    sudo systemctl enable avahi-daemon
    sudo systemctl start avahi-daemon
fi

# Get current hostname
CURRENT_HOSTNAME=$(hostname)
echo "Current hostname: $CURRENT_HOSTNAME"
echo ""

# Ask if user wants to change hostname to timelapsepi
if [ "$CURRENT_HOSTNAME" != "timelapsepi" ]; then
    read -p "Change hostname to 'timelapsepi' for timelapsepi.local to work? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🏷️  Setting hostname to timelapsepi..."
        sudo hostnamectl set-hostname timelapsepi
        
        # Update /etc/hosts
        if ! grep -q "127.0.1.1.*timelapsepi" /etc/hosts; then
            echo "127.0.1.1    timelapsepi" | sudo tee -a /etc/hosts
        fi
        
        echo "✅ Hostname changed to timelapsepi"
        echo "⚠️  You need to REBOOT for the .local domain to work properly"
        echo ""
        read -p "Reboot now? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "🔄 Rebooting..."
            sudo reboot
        else
            echo "Remember to reboot later: sudo reboot"
        fi
    fi
else
    echo "✅ Hostname is already 'timelapsepi'"
    echo ""
fi

# Create/update Avahi service file
echo "📝 Creating Avahi service file..."
sudo tee /etc/avahi/services/timelapsepi.service > /dev/null << 'EOF'
<?xml version="1.0" standalone='no'?>
<!DOCTYPE service-group SYSTEM "avahi-service.dtd">
<service-group>
  <name replace-wildcards="yes">TimelapsePI on %h</n>
  <service>
    <type>_http._tcp</type>
    <port>5000</port>
    <txt-record>path=/</txt-record>
  </service>
</service-group>
EOF

# Restart Avahi
echo "🔄 Restarting Avahi daemon..."
sudo systemctl restart avahi-daemon

# Wait a moment
sleep 2

# Check Avahi status
echo ""
echo "Checking Avahi status..."
if systemctl is-active --quiet avahi-daemon; then
    echo "✅ Avahi daemon is running"
else
    echo "❌ Avahi daemon is not running"
    sudo systemctl status avahi-daemon
    exit 1
fi

echo ""
echo "========================================"
echo "✅ Configuration complete!"
echo "========================================"
echo ""
echo "You should now be able to access TimelapsePI at:"
echo "  • http://timelapsepi.local:5000"
echo "  • http://$(hostname -I | awk '{print $1}'):5000"
echo ""

if [ "$CURRENT_HOSTNAME" != "timelapsepi" ] && [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "⚠️  Note: If timelapsepi.local doesn't work, you may need to:"
    echo "   1. Reboot your Pi: sudo reboot"
    echo "   2. Or change hostname to 'timelapsepi'"
    echo ""
fi

echo "🔍 Testing local domain resolution..."
if avahi-browse -a -t | grep -q "TimelapsePI"; then
    echo "✅ Service is being advertised via mDNS"
else
    echo "⚠️  Service not found in mDNS - may need a reboot"
fi

echo ""
echo "On your computer/phone:"
echo "  • Windows: Install Bonjour Print Services if .local doesn't work"
echo "  • Mac/Linux: Should work automatically"
echo ""
