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
        statusText.textContent = status.camera_available ? 'Ready' : 'No Camera';
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
