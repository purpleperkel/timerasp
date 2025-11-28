# Video Preview & System Controls

## New Features

### 📹 Video Preview

Preview your compiled timelapse videos directly in the web browser before downloading.

#### How to Use:

1. **Compile a video** from a session
2. **Click "▶️ Preview"** button on any session with a compiled video
3. **Video player modal appears** with full playback controls
4. **Download from preview** or close and download later

#### Features:

- ✅ In-browser HTML5 video player
- ✅ Full playback controls (play, pause, seek, volume)
- ✅ Fullscreen support
- ✅ Download directly from preview
- ✅ Keyboard shortcut: Press `Esc` to close preview

### ⚙️ System Controls

Control your Raspberry Pi directly from the web interface - no SSH needed!

#### Available Controls:

**1. 🔄 Restart Service**
- Restarts the TimelapsePI service
- Stops active timelapses
- Page reloads automatically after 5 seconds
- Useful for: Applying configuration changes

**2. 🔁 Reboot Pi**
- Reboots the Raspberry Pi in 1 minute
- Stops all running services
- System comes back online automatically
- Useful for: Applying system updates, freeing memory

**3. 🔌 Shutdown Pi**
- Shuts down the Raspberry Pi in 1 minute
- Safely powers down the system
- Requires physical power cycle to restart
- Useful for: Safe power-off, moving the Pi

#### Safety Features:

- ⚠️ **Confirmation required** for all system actions
- ⏱️ **1 minute delay** for shutdown/reboot (can be cancelled)
- 🔒 **Sudo permissions** configured automatically during install
- 📝 **Warning messages** explain what will happen

#### Security Notes:

- System controls use sudo with restricted permissions
- Only specific commands are allowed (shutdown, reboot, restart service)
- Configured during installation in `/etc/sudoers.d/timelapsepi`
- Follows security best practices

## Installation

### Automatic Setup

All install scripts (`install.sh`, `install_venv.sh`, `install_usb_only.sh`) automatically:

1. Copy sudoers configuration
2. Set correct permissions (0440)
3. Validate syntax
4. Configure for your username

### Manual Setup

If needed, you can set up sudo permissions manually:

```bash
# Copy sudoers file
sudo cp timelapsepi-sudoers /etc/sudoers.d/timelapsepi

# Replace 'pi' with your username
sudo sed -i "s|^pi |$USER |g" /etc/sudoers.d/timelapsepi

# Set correct permissions
sudo chmod 0440 /etc/sudoers.d/timelapsepi

# Validate syntax
sudo visudo -c -f /etc/sudoers.d/timelapsepi
```

### Verification

Test sudo permissions:

```bash
# Should work without password prompt
sudo shutdown -c
sudo systemctl status timelapsepi
```

## Usage Examples

### Video Preview Workflow

```
1. Start timelapse → capture frames
2. Stop timelapse → compile video
3. Click "Preview" → watch in browser
4. Like it? → Click "Download"
5. Don't like it? → Delete and try again
```

### System Control Workflow

**Restarting after configuration changes:**
```
1. Modify config/settings.json
2. Click "Restart Service"
3. Confirm action
4. Wait 5 seconds for reload
5. New settings active!
```

**Rebooting the Pi:**
```
1. Click "Reboot Pi"
2. Read warning message
3. Confirm action
4. System reboots in 1 minute
5. Access again once rebooted
```

**Shutting down safely:**
```
1. Stop active timelapses
2. Download any important videos
3. Click "Shutdown Pi"
4. Confirm action
5. Wait for shutdown to complete
6. Unplug power when LED stops blinking
```

## Troubleshooting

### Video Preview Issues

**Problem:** Video won't play

**Solutions:**
1. Check if video file exists:
   ```bash
   ls -la ~/timelapsepi/timelapse_data/videos/
   ```

2. Try downloading and playing locally

3. Check browser console for errors

4. Try a different browser (Chrome recommended)

**Problem:** Preview is laggy or stutters

**Solutions:**
1. Video is too large - try lower resolution
2. Slow network - use download instead
3. Compile with lower frame rate
4. Use hardware-accelerated browser

### System Control Issues

**Problem:** "Permission denied" errors

**Solutions:**
1. Check sudoers file exists:
   ```bash
   sudo cat /etc/sudoers.d/timelapsepi
   ```

2. Verify permissions:
   ```bash
   ls -la /etc/sudoers.d/timelapsepi
   # Should show: -r--r----- (0440)
   ```

3. Validate syntax:
   ```bash
   sudo visudo -c -f /etc/sudoers.d/timelapsepi
   ```

4. Reinstall:
   ```bash
   cd ~/timelapsepi
   sudo cp timelapsepi-sudoers /etc/sudoers.d/timelapsepi
   sudo sed -i "s|^pi |$USER |g" /etc/sudoers.d/timelapsepi
   sudo chmod 0440 /etc/sudoers.d/timelapsepi
   ```

**Problem:** Buttons don't work

**Solutions:**
1. Check browser console for errors
2. Restart the TimelapsePI service
3. Clear browser cache
4. Try a different browser

**Problem:** System doesn't shutdown/reboot

**Solutions:**
1. Check if command was sent:
   ```bash
   # Check if shutdown is scheduled
   sudo shutdown -c
   # This will cancel if scheduled, or show error if not
   ```

2. Check system logs:
   ```bash
   sudo journalctl -n 50
   ```

3. SSH into Pi and run manually:
   ```bash
   sudo reboot
   # or
   sudo shutdown -h now
   ```

## API Endpoints

### Video Preview
```
GET /api/sessions/<session_id>/video/stream
```
Returns: MP4 video stream

### System Controls
```
POST /api/system/restart-service
POST /api/system/reboot
POST /api/system/shutdown
POST /api/system/cancel-shutdown
```

## Security Considerations

### What's Allowed

The sudoers configuration ONLY allows:
- `/sbin/shutdown` - System shutdown
- `/sbin/reboot` - System reboot
- `/bin/systemctl restart timelapsepi` - Service restart
- `/bin/systemctl stop timelapsepi` - Service stop
- `/bin/systemctl start timelapsepi` - Service start

### What's NOT Allowed

- No arbitrary command execution
- No file system modifications
- No user management
- No package installation
- No privilege escalation

### Best Practices

1. **Use HTTPS** if accessing remotely (set up with reverse proxy)
2. **Firewall rules** to restrict access to local network
3. **Change default passwords** on your Pi
4. **Keep system updated** with `sudo apt update && sudo apt upgrade`

## Cancelling Shutdown/Reboot

If you accidentally click shutdown or reboot, you have 1 minute to cancel:

### Via SSH:
```bash
sudo shutdown -c
```

### Via System:
The system will be listening for the cancel command, you just need SSH access.

## Tips & Tricks

### Video Preview

- Use fullscreen for best viewing experience
- Adjust playback speed in browser (some browsers support this)
- Right-click video for download/save options
- Preview before sharing to check quality

### System Controls

- **Restart Service** is safe and quick for testing changes
- **Reboot** is good for clearing memory or applying updates
- **Shutdown** saves power when not in use
- Always download important videos before shutdown!

### Remote Access

If accessing TimelapsePI remotely:
- Set up SSH for emergency access
- Use VPN for secure connection
- Consider UPS for clean shutdowns
- Document your IP address/hostname

## Related Files

- `timelapsepi-sudoers` - Sudo permissions configuration
- `app.py` - System control API endpoints
- `templates/index.html` - UI with preview modal
- `static/js/app.js` - Preview and control JavaScript

---

**Enjoy previewing your timelapses and easy system control! 🎥⚙️**
