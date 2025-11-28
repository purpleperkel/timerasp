# Dynamic Camera Device Selection 📹

## Problem Solved

Your camera has multiple `/dev/video*` devices:
- `/dev/video0` - **Actual camera** (works!)
- `/dev/video3` - Metadata device (doesn't work)

The old code was picking `/dev/video3` which can't capture images.

## New Features

### 🎯 Automatic Device Detection

On startup, the system now:
1. **Scans all `/dev/video*` devices**
2. **Tests each with fswebcam** (not just v4l2-ctl)
3. **Only shows working devices**
4. **Auto-selects the best one**

### 📹 Camera Device Dropdown

New UI element in the control panel:

```
┌─────────────────────────────────────┐
│ 📹 Camera Device:                   │
│ [/dev/video0 - Logitech Webcam  ▼] │ ← New dropdown!
│ Select which camera to use...       │
└─────────────────────────────────────┘
```

### 🔄 Live Device Switching

- **Change anytime** - No restart needed!
- **Preview updates** - Switches to new device immediately
- **Persistent** - Saved to config for next restart

## How It Works

### Device Detection Algorithm

```python
For each /dev/video* device:
  1. Check v4l2-ctl for "Video Capture" capability
  2. Extract device name from v4l2-ctl output
  3. TEST with fswebcam capture to /dev/null
  4. If capture succeeds AND produces data:
     ✅ Add to available devices
  5. Else:
     ❌ Skip this device
```

**The key:** Actually testing fswebcam capture, not just checking capabilities!

### Test Details

```bash
# For each device, runs:
fswebcam -d /dev/videoX -r 640x480 --no-banner -

# Success criteria:
# - Exit code 0
# - Output > 1000 bytes (valid JPEG)
```

This filters out:
- Metadata devices (like `/dev/video3`)
- Disconnected devices
- Devices with errors

## Using the Feature

### On First Load

1. **Open page** → Device dropdown populates
2. **Shows all working cameras**
3. **Current device is selected**

Example display:
```
/dev/video0 - Logitech Webcam C270
```

### Changing Devices

1. **Click dropdown**
2. **Select new device**
3. **Change happens immediately**
   - Saved to config
   - Preview refreshes
   - Next capture uses new device

### Multiple Cameras

If you have multiple cameras:

```
📹 Camera Device:
┌────────────────────────────────────────┐
│ /dev/video0 - Logitech Webcam C270    │
│ /dev/video2 - USB Camera               │ ← Multiple options!
│ /dev/video4 - Microsoft LifeCam       │
└────────────────────────────────────────┘
```

## API Endpoints

### Get Available Devices

```http
GET /api/camera/devices

Response:
{
  "devices": [
    {
      "device": "/dev/video0",
      "name": "Logitech Webcam C270"
    }
  ],
  "current_device": "/dev/video0"
}
```

### Set Camera Device

```http
POST /api/camera/device
Content-Type: application/json

{
  "device": "/dev/video0"
}

Response:
{
  "success": true,
  "device": "/dev/video0"
}
```

## Configuration

Device saved in `config/settings.json`:

```json
{
  "camera_device": "/dev/video0"
}
```

## Startup Behavior

**First startup:**
```
[Device Detection] Found working camera: /dev/video0 (Logitech Webcam C270)
[Device Detection] Using default camera: /dev/video0
```

**Subsequent startups:**
```
[Device Detection] Found working camera: /dev/video0 (Logitech Webcam C270)
[Capture] Using camera device: /dev/video0
```

## What Gets Filtered Out

### ❌ Metadata Devices

```bash
# /dev/video3 test:
fswebcam -d /dev/video3 -r 640x480 --no-banner -
# Output: "Inappropriate ioctl for device"
# Result: SKIPPED
```

### ❌ Non-Capture Devices

Devices that show "Video Capture" in v4l2-ctl but can't actually capture are filtered.

### ✅ Only Working Cameras

Only devices that pass the fswebcam test appear in dropdown.

## Troubleshooting

### No Devices Detected

**Check:**
```bash
# List all video devices
ls -la /dev/video*

# Test manually
fswebcam -d /dev/video0 -r 640x480 --no-banner test.jpg
```

**If manual test works but device not detected:**
```bash
# Check logs during startup
sudo journalctl -u timelapsepi -n 50 | grep "Device Detection"
```

### Wrong Device Auto-Selected

**Manually set device:**
```bash
# Use API
curl -X POST http://localhost:5000/api/camera/device \
  -H "Content-Type: application/json" \
  -d '{"device": "/dev/video0"}'

# Or use UI dropdown
```

### Device Changed But Not Working

**Reload page:**
- Force refresh: Ctrl+Shift+R
- Dropdown will reload with current device

**Check logs:**
```bash
sudo journalctl -u timelapsepi -f
# Watch for [Capture] Using camera device: ...
```

## Detection on Startup

**During service start:**
```
[Device Detection] Found working camera: /dev/video0 (Logitech Webcam C270)
[Device Detection] Skipping /dev/video3 - fswebcam test failed
[Device Detection] Using default camera: /dev/video0
```

Takes ~3-5 seconds to scan all devices on startup.

## Benefits

### ✅ No More Wrong Device

- Tests actual capture, not just capabilities
- Metadata devices automatically filtered
- Uses device that actually works

### ✅ Multi-Camera Support

- Handles multiple cameras gracefully
- Easy switching via dropdown
- Each device properly identified

### ✅ User-Friendly

- No manual config editing
- Visual device names
- Live switching

### ✅ Persistent

- Remembers your choice
- Survives reboots
- Stored in config file

## Technical Details

### Detection Speed

```
Single device: ~1 second
Three devices: ~3 seconds
Ten devices:   ~10 seconds
```

Each device tested in sequence.

### Memory

Minimal - device list cached in config, not memory.

### Startup Impact

Adds 1-5 seconds to startup time depending on number of devices.

## Example Scenarios

### Scenario 1: Single Camera

```
Devices detected: /dev/video0
Auto-selected: /dev/video0
Dropdown shows: 1 option
Result: ✅ Just works
```

### Scenario 2: Camera + Metadata

```
Devices detected: /dev/video0 (works), /dev/video3 (fails test)
Auto-selected: /dev/video0
Dropdown shows: 1 option (/dev/video0 only)
Result: ✅ Metadata device hidden
```

### Scenario 3: Multiple Cameras

```
Devices detected: /dev/video0, /dev/video2
Auto-selected: /dev/video0 (first working)
Dropdown shows: 2 options
User can: Switch between cameras anytime
Result: ✅ Full multi-camera support
```

## Update Instructions

```bash
# 1. Stop service
sudo systemctl stop timelapsepi

# 2. Update files
cd ~/timelapsepi
# Upload new version

# 3. Start service (will detect devices)
sudo systemctl start timelapsepi

# 4. Watch detection
sudo journalctl -u timelapsepi -f
# Look for [Device Detection] messages

# 5. Open page
# Device dropdown should show /dev/video0
```

## Success Indicators

✅ Dropdown shows your camera  
✅ Logs show "/dev/video0" (not video3)  
✅ Preview works  
✅ Timelapse captures frames  
✅ Can switch devices via dropdown  

---

**Your camera device issue is solved! 📹✨**
