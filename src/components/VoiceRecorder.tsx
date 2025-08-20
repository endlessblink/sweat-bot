import React, { useState, useRef } from 'react';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  userId: string;
}

export function VoiceRecorder({ onTranscription, userId }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        
        // Send to Python backend for Whisper processing
        const formData = new FormData();
        formData.append('audio', audioBlob);
        formData.append('userId', userId);
        
        try {
          const response = await fetch('http://localhost:8000/api/voice/transcribe', {
            method: 'POST',
            body: formData,
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.text && data.text.trim()) {
              onTranscription(data.text.trim());
            } else {
              console.error('No transcription text received');
              alert('לא הצלחתי להבין את מה שאמרת. אנא נסה שוב.');
            }
          } else {
            console.error('Transcription failed:', response.status);
            alert('שגיאה בעיבוד הקול. אנא נסה שוב.');
          }
        } catch (error) {
          console.error('Error transcribing:', error);
          alert('שגיאה בחיבור לשרת. אנא בדוק שהשרת פועל.');
        } finally {
          setIsProcessing(false);
        }
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('לא ניתן לגשת למיקרופון. אנא בדוק הרשאות.');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`
          px-6 py-3 rounded-full font-medium transition-all
          ${isRecording 
            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'
          }
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {isProcessing ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin">⏳</span>
            מעבד...
          </span>
        ) : isRecording ? (
          <span className="flex items-center gap-2">
            <span className="text-xl">🔴</span>
            עצור הקלטה
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <span className="text-xl">🎤</span>
            התחל הקלטה
          </span>
        )}
      </button>
      
      {isRecording && (
        <div className="text-sm text-gray-600">
          מקליט... דבר עכשיו
        </div>
      )}
    </div>
  );
}