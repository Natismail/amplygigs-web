"use client";

import { useState, useRef, useEffect } from 'react';
import { Mic, X, Sparkles, Loader2, MicOff } from 'lucide-react';
import { aiClient } from '@/lib/ai/client';
import { useRouter } from 'next/navigation';

export default function GlobalAmyAssistant() {
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [amyResponse, setAmyResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const amyAudioRef = useRef(null);
  const wakeWordTimerRef = useRef(null);

  // Continuous wake word listening
  useEffect(() => {
    const startWakeWordListening = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const recorder = new MediaRecorder(stream);
        const chunks = [];

        recorder.ondataavailable = (event) => {
          chunks.push(event.data);
        };

        recorder.onstop = async () => {
          const audioBlob = new Blob(chunks, { type: 'audio/wav' });
          
          try {
            // Quick wake word check
            const result = await aiClient.checkWakeWord(audioBlob);
            
            if (result.wake_word_detected) {
              // Wake word detected! Activate Amy
              setIsActive(true);
              setTranscript('');
              setAmyResponse('');
              
              // Play activation sound (optional)
              playActivationSound();
              
              // Start full listening
              startFullListening();
            }
          } catch (error) {
            console.error('Wake word check error:', error);
          }
          
          // Continue listening for wake word
          chunks.length = 0;
          if (!isActive) {
            recorder.start();
            setTimeout(() => recorder.stop(), 3000); // Check every 3 seconds
          }
        };

        // Start initial recording
        recorder.start();
        setTimeout(() => recorder.stop(), 3000);
        
        return () => {
          stream.getTracks().forEach(track => track.stop());
        };
        
      } catch (error) {
        console.error('Microphone access error:', error);
      }
    };

    // Uncomment to enable always-on listening
    // startWakeWordListening();
    
    // For now, require manual activation to save battery
  }, [isActive]);

  const playActivationSound = () => {
    // Play a pleasant "ding" sound
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuL0fPTgjMGHm7A7+OZSA0PUqbl8Lh');
    audio.play().catch(() => {});
  };

  const startFullListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processVoiceCommand(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.error('Listening error:', error);
      setIsActive(false);
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  const processVoiceCommand = async (audioBlob) => {
    setIsProcessing(true);

    try {
      // Full conversation with Amy
      const result = await aiClient.voiceConversation(audioBlob, 'global');

      setTranscript(result.metadata.userInput || '');
      setAmyResponse(result.metadata.amyResponse || '');

      // Play Amy's audio response
      if (result.audio && amyAudioRef.current) {
        const audioURL = URL.createObjectURL(result.audio);
        amyAudioRef.current.src = audioURL;
        amyAudioRef.current.play();
      }

      // Execute action based on intent
      const intent = result.metadata.intent;
      
      if (intent === 'search_gigs') {
        // Parse and navigate to search
        const intentData = await aiClient.parseIntent(result.metadata.userInput);
        const query = new URLSearchParams({
          genre: intentData.filters.genre || '',
          location: intentData.filters.location || '',
          budget: intentData.filters.budget_max || '',
        }).toString();
        
        // Navigate after 2 seconds (let Amy finish speaking)
        setTimeout(() => {
          router.push(`/search?${query}`);
          closeAssistant();
        }, 2000);
        
      } else if (intent === 'create_event') {
        setTimeout(() => {
          router.push('/events/create');
          closeAssistant();
        }, 2000);
        
      } else if (intent === 'book_musician') {
        setTimeout(() => {
          router.push('/musicians');
          closeAssistant();
        }, 2000);
      }

    } catch (error) {
      console.error('Voice processing error:', error);
      setAmyResponse('Sorry, I had trouble understanding that. Could you try again?');
    } finally {
      setIsProcessing(false);
    }
  };

  const closeAssistant = () => {
    setIsActive(false);
    setIsListening(false);
    setTranscript('');
    setAmyResponse('');
    
    // Stop any playing audio
    if (amyAudioRef.current) {
      amyAudioRef.current.pause();
      amyAudioRef.current.currentTime = 0;
    }
  };

  // Manual activation button (floating action button)
  return (
    <>
      {/* Floating Amy Button (Bottom Right) */}
      {!isActive && (
        <button
          onClick={() => setIsActive(true)}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform group"
          aria-label="Activate Amy"
        >
          <Sparkles className="w-8 h-8 text-white group-hover:animate-pulse" />
          
          {/* Pulsing ring */}
          <span className="absolute inset-0 rounded-full bg-purple-400 opacity-75 animate-ping" />
        </button>
      )}

      {/* Amy Assistant Modal */}
      {isActive && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            {/* Close Button */}
            <button
              onClick={closeAssistant}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Amy Header */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Hi, I'm Amy!
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your AmplyGigs AI Assistant
              </p>
            </div>

            {/* Voice Visualizer */}
            <div className="mb-6">
              <button
                onClick={isListening ? stopListening : startFullListening}
                disabled={isProcessing}
                className={`
                  relative w-32 h-32 mx-auto rounded-full flex items-center justify-center
                  transition-all duration-300 shadow-lg
                  ${isListening 
                    ? 'bg-red-500 animate-pulse scale-110' 
                    : 'bg-purple-600 hover:bg-purple-700'
                  }
                  ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {isProcessing ? (
                  <Loader2 className="w-16 h-16 text-white animate-spin" />
                ) : isListening ? (
                  <MicOff className="w-16 h-16 text-white" />
                ) : (
                  <Mic className="w-16 h-16 text-white" />
                )}

                {/* Pulsing rings when listening */}
                {isListening && (
                  <>
                    <span className="absolute inset-0 rounded-full bg-red-400 opacity-75 animate-ping" />
                    <span className="absolute inset-0 rounded-full bg-red-300 opacity-50 animate-pulse" />
                  </>
                )}
              </button>

              <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
                {isProcessing 
                  ? 'Amy is thinking...' 
                  : isListening 
                  ? 'Listening...' 
                  : 'Tap to start speaking'}
              </p>
            </div>

            {/* Transcript */}
            {transcript && (
              <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">You said:</p>
                <p className="text-sm text-gray-900 dark:text-white">{transcript}</p>
              </div>
            )}

            {/* Amy's Response */}
            {amyResponse && (
              <div className="mb-4 p-4 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">Amy:</p>
                <p className="text-sm text-purple-900 dark:text-purple-100">{amyResponse}</p>
              </div>
            )}

            {/* Suggestions */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Try saying:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setTranscript('"Find Afrobeat musicians in Lagos"');
                    // Auto-process this
                  }}
                  className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  "Find musicians in Lagos"
                </button>
                <button
                  onClick={() => {
                    setTranscript('"Create an event"');
                  }}
                  className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  "Create an event"
                </button>
                <button
                  onClick={() => {
                    setTranscript('"Book a DJ"');
                  }}
                  className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  "Book a DJ"
                </button>
              </div>
            </div>
          </div>

          {/* Hidden audio player */}
          <audio ref={amyAudioRef} className="hidden" />
        </div>
      )}
    </>
  );
}