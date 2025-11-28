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
    const previewCurrentBtn = document.getElementById('previewCurrentBtn');
    const intervalInput = document.getElementById('intervalInput');
    const scheduleCheckbox = document.getElementById('scheduleCheckbox');
    const scheduleControls = document.getElementById('scheduleControls');
    
    startBtn.addEventListener('click', startTimelapse);
    stopBtn.addEventListener('click', stopTimelapse);
    
    if (previewCurrentBtn) {
        previewCurrentBtn.addEventListener('click', previewCurrentSession);
    }
    
    if (scheduleCheckbox) {
        scheduleCheckbox.addEventListener('change', (e) => {
            scheduleControls.style.display = e.target.checked ? 'block' : 'none';
        });
    }
    
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
    const previewCurrentBtn = document.getElementById('previewCurrentBtn');
    const statsPanel = document.getElementById('statsPanel');
    const intervalInput = document.getElementById('intervalInput');
    const cameraControlsSection = document.getElementById('cameraControlsSection');
    const recordingStatus = document.getElementById('recordingStatus');
    const scheduledEndStat = document.getElementById('scheduledEndStat');
    const scheduledEndTime = document.getElementById('scheduledEndTime');
    
    // Show camera controls only for USB cameras
    if (status.camera_type === 'usb' && cameraControlsSection) {
        cameraControlsSection.style.display = 'block';
    } else if (cameraControlsSection) {
        cameraControlsSection.style.display = 'none';
    }
    
    if (status.active) {
        // Timelapse is running or waiting
        statusBadge.classList.add('active');
        
        if (status.waiting_for_start) {
            statusText.textContent = 'Waiting to Start';
            recordingStatus.textContent = 'Waiting...';
        } else {
            statusText.textContent = 'Recording';
            recordingStatus.textContent = 'Recording';
        }
        
        startBtn.style.display = 'none';
        stopBtn.style.display = 'block';
        previewCurrentBtn.style.display = status.total_frames >= 2 ? 'block' : 'none';
        statsPanel.style.display = 'grid';
        intervalInput.disabled = true;
        
        // Update stats
        document.getElementById('sessionId').textContent = status.session_id || '-';
        document.getElementById('frameCount').textContent = status.total_frames || 0;
        
        // Show scheduled end time if set
        if (status.scheduled_end) {
            scheduledEndStat.style.display = 'block';
            const endTime = new Date(status.scheduled_end);
            scheduledEndTime.textContent = endTime.toLocaleString();
        } else {
            scheduledEndStat.style.display = 'none';
        }
        
        // Calculate duration
        if (status.start_time && !status.waiting_for_start) {
            const start = new Date(status.start_time);
            const now = new Date();
            const duration = Math.floor((now - start) / 1000);
            document.getElementById('duration').textContent = formatDuration(duration);
        } else if (status.waiting_for_start && status.scheduled_start) {
            const start = new Date(status.scheduled_start);
            const now = new Date();
            const timeUntil = Math.floor((start - now) / 1000);
            document.getElementById('duration').textContent = `Starts in ${formatDuration(timeUntil)}`;
        } else {
            document.getElementById('duration').textContent = '00:00:00';
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
        previewCurrentBtn.style.display = 'none';
        statsPanel.style.display = 'none';
        intervalInput.disabled = false;
        
        startBtn.disabled = !status.camera_available;
    }
}

async function startTimelapse() {
    const intervalInput = document.getElementById('intervalInput');
    const resolutionSelect = document.getElementById('resolutionSelect');
    const scheduleCheckbox = document.getElementById('scheduleCheckbox');
    const startDateTime = document.getElementById('startDateTime');
    const endDateTime = document.getElementById('endDateTime');
    
    const interval = parseInt(intervalInput.value);
    const [width, height] = resolutionSelect.value.split(',').map(Number);
    
    if (interval < 1) {
        alert('Interval must be at least 1 second');
        return;
    }
    
    const requestData = {
        interval: interval,
        resolution: [width, height]
    };
    
    // Add scheduled times if checkbox is checked
    if (scheduleCheckbox.checked) {
        if (startDateTime.value) {
            requestData.scheduled_start = new Date(startDateTime.value).toISOString();
        }
        if (endDateTime.value) {
            requestData.scheduled_end = new Date(endDateTime.value).toISOString();
            
            // Validate end is after start
            const start = startDateTime.value ? new Date(startDateTime.value) : new Date();
            const end = new Date(endDateTime.value);
            
            if (end <= start) {
                alert('End time must be after start time');
                return;
            }
        }
    }
    
    try {
        const response = await fetch('/api/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentState.startTime = new Date();
            
            if (data.scheduled_start) {
                alert(`Timelapse scheduled to start at ${new Date(data.scheduled_start).toLocaleString()}`);
            }
            
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
            <div class="session-item-no-preview">
                <div class="session-info">
                    <h3>Session ${session.id}</h3>
                    <p>📸 Frames: ${session.frame_count}</p>
                    <p>📅 Created: ${formatDate(session.created)}</p>
                    ${session.has_video && session.duration ? 
                        `<p>⏱️ Duration: ${formatDuration(Math.round(session.duration))}</p>` : ''}
                    <p>${session.has_video ? '✅ Video compiled' : '⏳ No video yet'}</p>
                </div>
                <div class="session-actions">
                    ${!session.has_video ? `
                        <button class="btn btn-success" onclick="compileVideo('${session.id}')">
                            🎬 Compile Video
                        </button>
                    ` : `
                        <button class="btn btn-primary" onclick="previewVideo('${session.id}')">
                            ▶️ Preview
                        </button>
                        <button class="btn btn-primary" onclick="downloadVideo('${session.id}')">
                            ⬇️ Download
                        </button>
                        <button class="btn btn-secondary" onclick="rotateVideo('${session.id}')">
                            🔄 Rotate
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
    // Create a custom dialog for compilation options
    const fps = prompt('Enter frame rate for video (default: 30fps):', '30');
    if (!fps) return;
    
    const rotation = prompt('Rotate video? Enter 0 (none), 90 (clockwise), 180, or 270 (counter-clockwise):', '0');
    if (rotation === null) return;
    
    const rotationValue = parseInt(rotation);
    if (![0, 90, 180, 270].includes(rotationValue)) {
        alert('Invalid rotation. Please use 0, 90, 180, or 270');
        return;
    }
    
    try {
        const response = await fetch('/api/compile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                session_id: sessionId,
                fps: parseInt(fps),
                rotation: rotationValue
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
    if (seconds < 60) {
        return `${seconds}s`;
    }
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    } else {
        return `${minutes}m ${secs}s`;
    }
}

function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString();
}

async function loadCameraSettings() {
    try {
        const response = await fetch('/api/camera/controls');
        const data = await response.json();
        
        console.log('Camera controls loaded:', data);
        
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
        } else if (data.error) {
            console.error('Camera controls error:', data.error);
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
    
    console.log('Applying camera settings:', settings);
    
    try {
        const response = await fetch('/api/camera/controls', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });
        
        const data = await response.json();
        console.log('Camera settings response:', data);
        
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
            
            // Reload current settings to verify
            setTimeout(loadCameraSettings, 500);
        } else {
            const errorMsg = data.errors ? data.errors.join(', ') : (data.error || 'Unknown error');
            alert('Error applying settings: ' + errorMsg);
            console.error('Camera settings error:', data);
        }
    } catch (error) {
        console.error('Error applying camera settings:', error);
        alert('Error applying camera settings: ' + error.message);
    }
}

// Video Preview Functions
function previewVideo(sessionId) {
    const modal = document.getElementById('videoModal');
    const video = document.getElementById('videoPlayer');
    const source = document.getElementById('videoSource');
    const title = document.getElementById('videoModalTitle');
    const downloadBtn = document.getElementById('downloadFromPreview');
    
    // Set video source
    source.src = `/api/sessions/${sessionId}/video/stream`;
    video.load();
    
    // Update title
    title.textContent = `Preview: ${sessionId}`;
    
    // Set download button
    downloadBtn.onclick = () => downloadVideo(sessionId);
    
    // Show modal
    modal.style.display = 'flex';
}

// Initialize modal controls
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('videoModal');
    const closeBtn = document.querySelector('.modal-close');
    const closePreviewBtn = document.getElementById('closePreview');
    const video = document.getElementById('videoPlayer');
    
    // Close modal functions
    const closeModal = () => {
        modal.style.display = 'none';
        video.pause();
    };
    
    if (closeBtn) closeBtn.onclick = closeModal;
    if (closePreviewBtn) closePreviewBtn.onclick = closeModal;
    
    // Close on outside click
    window.onclick = (event) => {
        if (event.target === modal) {
            closeModal();
        }
    };
    
    // Close on Escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.style.display === 'flex') {
            closeModal();
        }
    });
    
    // Initialize system controls
    initializeSystemControls();
});

// System Control Functions
function initializeSystemControls() {
    const restartServiceBtn = document.getElementById('restartServiceBtn');
    const rebootBtn = document.getElementById('rebootBtn');
    const shutdownBtn = document.getElementById('shutdownBtn');
    const warningDiv = document.getElementById('systemActionWarning');
    const warningText = document.getElementById('warningText');
    const confirmBtn = document.getElementById('confirmActionBtn');
    const cancelBtn = document.getElementById('cancelActionBtn');
    
    let pendingAction = null;
    
    const showWarning = (message, action) => {
        warningText.textContent = message;
        warningDiv.style.display = 'block';
        pendingAction = action;
    };
    
    const hideWarning = () => {
        warningDiv.style.display = 'none';
        pendingAction = null;
    };
    
    if (restartServiceBtn) {
        restartServiceBtn.onclick = () => {
            showWarning(
                'This will restart the TimelapsePI service. Active timelapses will be stopped. Continue?',
                restartService
            );
        };
    }
    
    if (rebootBtn) {
        rebootBtn.onclick = () => {
            showWarning(
                'This will reboot your Raspberry Pi in 1 minute. All active timelapses will be stopped. Continue?',
                rebootSystem
            );
        };
    }
    
    if (shutdownBtn) {
        shutdownBtn.onclick = () => {
            showWarning(
                'This will shutdown your Raspberry Pi in 1 minute. All active timelapses will be stopped. Continue?',
                shutdownSystem
            );
        };
    }
    
    if (confirmBtn) {
        confirmBtn.onclick = () => {
            if (pendingAction) {
                pendingAction();
                hideWarning();
            }
        };
    }
    
    if (cancelBtn) {
        cancelBtn.onclick = hideWarning;
    }
}

async function restartService() {
    try {
        const response = await fetch('/api/system/restart-service', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Service restarting... Page will reload in 5 seconds.');
            setTimeout(() => {
                location.reload();
            }, 5000);
        } else {
            alert('❌ Error: ' + (data.error || 'Failed to restart service'));
        }
    } catch (error) {
        console.error('Error restarting service:', error);
        alert('❌ Error restarting service. Check the logs.');
    }
}

async function rebootSystem() {
    try {
        const response = await fetch('/api/system/reboot', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ System rebooting in 1 minute... You can cancel with "sudo shutdown -c" on the Pi.');
            // Disable all buttons
            document.querySelectorAll('button').forEach(btn => btn.disabled = true);
        } else {
            alert('❌ Error: ' + (data.error || 'Failed to reboot'));
        }
    } catch (error) {
        console.error('Error rebooting:', error);
        alert('❌ Error rebooting system');
    }
}

async function shutdownSystem() {
    try {
        const response = await fetch('/api/system/shutdown', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ System shutting down in 1 minute... You can cancel with "sudo shutdown -c" on the Pi.');
            // Disable all buttons
            document.querySelectorAll('button').forEach(btn => btn.disabled = true);
        } else {
            alert('❌ Error: ' + (data.error || 'Failed to shutdown'));
        }
    } catch (error) {
        console.error('Error shutting down:', error);
        alert('❌ Error shutting down system');
    }
}

async function previewCurrentSession() {
    const btn = document.getElementById('previewCurrentBtn');
    const originalText = btn.textContent;
    
    btn.textContent = '⏳ Generating...';
    btn.disabled = true;
    
    try {
        const response = await fetch('/api/current-session/preview', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fps: 30 })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Open preview modal with current session video
            const modal = document.getElementById('videoModal');
            const video = document.getElementById('videoPlayer');
            const source = document.getElementById('videoSource');
            const title = document.getElementById('videoModalTitle');
            const downloadBtn = document.getElementById('downloadFromPreview');
            
            source.src = '/api/current-session/preview/video';
            video.load();
            
            title.textContent = 'Current Session Preview';
            downloadBtn.style.display = 'none'; // Can't download preview
            
            modal.style.display = 'flex';
            
            btn.textContent = originalText;
            btn.disabled = false;
        } else {
            alert('Error generating preview: ' + (data.error || 'Unknown error'));
            btn.textContent = originalText;
            btn.disabled = false;
        }
    } catch (error) {
        console.error('Error previewing current session:', error);
        alert('Error generating preview');
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

async function rotateVideo(sessionId) {
    const rotation = prompt('Rotate video:\n0 = No rotation\n90 = 90° clockwise\n180 = 180°\n270 = 90° counter-clockwise', '90');
    
    if (rotation === null) return;
    
    const rotationValue = parseInt(rotation);
    if (![90, 180, 270].includes(rotationValue)) {
        alert('Invalid rotation. Please use 90, 180, or 270');
        return;
    }
    
    if (!confirm(`Rotate video ${rotationValue}°? This will replace the original video.`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/sessions/${sessionId}/rotate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                rotation: rotationValue
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Video rotation started! This may take a minute. Refresh to see the result.');
            setTimeout(loadSessions, 3000);
        } else {
            alert('Error rotating video: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error rotating video:', error);
        alert('Error rotating video');
    }
}
