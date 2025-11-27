# USB Camera Setup Guide for TimelapsePI

This guide will help you set up and troubleshoot USB cameras with TimelapsePI.

## Quick Start

1. **Plug in your USB webcam** to any USB port on your Raspberry Pi
2. **Check if it's detected:**
   ```bash
   ls /dev/video*
   ```
   You should see devices like `/dev/video0`, `/dev/video1`, etc.

3. **Test the camera:**
   ```bash
   fswebcam test.jpg
   ```
   This should capture a test image.

4. **Start TimelapsePI** and it should automatically detect your camera!

## Supported Cameras

TimelapsePI works with most USB webcams that are UVC (USB Video Class) compatible. This includes:

- **Logitech Webcams** (C270, C310, C920, C922, etc.)
- **Microsoft LifeCam** series
- **Generic USB webcams** from Amazon/AliExpress
- **Action cameras** with USB webcam mode (GoPro, etc.)
- **DSLR/Mirrorless cameras** with USB webcam functionality

## Checking Your Camera

### List all video devices
```bash
ls -l /dev/video*
```

### Get detailed camera info
```bash
v4l2-ctl --list-devices
```

### Check supported formats and resolutions
```bash
v4l2-ctl --device=/dev/video0 --list-formats-ext
```

### View all camera settings
```bash
v4l2-ctl --device=/dev/video0 --all
```

## Testing Your Camera

### Capture a test image
```bash
# Basic capture
fswebcam test.jpg

# High quality capture
fswebcam -r 1920x1080 --jpeg 95 --no-banner test.jpg

# With camera adjustment time
fswebcam -r 1920x1080 --jpeg 95 --no-banner -S 5 test.jpg
```

### Test video capture
```bash
# Record 10 seconds of video
ffmpeg -f v4l2 -i /dev/video0 -t 10 test.mp4
```

## Common Issues and Solutions

### Issue: Camera not detected

**Solution 1: Check USB connection**
```bash
lsusb
# Look for your camera in the list
```

**Solution 2: Check kernel modules**
```bash
lsmod | grep uvc
# Should show uvcvideo module
```
If not loaded:
```bash
sudo modprobe uvcvideo
```

**Solution 3: Check permissions**
```bash
# Add user to video group
sudo usermod -a -G video $USER
# Log out and back in for changes to take effect
```

### Issue: Multiple video devices (/dev/video0, /dev/video1, etc.)

Some cameras create multiple devices - one for video and one for metadata.

**Find the correct device:**
```bash
for device in /dev/video*; do
    echo "=== $device ==="
    v4l2-ctl --device=$device --all | grep -i "video capture"
done
```

Look for "Video Capture" (not "Metadata Capture").

### Issue: Poor image quality

**Adjust camera settings:**
```bash
# List adjustable controls
v4l2-ctl --device=/dev/video0 --list-ctrls

# Adjust brightness
v4l2-ctl --device=/dev/video0 --set-ctrl=brightness=128

# Adjust contrast
v4l2-ctl --device=/dev/video0 --set-ctrl=contrast=32

# Adjust saturation
v4l2-ctl --device=/dev/video0 --set-ctrl=saturation=64

# Disable auto exposure (for consistent timelapse)
v4l2-ctl --device=/dev/video0 --set-ctrl=exposure_auto=1

# Set manual exposure
v4l2-ctl --device=/dev/video0 --set-ctrl=exposure_absolute=250
```

### Issue: Camera shows "Device or resource busy"

**Solution:**
```bash
# Find what's using the camera
sudo fuser /dev/video0

# Kill the process
sudo fuser -k /dev/video0

# Or restart TimelapsePI
sudo systemctl restart timelapsepi
```

### Issue: Wrong resolution or format

**Check supported resolutions:**
```bash
v4l2-ctl --device=/dev/video0 --list-formats-ext
```

TimelapsePI supports these common resolutions:
- 640x480 (VGA)
- 1280x720 (HD)
- 1920x1080 (Full HD)
- 3840x2160 (4K - if camera supports it)

### Issue: Captures are too slow

**Tips for faster captures:**

1. **Use lower resolution** - 720p captures faster than 1080p
2. **Adjust skip frames** - The `-S` parameter in fswebcam helps
3. **Check USB power** - Use powered USB hub for USB 3.0 cameras
4. **USB 2.0 vs 3.0** - Use USB 3.0 port on Pi 4/5 if available

### Issue: Inconsistent lighting in timelapse

**Lock camera settings:**
```bash
# Disable auto white balance
v4l2-ctl --device=/dev/video0 --set-ctrl=white_balance_automatic=0

# Set manual white balance
v4l2-ctl --device=/dev/video0 --set-ctrl=white_balance_temperature=4000

# Disable auto exposure
v4l2-ctl --device=/dev/video0 --set-ctrl=exposure_auto=1

# Set manual exposure
v4l2-ctl --device=/dev/video0 --set-ctrl=exposure_absolute=250

# Disable auto focus
v4l2-ctl --device=/dev/video0 --set-ctrl=focus_automatic_continuous=0
```

## Optimizing for Timelapse

### Best Practices

1. **Use Manual Settings**
   - Lock white balance, exposure, and focus
   - Prevents flickering in final video

2. **Power Management**
   - Use powered USB hub for high-res cameras
   - Disable USB auto-suspend:
     ```bash
     echo -1 | sudo tee /sys/module/usbcore/parameters/autosuspend
     ```

3. **Resolution Choice**
   - 1920x1080 is a good balance of quality and speed
   - 1280x720 for faster intervals or limited storage

4. **Interval Timing**
   - USB cameras can take 1-3 seconds to capture
   - Minimum recommended interval: 3-5 seconds
   - For faster intervals, use lower resolution

## Camera-Specific Settings

### Logitech C920/C922
These are popular for timelapses and work great with TimelapsePI!

```bash
# Disable autofocus
v4l2-ctl --device=/dev/video0 --set-ctrl=focus_automatic_continuous=0

# Set focus (0-255, adjust to your needs)
v4l2-ctl --device=/dev/video0 --set-ctrl=focus_absolute=0

# Lock exposure
v4l2-ctl --device=/dev/video0 --set-ctrl=exposure_auto=1
v4l2-ctl --device=/dev/video0 --set-ctrl=exposure_absolute=166
```

### Generic USB Cameras
Most work out of the box! If you have issues:

```bash
# Try different resolutions
fswebcam -r 1280x720 test.jpg
fswebcam -r 640x480 test.jpg

# List what your camera supports
v4l2-ctl --device=/dev/video0 --list-formats-ext
```

## Making Settings Persistent

Camera settings reset when unplugged. To make them persistent:

### Create a startup script
```bash
sudo nano /usr/local/bin/setup-camera.sh
```

Add:
```bash
#!/bin/bash
# Wait for camera to be ready
sleep 5

# Set camera settings
v4l2-ctl --device=/dev/video0 --set-ctrl=exposure_auto=1
v4l2-ctl --device=/dev/video0 --set-ctrl=exposure_absolute=250
v4l2-ctl --device=/dev/video0 --set-ctrl=white_balance_automatic=0
v4l2-ctl --device=/dev/video0 --set-ctrl=white_balance_temperature=4000
```

Make it executable:
```bash
sudo chmod +x /usr/local/bin/setup-camera.sh
```

### Create systemd service
```bash
sudo nano /etc/systemd/system/camera-setup.service
```

Add:
```ini
[Unit]
Description=USB Camera Setup
After=multi-user.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/setup-camera.sh
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
```

Enable it:
```bash
sudo systemctl enable camera-setup.service
sudo systemctl start camera-setup.service
```

## Useful Commands Reference

```bash
# List cameras
lsusb
v4l2-ctl --list-devices

# Test capture
fswebcam -r 1920x1080 --no-banner test.jpg

# Check what process is using camera
sudo fuser /dev/video0

# View camera capabilities
v4l2-ctl --device=/dev/video0 --list-formats-ext

# Reset camera
sudo rmmod uvcvideo
sudo modprobe uvcvideo

# Check system logs for camera issues
dmesg | grep video
journalctl -u timelapsepi -n 50
```

## Getting Help

If you're still having issues:

1. Check the camera with the test commands above
2. Look at TimelapsePI logs: `sudo journalctl -u timelapsepi -f`
3. Test camera outside TimelapsePI with fswebcam
4. Check USB power and connections
5. Try a different USB port

## Recommended USB Cameras

Based on community feedback, these cameras work great:

- **Logitech C270** - Budget friendly, 720p
- **Logitech C920** - Excellent quality, 1080p, great for timelapse
- **Logitech C922** - Similar to C920 with better low light
- **Microsoft LifeCam HD-3000** - Good budget option
- **Any UVC-compatible webcam** - Most modern webcams work!

---

**Happy timelapsing! 📸**
