# Camera Control Fixes 📹

## Issues Fixed

### 1. ❌ Camera Preview Not Working (Fixed ✅)

**Error:** "All candidate resources failed to load. Media load paused."

**Root Cause:**
- Preview endpoint calling `capture_image()` without new required parameters
- Function signature changed to include `auto_adjust` and `ir_mode`
- Missing parameters caused camera capture to fail

**Solution:**
- Updated preview endpoint to pass `auto_adjust=True` and `ir_mode='off'`
- Preview now uses auto-adjust for better live view
- Added better error logging with traceback

### 2. ❌ Invalid Camera Control Commands (Fixed ✅)

**Problem:**
- Control names in code didn't match actual v4l2 control names
- Your camera uses different control names than generic defaults

**Your Camera's Actual Controls:**
```
brightness:              -64 to 64   (was 0-255)
contrast:                0 to 64     (correct)
saturation:              0 to 128    (correct)
auto_exposure:           0 to 3      (menu)
exposure_time_absolute:  1 to 5000   (correct)
```

**What Was Wrong:**
- Code looked for `exposure_auto` → Camera has `auto_exposure`
- Code looked for `exposure_absolute` → Camera has `exposure_time_absolute`
- Brightness range was 0-255 → Camera is -64 to 64

**Solution:**
- Added control name mapping in backend
- Frontend sends: `exposure_auto` → Backend maps to: `auto_exposure`
- Frontend sends: `exposure_absolute` → Backend maps to: `exposure_time_absolute`
- Updated UI slider ranges to match camera specs

## Technical Details

### Control Name Mapping (Backend)

```python
control_mapping = {
    'brightness': 'brightness',               # Direct match
    'contrast': 'contrast',                   # Direct match
    'saturation': 'saturation',               # Direct match
    'exposure_auto': 'auto_exposure',        # Mapped
    'exposure_absolute': 'exposure_time_absolute'  # Mapped
}
```

**Why This Works:**
- Frontend keeps consistent API
- Backend translates to camera-specific names
- Works with different camera models

### Exposure Auto Values

Your camera's `auto_exposure` menu:
```
0 = Auto
1 = Manual
2 = Shutter Priority
3 = Aperture Priority (default)
```

**We use:**
- `3` = Auto mode (Aperture Priority)
- `1` = Manual mode (full control)

### Updated UI Ranges

**Brightness Slider:**
```html
Old: min="0" max="255" value="128"
New: min="-64" max="64" value="0"
```

**Exposure Slider:**
```html
Old: value="250"
New: value="156" (camera default)
```

**Saturation Slider:**
```html
Old: value="64"
New: value="56" (camera default)
```

## Preview Endpoint Fixed

### Before (Broken)
```python
capture_image("preview", 0, resolution=(640, 480))
# Missing required parameters!
```

### After (Fixed)
```python
capture_image("preview", 0, 
             resolution=(640, 480),
             auto_adjust=True,    # Let camera auto-adjust
             ir_mode='off')        # No IR for preview
```

**Why auto_adjust=True for preview?**
- Preview should show live, responsive feed
- Auto-adjusts to lighting changes
- Better user experience when framing shots

## Files Changed

### 1. app.py - Backend Fixes

**Lines ~718-756:** GET endpoint
- Added check for `auto_exposure` (actual control name)
- Added check for `exposure_time_absolute` (actual control name)
- Maps to frontend names (`exposure_auto`, `exposure_absolute`)

**Lines ~795-826:** POST endpoint
- Added `control_mapping` dictionary
- Translates frontend names to v4l2 names
- Skips unavailable controls gracefully

**Lines ~630-655:** Preview endpoint
- Fixed `capture_image` call with required params
- Added better error logging
- Fixed preview frame path

### 2. templates/index.html - UI Updates

**Brightness slider:**
```html
min="-64" max="64" value="0"
```

**Saturation slider:**
```html
value="56"  (was 64)
```

**Exposure slider:**
```html
value="156"  (was 250)
```

### 3. static/js/app.js - No Changes Needed

Already using correct values:
- `exposure_auto: 3` for auto
- `exposure_auto: 1` for manual

## Testing

### Test Camera Preview

1. **Restart service:**
   ```bash
   sudo systemctl restart timelapsepi
   ```

2. **Open page:**
   - Should see live camera preview
   - Image updates every 0.5 seconds
   - Auto-adjusts to lighting

3. **Check console (F12):**
   - Should be no "Media load paused" errors
   - May see preview frames updating

### Test Camera Controls

1. **Load current settings:**
   - Click "Refresh Current"
   - Should load without errors
   - Values should match your camera's output

2. **Adjust brightness:**
   - Move slider from -64 to 64
   - See value update
   - Click "Apply Settings"
   - Should see "✅ Applied!"

3. **Toggle exposure:**
   - Check/uncheck "Auto Exposure"
   - Manual exposure slider appears/disappears
   - Apply settings
   - Preview should reflect changes

4. **Check logs:**
   ```bash
   sudo journalctl -u timelapsepi -f
   ```
   Should see:
   ```
   [Camera Controls] Available controls: {...}
   [Camera Controls] ✅ Set auto_exposure=3
   [Camera Controls] ✅ Set brightness=0
   ```

## Your Camera Specs

Based on your `v4l2-ctl` output:

### User Controls
```
brightness:    -64 to 64,  default=0
contrast:      0 to 64,    default=32
saturation:    0 to 128,   default=56
hue:           -40 to 40,  default=0
gamma:         72 to 500,  default=100
gain:          0 to 100,   default=0
sharpness:     0 to 6,     default=3
```

### Camera Controls
```
auto_exposure: 0-3 menu,  default=3
  0 = Auto
  1 = Manual
  2 = Shutter Priority
  3 = Aperture Priority
exposure_time_absolute: 1-5000, default=156
```

### Currently Exposed in UI
- ✅ Brightness (-64 to 64)
- ✅ Contrast (0 to 64)
- ✅ Saturation (0 to 128)
- ✅ Auto/Manual Exposure
- ✅ Manual Exposure Time (1 to 5000)

### Not Currently Exposed
- Hue
- Gamma
- Gain
- Sharpness
- White Balance

*These could be added if needed!*

## Troubleshooting

### Preview still not working

**Check logs:**
```bash
sudo journalctl -u timelapsepi -n 50
```

**Look for:**
- "Preview error: ..."
- Python traceback
- Camera device errors

**Common issues:**
- Camera disconnected
- Another process using camera
- Permission issues

**Fix:**
```bash
# Check camera
v4l2-ctl --list-devices

# Test capture
fswebcam -d /dev/video0 test.jpg

# Check permissions
ls -la /dev/video*
```

### Controls don't apply

**Check available controls:**
```bash
v4l2-ctl --device=/dev/video0 --list-ctrls
```

**Verify mapping:**
```bash
# In logs, should see:
[Camera Controls] Available controls: {...}
[Camera Controls] Running: v4l2-ctl --device /dev/video0 --set-ctrl=auto_exposure=1
```

**If control fails:**
- Check control exists on camera
- Verify value is in range
- Try manual command:
  ```bash
  v4l2-ctl --device=/dev/video0 --set-ctrl=auto_exposure=1
  ```

### Brightness slider shows wrong range

**Force refresh:**
```
Ctrl+Shift+R
```

**Verify in DevTools:**
```html
<input type="range" id="brightnessSlider" 
       min="-64" max="64" value="0">
```

## Advanced: Adding More Controls

To add other controls (hue, gamma, etc.):

### 1. Update HTML
```html
<div class="control-group">
    <label for="hueSlider">Hue: <span id="hueValue">0</span></label>
    <input type="range" id="hueSlider" 
           min="-40" max="40" value="0" class="slider">
</div>
```

### 2. Update JavaScript
```javascript
const settings = {
    brightness: parseInt(document.getElementById('brightnessSlider').value),
    contrast: parseInt(document.getElementById('contrastSlider').value),
    saturation: parseInt(document.getElementById('saturationSlider').value),
    hue: parseInt(document.getElementById('hueSlider').value)  // Add this
};
```

### 3. Update Backend Mapping
```python
control_mapping = {
    'brightness': 'brightness',
    'contrast': 'contrast',
    'saturation': 'saturation',
    'hue': 'hue',  # Add this
    ...
}
```

## Summary

✅ Camera preview now works (fixed missing parameters)  
✅ Control names mapped correctly (exposure_auto → auto_exposure)  
✅ UI sliders match camera ranges  
✅ Better error logging and debugging  
✅ Preview uses auto-adjust for live view  

---

**Your camera should now work perfectly! 📹✨**
