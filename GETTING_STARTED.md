# Getting Started with TimelapsePI

**Welcome! This guide will get you up and running in 5 minutes.**

## What You Need

- ✅ Raspberry Pi (any model with network)
- ✅ USB Webcam (Logitech C270, C920, or any UVC camera)
- ✅ MicroSD card with Raspberry Pi OS installed
- ✅ Network connection (WiFi or Ethernet)

## Installation - Pick Your Method

### 🚀 Easiest: Run the Installer

```bash
# 1. Copy files to your Pi
scp -r timelapsepi/ pi@raspberrypi.local:~/

# 2. SSH into your Pi  
ssh pi@raspberrypi.local

# 3. Run the installer
cd timelapsepi
chmod +x install_venv.sh
./install_venv.sh
```

**Note:** Use `install_venv.sh` for the most reliable installation on modern systems.

### ⚡ Fastest: Manual One-Liner

```bash
# In your timelapsepi directory:
sudo apt-get update && \
sudo apt-get install -y python3 python3-pip ffmpeg avahi-daemon fswebcam v4l-utils && \
pip3 install --user --break-system-packages flask werkzeug && \
python3 app.py
```

Then visit `http://YOUR_PI_IP:5000`

## First Time Setup

### 1. Plug in Your USB Camera

```bash
# Check if it's detected
lsusb
ls /dev/video*

# Should see something like:
# /dev/video0  /dev/video1
```

### 2. Test the Camera

```bash
# Take a test photo
fswebcam test.jpg

# View it (if you have desktop)
# or download it to check
```

If this works, TimelapsePI will work!

### 3. Access the Web Interface

Open your browser and go to:
- `http://timelapsepi.local:5000` (if hostname is set)
- OR `http://YOUR_PI_IP:5000`

To find your Pi's IP:
```bash
hostname -I
```

### 4. Start Your First Timelapse!

1. **Set interval** - Start with 5 seconds
2. **Choose resolution** - Try 1280x720 for first test
3. **Click "Start Timelapse"**
4. Let it run for a minute
5. **Click "Stop Timelapse"**
6. **Compile Video** with 30fps
7. **Download and enjoy!**

## Common First-Time Issues

### "No camera detected"

**Fix:**
```bash
# Unplug and replug the camera
# Then check:
lsusb
ls /dev/video*

# Add yourself to video group
sudo usermod -a -G video $USER
# Log out and back in
```

### Can't access the web interface

**Fix 1:** Use IP address instead of `.local`:
```bash
hostname -I
# Then visit http://192.168.1.XXX:5000
```

**Fix 2:** Check if service is running:
```bash
sudo systemctl status timelapsepi
```

**Fix 3:** Run manually to see errors:
```bash
cd ~/timelapsepi
python3 app.py
```

### Installation errors

**If you see `externally-managed-environment`:**
- Use `install_venv.sh` instead
- Or see [QUICK_MANUAL_INSTALL.md](QUICK_MANUAL_INSTALL.md)

**If you see `libcamera-apps has no installation candidate`:**
- That's fine! You don't need it for USB cameras
- The installer will skip it automatically

## Tips for Your First Timelapse

### Good First Projects:
- ☀️ Sunset/sunrise (30-60 min, 5-10 sec intervals)
- ☁️ Cloud movement (10-20 min, 5 sec intervals)
- 🌱 Plant growing (multiple days, 5-10 min intervals)
- 🎨 Painting/crafts (1-2 hours, 10-30 sec intervals)

### Settings Guide:

**Interval:**
- Fast action (clouds): 2-5 seconds
- Medium (sunset): 5-10 seconds  
- Slow (plants): 5-60 minutes

**Resolution:**
- Testing: 640x480
- Good quality: 1280x720
- High quality: 1920x1080

**Storage estimate (1 hour at 5 sec intervals):**
- 640x480: ~36 MB
- 1280x720: ~108 MB
- 1920x1080: ~216 MB

## Next Steps

### Improve Your Timelapses

1. **Lock camera settings** - See [USB_CAMERA_GUIDE.md](USB_CAMERA_GUIDE.md)
2. **Stable mounting** - Use tripod or mount
3. **Consistent lighting** - Indoor or cloudy days work best
4. **Test before long shoots** - Always test 1-2 minutes first

### Advanced Features

- Run timelapses for days/weeks
- Set custom frame rates when compiling
- Manage multiple sessions
- Download videos anytime
- Delete old sessions to free space

### Get Help

- 📖 Full docs: [README.md](README.md)
- 🔧 Troubleshooting: [INSTALLATION_TROUBLESHOOTING.md](INSTALLATION_TROUBLESHOOTING.md)
- 📷 Camera setup: [USB_CAMERA_GUIDE.md](USB_CAMERA_GUIDE.md)
- ⚡ Quick reference: [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

## Useful Commands

```bash
# Check service status
sudo systemctl status timelapsepi

# View live logs
sudo journalctl -u timelapsepi -f

# Restart service
sudo systemctl restart timelapsepi

# Test camera
fswebcam test.jpg

# Check storage
df -h

# Manual run (for debugging)
cd ~/timelapsepi
python3 app.py
```

## Example Workflow

Here's a complete workflow for a sunset timelapse:

```bash
# 1. Setup (one time)
./install_venv.sh

# 2. Position camera pointing at sunset

# 3. Test camera
fswebcam -r 1920x1080 test.jpg

# 4. Access web interface
# http://timelapsepi.local:5000

# 5. Start timelapse
#    - Interval: 10 seconds
#    - Resolution: 1920x1080
#    - Click "Start"

# 6. Let it run for 45 minutes (sunset duration)

# 7. Click "Stop"
#    - You'll have ~270 frames

# 8. Click "Compile Video"
#    - 30 fps = 9 second video
#    - 60 fps = 4.5 second video

# 9. Download and share!
```

## You're Ready!

That's all you need to know to get started. The web interface is intuitive and the system handles everything else automatically.

**Happy timelapsing! 📸✨**

---

Questions? Check the [README.md](README.md) or [INSTALLATION_TROUBLESHOOTING.md](INSTALLATION_TROUBLESHOOTING.md)
