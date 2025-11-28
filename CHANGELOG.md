# Changelog - Git Setup & Camera Controls Update

## Version 1.1.0 - Git Configuration & Camera Controls

### 🎯 New Features

#### Camera Controls in UI
- **Brightness slider** (0-255) - Adjust camera brightness
- **Contrast slider** (0-64) - Adjust camera contrast  
- **Saturation slider** (0-128) - Adjust color saturation
- **Auto/Manual exposure** - Toggle between auto and manual exposure
- **Manual exposure slider** (1-5000) - Fine-tune exposure when in manual mode
- **Apply Settings button** - Save changes to camera with visual feedback
- **Refresh Current button** - Load current camera settings
- **Auto-hide for non-USB cameras** - Only shows for USB cameras

#### Git Configuration
- **Comprehensive .gitignore** - Excludes all user data, generated files, and temporary files
- **.gitattributes** - Proper line ending handling for cross-platform development
- **.dockerignore** - Efficient Docker builds
- **.gitkeep files** - Preserves directory structure in git
- **GIT_SETUP.md** - Complete guide for contributors
- **WHAT_GETS_COMMITTED.md** - Clear documentation of what's tracked

### 🔧 Bug Fixes

#### Sessions Loading
- Fixed "error loading sessions" issue
- Added proper error handling to sessions endpoint
- Auto-creates required directories if they don't exist
- Handles malformed session names gracefully

#### Camera Detection
- Improved USB camera detection logic
- Better handling of missing libcamera tools
- More informative camera type display in UI

### 📚 Documentation

#### New Guides
- **UPDATE_GUIDE.md** - How to update existing installations
- **GIT_SETUP.md** - Git setup and contribution guidelines
- **WHAT_GETS_COMMITTED.md** - Clear file tracking documentation

#### Updated Guides
- **README.md** - Added camera controls information
- **INSTALLATION_TROUBLESHOOTING.md** - Enhanced with more solutions

### 🗂️ Git Ignore Patterns

#### Now Ignored (Not Committed)
- `timelapse_data/` - All user timelapse data
- `config/settings.json` - User configuration
- `venv/` - Virtual environments
- `__pycache__/` - Python cache
- `*_backup/` - Backup directories
- `test.jpg`, `test.mp4` - Test files
- `*.log` - Log files
- IDE files (`.vscode/`, `.idea/`)
- OS files (`.DS_Store`, `Thumbs.db`)
- `run_app.sh` - Generated wrapper script
- `timelapsepi-venv.service` - Modified service file

#### Preserved Structure
- `.gitkeep` files in `timelapse_data/`, `config/`
- Directory structure maintained for clean clones

### 🔄 API Changes

#### New Endpoints
- `GET /api/camera/controls` - Get current camera control values
- `POST /api/camera/controls` - Set camera control values

#### Enhanced Endpoints
- `GET /api/sessions` - Now has better error handling
- `GET /api/status` - Shows camera type information

### 💻 UI Improvements

#### Status Display
- Shows camera type (USB Camera / Pi Camera / No Camera)
- Camera controls section auto-appears for USB cameras
- Better visual feedback on camera status

#### User Experience
- Real-time slider value updates
- Visual confirmation when applying settings
- Collapsible manual exposure controls
- Responsive design maintained

### 🛠️ Installation

#### What Gets Installed
All installers now create:
- Directory structure (via .gitkeep)
- Required system packages
- Python dependencies
- Systemd service
- Avahi configuration

#### What Stays Local
User-generated content:
- Timelapse images
- Compiled videos
- Configuration settings
- Virtual environment
- Log files

### 📦 Distribution

#### Tarball Creation
New clean tarball excludes:
- `.git/` directory
- `venv/` directory
- `__pycache__/`
- User data directories (images/videos)

Created with:
```bash
tar --exclude='.git' --exclude='venv' --exclude='__pycache__' \
    --exclude='timelapse_data/images/*' \
    --exclude='timelapse_data/videos/*' \
    -czf timelapsepi.tar.gz timelapsepi/
```

### 🔐 Security & Privacy

- User timelapse data never committed to git
- User camera settings stay private
- Local modifications preserved
- No sensitive data in repository

### ⚡ Performance

- Lighter git clones (no user data)
- Faster Docker builds (with .dockerignore)
- Efficient updates (pull code, keep data)

### 🎓 For Contributors

#### New Workflow Support
- Clear contribution guidelines
- Standard Python project structure
- Easy fork and customize
- No merge conflicts in user data

#### Development Tools
- `.gitattributes` for consistent line endings
- `.gitignore` for clean working directory
- Documentation for all workflows

### 📋 Upgrade Path

#### From Previous Version
1. Stop service
2. Backup data (optional - .gitignore protects it)
3. Copy new files
4. Restart service
5. Enjoy new camera controls!

See `UPDATE_GUIDE.md` for detailed instructions.

### 🐛 Known Issues

None currently!

### 🔮 Future Enhancements

Potential additions:
- White balance controls
- Focus controls (for cameras that support it)
- Preset profiles (indoor/outdoor/night)
- Schedule-based settings changes

### 📝 Notes

- Camera controls only available for USB cameras
- Requires `v4l-utils` to be installed
- Settings persist until camera is unplugged
- Use "Lock Exposure" for consistent timelapses

---

## Files Changed/Added

### Modified
- `app.py` - Added camera controls endpoints, fixed sessions
- `.gitignore` - Comprehensive exclusion rules
- `templates/index.html` - Added camera controls UI
- `static/css/style.css` - Added slider styles
- `static/js/app.js` - Added camera control logic
- `README.md` - Updated with new features

### Added
- `.gitattributes` - Line ending configuration
- `.dockerignore` - Docker build efficiency
- `.gitkeep` files - Preserve directories
- `GIT_SETUP.md` - Contributor guide
- `WHAT_GETS_COMMITTED.md` - File tracking docs
- `UPDATE_GUIDE.md` - Update instructions
- `CHANGELOG.md` - This file

### Preserved
All user data directories:
- `timelapse_data/images/`
- `timelapse_data/videos/`
- `config/`

---

**Version 1.1.0 - Camera Controls & Git Setup Complete! 🎉**
