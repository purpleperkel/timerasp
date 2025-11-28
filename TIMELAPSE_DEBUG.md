# Timelapse Not Capturing Frames - Debug Guide 🎬

## Issue: Frames Stay at 0

You're experiencing: Timelapse starts, but frame count stays at 0 and no images are captured.

## New Comprehensive Logging

I've added detailed logging to show exactly what's happening:

### Start a Timelapse

Then immediately check logs:

```bash
sudo journalctl -u timelapsepi -f
```

### What You Should See

**Successful capture:**
```
[Start] Starting timelapse:
  - Interval: 5s
  - Resolution: [1920, 1080]
  - Auto-adjust: False
  - IR Mode: auto
  - Session ID: 20241128_183000
[Start] Timelapse worker thread started
[Timelapse] Attempting to capture frame 0
[Capture] Frame 0 captured successfully
[Timelapse] Frame 0 captured. Total frames: 1
[Timelapse] Attempting to capture frame 1
[Capture] Frame 1 captured successfully
[Timelapse] Frame 1 captured. Total frames: 2
```

**Failed capture:**
```
[Start] Starting timelapse...
[Start] Timelapse worker thread started
[Timelapse] Attempting to capture frame 0
[Capture] ERROR: Failed to capture frame 0: Device or resource busy
[Timelapse] WARNING: Frame 0 capture returned False
[Timelapse] Attempting to capture frame 1
[Capture] ERROR: Failed to capture frame 1: Device or resource busy
```

## Common Causes & Fixes

### 1. Camera Busy (Preview Conflict)

**Problem:** Preview and timelapse both trying to use camera

**The logs will show:**
```
[Capture] ERROR: Failed to capture frame 0: Device or resource busy
```

**Fix:** The preview and timelapse shouldn't conflict anymore because:
- Preview uses `/tmp/timelapsepi_preview.jpg`
- Timelapse uses `~/timelapsepi/timelapse_data/images/`
- Both use `camera_lock` to prevent conflicts

**But if they do conflict:**
```bash
# Check what's using camera
sudo lsof /dev/video0

# Should see only timelapsepi process
```

### 2. Resolution Not Supported

**Problem:** Camera doesn't support the resolution

**The logs will show:**
```
[Capture] ERROR: Failed to capture frame 0: Invalid argument
```

**Fix:**
```bash
# Check supported resolutions
v4l2-ctl --device=/dev/video0 --list-formats-ext

# Use a supported resolution
# Common safe options:
# - 640x480
# - 1280x720
# - 1920x1080
```

### 3. Permission Issues

**Problem:** No permission to write to directory

**The logs will show:**
```
[Timelapse] ERROR: Exception capturing frame 0: [Errno 13] Permission denied
```

**Fix:**
```bash
# Check directory permissions
ls -la ~/timelapsepi/timelapse_data/

# Fix permissions
chmod 755 ~/timelapsepi/timelapse_data
chmod 755 ~/timelapsepi/timelapse_data/images
chmod 755 ~/timelapsepi/timelapse_data/videos
```

### 4. Camera Disconnected

**Problem:** Camera was unplugged or not detected

**The logs will show:**
```
[Capture] ERROR: Failed to capture frame 0: No such device
```

**Fix:**
```bash
# Check camera connection
v4l2-ctl --list-devices

# Reconnect camera if needed
# Then restart service
sudo systemctl restart timelapsepi
```

### 5. Session Directory Creation Failed

**Problem:** Can't create session directory

**The logs will show:**
```
[Timelapse] ERROR: Exception capturing frame 0: [Errno 30] Read-only file system
```

**Fix:**
```bash
# Check if filesystem is read-only
mount | grep timelapsepi

# Check disk space
df -h

# If full, clean up old sessions:
cd ~/timelapsepi/timelapse_data/images
ls -lh
# Delete old sessions
rm -rf 20241127_*
```

## Step-by-Step Diagnosis

### Step 1: Update and Restart

```bash
# Stop service
sudo systemctl stop timelapsepi

# Update files (upload new version)
cd ~/timelapsepi

# Restart
sudo systemctl restart timelapsepi

# Check it's running
sudo systemctl status timelapsepi
```

### Step 2: Start Fresh Timelapse

1. Open page: `http://192.168.1.213:5000`
2. Set interval: `5 seconds`
3. Set resolution: `1280x720` (safe default)
4. **Uncheck** Auto-Adjust (start simple)
5. IR Mode: `off` (start simple)
6. Click "Start Timelapse"

### Step 3: Watch Logs Immediately

```bash
sudo journalctl -u timelapsepi -f
```

**Within 5 seconds you should see:**
```
[Start] Starting timelapse...
[Timelapse] Attempting to capture frame 0
```

### Step 4: Identify the Error

Look for one of these patterns:

**A. Device Busy:**
```
ERROR: Device or resource busy
```
→ Another process using camera

**B. Invalid Argument:**
```
ERROR: Invalid argument
```
→ Unsupported resolution

**C. Permission Denied:**
```
ERROR: Permission denied
```
→ Directory permission issue

**D. No Such Device:**
```
ERROR: No such device
```
→ Camera not connected

**E. Timeout:**
```
ERROR: Timeout capturing frame
```
→ Camera not responding

### Step 5: Apply Specific Fix

Based on the error from Step 4, apply the fix from "Common Causes" above.

## Manual Test

Test if fswebcam works manually:

```bash
# Test with same parameters as timelapse
cd ~/timelapsepi/timelapse_data/images
mkdir test_session
cd test_session

# Capture frame (same command timelapse uses)
fswebcam -d /dev/video0 -r 1280x720 --no-banner --jpeg 95 -S 2 frame_000000.jpg

# Check result
ls -lh frame_000000.jpg

# If it worked, timelapse should work too
```

## Check Session Directory

After starting timelapse, check if directory was created:

```bash
# List sessions
ls -la ~/timelapsepi/timelapse_data/images/

# You should see: 20241128_HHMMSS/

# Check if frames are being captured
ls -la ~/timelapsepi/timelapse_data/images/20241128_*/

# Should see: frame_000000.jpg, frame_000001.jpg, etc.
```

## Debugging Checklist

Run through this checklist:

```bash
# 1. Camera detected?
v4l2-ctl --list-devices
# Should list your camera

# 2. Can capture manually?
fswebcam -d /dev/video0 -r 1280x720 --no-banner test.jpg
ls -lh test.jpg
# Should create ~100KB file

# 3. Service running?
sudo systemctl status timelapsepi
# Should show "active (running)"

# 4. Logs showing errors?
sudo journalctl -u timelapsepi -n 50
# Look for ERROR messages

# 5. Disk space available?
df -h
# Should have space in home directory

# 6. Directory writable?
touch ~/timelapsepi/timelapse_data/images/test.txt
rm ~/timelapsepi/timelapse_data/images/test.txt
# Should work without errors

# 7. Preview working?
# Open http://192.168.1.213:5000
# Preview should show live camera
```

## Log Examples

### Successful Timelapse

```
[Start] Starting timelapse:
  - Interval: 5s
  - Resolution: [1280, 720]
  - Auto-adjust: False
  - IR Mode: auto
  - Session ID: 20241128_183045
[Start] Timelapse worker thread started
[Timelapse] Attempting to capture frame 0
[Capture] Frame 0 captured successfully
[Timelapse] Frame 0 captured. Total frames: 1

... 5 seconds later ...

[Timelapse] Attempting to capture frame 1
[Capture] Frame 1 captured successfully
[Timelapse] Frame 1 captured. Total frames: 2

... continues ...
```

### Failed - Device Busy

```
[Start] Starting timelapse...
[Timelapse] Attempting to capture frame 0
[Capture] ERROR: Failed to capture frame 0: Device or resource busy
[Timelapse] WARNING: Frame 0 capture returned False

... 5 seconds later ...

[Timelapse] Attempting to capture frame 1
[Capture] ERROR: Failed to capture frame 1: Device or resource busy
[Timelapse] WARNING: Frame 1 capture returned False
```

**Fix:** Kill other process using camera

### Failed - Invalid Resolution

```
[Start] Starting timelapse...
[Timelapse] Attempting to capture frame 0
[Capture] ERROR: Failed to capture frame 0: Invalid argument
[Timelapse] WARNING: Frame 0 capture returned False
```

**Fix:** Use supported resolution (try 1280x720)

## Quick Fixes

### Fix 1: Kill Everything and Restart

```bash
# Nuclear option - restart everything
sudo systemctl restart timelapsepi

# Wait 5 seconds
sleep 5

# Try timelapse again
```

### Fix 2: Use Safe Settings

```
Resolution: 1280x720 (not 4K)
Interval: 5 seconds
Auto-Adjust: OFF
IR Mode: OFF
```

### Fix 3: Test Camera Independently

```bash
# Stop service
sudo systemctl stop timelapsepi

# Test camera manually
fswebcam -d /dev/video0 -r 1280x720 --no-banner test.jpg

# If that works, start service
sudo systemctl start timelapsepi
```

## What to Share for Help

If still not working, share:

```bash
# 1. Logs during timelapse attempt
sudo journalctl -u timelapsepi -n 100 > timelapse_logs.txt

# 2. Camera info
v4l2-ctl --list-devices > camera_info.txt
v4l2-ctl --device=/dev/video0 --list-formats-ext >> camera_info.txt

# 3. Directory status
ls -laR ~/timelapsepi/timelapse_data/images/ > directory_status.txt

# 4. Manual capture test
fswebcam -d /dev/video0 -r 1280x720 --no-banner test.jpg 2>&1 > manual_test.txt
```

---

**The logs will now tell you exactly what's wrong! 🔍**
