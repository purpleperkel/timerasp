# TimelapsePI System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERFACE                          │
│                                                             │
│  Web Browser → http://timelapsepi.local:5000               │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Camera     │  │  Timelapse   │  │   Session    │    │
│  │   Preview    │  │   Control    │  │   Manager    │    │
│  │              │  │              │  │              │    │
│  │  - Live view │  │  - Start     │  │  - List      │    │
│  │  - MJPEG     │  │  - Stop      │  │  - Preview   │    │
│  │  - Stream    │  │  - Settings  │  │  - Download  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    FLASK WEB SERVER                         │
│                     (app.py)                                │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   API        │  │   Worker     │  │   Compiler   │    │
│  │   Routes     │  │   Thread     │  │              │    │
│  │              │  │              │  │              │    │
│  │  - /api/*    │  │  - Capture   │  │  - ffmpeg    │    │
│  │  - Status    │  │  - Interval  │  │  - MP4       │    │
│  │  - Control   │  │  - Loop      │  │  - 30fps     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                  CAMERA INTERFACE                           │
│                                                             │
│  ┌────────────────────┐        ┌────────────────────┐     │
│  │   USB Camera       │   OR   │  Pi Camera Module  │     │
│  │                    │        │                    │     │
│  │  fswebcam          │        │  libcamera-still   │     │
│  │  v4l2-ctl          │        │  libcamera         │     │
│  │  /dev/video0       │        │  CSI interface     │     │
│  └────────────────────┘        └────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                   FILE STORAGE                              │
│                                                             │
│  ~/timelapsepi/timelapse_data/                             │
│  ├── images/                                               │
│  │   ├── 20240101_120000/                                 │
│  │   │   ├── frame_000000.jpg                             │
│  │   │   ├── frame_000001.jpg                             │
│  │   │   └── ...                                          │
│  │   └── 20240101_150000/                                 │
│  └── videos/                                               │
│      ├── 20240101_120000.mp4                              │
│      └── 20240101_150000.mp4                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  SYSTEM SERVICES                            │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   systemd    │  │    Avahi     │  │     Flask    │    │
│  │              │  │   (mDNS)     │  │              │    │
│  │  Auto-start  │  │              │  │  Port 5000   │    │
│  │  on boot     │  │  .local DNS  │  │  HTTP Server │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘

DATA FLOW - Timelapse Recording:

1. User clicks "Start Timelapse" in browser
2. Flask receives POST to /api/start
3. Worker thread starts in background
4. Every N seconds:
   ├─ Worker calls capture_image()
   ├─ fswebcam captures to JPEG
   ├─ File saved: images/SESSION/frame_XXXXXX.jpg
   └─ Frame counter increments
5. User clicks "Stop Timelapse"
6. Worker thread stops
7. User clicks "Compile Video"
8. ffmpeg processes images → MP4 video
9. Video saved: videos/SESSION.mp4
10. User downloads via browser

NETWORK ACCESS:

┌──────────────┐
│   Router     │
│  (DHCP)      │
└──────────────┘
       ↓
   192.168.1.X
       ↓
┌──────────────┐
│ Raspberry Pi │
│              │
│ timelapsepi  │ ← hostname
└──────────────┘
       ↓
   Avahi/mDNS
       ↓
timelapsepi.local:5000 ← Access point
       ↓
┌──────────────┐
│  Your Device │
│  (Browser)   │
└──────────────┘

KEY TECHNOLOGIES:

- Python 3 + Flask (Web Framework)
- fswebcam (USB Camera Capture)
- v4l2-ctl (Camera Control)
- ffmpeg (Video Compilation)
- Avahi (mDNS for .local domain)
- systemd (Service Management)
- JavaScript (Frontend)
- HTML/CSS (UI)
```
