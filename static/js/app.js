// TimelapsePI Frontend JavaScript

let currentState = {
    active: false,
    sessionId: null,
    startTime: null,
    interval: 5
};

let updateInterval = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeUI();
    initializeCameraControls();
    checkStatus();
    loadSessions();
    
    // Update status every second when active
    setInterval(checkStatus, 1000);
    setInterval(loadSessions, 10000); // Refresh sessions every 10 seconds
});

function initializeUI() {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const intervalInput = document.getElementById('intervalInput');
    
    startBtn.addEventListener('click', startTimelapse);
    stopBtn.addEventListener('click', stopTimelapse);
    
    // Handle camera preview errors
    const cameraPreview = document.getElementById('cameraPreview');
    const noCamera = document.getElementById('noCamera');
    
    cameraPreview.addEventListener('error', () => {
        cameraPreview.style.display = 'none';
        noCamera.style.display = 'block';
    });
    
    cameraPreview.addEventListener('load', () => {
        cameraPreview.style.display = 'block';
        noCamera.style.display = 'none';
    });
}

function initializeCameraControls() {
    const brightnessSlider = document.getElementById('brightnessSlider');
    const contrastSlider = document.getElementById('contrastSlider');
    const saturationSlider = document.getElementById('saturationSlider');
    const exposureSlider = document.getElementById('exposureSlider');
    const autoExposureCheckbox = document.getElementById('autoExposureCheckbox');
    const applySettingsBtn = document.getElementById('applyCameraSettings');
    const loadSettingsBtn = document.getElementById('loadCameraSettings');
    const manualExposureGroup = document.getElementById('manualExposureGroup');
    
    // Update value displays
    if (brightnessSlider) {
        brightnessSlider.addEventListener('input', (e) => {
            document.getElementById('brightnessValue').textContent = e.target.value;
        });
    }
    
    if (contrastSlider) {
        contrastSlider.addEventListener('input', (e) => {
            document.getElementById('contrastValue').textContent = e.target.value;
        });
    }
    
    if (saturationSlider) {
        saturationSlider.addEventListener('input', (e) => {
            document.getElementById('saturationValue').textContent = e.target.value;
        });
    }
    
    if (exposureSlider) {
        exposureSlider.addEventListener('input', (e) => {
            document.getElementById('exposureValue').textContent = e.target.value;
        });
    }
    
    // Toggle manual exposure
    if (autoExposureCheckbox) {
        autoExposureCheckbox.addEventListener('change', (e) => {
            if (manualExposureGroup) {
                manualExposureGroup.style.display = e.target.checked ? 'none' : 'block';
            }
        });
    }
    
    // Apply settings
    if (applySettingsBtn) {
        applySettingsBtn.addEventListener('click', applyCameraSettings);
    }
    
    // Load current settings
    if (loadSettingsBtn) {
        loadSettingsBtn.addEventListener('click', loadCameraSettings);
    }
    
    // Load settings on startup
    loadCameraSettings();
}

async function checkStatus() {
    try {
        const response = await fetch('/api/status');
        const data = await response.json();
        
        currentState.active = data.active;
        currentState.sessionId = data.session_id;
        currentState.interval = data.interval;
        
        updateUI(data);
    } catch (error) {
        console.error('Error checking status:', error);
    }
}

function updateUI(status) {
    const statusBadge = document.getElementById('statusBadge');
    const statusText = document.getElementById('statusText');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const statsPanel = document.getElementById('statsPanel');
    const intervalInput = document.getElementById('intervalInput');
    const cameraControlsSection = document.getElementById('cameraControlsSection');
    
    // Show camera controls only for USB cameras
    if (status.camera_type === 'usb' && cameraControlsSection) {
        cameraControlsSection.style.display = 'block';
    } else if (cameraControlsSection) {
        cameraControlsSection.style.display = 'none';
    }
    
    if (status.active) {
        // Timelapse is running
        statusBadge.classList.add('active');
        statusText.textContent = 'Recording';
        startBtn.style.display = 'none';
        stopBtn.style.display = 'block';
        statsPanel.style.display = 'grid';
        intervalInput.disabled = true;
        
        // Update stats
        document.getElementById('sessionId').textContent = status.session_id || '-';
        document.getElementById('frameCount').textContent = status.total_frames || 0;
        
        // Calculate duration
        if (status.start_time) {
            const start = new Date(status.start_time);
            const now = new Date();
            const duration = Math.floor((now - start) / 1000);
            document.getElementById('duration').textContent = formatDuration(duration);
        }
        
        // Calculate estimated video length at 30fps
        const videoLength = (status.total_frames / 30).toFixed(1);
        document.getElementById('videoLength').textContent = `${videoLength}s @ 30fps`;
        
    } else {
        // Timelapse is stopped
        statusBadge.classList.remove('active');
        const cameraTypeText = status.camera_type === 'usb' ? 'USB Camera' : (status.camera_type === 'libcamera' ? 'Pi Camera' : 'No Camera');
        statusText.textContent = status.camera_available ? `Ready (${cameraTypeText})` : 'No Camera';
        startBtn.style.display = 'block';
        stopBtn.style.display = 'none';
        statsPanel.style.display = 'none';
        intervalInput.disabled = false;
        
        startBtn.disabled = !status.camera_available;
    }
}

async function startTimelapse() {
    const intervalInput = document.getElementById('intervalInput');
    const resolutionSelect = document.getElementById('resolutionSelect');
    
    const interval = parseInt(intervalInput.value);
    const [width, height] = resolutionSelect.value.split(',').map(Number);
    
    if (interval < 1) {
        alert('Interval must be at least 1 second');
        return;
    }
    
    try {
        const response = await fetch('/api/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                interval: interval,
                resolution: [width, height]
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentState.startTime = new Date();
            await checkStatus();
        } else {
            alert('Error starting timelapse: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error starting timelapse:', error);
        alert('Error starting timelapse');
    }
}

async function stopTimelapse() {
    if (!confirm('Stop the current timelapse?')) {
        return;
    }
    
    try {
        const response = await fetch('/api/stop', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            await checkStatus();
            await loadSessions();
            
            // Ask if user wants to compile video
            if (confirm(`Timelapse stopped with ${data.total_frames} frames. Compile video now?`)) {
                compileVideo(data.session_id);
            }
        } else {
            alert('Error stopping timelapse: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error stopping timelapse:', error);
        alert('Error stopping timelapse');
    }
}

async function loadSessions() {
    const sessionsList = document.getElementById('sessionsList');
    
    try {
        const response = await fetch('/api/sessions');
        const data = await response.json();
        
        if (data.sessions.length === 0) {
            sessionsList.innerHTML = '<div class="empty-state"><p>📂 No sessions yet</p><p style="font-size: 0.9em;">Start a timelapse to create your first session!</p></div>';
            return;
        }
        
        sessionsList.innerHTML = data.sessions.map(session => `
            <div class="session-item">
                <img class="session-preview" 
                     src="/api/sessions/${session.id}/preview" 
                     alt="Session preview"
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23ddd%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%22 y=%2250%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22 font-size=%2220%22%3ENo Preview%3C/text%3E%3C/svg%3E'">
                <div class="session-info">
                    <h3>Session ${session.id}</h3>
                    <p>📸 Frames: ${session.frame_count}</p>
                    <p>📅 Created: ${formatDate(session.created)}</p>
                    <p>${session.has_video ? '✅ Video compiled' : '⏳ No video yet'}</p>
                </div>
                <div class="session-actions">
                    ${!session.has_video ? `
                        <button class="btn btn-success" onclick="compileVideo('${session.id}')">
                            🎬 Compile Video
                        </button>
                    ` : `
                        <button class="btn btn-primary" onclick="downloadVideo('${session.id}')">
                            ⬇️ Download Video
                        </button>
                    `}
                    <button class="btn btn-danger" onclick="deleteSession('${session.id}')">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading sessions:', error);
        sessionsList.innerHTML = '<p class="loading">Error loading sessions</p>';
    }
}

async function compileVideo(sessionId) {
    const fps = prompt('Enter frame rate for video (default: 30fps):', '30');
    if (!fps) return;
    
    try {
        const response = await fetch('/api/compile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                session_id: sessionId,
                fps: parseInt(fps)
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Video compilation started! This may take a few minutes. Refresh the page to check progress.');
            setTimeout(loadSessions, 2000);
        } else {
            alert('Error compiling video: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error compiling video:', error);
        alert('Error compiling video');
    }
}

function downloadVideo(sessionId) {
    window.location.href = `/api/sessions/${sessionId}/video`;
}

async function deleteSession(sessionId) {
    if (!confirm('Delete this session and all its files?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/sessions/${sessionId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            await loadSessions();
        } else {
            alert('Error deleting session');
        }
    } catch (error) {
        console.error('Error deleting session:', error);
        alert('Error deleting session');
    }
}

function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString();
}

async function loadCameraSettings() {
    try {
        const response = await fetch('/api/camera/controls');
        const data = await response.json();
        
        if (data.controls) {
            // Show camera controls section
            const controlsSection = document.getElementById('cameraControlsSection');
            if (controlsSection) {
                controlsSection.style.display = 'block';
            }
            
            // Update sliders with current values
            if (data.controls.brightness !== undefined) {
                document.getElementById('brightnessSlider').value = data.controls.brightness;
                document.getElementById('brightnessValue').textContent = data.controls.brightness;
            }
            
            if (data.controls.contrast !== undefined) {
                document.getElementById('contrastSlider').value = data.controls.contrast;
                document.getElementById('contrastValue').textContent = data.controls.contrast;
            }
            
            if (data.controls.saturation !== undefined) {
                document.getElementById('saturationSlider').value = data.controls.saturation;
                document.getElementById('saturationValue').textContent = data.controls.saturation;
            }
            
            if (data.controls.exposure_absolute !== undefined) {
                document.getElementById('exposureSlider').value = data.controls.exposure_absolute;
                document.getElementById('exposureValue').textContent = data.controls.exposure_absolute;
            }
            
            if (data.controls.exposure_auto !== undefined) {
                // exposure_auto: 3=auto, 1=manual
                const isAuto = data.controls.exposure_auto === 3;
                document.getElementById('autoExposureCheckbox').checked = isAuto;
                document.getElementById('manualExposureGroup').style.display = isAuto ? 'none' : 'block';
            }
        }
    } catch (error) {
        console.error('Error loading camera settings:', error);
        // Hide camera controls if not available
        const controlsSection = document.getElementById('cameraControlsSection');
        if (controlsSection) {
            controlsSection.style.display = 'none';
        }
    }
}

async function applyCameraSettings() {
    const settings = {
        brightness: parseInt(document.getElementById('brightnessSlider').value),
        contrast: parseInt(document.getElementById('contrastSlider').value),
        saturation: parseInt(document.getElementById('saturationSlider').value)
    };
    
    // Add exposure settings
    const autoExposure = document.getElementById('autoExposureCheckbox').checked;
    settings.exposure_auto = autoExposure ? 3 : 1;
    
    if (!autoExposure) {
        settings.exposure_absolute = parseInt(document.getElementById('exposureSlider').value);
    }
    
    try {
        const response = await fetch('/api/camera/controls', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Show success message
            const btn = document.getElementById('applyCameraSettings');
            const originalText = btn.textContent;
            btn.textContent = '✅ Applied!';
            btn.style.background = '#4caf50';
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 2000);
        } else {
            alert('Error applying settings: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error applying camera settings:', error);
        alert('Error applying camera settings');
    }
}
