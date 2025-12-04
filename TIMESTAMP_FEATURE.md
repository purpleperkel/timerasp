# Timestamp Overlay Feature

## Overview
TimelapsePI now supports adding customizable timestamp overlays to every frame captured during a timelapse. This feature helps track when each frame was taken and is essential for scientific observations, construction documentation, and long-term monitoring projects.

## Features

### Timestamp Formats
Choose from multiple date/time formats:
- **Full DateTime**: `2024-01-15 14:30:45` (Default)
- **European Format**: `15/01/2024 14:30:45`
- **US Format**: `01/15/2024 02:30 PM`
- **Time Only**: `14:30:45`
- **Date Only**: `2024-01-15`
- **Verbose**: `Monday, January 15, 2024`

### Positioning Options
Place the timestamp anywhere on the image:
- **Top Left**: Upper left corner
- **Top Right**: Upper right corner
- **Bottom Left**: Lower left corner
- **Bottom Right**: Lower right corner (Default)
- **Center**: Center of the image

### Visual Customization
- **Font Size**: Adjustable from 10px to 100px
- **Text Color**: White, Black, Yellow, Red, Green, or Blue
- **Background**: Optional semi-transparent black background for better readability
- **Margin**: 20px from edges (configurable in code)

## Using the Feature

### Via Web Interface

1. **Enable Timestamps**
   - Check "Add timestamp overlay to frames" in the Timelapse Control panel
   - Timestamp configuration options will appear

2. **Configure Settings**
   - **Format**: Select your preferred date/time format
   - **Position**: Choose where on the image to place the timestamp
   - **Font Size**: Adjust the slider for text size (default 30px)
   - **Text Color**: Select from preset colors
   - **Background**: Check to add semi-transparent background

3. **Start Recording**
   - Begin your timelapse as normal
   - Each frame will have the timestamp applied automatically

### Visual Examples

#### Bottom Right with Background (Default)
```
┌─────────────────────────────┐
│                             │
│         [Image Content]     │
│                             │
│                             │
│              ╔══════════════╗
│              ║ 2024-01-15   ║
│              ║ 14:30:45     ║
└──────────────╚══════════════╝
```

#### Top Left without Background
```
┌─────────────────────────────┐
│ 2024-01-15 14:30:45         │
│                             │
│         [Image Content]     │
│                             │
│                             │
└─────────────────────────────┘
```

## Technical Implementation

### Image Processing
- Uses Python PIL (Pillow) library
- Applies overlay after image capture
- Maintains original image quality (JPEG 95%)
- Processes images in-place (no duplicate files)

### Font Rendering
The system attempts to use high-quality system fonts:
1. DejaVu Sans Bold (Linux)
2. Liberation Sans Bold (Linux)
3. Helvetica (macOS)
4. Falls back to PIL default font if none available

### Performance Impact
- Minimal processing overhead (~50-100ms per frame)
- No impact on capture interval timing
- Processed during capture, not compilation

### Configuration Structure
```json
{
  "timestamp_config": {
    "enabled": true,
    "format": "%Y-%m-%d %H:%M:%S",
    "position": "bottom-right",
    "font_size": 30,
    "font_color": [255, 255, 255],
    "background_color": [0, 0, 0, 128],
    "margin": 20
  }
}
```

## Use Cases

### Scientific Research
- Document exact timing of observations
- Track environmental changes over time
- Correlate events with timestamps

### Construction Projects
- Legal documentation of progress
- Verify work schedules
- Track project milestones

### Nature Photography
- Document seasonal changes
- Track animal behavior patterns
- Monitor weather conditions

### Security/Monitoring
- Evidence timestamps
- Incident documentation
- Compliance recording

## Best Practices

### Readability
1. **High Contrast**: Use white text on dark backgrounds or vice versa
2. **Background**: Enable for outdoor/variable lighting conditions
3. **Size**: Larger fonts for high-resolution captures

### Positioning
- **Bottom corners**: Standard for minimal intrusion
- **Top corners**: When bottom area contains important content
- **Avoid center**: Unless specifically needed for watermarking

### Format Selection
- **Full datetime**: For documentation requiring complete timestamps
- **Time only**: For single-day projects
- **Date only**: For very slow captures (one frame per day)
- **Verbose format**: For presentation/exhibition use

## Limitations

### Current Limitations
- Single color selection (no gradients)
- Fixed margin size (20px)
- No custom font upload
- No rotation options
- Single timestamp per frame

### Image Requirements
- Works with JPEG output only
- Applied during capture (not reversible)
- Cannot be added to existing sessions

## Troubleshooting

### Timestamp Not Appearing
1. Verify "Add timestamp overlay" is checked
2. Check frame captures are succeeding
3. Verify Pillow is installed (`pip3 list | grep Pillow`)

### Poor Readability
1. Enable background option
2. Increase font size
3. Change text color for better contrast
4. Adjust position away from busy areas

### Installation Issues
```bash
# Install Pillow manually if needed
pip3 install --user Pillow

# Or with system packages flag
pip3 install --user --break-system-packages Pillow
```

## Advanced Configuration

### Custom Colors (via API)
```javascript
// Custom RGB values via API
timestamp_config: {
  font_color: [255, 200, 100],  // Custom orange
  background_color: [0, 0, 255, 100]  // Blue background
}
```

### Custom Formats
Use Python strftime format codes:
- `%Y` - 4-digit year
- `%m` - Month (01-12)
- `%d` - Day (01-31)
- `%H` - Hour (00-23)
- `%I` - Hour (01-12)
- `%M` - Minute (00-59)
- `%S` - Second (00-59)
- `%p` - AM/PM
- `%A` - Weekday name
- `%B` - Month name

### Multiple Timestamps
While not directly supported, you can modify the code to add multiple timestamps:
```python
# In add_timestamp_to_image function
# Add second timestamp at different position
```

## Future Enhancements

Potential improvements:
- Custom font upload support
- Multiple timestamps per frame
- Temperature/sensor data overlay
- Logo/watermark support
- Timestamp templates
- Reversible timestamps (separate layer)
- Batch add/remove timestamps
- Custom positioning (pixel coordinates)
- Outline/shadow effects
- Animated timestamp updates

## Integration with Other Features

### Works With
✅ Variable intervals
✅ Scheduled start/end
✅ Pause/resume
✅ All resolutions
✅ USB and Pi cameras

### Persistence
- Timestamp settings saved with session
- Restored on pause/resume
- Included in compiled videos

## Performance Specifications

- **Processing Time**: ~50-100ms per frame
- **Memory Usage**: < 10MB additional
- **CPU Impact**: ~5% on Pi 4
- **Storage**: No additional storage (in-place modification)
- **Quality**: Maintains 95% JPEG quality

## API Reference

### Enable Timestamps
```json
POST /api/start
{
  "interval": 30,
  "resolution": [1920, 1080],
  "timestamp_config": {
    "enabled": true,
    "format": "%Y-%m-%d %H:%M:%S",
    "position": "bottom-right",
    "font_size": 30,
    "font_color": [255, 255, 255],
    "background_color": [0, 0, 0, 128]
  }
}
```

### Default Configuration
If not specified, uses these defaults:
- Format: `%Y-%m-%d %H:%M:%S`
- Position: `bottom-right`
- Font Size: `30`
- Color: White `[255, 255, 255]`
- Background: Semi-transparent black
- Margin: `20px`
