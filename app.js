/**
 * VoiceScribe Accessibility - Speech-to-Text Tool
 * Uses Web Speech API for real-time transcription
 * 100% client-side, privacy-focused
 */

// ==================== STATE ====================
const state = {
    isRecording: false,
    isPaused: false,
    recognition: null,
    audioContext: null,
    analyser: null,
    microphone: null,
    animationId: null,
    transcript: [],
    interimText: '',
    startTime: null,
    pausedDuration: 0,
    lastPauseTime: null,
    currentSegment: 0,
    speechSynthesis: window.speechSynthesis,
    currentUtterance: null
};

// ==================== DOM ELEMENTS ====================
const elements = {
    statusDot: document.getElementById('status-dot'),
    statusText: document.getElementById('status-text'),
    confidenceMeter: document.getElementById('confidence-meter'),
    confidenceFill: document.getElementById('confidence-fill'),
    confidenceValue: document.getElementById('confidence-value'),
    canvas: document.getElementById('audio-visualizer'),
    visualizerFallback: document.getElementById('visualizer-fallback'),
    btnRecord: document.getElementById('btn-record'),
    btnPause: document.getElementById('btn-pause'),
    btnStop: document.getElementById('btn-stop'),
    languageSelect: document.getElementById('language-select'),
    punctuationSelect: document.getElementById('punctuation-select'),
    continuousToggle: document.getElementById('continuous-toggle'),
    interimToggle: document.getElementById('interim-toggle'),
    transcriptOutput: document.getElementById('transcript-output'),
    wordCount: document.getElementById('word-count'),
    duration: document.getElementById('duration'),
    segmentCount: document.getElementById('segment-count'),
    btnCopy: document.getElementById('btn-copy'),
    btnClearTranscript: document.getElementById('btn-clear-transcript'),
    btnExportTxt: document.getElementById('btn-export-txt'),
    btnExportSrt: document.getElementById('btn-export-srt'),
    btnExportVtt: document.getElementById('btn-export-vtt'),
    btnExportJson: document.getElementById('btn-export-json'),
    btnTextToSpeech: document.getElementById('btn-text-to-speech'),
    btnHighContrast: document.getElementById('btn-high-contrast'),
    btnLargeText: document.getElementById('btn-large-text'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toast-message')
};

const canvasCtx = elements.canvas.getContext('2d');

// ==================== INITIALIZATION ====================
function init() {
    checkBrowserSupport();
    attachEventListeners();
    loadSettings();
    setupCanvas();
    updateStats();
}

function checkBrowserSupport() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        showToast('⚠️ Your browser does not support Speech Recognition. Please use Chrome, Edge, or Safari.');
        elements.btnRecord.disabled = true;
        elements.statusText.textContent = 'Browser not supported';
        elements.statusDot.style.background = '#dc2626';
    }
}

function setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = elements.canvas.getBoundingClientRect();
    elements.canvas.width = rect.width * dpr;
    elements.canvas.height = rect.height * dpr;
    canvasCtx.scale(dpr, dpr);
}

// ==================== EVENT LISTENERS ====================
function attachEventListeners() {
    elements.btnRecord.addEventListener('click', toggleRecording);
    elements.btnPause.addEventListener('click', togglePause);
    elements.btnStop.addEventListener('click', stopRecording);
    
    elements.languageSelect.addEventListener('change', handleLanguageChange);
    elements.continuousToggle.addEventListener('change', saveSettings);
    elements.interimToggle.addEventListener('change', saveSettings);
    elements.punctuationSelect.addEventListener('change', saveSettings);
    
    elements.btnCopy.addEventListener('click', copyTranscript);
    elements.btnClearTranscript.addEventListener('click', clearTranscript);
    
    elements.btnExportTxt.addEventListener('click', () => exportTranscript('txt'));
    elements.btnExportSrt.addEventListener('click', () => exportTranscript('srt'));
    elements.btnExportVtt.addEventListener('click', () => exportTranscript('vtt'));
    elements.btnExportJson.addEventListener('click', () => exportTranscript('json'));
    
    elements.btnTextToSpeech.addEventListener('click', readTranscriptAloud);
    elements.btnHighContrast.addEventListener('click', toggleHighContrast);
    elements.btnLargeText.addEventListener('click', toggleLargeText);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
    
    // Window resize
    window.addEventListener('resize', setupCanvas);
}

function handleKeyboard(e) {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case ' ':
                e.preventDefault();
                toggleRecording();
                break;
            case '.':
                e.preventDefault();
                togglePause();
                break;
            case 'c':
                if (e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') {
                    e.preventDefault();
                    copyTranscript();
                }
                break;
            case 's':
                e.preventDefault();
                exportTranscript('txt');
                break;
            case 'l':
                e.preventDefault();
                clearTranscript();
                break;
        }
    }
    if (e.key === 'Escape') {
        stopRecording();
    }
}

// ==================== RECORDING LOGIC ====================
function toggleRecording() {
    if (state.isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

function startRecording() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    
    state.recognition = new SpeechRecognition();
    state.recognition.continuous = elements.continuousToggle.checked;
    state.recognition.interimResults = elements.interimToggle.checked;
    state.recognition.lang = elements.languageSelect.value === 'auto' ? 'en-US' : elements.languageSelect.value;
    state.recognition.maxAlternatives = 1;
    
    state.recognition.onstart = () => {
        state.isRecording = true;
        state.isPaused = false;
        state.startTime = state.startTime || Date.now();
        updateUIState('recording');
        startVisualizer();
        showToast('🎙️ Recording started');
    };
    
    state.recognition.onresult = (event) => {
        handleRecognitionResult(event);
    };
    
    state.recognition.onerror = (event) => {
        handleRecognitionError(event);
    };
    
    state.recognition.onend = () => {
        if (state.isRecording && !state.isPaused && elements.continuousToggle.checked) {
            try {
                state.recognition.start();
            } catch (e) {}
        } else {
            stopVisualizer();
            if (!state.isPaused) {
                updateUIState('idle');
            }
        }
    };
    
    try {
        state.recognition.start();
    } catch (e) {
        showToast('Error starting recording: ' + e.message);
    }
}

function stopRecording() {
    state.isRecording = false;
    state.isPaused = false;
    
    if (state.recognition) {
        try {
            state.recognition.stop();
        } catch (e) {}
        state.recognition = null;
    }
    
    stopVisualizer();
    updateUIState('idle');
    state.interimText = '';
    renderTranscript();
    showToast('⏹️ Recording stopped');
}

function togglePause() {
    if (!state.isRecording) return;
    
    if (state.isPaused) {
        state.isPaused = false;
        state.pausedDuration += Date.now() - state.lastPauseTime;
        state.recognition.start();
        updateUIState('recording');
        showToast('▶️ Recording resumed');
    } else {
        state.isPaused = true;
        state.lastPauseTime = Date.now();
        state.recognition.stop();
        updateUIState('paused');
        showToast('⏸️ Recording paused');
    }
}

function handleRecognitionResult(event) {
    let finalTranscript = '';
    let interimTranscript = '';
    let confidence = 0;
    let confidenceCount = 0;
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        confidence += result[0].confidence;
        confidenceCount++;
        
        if (result.isFinal) {
            finalTranscript += transcript + ' ';
        } else {
            interimTranscript += transcript;
        }
    }
    
    if (confidenceCount > 0) {
        const avgConfidence = Math.round((confidence / confidenceCount) * 100);
        updateConfidence(avgConfidence);
    }
    
    if (finalTranscript) {
        finalTranscript = processPunctuation(finalTranscript.trim());
        
        const segment = {
            id: ++state.currentSegment,
            text: finalTranscript,
            timestamp: new Date(),
            elapsed: getElapsedTime()
        };
        
        state.transcript.push(segment);
        state.interimText = '';
    } else {
        state.interimText = interimTranscript;
    }
    
    renderTranscript();
    updateStats();
    saveTranscript();
}

function handleRecognitionError(event) {
    console.error('Speech recognition error:', event.error);
    
    const errorMessages = {
        'no-speech': 'No speech detected. Please try again.',
        'audio-capture': 'No microphone found. Please check your device.',
        'not-allowed': 'Microphone permission denied. Please allow access.',
        'network': 'Network error. Please check your connection.',
        'aborted': 'Recording aborted.',
        'language-not-supported': 'Language not supported. Please select another.'
    };
    
    showToast('⚠️ ' + (errorMessages[event.error] || 'An error occurred: ' + event.error));
    
    if (event.error === 'not-allowed' || event.error === 'audio-capture') {
        stopRecording();
    }
}

function handleLanguageChange() {
    saveSettings();
    if (state.isRecording) {
        showToast('Language changed. Restarting recording...');
        stopRecording();
        setTimeout(startRecording, 300);
    }
}

// ==================== PUNCTUATION PROCESSING ====================
function processPunctuation(text) {
    const mode = elements.punctuationSelect.value;
    
    if (mode === 'none') {
        return text.replace(/[.,!?;:]/g, '');
    }
    
    if (mode === 'auto') {
        text = text.trim();
        text = text.charAt(0).toUpperCase() + text.slice(1);
        
        if (!/[.!?]$/.test(text)) {
            if (/^(who|what|when|where|why|how|is|are|was|were|do|does|did|can|could|will|would|should|may|might|have|has|had)/i.test(text)) {
                text += '?';
            } else {
                text += '.';
            }
        }
        
        text = text.replace(/\s+([.,!?;:])/g, '$1');
        text = text.replace(/([.,!?;:])(?=[^\s])/g, '$1 ');
    }
    
    return text;
}

// ==================== VISUALIZER ====================
async function startVisualizer() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        state.analyser = state.audioContext.createAnalyser();
        state.microphone = state.audioContext.createMediaStreamSource(stream);
        state.microphone.connect(state.analyser);
        state.analyser.fftSize = 256;
        
        elements.canvas.style.display = 'block';
        elements.visualizerFallback.classList.remove('active');
        drawVisualizer();
    } catch (e) {
        elements.canvas.style.display = 'none';
        elements.visualizerFallback.classList.add('active');
    }
}

function drawVisualizer() {
    if (!state.analyser) return;
    
    const bufferLength = state.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    state.analyser.getByteFrequencyData(dataArray);
    
    const width = elements.canvas.width / (window.devicePixelRatio || 1);
    const height = elements.canvas.height / (window.devicePixelRatio || 1);
    
    canvasCtx.clearRect(0, 0, width, height);
    
    const barWidth = (width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * height * 0.8;
        
        const gradient = canvasCtx.createLinearGradient(0, height, 0, height - barHeight);
        gradient.addColorStop(0, '#2563eb');
        gradient.addColorStop(1, '#60a5fa');
        
        canvasCtx.fillStyle = gradient;
        canvasCtx.fillRect(x, height - barHeight, barWidth, barHeight);
        
        x += barWidth + 1;
    }
    
    if (state.isRecording) {
        state.animationId = requestAnimationFrame(drawVisualizer);
    }
}

function stopVisualizer() {
    if (state.animationId) {
        cancelAnimationFrame(state.animationId);
        state.animationId = null;
    }
    
    if (state.audioContext) {
        state.audioContext.close();
        state.audioContext = null;
    }
    
    state.analyser = null;
    state.microphone = null;
    
    elements.canvas.style.display = 'none';
    elements.visualizerFallback.classList.remove('active');
    
    const width = elements.canvas.width / (window.devicePixelRatio || 1);
    const height = elements.canvas.height / (window.devicePixelRatio || 1);
    canvasCtx.clearRect(0, 0, width, height);
}

// ==================== UI UPDATES ====================
function updateUIState(status) {
    elements.statusDot.className = 'status-dot';
    
    switch(status) {
        case 'recording':
            elements.statusDot.classList.add('recording');
            elements.statusText.textContent = 'Recording...';
            elements.btnRecord.classList.add('recording');
            elements.btnRecord.innerHTML = '<span class="record-icon">■</span><span class="record-label">Stop Recording</span>';
            elements.btnPause.disabled = false;
            elements.btnStop.disabled = false;
            elements.confidenceMeter.style.display = 'flex';
            break;
            
        case 'paused':
            elements.statusDot.classList.add('paused');
            elements.statusText.textContent = 'Paused';
            elements.btnRecord.classList.remove('recording');
            elements.btnRecord.innerHTML = '<span class="record-icon">●</span><span class="record-label">Resume Recording</span>';
            elements.btnPause.disabled = false;
            elements.btnStop.disabled = false;
            break;
            
        case 'idle':
        default:
            elements.statusText.textContent = 'Ready to listen';
            elements.btnRecord.classList.remove('recording');
            elements.btnRecord.innerHTML = '<span class="record-icon">●</span><span class="record-label">Start Recording</span>';
            elements.btnPause.disabled = true;
            elements.btnStop.disabled = true;
            elements.confidenceMeter.style.display = 'none';
            updateConfidence(0);
            break;
    }
}

function updateConfidence(value) {
    elements.confidenceFill.style.width = value + '%';
    elements.confidenceValue.textContent = value + '%';
}

function getElapsedTime() {
    if (!state.startTime) return 0;
    let elapsed = Date.now() - state.startTime;
    if (state.isPaused && state.lastPauseTime) {
        elapsed = state.lastPauseTime - state.startTime - state.pausedDuration;
    } else {
        elapsed -= state.pausedDuration;
    }
    return Math.max(0, elapsed);
}

function formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
}

function updateDuration() {
    if (state.isRecording && !state.isPaused) {
        elements.duration.textContent = formatDuration(getElapsedTime());
        requestAnimationFrame(updateDuration);
    }
}

// ==================== TRANSCRIPT MANAGEMENT ====================
function renderTranscript() {
    if (state.transcript.length === 0 && !state.interimText) {
        elements.transcriptOutput.innerHTML = '<p class="placeholder-text">Your speech will appear here...</p>';
        return;
    }
    
    let html = '';
    
    state.transcript.forEach(segment => {
        const timeStr = segment.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        html += `<p class="final"><span class="timestamp">${timeStr}</span>${escapeHtml(segment.text)}</p>`;
    });
    
    if (state.interimText && elements.interimToggle.checked) {
        html += `<p class="interim">${escapeHtml(state.interimText)}</p>`;
    }
    
    elements.transcriptOutput.innerHTML = html;
    elements.transcriptOutput.scrollTop = elements.transcriptOutput.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateStats() {
    const fullText = state.transcript.map(s => s.text).join(' ');
    const words = fullText.trim().split(/\s+/).filter(w => w.length > 0);
    elements.wordCount.textContent = words.length;
    elements.segmentCount.textContent = state.transcript.length;
    
    if (state.isRecording && !state.isPaused) {
        updateDuration();
    }
}

function clearTranscript() {
    if (state.transcript.length === 0 && !state.interimText) return;
    
    if (confirm('Are you sure you want to clear the transcript?')) {
        state.transcript = [];
        state.interimText = '';
        state.currentSegment = 0;
        state.startTime = null;
        state.pausedDuration = 0;
        state.lastPauseTime = null;
        elements.duration.textContent = '00:00';
        renderTranscript();
        updateStats();
        saveTranscript();
        showToast('🗑️ Transcript cleared');
    }
}

function copyTranscript() {
    const text = state.transcript.map(s => s.text).join('\n');
    if (!text) {
        showToast('Nothing to copy');
        return;
    }
    
    navigator.clipboard.writeText(text).then(() => {
        showToast('📋 Copied to clipboard');
    }).catch(() => {
        showToast('Failed to copy');
    });
}

// ==================== EXPORT ====================
function exportTranscript(format) {
    if (state.transcript.length === 0) {
        showToast('Nothing to export');
        return;
    }
    
    let content = '';
    let filename = 'transcript';
    let mimeType = 'text/plain';
    
    switch(format) {
        case 'txt':
            content = state.transcript.map(s => {
                const time = s.timestamp.toLocaleTimeString();
                return `[${time}] ${s.text}`;
            }).join('\n\n');
            filename += '.txt';
            break;
            
        case 'srt':
            content = generateSRT();
            filename += '.srt';
            break;
            
        case 'vtt':
            content = generateVTT();
            filename += '.vtt';
            mimeType = 'text/vtt';
            break;
            
        case 'json':
            content = JSON.stringify({
                title: 'VoiceScribe Transcript',
                created: new Date().toISOString(),
                language: elements.languageSelect.value,
                segments: state.transcript
            }, null, 2);
            filename += '.json';
            mimeType = 'application/json';
            break;
    }
    
    downloadFile(content, filename, mimeType);
    showToast(`💾 Exported as ${format.toUpperCase()}`);
}

function generateSRT() {
    let srt = '';
    state.transcript.forEach((segment, index) => {
        const startTime = formatSRTTime(segment.elapsed);
        const endTime = formatSRTTime(segment.elapsed + 3000);
        srt += `${index + 1}\n`;
        srt += `${startTime} --> ${endTime}\n`;
        srt += `${segment.text}\n\n`;
    });
    return srt;
}

function generateVTT() {
    let vtt = 'WEBVTT\n\n';
    state.transcript.forEach((segment, index) => {
        const startTime = formatVTTTime(segment.elapsed);
        const endTime = formatVTTTime(segment.elapsed + 3000);
        vtt += `${index + 1}\n`;
        vtt += `${startTime} --> ${endTime}\n`;
        vtt += `${segment.text}\n\n`;
    });
    return vtt;
}

function formatSRTTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const millis = Math.floor((ms % 1000) / 10);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(millis).padStart(2, '0')}`;
}

function formatVTTTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const millis = Math.floor((ms % 1000));
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ==================== TEXT TO SPEECH ====================
function readTranscriptAloud() {
    const text = state.transcript.map(s => s.text).join('. ');
    if (!text) {
        showToast('Nothing to read');
        return;
    }
    
    if (state.speechSynthesis.speaking) {
        state.speechSynthesis.cancel();
        elements.btnTextToSpeech.classList.remove('active');
        elements.btnTextToSpeech.textContent = '🔊 Read Aloud';
        return;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.lang = elements.languageSelect.value === 'auto' ? 'en-US' : elements.languageSelect.value;
    
    const voices = state.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang === utterance.lang) ||
                          voices.find(v => v.lang.startsWith(utterance.lang.split('-')[0])) ||
                          voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.onstart = () => {
        elements.btnTextToSpeech.classList.add('active');
        elements.btnTextToSpeech.textContent = '⏹ Stop Reading';
    };
    
    utterance.onend = () => {
        elements.btnTextToSpeech.classList.remove('active');
        elements.btnTextToSpeech.textContent = '🔊 Read Aloud';
    };
    
    state.speechSynthesis.speak(utterance);
}

// ==================== ACCESSIBILITY MODES ====================
function toggleHighContrast() {
    document.body.classList.toggle('high-contrast');
    elements.btnHighContrast.classList.toggle('active');
    saveSettings();
}

function toggleLargeText() {
    document.body.classList.toggle('large-text');
    elements.btnLargeText.classList.toggle('active');
    saveSettings();
}

// ==================== SETTINGS & STORAGE ====================
function saveSettings() {
    const settings = {
        language: elements.languageSelect.value,
        punctuation: elements.punctuationSelect.value,
        continuous: elements.continuousToggle.checked,
        interim: elements.interimToggle.checked,
        highContrast: document.body.classList.contains('high-contrast'),
        largeText: document.body.classList.contains('large-text')
    };
    localStorage.setItem('voicescribe-settings', JSON.stringify(settings));
}

function loadSettings() {
    const saved = localStorage.getItem('voicescribe-settings');
    if (!saved) return;
    
    try {
        const settings = JSON.parse(saved);
        elements.languageSelect.value = settings.language || 'en-US';
        elements.punctuationSelect.value = settings.punctuation || 'auto';
        elements.continuousToggle.checked = settings.continuous !== false;
        elements.interimToggle.checked = settings.interim !== false;
        
        if (settings.highContrast) {
            document.body.classList.add('high-contrast');
            elements.btnHighContrast.classList.add('active');
        }
        if (settings.largeText) {
            document.body.classList.add('large-text');
            elements.btnLargeText.classList.add('active');
        }
    } catch (e) {
        console.error('Failed to load settings', e);
    }
}

function saveTranscript() {
    localStorage.setItem('voicescribe-transcript', JSON.stringify(state.transcript));
}

function loadTranscript() {
    const saved = localStorage.getItem('voicescribe-transcript');
    if (!saved) return;
    
    try {
        const transcript = JSON.parse(saved);
        state.transcript = transcript.map(s => ({
            ...s,
            timestamp: new Date(s.timestamp)
        }));
        state.currentSegment = state.transcript.length;
        renderTranscript();
        updateStats();
    } catch (e) {
        console.error('Failed to load transcript', e);
    }
}

// ==================== TOAST ====================
function showToast(message) {
    elements.toastMessage.textContent = message;
    elements.toast.classList.add('show');
    elements.toast.setAttribute('aria-hidden', 'false');
    
    setTimeout(() => {
        elements.toast.classList.remove('show');
        elements.toast.setAttribute('aria-hidden', 'true');
    }, 3000);
}

// ==================== INIT ====================
if (state.speechSynthesis.onvoiceschanged !== undefined) {
    state.speechSynthesis.onvoiceschanged = () => {};
}

document.addEventListener('DOMContentLoaded', () => {
    init();
    loadTranscript();
});