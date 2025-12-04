# Pause/Resume Feature Documentation

## Overview
TimelapsePI now supports pausing and resuming timelapse recordings, with full persistence across system restarts. This allows you to:
- Pause a timelapse temporarily
- Shut down or restart your Raspberry Pi
- Resume the timelapse from exactly where you left off

## How It Works

### Session Persistence
When you pause a timelapse, the current session state is saved to disk including:
- Session ID and timestamp
- Current frame count
- All settings (interval, resolution, schedules)
- Variable interval configuration (if enabled)
- Last captured frame number

### File Storage
- Session state is saved to: `/config/sessions_state.json`
- Image frames remain in: `/timelapse_data/images/{session_id}/`
- State file is automatically cleared when resuming or stopping

## Using Pause/Resume

### Via Web Interface

#### To Pause:
1. While a timelapse is running, click the **⏸️ Pause** button
2. Confirm the pause action
3. The session state is saved automatically
4. You'll see "Paused (X frames)" in the status

#### To Resume:
1. Click the **▶️ Resume** button
2. Recording continues from the last frame
3. The UI shows which frame it resumed from
4. All settings are restored exactly as they were

### After System Restart

When TimelapsePI starts up, it automatically:
1. Checks for any paused sessions
2. Restores the session state if found
3. Shows the paused session in the UI
4. Allows you to resume with the Resume button

## Features

### Complete State Preservation
- **Frame continuity**: No frames are lost or duplicated
- **Settings retained**: All intervals, schedules, and configurations
- **Time tracking**: Total pause duration is tracked
- **Variable intervals**: Schedule continues correctly after resume

### Safety Features
- Confirmation dialogs prevent accidental pauses
- State validation ensures corrupted files don't cause issues
- Missing session directories are detected and handled
- Automatic cleanup of state files when appropriate

## Use Cases

### Maintenance Windows
- Pause timelapse for system updates
- Restart for hardware changes
- Resume without losing progress

### Power Management
- Pause during power outages (with UPS)
- Scheduled shutdowns for energy saving
- Resume when power is restored

### Long-Term Projects
- Construction timelapses over months
- Plant growth over seasons
- Weather patterns over years

## Technical Implementation

### Backend Components

1. **State Persistence**
   ```python
   # State saved to JSON file
   {
       "active": false,
       "paused": true,
       "current_session": "20240115_143022",
       "total_frames": 1250,
       "resolution": [1920, 1080],
       "interval": 30,
       ...
   }
   ```

2. **Worker Thread Management**
   - Thread safely terminates on pause
   - New thread spawns on resume
   - Frame numbering continues sequentially

3. **API Endpoints**
   - `POST /api/pause` - Pause current timelapse
   - `POST /api/resume` - Resume paused timelapse
   - `GET /api/status` - Includes pause state

### Frontend Updates

1. **UI States**
   - Running → Shows Pause button
   - Paused → Shows Resume and Stop buttons
   - Stopped → Shows Start button only

2. **Status Display**
   - Shows "Paused (X frames)" when paused
   - Displays pause duration
   - Indicates resumed frame number

3. **Notifications**
   - Toast messages confirm pause/resume
   - Clear feedback on state changes

## Limitations

### What's Preserved
✅ Frame sequence and numbering
✅ All timelapse settings
✅ Variable interval schedules
✅ Scheduled start/end times
✅ Camera settings (for USB cameras)

### What's Not Preserved
❌ Exact timing between frames during pause
❌ In-progress frame captures (if paused mid-capture)
❌ Preview videos (need regeneration)
❌ Thread state (new thread on resume)

## Best Practices

### When to Pause
- System maintenance required
- Temporary interruptions expected
- Moving or adjusting camera
- Changing lighting or scene setup

### When to Stop Instead
- Project is complete
- Starting a completely new session
- Changing fundamental settings
- Errors or issues with current session

### Storage Considerations
- Paused sessions retain their image directories
- No automatic cleanup of paused sessions
- Manual deletion required if abandoning session
- State file is small (~1KB)

## Troubleshooting

### Session Won't Resume
1. Check if image directory exists
2. Verify state file isn't corrupted
3. Ensure sufficient disk space
4. Check camera is still connected

### Lost Pause State
- State file may be deleted if:
  - Manual deletion of `/config/sessions_state.json`
  - Corruption of state file
  - Session directory was removed

### Resume From Wrong Frame
- Check `last_frame_number` in state
- Verify images are sequentially numbered
- Look for missing frame files

## Examples

### Typical Pause/Resume Workflow
```
1. Start timelapse at 9:00 AM
2. Capture 500 frames by 2:00 PM
3. Pause for maintenance
4. Shut down system
5. --- Power off for 2 hours ---
6. Boot system at 4:00 PM
7. Resume timelapse
8. Continue from frame 501
```

### Multi-Day Project
```
Day 1: Capture 1000 frames, pause at night
Day 2: Resume morning, capture 1000 more, pause
Day 3: Resume, capture final 1000 frames
Result: Seamless 3000-frame timelapse
```

## Future Enhancements

Potential improvements being considered:
- Multiple paused sessions support
- Scheduled pause/resume times
- Automatic pause on low battery
- Cloud backup of pause states
- Resume with modified settings option
- Pause history and statistics
