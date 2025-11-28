#!/bin/bash

# TimelapsePI Installation Script - Using Python Virtual Environment
# This is the cleanest approach for modern Python installations

set -e

echo "========================================"
echo "TimelapsePI Installation (venv)"
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

# Install required packages
echo "📦 Installing dependencies..."
sudo apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    ffmpeg \
    avahi-daemon \
    avahi-utils \
    fswebcam \
    v4l-utils

echo "✅ System packages installed"

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

# Create virtual environment
echo "🐍 Creating Python virtual environment..."
python3 -m venv venv

# Activate and install packages
echo "📦 Installing Python packages in virtual environment..."
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate

echo "✅ Python packages installed in venv"

# Create a wrapper script to run with venv
echo "📝 Creating startup wrapper..."
cat > run_app.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
source venv/bin/activate
python3 app.py
EOF
chmod +x run_app.sh

# Update systemd service to use venv
echo "⚙️  Setting up systemd service..."
cat > timelapsepi-venv.service << EOF
[Unit]
Description=TimelapsePI Camera Controller
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR
ExecStart=$INSTALL_DIR/venv/bin/python3 $INSTALL_DIR/app.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

Environment="PYTHONUNBUFFERED=1"

[Install]
WantedBy=multi-user.target
EOF

sudo cp timelapsepi-venv.service /etc/systemd/system/timelapsepi.service
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
    echo "💡 This installation uses a Python virtual environment"
    echo "   located at: $INSTALL_DIR/venv"
    echo ""
    echo "To run manually:"
    echo "  cd $INSTALL_DIR"
    echo "  ./run_app.sh"
    echo ""
    echo "Service commands:"
    echo "  • Check status:  sudo systemctl status timelapsepi"
    echo "  • View logs:     sudo journalctl -u timelapsepi -f"
    echo "  • Stop service:  sudo systemctl stop timelapsepi"
    echo "  • Start service: sudo systemctl start timelapsepi"
    echo ""
else
    echo ""
    echo "❌ Service failed to start. Check logs with:"
    echo "   sudo journalctl -u timelapsepi -n 50"
    echo ""
    exit 1
fi
