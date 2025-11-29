#!/usr/bin/env python3
"""
TimelapsePI - Raspberry Pi Timelapse Camera Controller
Main Flask application
"""

import os
import json
import time
import threading
import subprocess
from datetime import datetime
from pathlib import Path
from flask import Flask, render_template, jsonify, request, send_file, Response
import glob

app = Flask(__name__)

# Configuration
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "timelapse_data"
IMAGES_DIR = DATA_DIR / "images"
VIDEOS_DIR = DATA_DIR / "videos"
CONFIG_FILE = BASE_DIR / "config" / "settings.json"

# Ensure directories exist
IMAGES_DIR.mkdir(parents=True, exist_ok=True)
VIDEOS_DIR.mkdir(parents=True, exist_ok=True)
CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)

# Global state
timelapse_state = {
    "active": False,
    "current_session": None,
    "interval": 5,  # seconds (default/fallback)
    "total_frames": 0,
    "start_time": None,
    "scheduled_start": None,  # ISO datetime string
    "scheduled_end": None,    # ISO datetime string
    "thread": None,
    "waiting_for_start": False,
    "use_variable_intervals": False,
    "interval_schedule": [],  # List of time-based interval periods
    "current_interval": 5     # Current active interval (may change based on time)
}

camera_lock = threading.Lock()

def load_config():
    """Load configuration from file"""
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE, 'r') as f:
            return json.load(f)
    return {
        "interval": 5,
        "resolution": [1920, 1080],
        "camera_type": "auto"  # auto, picamera, libcamera, or usb
    }

def save_config(config):
    """Save configuration to file"""
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config, f, indent=2)

def detect_camera():
    """Detect available camera"""
    # Check for V4L2 devices (USB cameras) first
    video_devices = list(Path('/dev').glob('video*'))
    if video_devices:
        # Filter out metadata devices, keep only actual video capture devices
        for device in video_devices:
            try:
                # Check if it's a valid video capture device
                result = subprocess.run(['v4l2-ctl', '--device', str(device), '--all'], 
                                      capture_output=True, timeout=1)
                if b'Video Capture' in result.stdout:
                    return 'usb'
            except:
                pass
    
    # Fallback to libcamera for Raspberry Pi Camera (if available)
    try:
        result = subprocess.run(['libcamera-hello', '--list-cameras'], 
                              capture_output=True, timeout=2)
        if result.returncode == 0:
            return 'libcamera'
    except FileNotFoundError:
        # libcamera-hello not installed, that's fine
        pass
    except:
        pass
    
    return None

def capture_image(session_id, frame_number, resolution=(1920, 1080)):
    """Capture a single image"""
    session_dir = IMAGES_DIR / session_id
    session_dir.mkdir(exist_ok=True)
    
    filename = session_dir / f"frame_{frame_number:06d}.jpg"
    
    camera_type = detect_camera()
    
    if camera_type == 'usb':
        # Use fswebcam for USB cameras with optimized settings
        cmd = [
            'fswebcam',
            '-r', f"{resolution[0]}x{resolution[1]}",
            '--no-banner',
            '--jpeg', '95',  # High quality JPEG
            '-S', '3',  # Skip 3 frames to let camera adjust
            '--set', 'brightness=50%',
            str(filename)
        ]
        try:
            subprocess.run(cmd, check=True, capture_output=True, timeout=10)
        except subprocess.TimeoutExpired:
            print(f"Timeout capturing frame {frame_number}")
            return False
    elif camera_type == 'libcamera':
        # Use libcamera-still for Raspberry Pi Camera
        cmd = [
            'libcamera-still',
            '-o', str(filename),
            '--width', str(resolution[0]),
            '--height', str(resolution[1]),
            '--nopreview',
            '-t', '1'
        ]
        subprocess.run(cmd, check=True, capture_output=True)
    else:
        raise Exception("No camera detected")
    
    return filename.exists()

def get_current_interval_from_schedule(schedule):
    """Get the current interval based on time-based schedule"""
    if not schedule:
        return None
    
    now = datetime.now()
    current_time = now.strftime("%H:%M")
    
    for period in schedule:
        # Parse times
        start_time = period['start']
        end_time = period['end']
        
        # Handle overnight periods
        if start_time <= end_time:
            # Normal period (same day)
            if start_time <= current_time < end_time:
                return period['interval']
        else:
            # Overnight period (crosses midnight)
            if current_time >= start_time or current_time < end_time:
                return period['interval']
    
    return None  # No matching period

def timelapse_worker(session_id, interval, resolution, scheduled_start=None, scheduled_end=None):
    """Background worker for capturing timelapse frames with support for variable intervals"""
    frame_number = 0
    
    # Wait for scheduled start if specified
    if scheduled_start:
        timelapse_state["waiting_for_start"] = True
        start_dt = datetime.fromisoformat(scheduled_start.replace('Z', '+00:00'))
        
        while datetime.now(start_dt.tzinfo or None) < start_dt:
            if not timelapse_state["active"]:
                timelapse_state["waiting_for_start"] = False
                return
            time.sleep(1)
        
        timelapse_state["waiting_for_start"] = False
        timelapse_state["start_time"] = datetime.now().isoformat()
    
    while timelapse_state["active"]:
        # Check if we've reached scheduled end time
        if scheduled_end:
            end_dt = datetime.fromisoformat(scheduled_end.replace('Z', '+00:00'))
            if datetime.now(end_dt.tzinfo or None) >= end_dt:
                print(f"Reached scheduled end time, stopping timelapse")
                timelapse_state["active"] = False
                break
        
        try:
            with camera_lock:
                success = capture_image(session_id, frame_number, resolution)
            
            if success:
                frame_number += 1
                timelapse_state["total_frames"] = frame_number
            
            # Determine the interval to use
            current_interval = interval  # Default
            
            # Check if we should use variable intervals
            if timelapse_state.get("use_variable_intervals") and timelapse_state.get("interval_schedule"):
                scheduled_interval = get_current_interval_from_schedule(timelapse_state["interval_schedule"])
                if scheduled_interval is not None:
                    current_interval = scheduled_interval
                    # Update state to reflect current interval
                    if timelapse_state["current_interval"] != current_interval:
                        timelapse_state["current_interval"] = current_interval
                        print(f"Interval changed to {current_interval} seconds based on schedule")
            
            # Wait for the interval
            time.sleep(current_interval)
            
        except Exception as e:
            print(f"Error capturing frame: {e}")
            time.sleep(1)

def compile_video(session_id, fps=30, rotation=0):
    """Compile images into a video using ffmpeg"""
    session_dir = IMAGES_DIR / session_id
    output_file = VIDEOS_DIR / f"{session_id}.mp4"
    
    # Check if images exist
    images = sorted(session_dir.glob("frame_*.jpg"))
    if not images:
        return None
    
    # Build ffmpeg command with rotation
    cmd = [
        'ffmpeg',
        '-y',  # Overwrite output file
        '-framerate', str(fps),
        '-pattern_type', 'glob',
        '-i', str(session_dir / 'frame_*.jpg'),
    ]
    
    # Add rotation filter if specified
    # 0 = no rotation, 90 = 90° clockwise, 180 = 180°, 270 = 90° counter-clockwise
    if rotation == 90:
        cmd.extend(['-vf', 'transpose=1'])  # 90° clockwise
    elif rotation == 180:
        cmd.extend(['-vf', 'transpose=1,transpose=1'])  # 180°
    elif rotation == 270:
        cmd.extend(['-vf', 'transpose=2'])  # 90° counter-clockwise
    
    cmd.extend([
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-crf', '23',
        str(output_file)
    ])
    
    try:
        subprocess.run(cmd, check=True, capture_output=True)
        return output_file
    except subprocess.CalledProcessError as e:
        print(f"Error compiling video: {e}")
        return None

@app.route('/')
def index():
    """Main page"""
    return render_template('index.html')

@app.route('/api/camera/info')
def camera_info():
    """Get detailed camera information"""
    camera_type = detect_camera()
    
    info = {
        "detected": camera_type is not None,
        "type": camera_type,
        "details": None
    }
    
    if camera_type == 'usb':
        # Get USB camera details
        video_devices = list(Path('/dev').glob('video*'))
        devices = []
        
        for device in video_devices:
            try:
                result = subprocess.run(['v4l2-ctl', '--device', str(device), '--all'], 
                                      capture_output=True, timeout=2, text=True)
                if 'Video Capture' in result.stdout:
                    # Extract device name
                    for line in result.stdout.split('\n'):
                        if 'Card type' in line:
                            card_name = line.split(':')[1].strip()
                            devices.append({
                                "device": str(device),
                                "name": card_name
                            })
                            break
            except:
                pass
        
        info['details'] = {
            "devices": devices,
            "count": len(devices)
        }
    
    return jsonify(info)

@app.route('/api/status')
def get_status():
    """Get current timelapse status including variable interval information"""
    status_data = {
        "active": timelapse_state["active"],
        "session_id": timelapse_state["current_session"],
        "interval": timelapse_state["interval"],
        "total_frames": timelapse_state["total_frames"],
        "start_time": timelapse_state["start_time"],
        "scheduled_start": timelapse_state.get("scheduled_start"),
        "scheduled_end": timelapse_state.get("scheduled_end"),
        "waiting_for_start": timelapse_state.get("waiting_for_start", False),
        "camera_available": detect_camera() is not None,
        "camera_type": detect_camera()
    }
    
    # Add variable interval information if active
    if timelapse_state.get("use_variable_intervals"):
        status_data["use_variable_intervals"] = True
        status_data["current_interval"] = timelapse_state.get("current_interval", timelapse_state["interval"])
        status_data["interval_schedule"] = timelapse_state.get("interval_schedule", [])
    
    return jsonify(status_data)

@app.route('/api/start', methods=['POST'])
def start_timelapse():
    """Start a new timelapse with support for variable intervals"""
    if timelapse_state["active"]:
        return jsonify({"error": "Timelapse already active"}), 400
    
    data = request.json or {}
    interval = data.get('interval', 5)
    resolution = data.get('resolution', [1920, 1080])
    scheduled_start = data.get('scheduled_start')  # ISO datetime string
    scheduled_end = data.get('scheduled_end')      # ISO datetime string
    use_variable_intervals = data.get('use_variable_intervals', False)
    interval_schedule = data.get('interval_schedule', [])
    
    # Create new session
    session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Update state
    timelapse_state["active"] = True
    timelapse_state["current_session"] = session_id
    timelapse_state["interval"] = interval
    timelapse_state["total_frames"] = 0
    timelapse_state["scheduled_start"] = scheduled_start
    timelapse_state["scheduled_end"] = scheduled_end
    timelapse_state["use_variable_intervals"] = use_variable_intervals
    timelapse_state["interval_schedule"] = interval_schedule
    timelapse_state["current_interval"] = interval  # Start with default
    
    if not scheduled_start:
        timelapse_state["start_time"] = datetime.now().isoformat()
    else:
        timelapse_state["start_time"] = None  # Will be set when actually starts
    
    # Log variable intervals if enabled
    if use_variable_intervals and interval_schedule:
        print(f"Starting timelapse with variable intervals: {interval_schedule}")
    
    # Start worker thread
    thread = threading.Thread(
        target=timelapse_worker,
        args=(session_id, interval, resolution, scheduled_start, scheduled_end),
        daemon=True
    )
    thread.start()
    timelapse_state["thread"] = thread
    
    return jsonify({
        "success": True,
        "session_id": session_id,
        "interval": interval,
        "scheduled_start": scheduled_start,
        "scheduled_end": scheduled_end,
        "use_variable_intervals": use_variable_intervals,
        "interval_schedule": interval_schedule if use_variable_intervals else None
    })

@app.route('/api/stop', methods=['POST'])
def stop_timelapse():
    """Stop the current timelapse"""
    if not timelapse_state["active"]:
        return jsonify({"error": "No active timelapse"}), 400
    
    session_id = timelapse_state["current_session"]
    total_frames = timelapse_state["total_frames"]
    
    # Stop the timelapse
    timelapse_state["active"] = False
    
    # Wait for thread to finish
    if timelapse_state["thread"]:
        timelapse_state["thread"].join(timeout=10)
    
    return jsonify({
        "success": True,
        "session_id": session_id,
        "total_frames": total_frames
    })

@app.route('/api/compile', methods=['POST'])
def compile_timelapse():
    """Compile a session into a video"""
    data = request.json or {}
    session_id = data.get('session_id')
    fps = data.get('fps', 30)
    rotation = data.get('rotation', 0)  # 0, 90, 180, 270
    
    if not session_id:
        return jsonify({"error": "session_id required"}), 400
    
    session_dir = IMAGES_DIR / session_id
    if not session_dir.exists():
        return jsonify({"error": "Session not found"}), 404
    
    # Compile in background to avoid blocking
    def compile_async():
        compile_video(session_id, fps, rotation)
    
    thread = threading.Thread(target=compile_async, daemon=True)
    thread.start()
    
    return jsonify({
        "success": True,
        "message": "Compilation started",
        "session_id": session_id
    })

@app.route('/api/sessions')
def list_sessions():
    """List all timelapse sessions"""
    sessions = []
    
    # Ensure directory exists
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    
    try:
        for session_dir in sorted(IMAGES_DIR.iterdir(), reverse=True):
            # Skip if not a directory, starts with dot, or is the preview folder
            if not session_dir.is_dir() or session_dir.name.startswith('.') or session_dir.name == 'preview':
                continue
            
            images = list(session_dir.glob("frame_*.jpg"))
            video_file = VIDEOS_DIR / f"{session_dir.name}.mp4"
            
            # Skip if no images found (empty directory)
            if len(images) == 0:
                continue
            
            try:
                created_time = datetime.strptime(session_dir.name, "%Y%m%d_%H%M%S").isoformat()
            except:
                # If directory name doesn't match expected format, use current time
                created_time = datetime.now().isoformat()
            
            # Calculate video duration if video exists
            duration_seconds = None
            if video_file.exists():
                try:
                    # Use ffprobe to get video duration
                    result = subprocess.run(
                        ['ffprobe', '-v', 'error', '-show_entries', 
                         'format=duration', '-of', 
                         'default=noprint_wrappers=1:nokey=1', str(video_file)],
                        capture_output=True,
                        text=True,
                        timeout=5
                    )
                    if result.returncode == 0 and result.stdout.strip():
                        duration_seconds = float(result.stdout.strip())
                except Exception as e:
                    print(f"Error getting duration for {session_dir.name}: {e}")
            
            sessions.append({
                "id": session_dir.name,
                "frame_count": len(images),
                "has_video": video_file.exists(),
                "created": created_time,
                "duration": duration_seconds
            })
    except Exception as e:
        print(f"Error listing sessions: {e}")
    
    return jsonify({"sessions": sessions})

@app.route('/api/sessions/<session_id>/preview')
def session_preview(session_id):
    """Get a preview image from a session"""
    session_dir = IMAGES_DIR / session_id
    
    if not session_dir.exists():
        return jsonify({"error": "Session not found"}), 404
    
    # Get the first image
    images = sorted(session_dir.glob("frame_*.jpg"))
    if not images:
        return jsonify({"error": "No images in session"}), 404
    
    return send_file(images[0], mimetype='image/jpeg')

@app.route('/api/sessions/<session_id>/video')
def download_video(session_id):
    """Download compiled video"""
    video_file = VIDEOS_DIR / f"{session_id}.mp4"
    
    if not video_file.exists():
        return jsonify({"error": "Video not found"}), 404
    
    return send_file(video_file, mimetype='video/mp4', as_attachment=True)

@app.route('/api/sessions/<session_id>/rotate', methods=['POST'])
def rotate_video(session_id):
    """Rotate an existing video"""
    data = request.json or {}
    rotation = data.get('rotation', 90)  # Default 90° clockwise
    
    video_file = VIDEOS_DIR / f"{session_id}.mp4"
    
    if not video_file.exists():
        return jsonify({"error": "Video not found"}), 404
    
    # Create rotated filename
    rotated_file = VIDEOS_DIR / f"{session_id}_rotated.mp4"
    
    # Build ffmpeg command
    cmd = ['ffmpeg', '-y', '-i', str(video_file)]
    
    if rotation == 90:
        cmd.extend(['-vf', 'transpose=1'])  # 90° clockwise
    elif rotation == 180:
        cmd.extend(['-vf', 'transpose=1,transpose=1'])  # 180°
    elif rotation == 270:
        cmd.extend(['-vf', 'transpose=2'])  # 90° counter-clockwise
    else:
        return jsonify({"error": "Invalid rotation. Use 90, 180, or 270"}), 400
    
    cmd.extend(['-c:a', 'copy', str(rotated_file)])
    
    try:
        # Run rotation in background
        def rotate_async():
            subprocess.run(cmd, check=True, capture_output=True, timeout=300)
            # Replace original with rotated
            rotated_file.replace(video_file)
        
        thread = threading.Thread(target=rotate_async, daemon=True)
        thread.start()
        
        return jsonify({
            "success": True,
            "message": f"Rotating video {rotation}°..."
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/sessions/<session_id>', methods=['DELETE'])
def delete_session(session_id):
    """Delete a session and its files"""
    session_dir = IMAGES_DIR / session_id
    video_file = VIDEOS_DIR / f"{session_id}.mp4"
    preview_file = VIDEOS_DIR / f"{session_id}_preview.mp4"
    
    # Delete images
    if session_dir.exists():
        import shutil
        shutil.rmtree(session_dir)
    
    # Delete video
    if video_file.exists():
        video_file.unlink()
    
    # Delete preview if exists
    if preview_file.exists():
        preview_file.unlink()
    
    return jsonify({"success": True})

@app.route('/api/camera/preview')
def camera_preview():
    """Live camera preview stream"""
    def generate_frames():
        """Generate frames for MJPEG stream"""
        while True:
            try:
                # Capture to temporary file
                temp_file = IMAGES_DIR / "preview.jpg"
                with camera_lock:
                    capture_image("preview", 0, resolution=(640, 480))
                    
                if temp_file.parent.joinpath("preview/frame_000000.jpg").exists():
                    with open(temp_file.parent / "preview/frame_000000.jpg", 'rb') as f:
                        frame = f.read()
                    
                    yield (b'--frame\r\n'
                           b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
                
                time.sleep(0.5)  # 2 FPS preview
            except Exception as e:
                print(f"Preview error: {e}")
                time.sleep(1)
    
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/api/config', methods=['GET', 'POST'])
def handle_config():
    """Get or update configuration"""
    if request.method == 'GET':
        return jsonify(load_config())
    else:
        config = request.json
        save_config(config)
        return jsonify({"success": True})

@app.route('/api/camera/controls', methods=['GET', 'POST'])
def camera_controls():
    """Get or set camera controls (USB camera only)"""
    camera_type = detect_camera()
    
    if camera_type != 'usb':
        return jsonify({"error": "Camera controls only available for USB cameras"}), 400
    
    # Find video device
    video_device = '/dev/video0'
    video_devices = list(Path('/dev').glob('video*'))
    for device in video_devices:
        try:
            result = subprocess.run(['v4l2-ctl', '--device', str(device), '--all'], 
                                  capture_output=True, timeout=1)
            if b'Video Capture' in result.stdout:
                video_device = str(device)
                break
        except:
            pass
    
    if request.method == 'GET':
        # Get current controls
        try:
            result = subprocess.run(['v4l2-ctl', '--device', video_device, '--list-ctrls'],
                                  capture_output=True, text=True, timeout=2)
            
            controls = {}
            for line in result.stdout.split('\n'):
                if 'brightness' in line.lower():
                    # Parse: brightness 0x00980900 (int) : min=0 max=255 step=1 default=128 value=128
                    parts = line.split('value=')
                    if len(parts) > 1:
                        controls['brightness'] = int(parts[1].split()[0])
                elif 'contrast' in line.lower() and 'auto' not in line.lower():
                    parts = line.split('value=')
                    if len(parts) > 1:
                        controls['contrast'] = int(parts[1].split()[0])
                elif 'saturation' in line.lower():
                    parts = line.split('value=')
                    if len(parts) > 1:
                        controls['saturation'] = int(parts[1].split()[0])
                elif 'exposure_auto ' in line.lower():
                    parts = line.split('value=')
                    if len(parts) > 1:
                        controls['exposure_auto'] = int(parts[1].split()[0])
                elif 'exposure_absolute' in line.lower():
                    parts = line.split('value=')
                    if len(parts) > 1:
                        controls['exposure_absolute'] = int(parts[1].split()[0])
            
            return jsonify({
                "device": video_device,
                "controls": controls
            })
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    else:  # POST - set controls
        data = request.json
        
        try:
            results = {}
            for control, value in data.items():
                if control in ['brightness', 'contrast', 'saturation', 'exposure_auto', 'exposure_absolute']:
                    result = subprocess.run(
                        ['v4l2-ctl', '--device', video_device, f'--set-ctrl={control}={value}'],
                        capture_output=True, timeout=2
                    )
                    results[control] = "success" if result.returncode == 0 else "failed"
            
            return jsonify({
                "success": True,
                "results": results
            })
        except Exception as e:
            return jsonify({"error": str(e)}), 500

@app.route('/api/sessions/<session_id>/video/stream')
def stream_video(session_id):
    """Stream compiled video for preview"""
    video_file = VIDEOS_DIR / f"{session_id}.mp4"
    
    if not video_file.exists():
        return jsonify({"error": "Video not found"}), 404
    
    return send_file(video_file, mimetype='video/mp4')

@app.route('/api/current-session/preview', methods=['POST'])
def preview_current_session():
    """Generate a preview video of the current recording session"""
    if not timelapse_state["active"] and not timelapse_state["current_session"]:
        return jsonify({"error": "No active session"}), 400
    
    session_id = timelapse_state["current_session"]
    data = request.json or {}
    fps = data.get('fps', 30)
    
    session_dir = IMAGES_DIR / session_id
    if not session_dir.exists():
        return jsonify({"error": "Session directory not found"}), 404
    
    # Count current frames
    images = sorted(session_dir.glob("frame_*.jpg"))
    frame_count = len(images)
    if frame_count < 2:
        return jsonify({"error": "Not enough frames yet (need at least 2)"}), 400
    
    # Generate preview video
    preview_file = VIDEOS_DIR / f"{session_id}_preview.mp4"
    
    try:
        # For large frame counts, use lower quality/faster encoding
        # and sample frames if there are too many
        if frame_count > 200:
            # Use faster encoding preset and lower quality for previews
            preset = 'ultrafast'
            crf = '28'  # Lower quality for faster encoding
            # Sample every nth frame for very long sequences
            if frame_count > 500:
                # Create temporary file list with sampled frames
                step = frame_count // 300  # Limit to ~300 frames max
                sampled_images = images[::step]
                temp_list = session_dir / 'preview_frames.txt'
                with open(temp_list, 'w') as f:
                    for img in sampled_images:
                        f.write(f"file '{img.name}'\n")
                
                cmd = [
                    'ffmpeg',
                    '-y',  # Overwrite
                    '-f', 'concat',
                    '-safe', '0',
                    '-i', str(temp_list),
                    '-c:v', 'libx264',
                    '-preset', preset,
                    '-pix_fmt', 'yuv420p',
                    '-crf', crf,
                    '-vf', 'scale=1280:720',  # Scale down for faster encoding
                    str(preview_file)
                ]
            else:
                # Use all frames but with faster encoding
                cmd = [
                    'ffmpeg',
                    '-y',  # Overwrite
                    '-framerate', str(fps),
                    '-pattern_type', 'glob',
                    '-i', str(session_dir / 'frame_*.jpg'),
                    '-c:v', 'libx264',
                    '-preset', preset,
                    '-pix_fmt', 'yuv420p',
                    '-crf', crf,
                    '-vf', 'scale=1280:720',  # Scale down for faster encoding
                    str(preview_file)
                ]
        else:
            # Original quality for smaller frame counts
            cmd = [
                'ffmpeg',
                '-y',  # Overwrite
                '-framerate', str(fps),
                '-pattern_type', 'glob',
                '-i', str(session_dir / 'frame_*.jpg'),
                '-c:v', 'libx264',
                '-preset', 'fast',  # Balanced preset
                '-pix_fmt', 'yuv420p',
                '-crf', '23',
                str(preview_file)
            ]
        
        # Dynamic timeout based on frame count (minimum 60s, max 300s, add 0.3s per frame)
        timeout_seconds = min(300, max(60, 30 + (frame_count * 0.3)))
        
        result = subprocess.run(cmd, capture_output=True, timeout=timeout_seconds)
        
        # Clean up temp file if created
        temp_list = session_dir / 'preview_frames.txt'
        if temp_list.exists():
            temp_list.unlink()
        
        if result.returncode == 0 and preview_file.exists():
            # Get actual frame count used in preview
            preview_frames = frame_count
            if frame_count > 500:
                preview_frames = len(sampled_images) if 'sampled_images' in locals() else frame_count
            
            return jsonify({
                "success": True,
                "preview_url": f"/api/current-session/preview/video",
                "frame_count": frame_count,
                "preview_frame_count": preview_frames,
                "sampled": frame_count > 500
            })
        else:
            error_msg = result.stderr.decode('utf-8') if result.stderr else "Unknown error"
            return jsonify({"error": f"Failed to generate preview: {error_msg[:200]}"}), 500
            
    except subprocess.TimeoutExpired:
        # Clean up temp file if created
        temp_list = session_dir / 'preview_frames.txt'
        if temp_list.exists():
            temp_list.unlink()
        return jsonify({
            "error": f"Preview generation timed out after {timeout_seconds}s. Try reducing frame count or wait for processing.",
            "frame_count": frame_count
        }), 500
    except Exception as e:
        # Clean up temp file if created
        temp_list = session_dir / 'preview_frames.txt'
        if temp_list.exists():
            temp_list.unlink()
        return jsonify({"error": str(e)}), 500

@app.route('/api/current-session/preview/video')
def stream_current_preview():
    """Stream the current session preview video"""
    if not timelapse_state["current_session"]:
        return jsonify({"error": "No active session"}), 404
    
    preview_file = VIDEOS_DIR / f"{timelapse_state['current_session']}_preview.mp4"
    
    if not preview_file.exists():
        return jsonify({"error": "Preview not generated yet"}), 404
    
    return send_file(preview_file, mimetype='video/mp4')

@app.route('/api/system/shutdown', methods=['POST'])
def shutdown_system():
    """Shutdown the system"""
    try:
        # Schedule shutdown in 1 minute to allow response to be sent
        subprocess.Popen(['sudo', 'shutdown', '-h', '+1'], 
                        stdout=subprocess.PIPE, 
                        stderr=subprocess.PIPE)
        return jsonify({
            "success": True,
            "message": "System will shutdown in 1 minute"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/system/reboot', methods=['POST'])
def reboot_system():
    """Reboot the system"""
    try:
        # Schedule reboot in 1 minute to allow response to be sent
        subprocess.Popen(['sudo', 'reboot'], 
                        stdout=subprocess.PIPE, 
                        stderr=subprocess.PIPE)
        return jsonify({
            "success": True,
            "message": "System will reboot in 1 minute"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/system/restart-service', methods=['POST'])
def restart_service():
    """Restart the TimelapsePI service"""
    try:
        # This will kill the current process, systemd will restart it
        subprocess.Popen(['sudo', 'systemctl', 'restart', 'timelapsepi'], 
                        stdout=subprocess.PIPE, 
                        stderr=subprocess.PIPE)
        return jsonify({
            "success": True,
            "message": "Service restarting"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/system/cancel-shutdown', methods=['POST'])
def cancel_shutdown():
    """Cancel scheduled shutdown/reboot"""
    try:
        subprocess.run(['sudo', 'shutdown', '-c'], 
                      capture_output=True, 
                      timeout=2)
        return jsonify({
            "success": True,
            "message": "Shutdown/reboot cancelled"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
