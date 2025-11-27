# Installation Troubleshooting

## Error: "libcamera-apps has no installation candidate"

This error occurs when installing on certain systems (like standard Debian) that don't have the Raspberry Pi camera packages in their repositories.

### ✅ Solution

You have **two options**:

### Option 1: Use the updated install script (Recommended)

The main `install.sh` has been updated to handle this gracefully. It will:
- Install all USB camera dependencies
- Skip libcamera-apps if not available
- Still work perfectly with USB cameras

Just run:
```bash
./install.sh
```

### Option 2: Use the USB-only install script

For a cleaner install without any Pi Camera dependencies:

```bash
./install_usb_only.sh
```

This script only installs what you need for USB cameras:
- fswebcam (USB camera capture)
- v4l-utils (camera control)
- ffmpeg (video compilation)
- avahi (for .local domain)

## Why This Happens

The `libcamera-apps` package is specific to Raspberry Pi OS and provides support for the Raspberry Pi Camera Module. It's not available in standard Debian repositories.

**Good news:** Since you're using a USB camera, you don't need it at all! 

## What Gets Installed

### USB Camera Setup (what you need):
- ✅ `fswebcam` - captures images from USB cameras
- ✅ `v4l-utils` - controls camera settings (exposure, brightness, etc.)
- ✅ `ffmpeg` - compiles images into videos
- ✅ `avahi-daemon` - enables `.local` domain
- ✅ Python packages (Flask)

### Pi Camera Support (optional, only if you have Pi Camera):
- ⚠️ `libcamera-apps` - only needed for Raspberry Pi Camera Module
- ⚠️ Not required for USB cameras

## Verifying Your Installation

After installation, verify USB camera support:

```bash
# Check for USB cameras
lsusb

# List video devices
ls -la /dev/video*

# Test camera capture
fswebcam -r 1280x720 --no-banner test.jpg

# Check installed tools
which fswebcam
which v4l2-ctl
which ffmpeg
```

## Other Common Installation Issues

### Issue: Python packages fail to install

**Error:** `error: externally-managed-environment`

**Solution:** Use pip with --user flag (already in the script):
```bash
pip3 install --user -r requirements.txt
```

Or create a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Issue: Permission denied errors

**Solution:** Don't run the script as root:
```bash
# Wrong:
sudo ./install.sh

# Correct:
./install.sh
```

The script will ask for sudo password when needed.

### Issue: Avahi service fails

**Error:** `Failed to start avahi-daemon.service`

**Solution:**
```bash
# Install avahi
sudo apt-get install avahi-daemon avahi-utils

# Enable and start
sudo systemctl enable avahi-daemon
sudo systemctl start avahi-daemon

# Check status
sudo systemctl status avahi-daemon
```

### Issue: Service won't start

**Check logs:**
```bash
sudo journalctl -u timelapsepi -n 50
```

**Common causes:**
1. Port 5000 already in use
2. Missing Python packages
3. Incorrect file permissions

**Solutions:**
```bash
# Check if port 5000 is in use
sudo netstat -tulpn | grep 5000

# Test manually
cd ~/timelapsepi
python3 app.py

# Fix permissions
sudo chown -R $USER:$USER ~/timelapsepi
```

### Issue: Can't access timelapsepi.local

**Solution 1:** Use IP address instead:
```bash
# Get your IP
hostname -I

# Access via IP
http://192.168.1.XXX:5000
```

**Solution 2:** Install Bonjour/mDNS client:
- **Windows:** [Bonjour Print Services](https://support.apple.com/kb/DL999)
- **Linux:** Already has avahi
- **Mac:** Already has Bonjour

**Solution 3:** Check Avahi:
```bash
sudo systemctl status avahi-daemon
avahi-browse -a
```

## Manual Installation (if scripts fail)

If the automated scripts don't work, install manually:

```bash
# 1. Install system packages
sudo apt-get update
sudo apt-get install -y python3 python3-pip ffmpeg avahi-daemon fswebcam v4l-utils

# 2. Install Python packages
cd ~/timelapsepi
pip3 install --user flask

# 3. Test the app
python3 app.py

# 4. Set up service (optional)
sudo cp timelapsepi.service /etc/systemd/system/
sudo nano /etc/systemd/system/timelapsepi.service
# Edit User= and paths to match your setup
sudo systemctl daemon-reload
sudo systemctl enable timelapsepi
sudo systemctl start timelapsepi
```

## Still Having Issues?

### Collect diagnostic information:

```bash
# System info
uname -a
cat /etc/os-release

# Check camera
lsusb
ls -la /dev/video*
v4l2-ctl --list-devices

# Check services
sudo systemctl status timelapsepi
sudo systemctl status avahi-daemon

# Check logs
sudo journalctl -u timelapsepi -n 100
```

### Test camera manually:

```bash
# Simple test
fswebcam test.jpg

# If that fails, try:
fswebcam -d /dev/video0 test.jpg

# Or try different device
fswebcam -d /dev/video1 test.jpg
```

## Quick Recovery Commands

```bash
# Restart everything
sudo systemctl restart avahi-daemon
sudo systemctl restart timelapsepi

# View real-time logs
sudo journalctl -u timelapsepi -f

# Test manually
cd ~/timelapsepi
python3 app.py
# Then visit http://localhost:5000
```

---

Need more help? Check:
- [README.md](README.md) - Main documentation
- [USB_CAMERA_GUIDE.md](USB_CAMERA_GUIDE.md) - USB camera setup
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Command reference
