# How to Update Your Existing TimelapsePI Installation

## Quick Update (Recommended)

If you already have TimelapsePI installed and running, here's how to update it:

### Method 1: Replace Files and Restart

```bash
# 1. Stop the service
sudo systemctl stop timelapsepi

# 2. Backup your data (optional but recommended)
cp -r ~/timelapsepi/timelapse_data ~/timelapsepi_backup

# 3. Download new files to your Pi
# (upload the new timelapsepi folder via scp or copy)

# 4. Copy new files (keep your data)
cd ~/timelapsepi
cp -r /path/to/new/timelapsepi/app.py .
cp -r /path/to/new/timelapsepi/static .
cp -r /path/to/new/timelapsepi/templates .

# 5. Restart the service
sudo systemctl restart timelapsepi

# 6. Check it's running
sudo systemctl status timelapsepi
```

### Method 2: Quick File Updates

If you just want to update specific files:

```bash
# Stop service
sudo systemctl stop timelapsepi

# Update main app
cd ~/timelapsepi
# Copy new app.py from the download

# Update UI files
# Copy new static/js/app.js
# Copy new static/css/style.css  
# Copy new templates/index.html

# Restart
sudo systemctl restart timelapsepi
```

## What's New in This Update

### 🔧 Fixed Issues:

1. **"Error loading sessions" fixed**
   - Added proper error handling
   - Creates directories if they don't exist
   - Handles malformed session names gracefully

2. **Better camera detection**
   - Improved USB camera detection
   - More detailed camera information

### ✨ New Features:

1. **Camera Controls in UI** (USB cameras only)
   - Brightness slider
   - Contrast slider
   - Saturation slider
   - Auto/Manual exposure toggle
   - Manual exposure control
   - "Apply Settings" button to save changes
   - "Refresh Current" to see current values

2. **Improved Status Display**
   - Shows camera type (USB Camera / Pi Camera)
   - Better visual feedback

3. **Real-time Control Updates**
   - See current camera settings
   - Adjust and apply instantly
   - Perfect for locking exposure for consistent timelapses

## Verify the Update

After updating, visit your TimelapsePI interface and you should see:

1. ✅ Sessions load without errors
2. ✅ Camera type shown in status badge
3. ✅ New "Camera Controls" section (for USB cameras)
4. ✅ Sliders for brightness, contrast, saturation
5. ✅ Auto/Manual exposure controls

## Testing Camera Controls

1. **Load current settings:**
   - Click "Refresh Current" button
   - Sliders should move to current values

2. **Adjust settings:**
   - Move sliders
   - See values update in real-time

3. **Apply settings:**
   - Click "Apply Settings"
   - Should see "✅ Applied!" confirmation

4. **Lock exposure for timelapse:**
   - Uncheck "Auto Exposure"
   - Adjust manual exposure slider
   - Click "Apply Settings"
   - Perfect for consistent lighting!

## Troubleshooting

### Camera controls don't appear

**Reason:** You might have a Pi Camera or no camera detected

**Check:**
```bash
# Verify USB camera
v4l2-ctl --list-devices

# Check logs
sudo journalctl -u timelapsepi -n 50
```

### Settings don't apply

**Fix:**
```bash
# Make sure v4l-utils is installed
sudo apt-get install v4l-utils

# Check camera device
ls -la /dev/video*

# Restart service
sudo systemctl restart timelapsepi
```

### Still see "error loading sessions"

**Fix:**
```bash
# Create directories manually
cd ~/timelapsepi
mkdir -p timelapse_data/images
mkdir -p timelapse_data/videos
mkdir -p config

# Set permissions
chmod 755 timelapse_data
chmod 755 timelapse_data/images
chmod 755 timelapse_data/videos

# Restart
sudo systemctl restart timelapsepi
```

## Rolling Back

If something goes wrong:

```bash
# Restore from backup
sudo systemctl stop timelapsepi
cd ~
rm -rf timelapsepi
mv timelapsepi_backup timelapsepi
sudo systemctl start timelapsepi
```

## Need Help?

Check the logs:
```bash
sudo journalctl -u timelapsepi -f
```

Test manually:
```bash
cd ~/timelapsepi
python3 app.py
```

---

**Enjoy the new camera controls! 🎥✨**
