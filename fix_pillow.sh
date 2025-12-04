#!/bin/bash

# Fix for Pillow installation issues on Raspberry Pi
# Handles Python 3.13 compatibility and build dependencies

echo "========================================="
echo "TimelapsePI - Pillow Installation Fix"
echo "========================================="

# Detect Python version
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo "Detected Python version: $PYTHON_VERSION"

# Function to install system dependencies for Pillow
install_pillow_deps() {
    echo "Installing system dependencies for Pillow..."
    sudo apt-get update
    sudo apt-get install -y \
        libjpeg-dev \
        zlib1g-dev \
        libfreetype6-dev \
        liblcms2-dev \
        libopenjp2-7-dev \
        libtiff5-dev \
        libwebp-dev \
        libharfbuzz-dev \
        libfribidi-dev \
        libxcb1-dev
}

# Function to try installing Pillow
try_install_pillow() {
    local version=$1
    echo "Attempting to install Pillow $version..."
    
    if [ -d "venv" ]; then
        source venv/bin/activate
        pip install --no-cache-dir Pillow==$version
    else
        pip3 install --user --break-system-packages Pillow==$version 2>/dev/null || \
        pip3 install --user Pillow==$version
    fi
}

# Main installation process
echo ""
echo "Step 1: Installing system dependencies..."
install_pillow_deps

echo ""
echo "Step 2: Attempting Pillow installation..."

# Check Python version and install appropriate Pillow version
if [[ $PYTHON_VERSION == 3.13* ]]; then
    echo "Python 3.13 detected - using Pillow 11.0.0"
    try_install_pillow "11.0.0"
elif [[ $PYTHON_VERSION == 3.12* ]]; then
    echo "Python 3.12 detected - using Pillow 10.4.0"
    try_install_pillow "10.4.0"
elif [[ $PYTHON_VERSION == 3.11* ]]; then
    echo "Python 3.11 detected - using Pillow 10.2.0"
    try_install_pillow "10.2.0"
else
    echo "Python $PYTHON_VERSION detected - trying latest Pillow"
    if [ -d "venv" ]; then
        source venv/bin/activate
        pip install --no-cache-dir Pillow
    else
        pip3 install --user --break-system-packages Pillow 2>/dev/null || \
        pip3 install --user Pillow
    fi
fi

# Verify installation
echo ""
echo "Step 3: Verifying installation..."
python3 -c "from PIL import Image; print('✅ Pillow installed successfully!')" 2>/dev/null

if [ $? -ne 0 ]; then
    echo "⚠️  Pillow installation failed or incomplete."
    echo ""
    echo "TimelapsePI will still work but without timestamp overlay feature."
    echo ""
    echo "Alternative solutions:"
    echo "1. Try installing pre-compiled wheel:"
    echo "   pip3 install --user --break-system-packages --only-binary :all: Pillow"
    echo ""
    echo "2. Use system package (older version):"
    echo "   sudo apt-get install python3-pil"
    echo ""
    echo "3. Continue without timestamps - TimelapsePI will work fine"
else
    echo ""
    echo "✅ Pillow installation complete!"
    echo "Timestamp overlay feature is available."
fi

echo ""
echo "========================================="
echo "Installation process complete"
echo "========================================="
