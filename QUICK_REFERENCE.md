# TimelapsePI Quick Reference

## 🚀 Quick Start
```bash
# Install
./install.sh

# Access
http://timelapsepi.local:5000
```

## 📷 Camera Commands

### USB Camera
```bash
# List cameras
lsusb
v4l2-ctl --list-devices

# Test capture
fswebcam test.jpg

# High quality test
fswebcam -r 1920x1080 --jpeg 95 --no-banner test.jpg

# Check supported resolutions
v4l2-ctl --device=/dev/video0 --list-formats-ext

# Adjust settings
v4l2-ctl --device=/dev/video0 --set-ctrl=brightness=128
v4l2-ctl --device=/dev/video0 --set-ctrl=exposure_auto=1
```

### Raspberry Pi Camera
```bash
# List cameras
libcamera-hello --list-cameras

# Test capture
libcamera-still -o test.jpg
```

## ⚙️ Service Management
```bash
# Check status
sudo systemctl status timelapsepi

# Start service
sudo systemctl start timelapsepi

# Stop service
sudo systemctl stop timelapsepi

# Restart service
sudo systemctl restart timelapsepi

# View logs
sudo journalctl -u timelapsepi -f

# View recent logs
sudo journalctl -u timelapsepi -n 50

# Disable auto-start
sudo systemctl disable timelapsepi

# Enable auto-start
sudo systemctl enable timelapsepi
```

## 🌐 Network
```bash
# Check if .local domain works
ping timelapsepi.local

# Get IP address
hostname -I

# Check Avahi
sudo systemctl status avahi-daemon

# List mDNS services
avahi-browse -a
```

## 📁 File Locations
```
~/timelapsepi/
├── app.py                      # Main application
├── timelapse_data/
│   ├── images/                 # Captured frames
│   │   └── SESSION_ID/
│   │       └── frame_*.jpg
│   └── videos/                 # Compiled videos
│       └── SESSION_ID.mp4
├── config/
│   └── settings.json           # Configuration
└── static/                     # Web assets
```

## 🎬 Manual Video Compilation
```bash
cd ~/timelapsepi/timelapse_data/images/20240101_120000

# Create video at 30fps
ffmpeg -framerate 30 -pattern_type glob -i 'frame_*.jpg' \
  -c:v libx264 -pix_fmt yuv420p -crf 23 output.mp4

# Create video at 60fps
ffmpeg -framerate 60 -pattern_type glob -i 'frame_*.jpg' \
  -c:v libx264 -pix_fmt yuv420p -crf 23 output_60fps.mp4

# Create with different quality (lower CRF = better quality)
ffmpeg -framerate 30 -pattern_type glob -i 'frame_*.jpg' \
  -c:v libx264 -pix_fmt yuv420p -crf 18 output_hq.mp4
```

## 🔧 Troubleshooting

### Camera not detected
```bash
# Check USB devices
lsusb

# Check video devices
ls -l /dev/video*

# Check permissions
groups | grep video

# Add user to video group
sudo usermod -a -G video $USER
# Then log out and back in
```

### Service won't start
```bash
# Check logs
sudo journalctl -u timelapsepi -n 50

# Test manually
cd ~/timelapsepi
python3 app.py

# Check Python packages
pip3 list | grep -i flask
```

### Out of space
```bash
# Check disk usage
df -h

# Check timelapse data size
du -sh ~/timelapsepi/timelapse_data/*

# Delete old sessions via web UI or:
rm -rf ~/timelapsepi/timelapse_data/images/OLD_SESSION_ID
rm ~/timelapsepi/timelapse_data/videos/OLD_SESSION_ID.mp4
```

### Can't access .local domain
```bash
# Use IP instead
http://$(hostname -I | awk '{print $1}'):5000

# Restart Avahi
sudo systemctl restart avahi-daemon

# Check hostname
hostname
hostnamectl
```

## 📊 Estimations

### Storage
```
Resolution    | JPEG Size | 1 Hour    | 24 Hours
640x480       | ~50KB     | ~36MB     | ~860MB
1280x720      | ~150KB    | ~108MB    | ~2.6GB
1920x1080     | ~300KB    | ~216MB    | ~5.2GB
3840x2160     | ~800KB    | ~576MB    | ~13.8GB
```
*Based on 5-second interval*

### Video Length
```
Interval | 1 Hour  | 8 Hours | 24 Hours
1 sec    | 120s    | 960s    | 2880s (48min)
5 sec    | 24s     | 192s    | 576s (9.6min)
10 sec   | 12s     | 96s     | 288s (4.8min)
30 sec   | 4s      | 32s     | 96s (1.6min)
60 sec   | 2s      | 16s     | 48s
```
*At 30fps output*

## 🌟 Pro Tips

1. **Lock camera settings** for consistent lighting
2. **Use powered USB hub** for high-res USB cameras
3. **Test interval timing** before long timelapses
4. **Monitor storage space** regularly
5. **Use manual exposure** for outdoor timelapses
6. **Consider lower resolution** for long projects
7. **Backup videos** after compilation

## 📞 Support

- README: [README.md](README.md)
- USB Camera Guide: [USB_CAMERA_GUIDE.md](USB_CAMERA_GUIDE.md)
- Architecture: [ARCHITECTURE.md](ARCHITECTURE.md)

## 🔗 API Endpoints

```
GET  /api/status                    # Current status
POST /api/start                     # Start timelapse
POST /api/stop                      # Stop timelapse
GET  /api/sessions                  # List sessions
POST /api/compile                   # Compile video
GET  /api/camera/preview            # Live preview stream
GET  /api/camera/info               # Camera info
GET  /api/sessions/:id/preview      # Session preview
GET  /api/sessions/:id/video        # Download video
DELETE /api/sessions/:id            # Delete session
```

## 🎨 Example API Usage

```bash
# Get status
curl http://timelapsepi.local:5000/api/status

# Start timelapse with 10 second interval
curl -X POST http://timelapsepi.local:5000/api/start \
  -H "Content-Type: application/json" \
  -d '{"interval": 10, "resolution": [1920, 1080]}'

# Stop timelapse
curl -X POST http://timelapsepi.local:5000/api/stop

# List sessions
curl http://timelapsepi.local:5000/api/sessions

# Compile video
curl -X POST http://timelapsepi.local:5000/api/compile \
  -H "Content-Type: application/json" \
  -d '{"session_id": "20240101_120000", "fps": 30}'
```
