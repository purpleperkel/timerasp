# UI Visibility Check

## What You Should See

### Timelapse Control Section

After the Resolution dropdown and Schedule section, you should see:

```
┌─────────────────────────────────────────────┐
│ Interval (seconds): [5      ]              │
│                                             │
│ Resolution: [1920x1080 (Full HD) ▼]       │
│                                             │
│ ☐ Schedule start/end times                 │
│                                             │
│ [  ○——  ]  🔧 Auto-Adjust Settings         │ ← iOS toggle (gray)
│ Let camera automatically adjust...          │
│                                             │
│ 🌙 IR Night Vision Mode:                   │
│ [Auto (detect darkness) ▼]                 │ ← Dropdown
│ Auto mode switches to IR...                 │
│                                             │
│ [Start Timelapse]                           │
└─────────────────────────────────────────────┘
```

### iOS Toggle Switch

**OFF (default):**
```
[  ●——○  ]  ← Gray background, white knob on left
```

**ON (when checked):**
```
[  ○——●  ]  ← Green background, white knob on right
```

### IR Mode Dropdown

**Options:**
- Auto (detect darkness) ← Default
- Always Off
- Always On

### During Recording

Stats panel should show:

```
┌─────────────────────────────────────────────┐
│ Session: 20241128_120000                    │
│ Frames: 150                                 │
│ Duration: 00:05:00                          │
│ Auto-Adjust: ✅ On    ← Shows current state │
│ IR Mode: 🌙 Auto     ← Shows current mode   │
└─────────────────────────────────────────────┘
```

## Troubleshooting

### If you don't see the controls:

1. **Force refresh browser**
   ```
   Ctrl+Shift+R (Windows/Linux)
   Cmd+Shift+R (Mac)
   ```

2. **Clear cache**
   ```
   Ctrl+Shift+Delete
   Select "Cached images and files"
   Clear
   ```

3. **Check browser console**
   ```
   F12 → Console tab
   Look for errors
   ```

4. **Verify service restarted**
   ```bash
   sudo systemctl restart timelapsepi
   sudo systemctl status timelapsepi
   ```

### If toggle looks wrong:

**Expected:** iOS-style rounded toggle  
**Problem:** Square checkbox or invisible

**Fix:**
```bash
# Make sure CSS loaded
curl http://localhost:5000/static/css/style.css | grep "iOS Toggle"

# Should output:
# /* Checkboxes - iOS Toggle Style */
```

### If text is wrong color:

**Expected:** White text on glass background  
**Problem:** Dark text (hard to read)

**Fix:** Force refresh browser (Ctrl+Shift+R)

## Visual Examples

### Toggle States

```css
/* Gray (OFF) */
background: rgba(120, 120, 128, 0.32)
● on left side

/* Green (ON) */  
background: #34c759
● on right side
```

### Dropdown

```
Glass background
Semi-transparent white
Rounded corners (12px)
White text
```

### Help Text

```
Smaller italic text
80% opacity white
Below each control
```

## Browser DevTools Check

### Inspect Toggle

1. Right-click toggle
2. Inspect Element
3. Should see:

```html
<input type="checkbox" id="autoAdjustCheckbox">
```

4. Computed styles should show:
   - width: 51px
   - height: 31px
   - background: rgba(120, 120, 128, 0.32)
   - border-radius: 16px

### Inspect Dropdown

1. Right-click IR dropdown
2. Inspect Element
3. Should see:

```html
<select id="irModeSelect">
  <option value="auto">Auto (detect darkness)</option>
  <option value="off">Always Off</option>
  <option value="on">Always On</option>
</select>
```

4. Computed styles should show:
   - background: rgba(255, 255, 255, 0.3)
   - backdrop-filter: blur(10px)

## Common Issues

### 1. Controls not visible

**Symptom:** Missing auto-adjust checkbox and IR dropdown  
**Cause:** Browser cached old HTML/CSS  
**Fix:** Hard refresh (Ctrl+Shift+R)

### 2. Square checkbox instead of toggle

**Symptom:** Regular checkbox appearance  
**Cause:** CSS not loaded or overridden  
**Fix:** Check CSS file loaded, clear cache

### 3. No stats during recording

**Symptom:** Auto-Adjust and IR Mode stats missing  
**Cause:** JavaScript not updated  
**Fix:** Refresh page, check console for errors

### 4. Toggle doesn't switch

**Symptom:** Clicking does nothing  
**Cause:** JavaScript not connected  
**Fix:** Check browser console, verify app.js loaded

## Success Criteria

✅ iOS-style toggle visible (gray pill shape)  
✅ Toggle has white knob that slides  
✅ Toggle turns green when checked  
✅ IR dropdown visible with 3 options  
✅ Help text visible below each control  
✅ During recording, stats show current values  
✅ All text is white and readable on glass

## Testing Steps

1. **Load page** → See controls
2. **Click toggle** → Should slide green
3. **Select IR mode** → Dropdown opens
4. **Start timelapse** → Stats show settings
5. **Check values** → Auto-Adjust: ✅ On (if checked)

---

**If everything looks right, you're all set! 🎉**
