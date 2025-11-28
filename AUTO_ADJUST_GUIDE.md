# Auto-Adjust and IR Night Vision Guide

## Overview

TimelapsePI now includes two powerful features for handling changing lighting conditions:

1. **Auto-Adjust Mode** - Automatically adjusts camera settings between frames
2. **IR Night Vision Mode** - Automatically switches to infrared for dark scenes

## 🔧 Auto-Adjust Mode

### What It Does

When enabled, the camera automatically adjusts these settings between each frame:
- **Brightness** - Adapts to changing light levels
- **Exposure** - Adjusts shutter speed for proper exposure
- **Contrast** - Optimizes contrast for the scene
- **Saturation** - Adjusts color intensity
- **White Balance** - Compensates for changing light color

### When to Use It

**✅ Perfect for:**
- **Sunrise/Sunset timelapses** - Natural light changes dramatically
- **All-day timelapses** - From dawn to dusk
- **Weather changes** - Sunny to cloudy transitions
- **Indoor with changing light** - Windows letting in varying daylight
- **Construction projects** - Long-term projects with variable conditions

**❌ Avoid for:**
- **Consistent lighting** - Studio/controlled environments
- **Night timelapses** - Better to lock settings
- **Scientific documentation** - Where consistent exposure is critical
- **Stop-motion animation** - Requires locked settings

### How It Works

**When Off (Default):**
```
Camera captures with locked settings
↓
Each frame has identical exposure/brightness
↓
Best for consistent lighting
```

**When On:**
```
Camera evaluates scene before each frame
↓
Adjusts exposure/brightness automatically
↓
Skips 10 frames to let camera stabilize
↓
Captures frame with optimized settings
```

### Technical Details

- **Frame Skip:** 10 frames (vs 2 when off) for better adjustment
- **Adjustment Time:** ~1-2 seconds per frame
- **Controls:** Uses camera's built-in auto-adjust
- **Compatibility:** USB cameras only (v4l2 interface)

### Settings Interaction

When Auto-Adjust is **ON**:
- Manual camera controls (brightness/contrast) are ignored during capture
- Settings can still be applied to the preview
- Each frame may have different settings

When Auto-Adjust is **OFF**:
- Camera uses locked settings (from Camera Controls panel)
- All frames have identical settings
- Faster capture (less frame skip)

## 🌙 IR Night Vision Mode

### What It Does

Automatically controls the camera's infrared LED for low-light shooting:
- **Auto:** Detects darkness and enables IR automatically
- **Always On:** IR is always enabled (for night timelapses)
- **Always Off:** IR is never used (for daylight only)

### How Auto Detection Works

1. **Analyzes each captured frame's brightness**
   - Samples center 50x50 pixel region
   - Calculates average brightness (0-255 scale)

2. **Makes IR decision:**
   - Brightness < 30: **Enable IR** (very dark)
   - Brightness > 50: **Disable IR** (bright enough)
   - Between 30-50: **Keep current state** (hysteresis)

3. **Switches IR mode** for next frame

### When to Use Each Mode

**🔄 Auto (Recommended):**
- **Day-to-night timelapses** - Automatically switches at dusk/dawn
- **24-hour timelapses** - Handles all lighting conditions
- **Mixed lighting** - Indoor spaces with changing light
- **Default choice** - Works well in most situations

**✅ Always On:**
- **Night-only timelapses** - Pure infrared footage
- **Wildlife observation** - Nocturnal animals
- **Security monitoring** - 24/7 IR recording
- **IR photography projects** - Artistic IR effects

**⛔ Always Off:**
- **Daylight-only timelapses** - No night footage needed
- **Color accuracy** - IR can tint images
- **Short duration** - Won't need IR
- **Battery saving** - IR LED uses power

### Compatible Cameras

Works with USB cameras that have IR controls:
- Logitech C920/C922 (with IR)
- Most security/surveillance cameras
- Cameras with "IR Cut" filter
- Cameras with LED controls

**Control names detected:**
- `led_mode`
- `infrared_mode`
- `ir_led`
- `led1_mode`

### Checking Your Camera

```bash
# List available controls
v4l2-ctl --device=/dev/video0 --list-ctrls

# Look for IR-related controls
v4l2-ctl --device=/dev/video0 --list-ctrls | grep -i "led\|infrared\|ir"

# Manually test IR on
v4l2-ctl --device=/dev/video0 --set-ctrl=led_mode=1

# Manually test IR off
v4l2-ctl --device=/dev/video0 --set-ctrl=led_mode=0
```

### Brightness Thresholds

The auto-detection uses these thresholds:

| Brightness Value | Lighting Condition | IR Action |
|-----------------|-------------------|-----------|
| 0-29 | Very Dark | Enable IR |
| 30-50 | Dim/Twilight | Keep Current |
| 51-255 | Adequate | Disable IR |

**Why the gap (30-50)?**
- Prevents flickering on/off at threshold
- Called "hysteresis" - adds stability
- Scene must get darker/lighter to change state

## 💡 Usage Examples

### Example 1: Sunrise to Sunset (24 hours)

```
Settings:
✅ Auto-Adjust: ON
🌙 IR Mode: Auto
⏱️ Interval: 30 seconds

What happens:
- Night: IR enabled, auto-adjusts for darkness
- Dawn: IR turns off, exposure increases gradually
- Day: Normal color, constant re-adjustment
- Dusk: Exposure decreases, eventually IR enables
- Night: Back to IR mode
```

### Example 2: Locked Outdoor Timelapse

```
Settings:
⛔ Auto-Adjust: OFF
🌙 IR Mode: Off
⏱️ Interval: 10 seconds
🔒 Locked exposure/brightness via Camera Controls

What happens:
- Consistent exposure throughout
- Underexposed at night, overexposed at midday
- Good for showing actual light changes
- Pure "raw" time progression
```

### Example 3: Night Wildlife Monitoring

```
Settings:
⛔ Auto-Adjust: OFF (for consistent IR look)
🌙 IR Mode: Always On
⏱️ Interval: 5 seconds
🔒 High brightness, locked settings

What happens:
- Pure IR footage all night
- Consistent grayscale look
- Better for motion detection
- Clearer night visibility
```

### Example 4: Indoor Plant Growth

```
Settings:
✅ Auto-Adjust: ON (window light varies)
🌙 IR Mode: Auto
⏱️ Interval: 5 minutes

What happens:
- Adapts to changing window light
- Uses IR at night (if needed)
- Consistent plant visibility
- Good for time compression
```

## 🎬 Best Practices

### For Smooth Timelapses

1. **Test first** - Capture 50-100 frames to check behavior
2. **Check transitions** - Watch sunrise/sunset moments
3. **Adjust thresholds** - May need tuning for your scene
4. **Lock focus** - Manual focus prevents hunting
5. **Disable auto-focus** - `v4l2-ctl --set-ctrl=focus_automatic_continuous=0`

### For Consistent Results

1. **Lock white balance** when auto-adjust is OFF
2. **Use Manual exposure** for night shots
3. **Test IR range** - Check how far IR illuminates
4. **Mount securely** - Vibration affects low-light
5. **Check USB power** - IR LED draws current

### Troubleshooting

**IR not switching:**
- Check camera supports IR controls
- Run `v4l2-ctl --list-ctrls` to verify
- Try manual IR toggle to test

**Flickering between IR on/off:**
- Scene is near threshold (30-50 brightness)
- Use Always On or Always Off for these conditions
- Or adjust scene lighting

**Auto-adjust too aggressive:**
- Disable auto-adjust, lock settings manually
- Use narrower exposure range
- Reduce contrast/brightness limits

**Overexposed frames:**
- Lower manual exposure value
- Reduce brightness setting
- Enable auto-adjust for compensation

**Underexposed frames:**
- Increase manual exposure
- Raise brightness setting
- Check if IR should be enabled

## 🔬 Technical Implementation

### Auto-Adjust Implementation

```python
# When auto_adjust = True
fswebcam -S 10  # Skip 10 frames for adjustment

# When auto_adjust = False  
fswebcam -S 2   # Skip only 2 frames
```

### IR Detection Implementation

```python
# Analyze brightness
ffmpeg -i last_frame.jpg -vf 'scale=100:100,format=gray,crop=50:50:25:25'
average_brightness = sum(pixels) / len(pixels)

# Make decision
if brightness < 30:
    enable_ir()
elif brightness > 50:
    disable_ir()
# else: keep current state
```

### Frame Timing

| Mode | Frame Skip | Adjust Time | Total/Frame |
|------|-----------|-------------|-------------|
| Auto-Adjust ON | 10 frames | ~1-2s | ~3-4s |
| Auto-Adjust OFF | 2 frames | ~0s | ~1-2s |

*Add interval time to get actual capture rate*

## 📊 Storage Impact

Auto-adjust **increases** storage slightly:
- Varies by JPEG quality per frame
- Darker frames = smaller files
- Brighter frames = larger files
- Average: +5-10% storage vs locked

IR mode **no impact** on storage:
- IR images are grayscale/monochrome
- Similar or smaller than color
- JPEG compression works well

## 🎯 Quick Reference

| Use Case | Auto-Adjust | IR Mode | Interval |
|----------|-------------|---------|----------|
| Sunrise/Sunset | ✅ ON | Auto | 30-60s |
| All-Day | ✅ ON | Auto | 30-60s |
| Night Only | ❌ OFF | Always On | 10-30s |
| Daylight Only | ❌ OFF | Off | 5-30s |
| Studio/Controlled | ❌ OFF | Off | Variable |
| Scientific | ❌ OFF | Off | Variable |
| Wildlife Night | ❌ OFF | Always On | 5-10s |
| Construction | ✅ ON | Auto | 5-10min |

## 📱 Using in the UI

1. **Start Timelapse screen:**
   - Check "🔧 Auto-Adjust Settings During Timelapse"
   - Select IR mode from dropdown
   - Start timelapse

2. **Monitor during capture:**
   - Stats panel shows: "Auto-Adjust: ✅ On"
   - Stats panel shows: "IR Mode: 🌙 Auto"

3. **Review results:**
   - Check frame consistency
   - Verify IR transitions
   - Adjust settings for next run

---

**Enjoy professional-quality timelapses with changing lighting! 🌅🌙✨**
