# Quick Manual Installation

If the install scripts give you trouble, here's a simple manual installation:

## One-Command Install (Copy and Paste)

```bash
# Install everything in one command
sudo apt-get update && \
sudo apt-get install -y python3 python3-pip ffmpeg avahi-daemon fswebcam v4l-utils && \
cd ~/timelapsepi && \
pip3 install --user --break-system-packages flask werkzeug && \
chmod +x app.py
```

## Run It

```bash
cd ~/timelapsepi
python3 app.py
```

Then open: `http://YOUR_PI_IP:5000`

## Make it Start on Boot (Optional)

```bash
# Copy and edit the service file
sudo cp timelapsepi.service /etc/systemd/system/
sudo nano /etc/systemd/system/timelapsepi.service

# Update these lines to match your username and path:
# User=YOUR_USERNAME
# WorkingDirectory=/home/YOUR_USERNAME/timelapsepi
# ExecStart=/usr/bin/python3 /home/YOUR_USERNAME/timelapsepi/app.py

# Then enable it
sudo systemctl daemon-reload
sudo systemctl enable timelapsepi
sudo systemctl start timelapsepi
```

## Enable .local Domain (Optional)

```bash
sudo cp timelapsepi.avahi-service /etc/avahi/services/timelapsepi.service
sudo systemctl restart avahi-daemon
```

Then access: `http://timelapsepi.local:5000`

## That's It!

No scripts needed. Just install the dependencies, install Flask, and run it.

## Test Your Camera First

Before running the app:

```bash
# List cameras
lsusb

# Check video devices  
ls -la /dev/video*

# Test capture
fswebcam test.jpg

# If that works, TimelapsePI will work!
```

## Troubleshooting Quick Fixes

### Can't install Flask?
```bash
# Try with break-system-packages
pip3 install --user --break-system-packages flask

# Or use virtual environment
python3 -m venv venv
source venv/bin/activate
pip install flask
python3 app.py
```

### Port 5000 in use?
```bash
# Edit app.py and change the port
nano app.py
# Change: app.run(host='0.0.0.0', port=5000, ...)
# To:     app.run(host='0.0.0.0', port=8080, ...)
```

### Camera not working?
```bash
# Add yourself to video group
sudo usermod -a -G video $USER
# Log out and back in

# Try different video device
fswebcam -d /dev/video0 test.jpg
fswebcam -d /dev/video1 test.jpg
```

---

**This method works on ANY Linux system with Python 3!**
