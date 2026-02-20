//src/components/amy/VoiceSearch.jsx

"use client";

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { aiClient } from '@/lib/ai/client';

export default function VoiceSearch({ onSearchResults }) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [amyResponse, setAmyResponse] = useState(null);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioPlayerRef = useRef(null);

  const startListening = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processVoiceInput(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsListening(true);
      setWakeWordDetected(false);

    } catch (error) {
      console.error('Microphone access error:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  const processVoiceInput = async (audioBlob) => {
    setIsProcessing(true);

    try {
      // Full conversation with Amy
      const result = await aiClient.voiceConversation(audioBlob, 'search');

      // Set transcript
      setTranscript(result.metadata.userInput || '');
      setAmyResponse(result.metadata.amyResponse || '');

      // Play Amy's audio response
      if (result.audio) {
        const audioURL = URL.createObjectURL(result.audio);
        audioPlayerRef.current.src = audioURL;
        audioPlayerRef.current.play();
      }

      // Parse intent and execute search
      if (result.metadata.intent === 'search_gigs') {
        const intentData = await aiClient.parseIntent(result.metadata.userInput);
        
        // Call parent component's search handler
        if (onSearchResults) {
          onSearchResults(intentData.filters);
        }
      }

      setWakeWordDetected(true);

    } catch (error) {
      console.error('Voice processing error:', error);
      setAmyResponse('Sorry, I had trouble understanding that. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      {/* Voice Button */}
      <button
        onClick={isListening ? stopListening : startListening}
        disabled={isProcessing}
        className={`
          relative w-24 h-24 rounded-full flex items-center justify-center
          transition-all duration-300 shadow-lg
          ${isListening 
            ? 'bg-red-500 animate-pulse' 
            : 'bg-purple-600 hover:bg-purple-700'
          }
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {isProcessing ? (
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        ) : isListening ? (
          <MicOff className="w-10 h-10 text-white" />
        ) : (
          <Mic className="w-10 h-10 text-white" />
        )}

        {/* Pulsing ring when listening */}
        {isListening && (
          <span className="absolute inset-0 rounded-full bg-red-400 opacity-75 animate-ping" />
        )}
      </button>

      {/* Status Text */}
      <div className="text-center">
        <p className="text-lg font-medium text-gray-900 dark:text-white">
          {isProcessing 
            ? 'Amy is thinking...' 
            : isListening 
            ? 'Listening... (say "Hey Amy")' 
            : 'Tap to talk to Amy'}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Try: "Hey Amy, find Afrobeat gigs in Lagos"
        </p>
      </div>

      {/* Transcript */}
      {transcript && (
        <div className="w-full max-w-md bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">You said:</p>
          <p className="text-gray-900 dark:text-white">{transcript}</p>
        </div>
      )}

      {/* Amy's Response */}
      {amyResponse && (
        <div className="w-full max-w-md bg-purple-100 dark:bg-purple-900/20 rounded-lg p-4">
          <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">Amy:</p>
          <p className="text-purple-900 dark:text-purple-100">{amyResponse}</p>
        </div>
      )}

      {/* Hidden audio player for Amy's voice */}
      <audio ref={audioPlayerRef} className="hidden" />
    </div>
  );
}