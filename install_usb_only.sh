#!/bin/bash

# TimelapsePI Installation Script - USB Camera Only
# This version only installs USB camera dependencies

set -e

echo "========================================"
echo "TimelapsePI USB Camera Installation"
echo "========================================"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please run this script as a normal user (not root)"
    echo "   The script will ask for sudo password when needed"
    exit 1
fi

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
INSTALL_DIR="/home/$USER/timelapsepi"

echo "📁 Installation directory: $INSTALL_DIR"
echo ""

# Update system
echo "📦 Updating system packages..."
sudo apt-get update

# Install required packages - USB camera only
echo "📦 Installing USB camera dependencies..."
sudo apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    avahi-daemon \
    avahi-utils \
    fswebcam \
    v4l-utils

echo "✅ USB camera tools installed successfully"

# Enable and start Avahi
echo "🌐 Enabling Avahi daemon..."
sudo systemctl enable avahi-daemon
sudo systemctl start avahi-daemon

# Create installation directory if it doesn't exist
if [ "$SCRIPT_DIR" != "$INSTALL_DIR" ]; then
    echo "📋 Copying files to $INSTALL_DIR..."
    sudo mkdir -p "$INSTALL_DIR"
    sudo cp -r "$SCRIPT_DIR"/* "$INSTALL_DIR/"
    sudo chown -R $USER:$USER "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"

# Install Python dependencies
echo "🐍 Installing Python packages..."
pip3 install --user --break-system-packages -r requirements.txt || pip3 install --user -r requirements.txt

# Make app.py executable
chmod +x app.py

# Set up systemd service
echo "⚙️  Setting up systemd service..."
sudo cp timelapsepi.service /etc/systemd/system/
sudo sed -i "s|User=pi|User=$USER|g" /etc/systemd/system/timelapsepi.service
sudo sed -i "s|/home/pi/timelapsepi|$INSTALL_DIR|g" /etc/systemd/system/timelapsepi.service
sudo systemctl daemon-reload
sudo systemctl enable timelapsepi.service

# Set up sudoers for system commands
echo "🔐 Setting up sudo permissions..."
sudo cp timelapsepi-sudoers /etc/sudoers.d/timelapsepi
sudo sed -i "s|^pi |$USER |g" /etc/sudoers.d/timelapsepi
sudo chmod 0440 /etc/sudoers.d/timelapsepi

# Verify sudoers file syntax
if sudo visudo -c -f /etc/sudoers.d/timelapsepi; then
    echo "✅ Sudo permissions configured"
else
    echo "⚠️  Warning: Sudoers file has syntax errors, removing it"
    sudo rm /etc/sudoers.d/timelapsepi
fi

# Set up Avahi service for .local domain
echo "🌐 Setting up timelapsepi.local domain..."
sudo cp timelapsepi.avahi-service /etc/avahi/services/timelapsepi.service

# Set hostname to timelapsepi (optional)
read -p "Do you want to change the hostname to 'timelapsepi'? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🏷️  Setting hostname to timelapsepi..."
    sudo hostnamectl set-hostname timelapsepi
    echo "127.0.1.1    timelapsepi" | sudo tee -a /etc/hosts
fi

# Create data directories
echo "📂 Creating data directories..."
mkdir -p "$INSTALL_DIR/timelapse_data/images"
mkdir -p "$INSTALL_DIR/timelapse_data/videos"
mkdir -p "$INSTALL_DIR/config"

# Check for USB camera
echo ""
echo "📷 Checking for USB camera..."
if ls /dev/video* 1> /dev/null 2>&1; then
    echo "✅ USB camera device(s) found:"
    ls -la /dev/video*
    echo ""
    echo "Testing camera with fswebcam..."
    if fswebcam -r 640x480 --no-banner --jpeg 85 /tmp/camera_test.jpg 2>/dev/null; then
        echo "✅ Camera test successful!"
        rm -f /tmp/camera_test.jpg
    else
        echo "⚠️  Camera test failed. Check camera connection and permissions."
    fi
else
    echo "⚠️  No USB camera detected. Please plug in your USB camera."
fi

# Start the service
echo ""
echo "🚀 Starting TimelapsePI service..."
sudo systemctl start timelapsepi.service

# Wait a moment for service to start
sleep 3

# Check service status
if sudo systemctl is-active --quiet timelapsepi.service; then
    echo ""
    echo "========================================"
    echo "✅ Installation completed successfully!"
    echo "========================================"
    echo ""
    echo "TimelapsePI is now running!"
    echo ""
    echo "Access your timelapse controller at:"
    echo "  • http://timelapsepi.local:5000"
    echo "  • http://$(hostname -I | awk '{print $1}'):5000"
    echo ""
    echo "🔧 USB Camera Commands:"
    echo "  • List cameras:  lsusb"
    echo "  • List devices:  ls -la /dev/video*"
    echo "  • Test camera:   fswebcam test.jpg"
    echo "  • Camera info:   v4l2-ctl --list-devices"
    echo ""
    echo "📋 Service Commands:"
    echo "  • Check status:  sudo systemctl status timelapsepi"
    echo "  • View logs:     sudo journalctl -u timelapsepi -f"
    echo "  • Stop service:  sudo systemctl stop timelapsepi"
    echo "  • Start service: sudo systemctl start timelapsepi"
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "⚠️  Hostname changed - reboot recommended:"
        echo "   sudo reboot"
        echo ""
    fi
else
    echo ""
    echo "❌ Service failed to start. Check logs with:"
    echo "   sudo journalctl -u timelapsepi -n 50"
    echo ""
    exit 1
fi
