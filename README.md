# TimelapsePI 📷

A Raspberry Pi timelapse camera controller with web interface, accessible at `timelapsepi.local`.

## Features

- 🎥 **Live Camera Preview** - See what your camera sees in real-time
- ⏱️ **Configurable Intervals** - Set capture intervals from 1 second to 1 hour
- 📐 **Multiple Resolutions** - Support for 4K, Full HD, HD, and VGA
- 🎬 **Video Compilation** - Automatically compile images into MP4 videos
- 💾 **Session Management** - Save, view, and manage multiple timelapse sessions
- 🌐 **Easy Access** - Access via `timelapsepi.local:5000` on your network
- 🚀 **Auto-start** - Starts automatically on boot

## Hardware Requirements

- Raspberry Pi (3, 4, or 5 recommended)
- **USB Webcam** (recommended - works with most UVC cameras)
  - Logitech C270, C920, C922
  - Microsoft LifeCam series
  - Most generic USB webcams
  - OR Raspberry Pi Camera Module (v1, v2, v3, or HQ)
- MicroSD card (16GB+ recommended)
- Power supply (powered USB hub recommended for high-res USB cameras)

## Software Requirements

- Raspberry Pi OS (Bullseye or newer)
- Python 3.7+
- ffmpeg
- libcamera-apps (for Pi Camera) or fswebcam (for USB cameras)

## Quick Installation

1. **Clone or copy the files to your Raspberry Pi:**
   ```bash
   git clone <your-repo> timelapsepi
   cd timelapsepi
   ```

2. **Run the installation script:**
   ```bash
   chmod +x install.sh
   ./install.sh
   ```
   
   **Note:** If you get errors about `libcamera-apps`, that's fine for USB cameras! The script will skip it automatically. Or use `./install_usb_only.sh` for a cleaner USB-only install.

3. **Wait for installation to complete** (takes 2-5 minutes)

4. **Access the interface:**
   - Open a browser and go to `http://timelapsepi.local:5000`
   - Or use your Pi's IP address: `http://192.168.1.xxx:5000`

That's it! 🎉

**Having installation issues?** See [INSTALLATION_TROUBLESHOOTING.md](INSTALLATION_TROUBLESHOOTING.md)

## Manual Installation

If you prefer to install manually:

### 1. Install System Dependencies

```bash
sudo apt-get update
sudo apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    avahi-daemon \
    libcamera-apps \
    fswebcam
```

### 2. Install Python Dependencies

```bash
pip3 install -r requirements.txt
```

### 3. Set Up Systemd Service

```bash
sudo cp timelapsepi.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable timelapsepi.service
sudo systemctl start timelapsepi.service
```

### 4. Set Up .local Domain (Optional)

```bash
sudo cp timelapsepi.avahi-service /etc/avahi/services/timelapsepi.service
sudo systemctl restart avahi-daemon
```

### 5. Change Hostname (Optional)

```bash
sudo hostnamectl set-hostname timelapsepi
echo "127.0.1.1    timelapsepi" | sudo tee -a /etc/hosts
sudo reboot
```

## Usage

### Starting a Timelapse

1. Open the web interface
2. Set your desired interval (in seconds)
3. Choose resolution
4. Click "Start Timelapse"
5. Watch the frame counter increase!

### Stopping a Timelapse

1. Click "Stop Timelapse"
2. Optionally compile the images into a video

### Compiling Videos

Videos are compiled using ffmpeg at 30fps by default. You can:

- Compile immediately after stopping
- Compile later from the "Saved Sessions" section
- Choose custom frame rates during compilation

### Managing Sessions

Each timelapse creates a session with:
- All captured images
- Metadata (timestamp, frame count)
- Optional compiled video

You can:
- Preview any session
- Download compiled videos
- Delete old sessions to free space

## Camera Support

### USB Webcam (Recommended)

TimelapsePI automatically detects USB webcams via `fswebcam` and `v4l-utils`. Just plug it in!

**Quick test:**
```bash
fswebcam test.jpg
```

**For detailed USB camera setup, troubleshooting, and optimization, see [USB_CAMERA_GUIDE.md](USB_CAMERA_GUIDE.md)**

Common USB cameras that work great:
- Logitech C270, C920, C922
- Microsoft LifeCam series
- Most UVC-compatible webcams

### Raspberry Pi Camera Module

The app also supports Raspberry Pi Camera Modules (v1, v2, v3, HQ) via `libcamera-still`.

**Enable the camera:**
```bash
sudo raspi-config
# Interface Options > Camera > Enable
```

## Configuration

### Change Port

Edit `/etc/systemd/system/timelapsepi.service` and modify the app.py command:

```python
# In app.py, change the last line:
app.run(host='0.0.0.0', port=8080, debug=False, threaded=True)
```

Then restart:
```bash
sudo systemctl daemon-reload
sudo systemctl restart timelapsepi
```

### Storage Location

By default, all data is stored in `~/timelapsepi/timelapse_data/`:
- Images: `timelapse_data/images/`
- Videos: `timelapse_data/videos/`

To change this, modify `BASE_DIR` in `app.py`.

### Camera Settings

Resolution and other camera settings can be adjusted in the web interface or by editing the config file at `config/settings.json`.

## Troubleshooting

### Can't access timelapsepi.local

1. **Check Avahi is running:**
   ```bash
   sudo systemctl status avahi-daemon
   ```

2. **Use IP address instead:**
   ```bash
   hostname -I
   # Then access http://YOUR_IP:5000
   ```

3. **Windows users:** Install [Bonjour Print Services](https://support.apple.com/kb/DL999)

### Camera not detected

1. **Check camera connection:**
   ```bash
   # For Pi Camera:
   libcamera-hello --list-cameras
   
   # For USB camera:
   ls /dev/video*
   ```

2. **Enable camera interface:**
   ```bash
   sudo raspi-config
   # Interface Options > Camera
   ```

3. **Check permissions:**
   ```bash
   sudo usermod -a -G video $USER
   ```

### Service won't start

1. **Check logs:**
   ```bash
   sudo journalctl -u timelapsepi -n 50
   ```

2. **Test manually:**
   ```bash
   cd ~/timelapsepi
   python3 app.py
   ```

3. **Check Python packages:**
   ```bash
   pip3 list | grep -i flask
   ```

### Out of storage space

1. **Check disk usage:**
   ```bash
   df -h
   ```

2. **Delete old sessions** via the web interface or:
   ```bash
   rm -rf ~/timelapsepi/timelapse_data/images/OLD_SESSION_ID
   rm ~/timelapsepi/timelapse_data/videos/OLD_SESSION_ID.mp4
   ```

## File Structure

```
timelapsepi/
├── app.py                      # Main Flask application
├── requirements.txt            # Python dependencies
├── install.sh                  # Installation script
├── timelapsepi.service         # Systemd service file
├── timelapsepi.avahi-service   # Avahi mDNS configuration
├── static/
│   ├── css/
│   │   └── style.css          # Stylesheet
│   └── js/
│       └── app.js             # Frontend JavaScript
├── templates/
│   └── index.html             # Web interface
├── timelapse_data/
│   ├── images/                # Captured frames (by session)
│   └── videos/                # Compiled videos
└── config/
    └── settings.json          # Configuration file
```

## API Endpoints

For integration or automation:

- `GET /api/status` - Get current status
- `POST /api/start` - Start timelapse
- `POST /api/stop` - Stop timelapse
- `GET /api/sessions` - List sessions
- `POST /api/compile` - Compile video
- `DELETE /api/sessions/<id>` - Delete session
- `GET /api/camera/preview` - Live camera stream

## Tips & Best Practices

1. **Storage:** A 24-hour timelapse at 5-second intervals = ~17,280 images (~25-50GB)
2. **Power:** Use a good quality power supply (3A+ for Pi 4)
3. **Cooling:** Consider a heatsink/fan for long timelapses
4. **Lighting:** Keep lighting consistent for best results
5. **Stability:** Mount your Pi securely to avoid vibration
6. **Backup:** Regularly download and backup your videos

## Advanced Usage

### Custom Intervals by Time of Day

You can modify the timelapse worker to capture more frequently during certain hours:

```python
# In app.py, modify timelapse_worker function
hour = datetime.now().hour
interval = 5 if 8 <= hour <= 18 else 30  # 5s during day, 30s at night
```

### Remote Access

To access from outside your network:

1. Set up port forwarding on your router (port 5000)
2. Or use a service like Tailscale or ngrok

### Automatic Upload

Add automatic upload to cloud storage by adding to the worker function.

## Contributing

Feel free to submit issues, fork the repository, and create pull requests!

## License

MIT License - feel free to use and modify as needed.

## Credits

Built with Flask, libcamera, ffmpeg, and lots of ☕

---

**Enjoy your timelapse photography! 📸✨**
