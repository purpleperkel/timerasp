# Modal Preview Fixes 🎬

## Issues Fixed

### 1. ❌ Preview Modal Not Showing (Fixed ✅)

**Problem:**
- Modal CSS was missing from stylesheet
- Videos appeared at bottom of page instead of popup

**Solution:**
- Added complete iOS glassmorphism modal styles
- Includes backdrop blur, animations, and responsive design

### 2. ❌ Current Session Preview Error (Fixed ✅)

**Problem:**
- Preview failed when session was stopped but still had frames
- Error: "No active session"

**Solution:**
- Fixed endpoint logic to work with any session that has frames
- Better error messages with FFmpeg output
- Removed requirement for session to be "active"

## New Modal Features

### 🎨 iOS Glassmorphism Design

**Background:**
- Dark backdrop with blur: `rgba(0, 0, 0, 0.85)` + `blur(20px)`
- Smooth fade-in animation

**Modal Card:**
- Frosted glass effect
- Semi-transparent white background
- Blur and saturation filters
- Slide-up animation on open

**Close Button:**
- Circular glass button
- Rotates 90° on hover
- Top-right corner placement

**Video Container:**
- Dark frosted background
- Rounded corners
- Built-in loading spinner

### ✨ Animations

**1. Fade In (Modal)**
```css
Duration: 0.3s
Effect: Opacity 0 → 1
Purpose: Smooth entrance
```

**2. Slide Up (Content)**
```css
Duration: 0.3s
Effect: translateY(50px) → 0
Purpose: Elegant entrance
```

**3. Rotate (Close Button)**
```css
Effect: rotate(90deg)
Purpose: Interactive feedback
```

**4. Spin (Loading)**
```css
Duration: 0.8s
Effect: Rotating border
Purpose: Show video loading
```

## Modal Structure

```
┌──────────────────────────────────────┐
│ [×]                                  │ ← Glass close button
│                                      │
│  Video Preview                       │ ← Title
│                                      │
│  ╔══════════════════════════════╗  │
│  ║                              ║  │ ← Video container
│  ║      [VIDEO PLAYER]          ║  │   (dark glass)
│  ║                              ║  │
│  ╚══════════════════════════════╝  │
│                                      │
│  [⬇️ Download]    [Close]          │ ← Actions
│                                      │
└──────────────────────────────────────┘
     Frosted glass modal
```

## How It Works

### Opening Modal

**From Current Session:**
```javascript
1. Click "👁️ Preview Current" button
2. POST to /api/current-session/preview
3. Backend generates preview video with FFmpeg
4. Modal opens with video
5. Download button hidden (preview only)
```

**From Session List:**
```javascript
1. Click "Preview" on session card
2. Direct video stream from /api/sessions/{id}/video/stream
3. Modal opens with video
4. Download button visible
```

### Loading States

**Video Container:**
- Shows spinning loader while video loads
- Automatically removed when video ready
- Uses CSS `::after` pseudo-element

**Button:**
- Changes to "⏳ Generating..." during generation
- Disabled during operation
- Restored when complete

### Closing Modal

**Three ways to close:**
1. Click × button (top-right)
2. Click "Close" button
3. Click outside modal (backdrop)

**On close:**
- Video pauses automatically
- Modal fades out
- Prevents background playback

## Error Handling

### Better Error Messages

**Old:**
```
Error: "Failed to generate preview"
```

**New:**
```
Error: "Failed to generate preview: [actual FFmpeg error]"
```

Shows first 200 characters of actual error for debugging.

### Session Validation

**Checks:**
1. ✅ Session ID exists
2. ✅ Session directory exists
3. ✅ At least 2 frames available
4. ✅ FFmpeg completes successfully

**Error responses:**
- 400: No session or not enough frames
- 404: Session directory not found
- 500: FFmpeg failed (with error details)

## CSS Classes

### Modal
```css
.modal
  → Fixed position overlay
  → Blur backdrop
  → Flexbox centering
```

### Modal Content
```css
.modal-content
  → Glass effect
  → Rounded corners
  → Shadow and inset highlight
  → Max 90% width/height
```

### Video Container
```css
.video-container
  → Dark glass background
  → Rounded borders
  → Contains video player
  → Loading spinner overlay
```

### Modal Actions
```css
.modal-actions
  → Flex row
  → Right-aligned
  → 12px gap
```

## Responsive Design

### Desktop (> 768px)
- Modal: 1000px max width
- Padding: 30px
- Large title: 1.8em

### Mobile (< 768px)
- Modal: 95% width
- Padding: 20px
- Smaller title: 1.4em
- Stacked buttons

## Browser Compatibility

**Full Support:**
- ✅ Safari (best blur quality)
- ✅ Chrome 76+
- ✅ Firefox 103+
- ✅ Edge 79+

**Fallback:**
- Semi-transparent backgrounds
- No blur (still functional)

## Files Changed

### Modified:
1. **static/css/style.css** - Added ~170 lines of modal CSS
2. **templates/index.html** - Updated modal structure
3. **static/js/app.js** - Added loading states and error handling
4. **app.py** - Fixed preview endpoint logic

### CSS Added:
- `.modal` - Overlay styles
- `.modal-content` - Glass card
- `.modal-close` - Close button
- `.video-container` - Video wrapper
- `.modal-actions` - Button container
- `.video-container.loading::after` - Spinner
- Media queries for responsive

## Testing

### Test Current Session Preview

1. **Start a timelapse:**
   ```
   Interval: 5 seconds
   Capture at least 10 frames
   ```

2. **Click "Preview Current":**
   - Should show "⏳ Generating..."
   - Modal should appear centered
   - Video should play
   - Download button hidden

3. **Close modal:**
   - Click × or Close button
   - Modal should disappear
   - Video should stop

### Test Session List Preview

1. **Find compiled session:**
   - Look in "Saved Sessions" section
   - Find session with "Preview" button

2. **Click "Preview":**
   - Modal appears immediately
   - Video loads with spinner
   - Download button visible

3. **Test download:**
   - Click "⬇️ Download"
   - Video should download

## Troubleshooting

### Modal doesn't appear

**Check browser console for errors:**
```javascript
// Should see:
Modal element: <div id="videoModal">...
```

**Force refresh:** Ctrl+Shift+R

### Video shows at bottom instead of modal

**Old CSS cached:**
```bash
# Clear browser cache
Ctrl+Shift+Delete

# Or force refresh
Ctrl+Shift+R
```

### Preview generation fails

**Check logs:**
```bash
sudo journalctl -u timelapsepi -n 50
```

**Common issues:**
- Not enough frames (need 2+)
- FFmpeg not installed
- No write permission to videos directory

### Video doesn't load

**Check:**
1. Session has frames
2. Preview file generated: `~/timelapsepi/timelapse_data/videos/SESSION_preview.mp4`
3. Browser supports H.264 video

## API Endpoints

### Generate Preview
```http
POST /api/current-session/preview
Content-Type: application/json

{
  "fps": 30
}

Response:
{
  "success": true,
  "preview_url": "/api/current-session/preview/video",
  "frame_count": 150
}
```

### Stream Preview
```http
GET /api/current-session/preview/video

Response:
Content-Type: video/mp4
[video data]
```

### Stream Session Video
```http
GET /api/sessions/{session_id}/video/stream

Response:
Content-Type: video/mp4
[video data]
```

## Performance

**Preview Generation:**
- Time: ~1-5 seconds for 100 frames
- Depends on: Frame count, resolution, CPU

**Modal Opening:**
- Animation: 0.3s (imperceptible)
- Video load: Depends on size
- Spinner shows during load

**Memory:**
- Preview videos cached in memory
- Reused if regenerated
- Cleaned up with session

## Future Enhancements

Possible additions:
- Video playback speed control
- Frame scrubbing
- Download preview option
- Picture-in-picture mode
- Keyboard shortcuts (Esc to close)

---

**Modal previews now work perfectly with iOS glass styling! 🎬✨**
