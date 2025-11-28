# Git Setup and Contributing

## Repository Structure

This repository uses `.gitignore` and `.gitkeep` files to maintain a clean structure while preserving necessary directories.

### What's Tracked in Git

**✅ Tracked:**
- Source code (`app.py`, `*.py`)
- Web interface (`static/`, `templates/`)
- Installation scripts (`install*.sh`)
- Documentation (`*.md`)
- Configuration templates
- Service files (`*.service`, `*.avahi-service`)
- Directory structure (via `.gitkeep` files)

**❌ Not Tracked (ignored):**
- User data (`timelapse_data/`)
- User configurations (`config/settings.json`)
- Virtual environments (`venv/`)
- Backup files
- Test images/videos
- Python cache (`__pycache__/`)
- IDE files (`.vscode/`, `.idea/`)
- OS files (`.DS_Store`, `Thumbs.db`)
- Log files

### Directory Structure

```
timelapsepi/
├── .git/                       # Git repository (not in tarball)
├── .gitignore                  # Defines what to ignore
├── .gitkeep files              # Preserve empty directories
├── app.py                      # Main application (tracked)
├── static/                     # Web assets (tracked)
├── templates/                  # HTML templates (tracked)
├── timelapse_data/             # User data (NOT tracked)
│   ├── .gitkeep                # Preserves directory
│   ├── images/                 # Session images (ignored)
│   └── videos/                 # Compiled videos (ignored)
├── config/                     # User config (NOT tracked)
│   └── .gitkeep                # Preserves directory
└── venv/                       # Virtual env (ignored)
```

## For Contributors

### Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd timelapsepi

# The directory structure is already created via .gitkeep files
# Just install dependencies
./install.sh
```

### Making Changes

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes
# Edit app.py, add features, etc.

# Test your changes
./test_run.sh

# Commit your changes
git add .
git commit -m "Description of your changes"

# Push to your fork
git push origin feature/your-feature-name
```

### What to Commit

**DO commit:**
- Code changes
- New features
- Bug fixes
- Documentation updates
- New installation scripts
- UI improvements

**DON'T commit:**
- Your personal timelapse images/videos
- Your config/settings.json file
- Test images (test.jpg, etc.)
- Virtual environment files
- IDE-specific settings
- Temporary files

### Testing Before Commit

```bash
# Run manual test
python3 app.py

# Check for Python errors
python3 -m py_compile app.py

# Test installation script (in a container/VM)
./install_venv.sh
```

## For Users

### If You Want to Track Your Own Changes

```bash
# Initialize git in your installation
cd ~/timelapsepi
git init

# Add remote (optional)
git remote add origin <your-fork-url>

# Your data will NOT be committed thanks to .gitignore
git add .
git commit -m "Initial setup"
```

### Updating from Upstream

```bash
# Add upstream remote
git remote add upstream <original-repo-url>

# Fetch updates
git fetch upstream

# Merge updates (keeps your data safe)
git merge upstream/main

# Your timelapse_data/ and config/ are safe!
```

## File Categories

### Source Code (Always Tracked)
- `app.py` - Main Flask application
- `static/` - CSS, JavaScript, images
- `templates/` - HTML templates
- `requirements.txt` - Python dependencies

### Installation (Always Tracked)
- `install*.sh` - Installation scripts
- `*.service` - Systemd service files
- `*.avahi-service` - mDNS configuration

### Documentation (Always Tracked)
- `README.md` - Main documentation
- `*.md` - All markdown docs
- `ARCHITECTURE.md`, `QUICK_REFERENCE.md`, etc.

### User Data (Never Tracked)
- `timelapse_data/images/` - Captured frames
- `timelapse_data/videos/` - Compiled videos
- `config/settings.json` - User settings

### Generated Files (Never Tracked)
- `venv/` - Virtual environment
- `__pycache__/` - Python cache
- `*.pyc` - Compiled Python
- `test.jpg` - Test images
- `*.log` - Log files

## .gitignore Patterns Explained

```gitignore
# Ignore all files in timelapse_data/
timelapse_data/

# Except preserve the directories with .gitkeep
!timelapse_data/.gitkeep
!timelapse_data/images/.gitkeep
!timelapse_data/videos/.gitkeep
```

This pattern:
1. Ignores everything in `timelapse_data/`
2. But keeps the directory structure
3. So git clones have the folders ready

## Best Practices

### For Development

1. **Always work in a branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Test before committing**
   ```bash
   ./test_run.sh
   python3 app.py
   ```

3. **Commit logical changes**
   ```bash
   git add app.py
   git commit -m "Add camera brightness control"
   ```

4. **Keep commits focused**
   - One feature per commit
   - Clear commit messages
   - Reference issues if applicable

### For Distribution

1. **Create clean tarball** (excludes .git):
   ```bash
   tar --exclude='.git' --exclude='venv' --exclude='timelapse_data/images/*' --exclude='timelapse_data/videos/*' -czf timelapsepi.tar.gz timelapsepi/
   ```

2. **Or use git archive**:
   ```bash
   git archive --format=tar.gz --prefix=timelapsepi/ HEAD > timelapsepi.tar.gz
   ```

## Troubleshooting

### "I accidentally committed user data!"

```bash
# Remove from git but keep file
git rm --cached timelapse_data/images/20240101_120000/frame_000001.jpg

# Remove entire directory from git
git rm -r --cached timelapse_data/images/20240101_120000/

# Commit the removal
git commit -m "Remove accidentally committed user data"
```

### "Git is tracking files it shouldn't"

```bash
# Check .gitignore is correct
cat .gitignore

# Remove from git cache
git rm -r --cached .
git add .
git commit -m "Fix .gitignore"
```

### "I want to ignore additional files"

```bash
# Add to .gitignore
echo "my_custom_file.txt" >> .gitignore

# If already tracked, remove from git
git rm --cached my_custom_file.txt

# Commit
git commit -m "Update .gitignore"
```

## Summary

- `.gitignore` keeps user data and generated files out of git
- `.gitkeep` preserves empty directory structure
- `.gitattributes` ensures proper line endings
- Contributors work on source code only
- Users' timelapse data is never at risk of being committed

---

**Happy Contributing! 🚀**
