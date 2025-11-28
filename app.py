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
    "interval": 5,  # seconds
    "total_frames": 0,
    "start_time": None,
    "thread": None
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

def timelapse_worker(session_id, interval, resolution):
    """Background worker for capturing timelapse frames"""
    frame_number = 0
    
    while timelapse_state["active"]:
        try:
            with camera_lock:
                success = capture_image(session_id, frame_number, resolution)
            
            if success:
                frame_number += 1
                timelapse_state["total_frames"] = frame_number
            
            # Wait for the interval
            time.sleep(interval)
            
        except Exception as e:
            print(f"Error capturing frame: {e}")
            time.sleep(1)

def compile_video(session_id, fps=30):
    """Compile images into a video using ffmpeg"""
    session_dir = IMAGES_DIR / session_id
    output_file = VIDEOS_DIR / f"{session_id}.mp4"
    
    # Check if images exist
    images = sorted(session_dir.glob("frame_*.jpg"))
    if not images:
        return None
    
    # Use ffmpeg to create video
    cmd = [
        'ffmpeg',
        '-y',  # Overwrite output file
        '-framerate', str(fps),
        '-pattern_type', 'glob',
        '-i', str(session_dir / 'frame_*.jpg'),
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-crf', '23',
        str(output_file)
    ]
    
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
    """Get current timelapse status"""
    return jsonify({
        "active": timelapse_state["active"],
        "session_id": timelapse_state["current_session"],
        "interval": timelapse_state["interval"],
        "total_frames": timelapse_state["total_frames"],
        "start_time": timelapse_state["start_time"],
        "camera_available": detect_camera() is not None,
        "camera_type": detect_camera()
    })

@app.route('/api/start', methods=['POST'])
def start_timelapse():
    """Start a new timelapse"""
    if timelapse_state["active"]:
        return jsonify({"error": "Timelapse already active"}), 400
    
    data = request.json or {}
    interval = data.get('interval', 5)
    resolution = data.get('resolution', [1920, 1080])
    
    # Create new session
    session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Update state
    timelapse_state["active"] = True
    timelapse_state["current_session"] = session_id
    timelapse_state["interval"] = interval
    timelapse_state["total_frames"] = 0
    timelapse_state["start_time"] = datetime.now().isoformat()
    
    # Start worker thread
    thread = threading.Thread(
        target=timelapse_worker,
        args=(session_id, interval, resolution),
        daemon=True
    )
    thread.start()
    timelapse_state["thread"] = thread
    
    return jsonify({
        "success": True,
        "session_id": session_id,
        "interval": interval
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
    
    if not session_id:
        return jsonify({"error": "session_id required"}), 400
    
    session_dir = IMAGES_DIR / session_id
    if not session_dir.exists():
        return jsonify({"error": "Session not found"}), 404
    
    # Compile in background to avoid blocking
    def compile_async():
        compile_video(session_id, fps)
    
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
            if session_dir.is_dir() and not session_dir.name.startswith('.'):
                images = list(session_dir.glob("frame_*.jpg"))
                video_file = VIDEOS_DIR / f"{session_dir.name}.mp4"
                
                try:
                    created_time = datetime.strptime(session_dir.name, "%Y%m%d_%H%M%S").isoformat()
                except:
                    # If directory name doesn't match expected format, use current time
                    created_time = datetime.now().isoformat()
                
                sessions.append({
                    "id": session_dir.name,
                    "frame_count": len(images),
                    "has_video": video_file.exists(),
                    "created": created_time
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

@app.route('/api/sessions/<session_id>', methods=['DELETE'])
def delete_session(session_id):
    """Delete a session and its files"""
    session_dir = IMAGES_DIR / session_id
    video_file = VIDEOS_DIR / f"{session_id}.mp4"
    
    # Delete images
    if session_dir.exists():
        import shutil
        shutil.rmtree(session_dir)
    
    # Delete video
    if video_file.exists():
        video_file.unlink()
    
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
