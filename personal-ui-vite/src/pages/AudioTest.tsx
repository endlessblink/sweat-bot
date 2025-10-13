import React, { useState } from 'react';

/**
 * Simple Audio Recording Test Page
 * Tests microphone permissions and audio blob creation
 */
export default function AudioTest() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  const sendLogToBackend = async (message: string, data?: any) => {
    try {
      await fetch('http://localhost:8000/api/v1/stt/debug-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level: 'info',
          message,
          data,
          source: 'audio-test-page',
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to send log to backend:', error);
    }
  };

  const startRecording = async () => {
    addLog('🎤 Starting audio recording test...');
    sendLogToBackend('🎤 Starting audio recording test');

    try {
      // Check microphone support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const error = 'Microphone API not supported';
        addLog(`❌ ${error}`);
        sendLogToBackend(error);
        return;
      }

      addLog('✅ Microphone API supported');
      sendLogToBackend('✅ Microphone API supported');

      // Request microphone access
      addLog('🔐 Requesting microphone permission...');
      sendLogToBackend('🔐 Requesting microphone permission...');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      addLog('✅ Microphone permission granted');
      sendLogToBackend('✅ Microphone permission granted');

      // Check supported codecs
      const supportedTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/wav',
      ];

      let mimeType = 'audio/webm';
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          addLog(`🎵 Using codec: ${type}`);
          sendLogToBackend('🎵 Using codec', { codec: type });
          break;
        }
      }

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
          addLog(`📊 Audio chunk received: ${event.data.size} bytes`);
          sendLogToBackend('📊 Audio chunk received', { size: event.data.size });
        } else {
          addLog('⚠️ Empty audio chunk received');
          sendLogToBackend('⚠️ Empty audio chunk received');
        }
      };

      mediaRecorder.onstart = () => {
        addLog('🔴 Recording started');
        sendLogToBackend('🔴 Recording started');
        setIsRecording(true);
      };

      mediaRecorder.onstop = () => {
        addLog('⏹️ Recording stopped');
        sendLogToBackend('⏹️ Recording stopped');
        setIsRecording(false);

        // Create final blob
        const finalBlob = new Blob(audioChunks, { type: mimeType });
        addLog(`📦 Final audio blob: ${finalBlob.size} bytes, type: ${finalBlob.type}`);
        sendLogToBackend('📦 Final audio blob created', {
          size: finalBlob.size,
          type: finalBlob.type,
          chunks: audioChunks.length,
        });

        setAudioBlob(finalBlob);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.onerror = (event) => {
        addLog(`❌ MediaRecorder error: ${event}`);
        sendLogToBackend('❌ MediaRecorder error', { error: String(event) });
        setIsRecording(false);
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      addLog('⏱️ MediaRecorder started (100ms intervals)');
      sendLogToBackend('⏱️ MediaRecorder started', { interval: 100 });

      // Auto-stop after 3 seconds for testing
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 3000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`❌ Recording failed: ${errorMessage}`);
      sendLogToBackend('❌ Recording failed', { error: errorMessage });
    }
  };

  const testTranscription = async () => {
    if (!audioBlob) {
      addLog('⚠️ No audio blob to test');
      return;
    }

    addLog('🧪 Testing transcription with recorded audio...');
    sendLogToBackend('🧪 Testing transcription with recorded audio');

    const formData = new FormData();
    formData.append('file', audioBlob, `test.${audioBlob.type.split('/')[1]}`);
    formData.append('language', 'he');
    formData.append('model', 'whisper-large-v3');
    formData.append('temperature', 0);
    formData.append('prompt', 'תרגילים: סקוואטים, שכיבות סמיכה');

    try {
      const response = await fetch('http://localhost:8000/api/v1/stt/transcribe', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        addLog(`✅ Transcription successful: "${result.text}"`);
        sendLogToBackend('✅ Transcription successful', {
          text: result.text,
          language: result.language,
          duration: result.duration
        });
      } else {
        addLog(`❌ Transcription failed: ${result.detail}`);
        sendLogToBackend('❌ Transcription failed', { error: result.detail });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`❌ Transcription error: ${errorMessage}`);
      sendLogToBackend('❌ Transcription error', { error: errorMessage });
    }
  };

  const clearLogs = () => {
    setLogs([]);
    sendLogToBackend('🗑️ Logs cleared');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>🎤 Audio Recording Test</h1>
      <p>This page tests microphone access and audio recording on your device.</p>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={startRecording}
          disabled={isRecording}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: isRecording ? '#ff6b6b' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isRecording ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {isRecording ? '⏺️ Recording...' : '🎤 Start Recording (3s)'}
        </button>

        <button
          onClick={testTranscription}
          disabled={!audioBlob}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: audioBlob ? '#2196F3' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: audioBlob ? 'pointer' : 'not-allowed',
            marginRight: '10px'
          }}
        >
          🧪 Test Transcription
        </button>

        <button
          onClick={clearLogs}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🗑️ Clear Logs
        </button>
      </div>

      {audioBlob && (
        <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
          <strong>📦 Audio Blob Created:</strong>
          <br />Size: {audioBlob.size} bytes
          <br />Type: {audioBlob.type}
        </div>
      )}

      <div style={{
        backgroundColor: '#1e1e1e',
        color: '#00ff00',
        padding: '15px',
        borderRadius: '5px',
        fontFamily: 'monospace',
        fontSize: '12px',
        maxHeight: '400px',
        overflowY: 'auto',
        whiteSpace: 'pre-wrap'
      }}>
        {logs.length === 0 ? 'No logs yet. Click "Start Recording" to begin testing.' : logs.join('\n')}
      </div>

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '5px' }}>
        <strong>📱 Device Info:</strong>
        <br />User Agent: {navigator.userAgent}
        <br />Touch Support: {'ontouchstart' in window ? 'Yes' : 'No'}
        <br />Mobile: {/Mobile|Android|iPhone/.test(navigator.userAgent) ? 'Yes' : 'No'}
      </div>
    </div>
  );
}