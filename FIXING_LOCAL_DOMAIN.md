# Fixing timelapsepi.local Domain

## Quick Fix

The `.local` domain requires your Pi's hostname to be set to "timelapsepi". Here's the quickest fix:

### Run the fix script:
```bash
cd ~/timelapsepi
chmod +x fix_local_domain.sh
./fix_local_domain.sh
```

This will:
1. Check/install Avahi
2. Offer to change hostname to "timelapsepi"
3. Configure mDNS properly
4. Test the configuration

## Manual Fix

If you prefer to do it manually:

### Step 1: Check your hostname
```bash
hostname
```

If it's not "timelapsepi", change it:
```bash
sudo hostnamectl set-hostname timelapsepi
```

### Step 2: Update /etc/hosts
```bash
sudo nano /etc/hosts
```

Add or update this line:
```
127.0.1.1    timelapsepi
```

### Step 3: Fix Avahi service file
```bash
sudo nano /etc/avahi/services/timelapsepi.service
```

Make sure it looks exactly like this:
```xml
<?xml version="1.0" standalone='no'?>
<!DOCTYPE service-group SYSTEM "avahi-service.dtd">
<service-group>
  <name replace-wildcards="yes">TimelapsePI on %h</n>
  <service>
    <type>_http._tcp</type>
    <port>5000</port>
    <txt-record>path=/</txt-record>
  </service>
</service-group>
```

### Step 4: Restart Avahi
```bash
sudo systemctl restart avahi-daemon
```

### Step 5: REBOOT (Important!)
```bash
sudo reboot
```

After reboot, try: `http://timelapsepi.local:5000`

## Why .local Doesn't Work

The `.local` domain is provided by mDNS/Avahi and depends on:

1. **Hostname** - Must match the domain (timelapsepi)
2. **Avahi** - Must be running
3. **Network** - Must be on same network
4. **Client** - Your computer must support mDNS

## Testing

### On your Raspberry Pi:
```bash
# Check hostname
hostname
# Should output: timelapsepi

# Check Avahi is running
sudo systemctl status avahi-daemon

# See what's being advertised
avahi-browse -a -t | grep -i timelapse

# Ping yourself
ping timelapsepi.local
```

### On your computer:

**Mac/Linux:**
```bash
ping timelapsepi.local
```

**Windows (if doesn't work):**
- Install [Bonjour Print Services](https://support.apple.com/kb/DL999)
- Then try: `ping timelapsepi.local`

## Common Issues

### Issue: "Hostname is not timelapsepi"

**Solution:**
```bash
sudo hostnamectl set-hostname timelapsepi
echo "127.0.1.1    timelapsepi" | sudo tee -a /etc/hosts
sudo reboot
```

### Issue: "Avahi not running"

**Solution:**
```bash
sudo apt-get install avahi-daemon avahi-utils
sudo systemctl enable avahi-daemon
sudo systemctl start avahi-daemon
```

### Issue: "Works on Pi but not from computer"

**Solutions:**

1. **Make sure you're on the same network**
   - Pi and computer must be on same WiFi/LAN

2. **Windows users - Install Bonjour**
   - Download: https://support.apple.com/kb/DL999
   - Or use IP address instead

3. **Check firewall**
   - Some firewalls block mDNS (port 5353 UDP)

4. **Try different browser**
   - Sometimes browser DNS cache causes issues

### Issue: "Still doesn't work after reboot"

**Alternative solutions:**

1. **Use IP address** (always works):
   ```bash
   # On Pi, find your IP:
   hostname -I
   
   # Then access via:
   http://192.168.1.XXX:5000
   ```

2. **Add entry to computer's hosts file**:
   
   **Mac/Linux:**
   ```bash
   # Find Pi's IP first
   sudo nano /etc/hosts
   # Add line:
   192.168.1.XXX    timelapsepi.local
   ```
   
   **Windows:**
   ```
   # Run Notepad as Administrator
   # Open: C:\Windows\System32\drivers\etc\hosts
   # Add line:
   192.168.1.XXX    timelapsepi.local
   ```

3. **Use raspberrypi.local** (if hostname wasn't changed):
   ```
   http://raspberrypi.local:5000
   ```

## Verification Checklist

Run these commands on your Pi to verify everything:

```bash
# 1. Check hostname
echo "Hostname: $(hostname)"

# 2. Check Avahi is running
systemctl is-active avahi-daemon && echo "✅ Avahi running" || echo "❌ Avahi not running"

# 3. Check service file exists
ls -la /etc/avahi/services/timelapsepi.service && echo "✅ Service file exists" || echo "❌ Service file missing"

# 4. Check if service is advertised
avahi-browse -a -t | grep -i timelapse && echo "✅ Service advertised" || echo "❌ Service not advertised"

# 5. Test local resolution
ping -c 1 timelapsepi.local && echo "✅ Local resolution works" || echo "❌ Local resolution failed"
```

## Client-Side Issues

### Windows

If `.local` doesn't work on Windows:

1. Install Bonjour Print Services
2. OR use Discovery DNS-SD Browser to verify service
3. OR just use IP address

### Mac

Should work automatically. If not:
```bash
# Flush DNS cache
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

### Linux

Should work automatically. If not:
```bash
# Install avahi client
sudo apt-get install avahi-daemon avahi-utils

# Or use systemd-resolved
sudo systemctl restart systemd-resolved
```

### Android/iOS

Most mobile browsers support `.local`, but may need:
- Be on same WiFi network
- Wait a minute for DNS to propagate
- Close and reopen browser

## The Easy Way Out

If `.local` is too much trouble, just:

1. **Find your Pi's IP:**
   ```bash
   hostname -I
   ```

2. **Bookmark it:**
   ```
   http://192.168.1.XXX:5000
   ```

3. **Or set a static IP on your router**

## Summary

**For .local to work:**
- ✅ Hostname must be "timelapsepi"
- ✅ Avahi must be running
- ✅ Must reboot after hostname change
- ✅ Client and Pi on same network
- ✅ Client must support mDNS

**If it still doesn't work:**
- Just use the IP address!
- It works exactly the same way
- http://YOUR_PI_IP:5000
