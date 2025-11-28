# What Gets Committed to Git

## Quick Reference

### ✅ TRACKED (Committed to Git)

**Core Application:**
- `app.py` - Main Flask application
- `requirements.txt` - Python dependencies
- `static/` - All web assets (CSS, JS)
- `templates/` - All HTML templates

**Installation & Setup:**
- `install.sh` - Main installer
- `install_usb_only.sh` - USB camera installer  
- `install_venv.sh` - Virtual environment installer
- `fix_local_domain.sh` - Domain fix script
- `test_run.sh` - Test runner
- `timelapsepi.service` - Systemd service template
- `timelapsepi.avahi-service` - mDNS configuration

**Documentation:**
- `README.md` - Main documentation
- All `*.md` files - Guides and references
- `ARCHITECTURE.md`
- `GETTING_STARTED.md`
- `INSTALLATION_TROUBLESHOOTING.md`
- `USB_CAMERA_GUIDE.md`
- `QUICK_REFERENCE.md`
- `QUICK_MANUAL_INSTALL.md`
- `FIXING_LOCAL_DOMAIN.md`
- `UPDATE_GUIDE.md`
- `GIT_SETUP.md`

**Git Configuration:**
- `.gitignore` - What to ignore
- `.gitattributes` - File handling rules
- `.dockerignore` - Docker build exclusions
- `.gitkeep` files - Preserve directory structure

### ❌ IGNORED (Not Committed)

**User Data:**
- `timelapse_data/images/` - All captured frames
- `timelapse_data/videos/` - All compiled videos
- `config/settings.json` - User configuration
- Any session directories

**Generated Files:**
- `venv/` - Python virtual environment
- `__pycache__/` - Python bytecode cache
- `*.pyc`, `*.pyo` - Compiled Python files
- `run_app.sh` - Auto-generated script
- `timelapsepi-venv.service` - Modified service file

**Development Files:**
- `.vscode/` - VS Code settings
- `.idea/` - PyCharm settings
- `*.swp`, `*.swo` - Vim swap files
- `.DS_Store` - macOS metadata
- `Thumbs.db` - Windows thumbnails

**Backup & Temporary:**
- `*_backup/` - Any backup directories
- `timelapsepi_backup/` - Backup directories
- `*.backup` - Backup files
- `*.tmp` - Temporary files
- `*.temp` - Temporary files
- `test.jpg` - Test images
- `test.mp4` - Test videos
- `preview/` - Preview directory

**Logs:**
- `*.log` - All log files
- `logs/` - Log directories

**System:**
- `/etc/` - System files (already installed elsewhere)
- `*.deb`, `*.rpm` - Package files

## Why This Matters

### For Users

**Your data is safe!**
- Your timelapses won't be accidentally committed
- Your camera settings stay private
- Your local modifications are preserved

**Easy updates:**
- Pull new code without losing data
- Switch between versions safely
- Fork and customize without conflicts

### For Contributors

**Clean repository:**
- No user data in git history
- Smaller clone size
- Focus on code, not data

**Easy collaboration:**
- No merge conflicts in user data
- Clear what's code vs. configuration
- Standard Python project structure

### For Distribution

**Portable:**
- Git clone has everything needed
- Tarball excludes unnecessary files
- Docker builds are efficient

**Professional:**
- Follows best practices
- Standard .gitignore patterns
- Clear documentation

## Directory Structure After Clone

```
timelapsepi/
├── app.py                          ✅ Tracked
├── requirements.txt                ✅ Tracked
├── README.md                       ✅ Tracked
├── .gitignore                      ✅ Tracked
├── .gitattributes                  ✅ Tracked
├── install.sh                      ✅ Tracked
├── static/                         ✅ Tracked
│   ├── css/
│   └── js/
├── templates/                      ✅ Tracked
│   └── index.html
├── timelapse_data/                 ✅ Directory tracked
│   ├── .gitkeep                    ✅ Tracked (preserves dir)
│   ├── images/                     ✅ Directory tracked
│   │   └── .gitkeep                ✅ Tracked (preserves dir)
│   └── videos/                     ✅ Directory tracked
│       └── .gitkeep                ✅ Tracked (preserves dir)
├── config/                         ✅ Directory tracked
│   └── .gitkeep                    ✅ Tracked (preserves dir)
└── venv/                           ❌ Created locally, ignored
```

## What Happens When You Install

```bash
./install.sh
```

**Created locally (ignored by git):**
1. `venv/` - Python virtual environment
2. `timelapse_data/images/SESSION_ID/` - Session directories
3. `timelapse_data/videos/SESSION_ID.mp4` - Videos
4. `config/settings.json` - Your settings
5. `run_app.sh` - Wrapper script (venv installs)
6. System files in `/etc/systemd/system/`
7. System files in `/etc/avahi/services/`

**None of these are committed to git!**

## Checking What's Ignored

```bash
# See what would be committed
git status

# See what's ignored
git status --ignored

# Check specific file
git check-ignore -v timelapse_data/images/20240101_120000/frame_000001.jpg

# List all tracked files
git ls-files
```

## Testing .gitignore

```bash
# Create test data
cd ~/timelapsepi
mkdir -p timelapse_data/images/test_session
touch timelapse_data/images/test_session/frame_000001.jpg
echo '{"test": true}' > config/settings.json
mkdir venv

# Check git status
git status

# You should NOT see:
# - timelapse_data/images/test_session/
# - config/settings.json
# - venv/

# You SHOULD see only tracked files if modified
```

## Summary Table

| Category | Example | Tracked? | Why |
|----------|---------|----------|-----|
| Source Code | `app.py` | ✅ Yes | Core functionality |
| Web Assets | `static/css/style.css` | ✅ Yes | Part of application |
| Templates | `templates/index.html` | ✅ Yes | Part of application |
| Install Scripts | `install.sh` | ✅ Yes | Distribution |
| Documentation | `README.md` | ✅ Yes | User guidance |
| User Images | `timelapse_data/images/*` | ❌ No | User data |
| User Videos | `timelapse_data/videos/*` | ❌ No | User data |
| User Config | `config/settings.json` | ❌ No | User settings |
| Virtual Env | `venv/` | ❌ No | Generated |
| Python Cache | `__pycache__/` | ❌ No | Generated |
| Test Files | `test.jpg` | ❌ No | Temporary |
| Backups | `*_backup/` | ❌ No | User data |
| Logs | `*.log` | ❌ No | Generated |
| IDE Files | `.vscode/` | ❌ No | Personal |

## Best Practices

1. **Never commit user data** - Already handled by .gitignore
2. **Keep documentation current** - Update README when changing features
3. **Test before commit** - Run `./test_run.sh`
4. **Use branches** - Never commit directly to main
5. **Clear commit messages** - Describe what and why

## Related Files

- `.gitignore` - Main ignore rules
- `.gitattributes` - File handling (line endings, binary files)
- `.dockerignore` - Docker build exclusions
- `GIT_SETUP.md` - Detailed git guide for contributors

---

**Your data stays yours, the code stays shared! 🔒✨**
