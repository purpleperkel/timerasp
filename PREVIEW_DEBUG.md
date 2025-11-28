# Preview Debugging Guide 🔍

## Quick Diagnosis

I've simplified the preview and added better logging. Let's debug why it's blank!

### Step 1: Test Camera Directly

Run this on your Pi:

```bash
# Test basic capture
fswebcam -d /dev/video0 -r 640x480 --no-banner /tmp/test.jpg

# Check if file was created
ls -lh /tmp/test.jpg

# If it worked, view it or download it
```

**Expected:** Should create a ~50-100KB JPEG file

**If it fails:** Your camera might be in use by another process

### Step 2: Test via API

Visit this URL in your browser:
```
http://192.168.1.213:5000/api/camera/test
```

**Expected response:**
```json
{
  "success": true,
  "device": "/dev/video0",
  "camera_type": "usb",
  "test_capture_size": 95837
}
```

**If error:** Will show what went wrong

### Step 3: Check Logs

```bash
# Restart service
sudo systemctl restart timelapsepi

# Watch logs in real-time
sudo journalctl -u timelapsepi -f
```

**Then open the preview page**

**Look for:**
```
[Preview] Using device: /dev/video0
[Preview] Frame 10 captured (95837 bytes)
[Preview] Frame 20 captured (95421 bytes)
```

**Or errors like:**
```
[Preview] Capture failed: Device busy
[Preview] Timeout capturing frame
[Preview] Error: ...
```

## Common Issues & Fixes

### Issue 1: Device Busy

**Symptom:**
```
Device or resource busy
```

**Cause:** Another process is using the camera

**Fix:**
```bash
# Find what's using camera
sudo lsof /dev/video0

# Or check processes
ps aux | grep fswebcam
ps aux | grep libcamera

# Kill the process (if it's not timelapsepi)
sudo kill <PID>

# Restart timelapsepi
sudo systemctl restart timelapsepi
```

### Issue 2: Permission Denied

**Symptom:**
```
Permission denied
```

**Fix:**
```bash
# Check permissions
ls -la /dev/video0

# Should show: crw-rw----+ 1 root video

# Add user to video group
sudo usermod -a -G video claude

# Reboot
sudo reboot
```

### Issue 3: Wrong Device

**Symptom:** Camera doesn't work with `/dev/video0`

**Fix:**
```bash
# List all video devices
v4l2-ctl --list-devices

# Test each one
for dev in /dev/video*; do
    echo "Testing $dev:"
    v4l2-ctl --device=$dev --all | head -5
done

# Find the one with "Video Capture"
# Then update app.py to use that device
```

### Issue 4: Camera Not Detected

**Symptom:**
```json
{
  "error": "No USB camera detected",
  "camera_type": null
}
```

**Fix:**
```bash
# Check if camera is connected
lsusb

# Check kernel messages
dmesg | grep video

# Try reconnecting camera
# Unplug USB, wait 5 seconds, plug back in

# Check again
lsusb
v4l2-ctl --list-devices
```

### Issue 5: Blank Preview (MJPEG Issue)

**Symptom:** Page loads but preview is blank, no errors in console

**Fix 1:** Check browser compatibility
- Safari/Chrome: Should work
- Firefox: May need different MIME type

**Fix 2:** Check if frames are being generated
```bash
# Check logs
sudo journalctl -u timelapsepi | grep Preview

# Should see:
[Preview] Frame 10 captured (95837 bytes)
```

**Fix 3:** Test MJPEG directly
```bash
# Install curl if needed
sudo apt-get install curl

# Test stream
curl http://localhost:5000/api/camera/preview | head -c 1000

# Should see binary data and "--frame" boundaries
```

## New Preview Implementation

### What Changed

**Old (Complex):**
```python
- Used capture_image() function
- Required session directories
- Used camera_lock
- Complex IR mode handling
```

**New (Simple):**
```python
- Direct fswebcam call
- Single temp file (/tmp/timelapsepi_preview.jpg)
- No locks (preview only)
- No IR mode
- Better logging
```

### Benefits

- ✅ Faster (no directory creation)
- ✅ Simpler (fewer failure points)
- ✅ Better debugging (detailed logs)
- ✅ No conflicts with timelapse capture

## API Endpoints

### Test Camera
```http
GET /api/camera/test

Response:
{
  "success": true,
  "device": "/dev/video0",
  "camera_type": "usb",
  "test_capture_size": 95837
}
```

### Preview Stream
```http
GET /api/camera/preview

Response: multipart/x-mixed-replace MJPEG stream
```

## Manual Testing Steps

### 1. Basic Camera Test
```bash
# Single frame
fswebcam -d /dev/video0 -r 640x480 --no-banner test1.jpg

# Multiple frames
for i in {1..5}; do
    fswebcam -d /dev/video0 -r 640x480 --no-banner test$i.jpg
    sleep 0.5
done

# All should work
ls -lh test*.jpg
```

### 2. Test with Same Parameters as Preview
```bash
# Exact same command preview uses
fswebcam -d /dev/video0 -r 640x480 --no-banner --jpeg 90 -S 2 /tmp/preview_test.jpg

# Check result
ls -lh /tmp/preview_test.jpg
```

### 3. Test MJPEG Stream Manually

Create test script:
```bash
cat > test_mjpeg.py << 'EOF'
import requests
import time

url = 'http://localhost:5000/api/camera/preview'
response = requests.get(url, stream=True, timeout=10)

print(f"Status: {response.status_code}")
print(f"Content-Type: {response.headers.get('Content-Type')}")

count = 0
for chunk in response.iter_content(chunk_size=1024):
    if b'--frame' in chunk:
        count += 1
        print(f"Frame boundary {count} found")
        if count >= 5:
            break

print(f"✅ Received {count} frames")
EOF

python3 test_mjpeg.py
```

## Browser Console Debugging

### Open DevTools (F12)

**Network Tab:**
1. Refresh page
2. Find request to `/api/camera/preview`
3. Check:
   - Status: Should be 200
   - Type: Should be "mjpeg" or "img"
   - Size: Should be increasing

**Console Tab:**
Look for errors:
```
Failed to load resource
CORS error
Content Security Policy
```

## Logs to Share

If still not working, collect these:

```bash
# Camera info
v4l2-ctl --list-devices > camera_info.txt

# Test capture
fswebcam -d /dev/video0 -r 640x480 --no-banner test.jpg 2>&1 | tee capture_test.txt

# Service logs
sudo journalctl -u timelapsepi -n 100 > service_logs.txt

# System info
uname -a > system_info.txt
lsusb >> system_info.txt
```

## Expected Log Output

**Successful preview:**
```
[Preview] Using device: /dev/video0
[Preview] Frame 10 captured (95837 bytes)
[Preview] Frame 20 captured (94231 bytes)
[Preview] Frame 30 captured (96012 bytes)
```

**Failed preview:**
```
[Preview] No USB camera detected
-- OR --
[Preview] Capture failed: Device or resource busy
-- OR --
[Preview] Timeout capturing frame
-- OR --
[Preview] Error: [Errno 2] No such file or directory: '/dev/video0'
```

## Quick Fixes

### Fix 1: Restart Everything
```bash
# Restart service
sudo systemctl restart timelapsepi

# If that doesn't work, reboot
sudo reboot
```

### Fix 2: Check Camera Connection
```bash
# Unplug camera
# Wait 5 seconds
# Plug back in

# Check
lsusb
v4l2-ctl --list-devices
```

### Fix 3: Reset Camera Settings
```bash
# Reset to defaults
v4l2-ctl --device=/dev/video0 --set-ctrl=brightness=0
v4l2-ctl --device=/dev/video0 --set-ctrl=contrast=32
v4l2-ctl --device=/dev/video0 --set-ctrl=saturation=56
v4l2-ctl --device=/dev/video0 --set-ctrl=auto_exposure=3
```

### Fix 4: Force Specific Device
If your camera is not `/dev/video0`, edit app.py:

```python
# Around line 640, change:
video_device = '/dev/video0'

# To your actual device, e.g.:
video_device = '/dev/video2'
```

## Success Indicators

✅ Preview shows live image  
✅ Image updates every 0.5 seconds  
✅ Logs show "Frame X captured"  
✅ /api/camera/test returns success  
✅ Manual fswebcam test works  

## Still Not Working?

Try this diagnostic sequence:

```bash
# 1. Test camera
fswebcam -d /dev/video0 -r 640x480 --no-banner /tmp/test.jpg
ls -lh /tmp/test.jpg

# 2. Test API
curl http://localhost:5000/api/camera/test

# 3. Check logs
sudo journalctl -u timelapsepi -n 50

# 4. Test stream (should see binary data)
curl http://localhost:5000/api/camera/preview | head -c 500
```

Share the output of these commands for further help!

---

**Let's get that preview working! 📹**
