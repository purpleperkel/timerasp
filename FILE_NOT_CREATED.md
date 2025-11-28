# File Not Created Issue - DEBUG UPDATE 🔍

## The Problem

Your logs showed:
```
[Capture] Frame 0 captured successfully to /home/pi/timelapsepi/timelapse_data/images/20251128_141038/frame_000000.jpg
[Capture] File exists: False, size: 0 bytes
```

**fswebcam says "success" but the file doesn't exist!**

This is a classic fswebcam issue where it returns exit code 0 but doesn't actually create the file.

## New Enhanced Debugging

I've added comprehensive debugging that will show:

1. ✅ If session directory exists and is writable
2. ✅ What fswebcam outputs (stdout/stderr)
3. ✅ Directory contents after capture
4. ✅ 0.1 second delay for filesystem sync
5. ✅ Verification of file size

## Update & Test

```bash
# Stop service
sudo systemctl stop timelapsepi

# Update files
cd ~/timelapsepi

# Restart
sudo systemctl restart timelapsepi

# Watch logs
sudo journalctl -u timelapsepi -f
```

## What You'll See Now

**If directory permission issue:**
```
[Capture] Session directory: /home/pi/timelapsepi/timelapse_data/images/20251128_141038
[Capture] Directory exists: True
[Capture] Directory is writable: False  ← Problem!
```

**If file created elsewhere:**
```
[Capture] File exists: False, size: 0 bytes
[Capture] DEBUG: Listing directory contents:
[Capture]   - frame_000001.jpg  ← Wrong frame number?
[Capture]   - (empty)           ← Nothing there?
```

**If fswebcam has errors:**
```
[Capture] fswebcam stdout: Capturing frame...
[Capture] fswebcam stderr: Error: Unable to set resolution
```

## Possible Causes

### 1. Resolution Not Supported

Your camera might not support 1920x1080. Try:

**In the UI:**
- Use 1280x720 instead
- Or 640x480 (guaranteed to work)

### 2. Directory Permissions

Check:
```bash
ls -la ~/timelapsepi/timelapse_data/
ls -la ~/timelapsepi/timelapse_data/images/

# Should be writable by pi user
# If not:
chmod 755 ~/timelapsepi/timelapse_data
chmod 755 ~/timelapsepi/timelapse_data/images
```

### 3. Disk Full

Check:
```bash
df -h

# If full, clean up:
cd ~/timelapsepi/timelapse_data/images
rm -rf 20251127_*  # Delete old sessions
```

### 4. Wrong Device

Your camera is `/dev/video3` (not video0). This is correct in the logs, but make sure fswebcam can use it:

```bash
# Test manually
fswebcam -d /dev/video3 -r 1280x720 --no-banner /tmp/test.jpg
ls -lh /tmp/test.jpg
```

## Quick Test

Try this manually to see what happens:

```bash
# Create test directory
mkdir -p ~/timelapsepi/timelapse_data/images/test_manual
cd ~/timelapsepi/timelapse_data/images/test_manual

# Run EXACT command from logs
fswebcam -d /dev/video3 -r 1920x1080 --no-banner --jpeg 95 -S 2 frame_000000.jpg

# Check result
ls -lh frame_000000.jpg

# If it doesn't work, try lower resolution
fswebcam -d /dev/video3 -r 1280x720 --no-banner --jpeg 95 -S 2 frame_000001.jpg
ls -lh frame_000001.jpg
```

If the manual test works but the service doesn't, it's a permission issue.

## Most Likely Fix

Based on the symptoms, I suspect **resolution not supported**. Try:

1. Start timelapse with **1280x720** resolution
2. Watch the logs
3. Should work!

---

**The new logs will tell us exactly why the file isn't being created! 🔍**
