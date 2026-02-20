// src/components/ai/AmyAssistant.jsx (Complete)

"use client";

import { useState, useRef } from 'react';
import { Mic, X, Sparkles, Loader2, MicOff, Send } from 'lucide-react';
import { aiClient } from '@/lib/ai/client';
import { useRouter } from 'next/navigation';

export default function AmyAssistant({ onClose }) {
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [amyResponse, setAmyResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [textInput, setTextInput] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const amyAudioRef = useRef(null);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processVoice(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.error('Microphone error:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  const processVoice = async (audioBlob) => {
    setIsProcessing(true);

    try {
      // Transcribe audio
      const transcription = await aiClient.transcribe(audioBlob);
      setTranscript(transcription.text);

      // Process the query
      await processQuery(transcription.text);

    } catch (error) {
      console.error('Voice processing error:', error);
      setAmyResponse('Sorry, I had trouble understanding that. Could you try again?');
    } finally {
      setIsProcessing(false);
    }
  };


//   //Free

//    const processVoice = async (audioBlob) => {
//   setIsProcessing(true);

//   try {
//     // ✅ Use FREE browser speech recognition instead of OpenAI
//     const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
//     recognition.lang = 'en-US';
//     recognition.interimResults = false;
    
//     recognition.onresult = async (event) => {
//       const transcript = event.results[0][0].transcript;
//       setTranscript(transcript);
//       await processQuery(transcript);
//     };
    
//     recognition.onerror = (event) => {
//       console.error('Speech recognition error:', event.error);
//       setAmyResponse('Sorry, I had trouble hearing that. Try typing instead!');
//     };
    
//     // Start recognition
//     const audioURL = URL.createObjectURL(audioBlob);
//     const audio = new Audio(audioURL);
//     audio.play();
//     recognition.start();

//   } catch (error) {
//     console.error('Voice processing error:', error);
//     setAmyResponse('Voice recognition not supported. Please type your question.');
//   } finally {
//     setIsProcessing(false);
//   }
// };

  const processText = async () => {
    if (!textInput.trim()) return;

    setIsProcessing(true);
    setTranscript(textInput);

    try {
      await processQuery(textInput);
    } catch (error) {
      console.error('Text processing error:', error);
      setAmyResponse('Sorry, I encountered an error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const processQuery = async (query) => {
    try {
      // Parse intent
      const intentResult = await aiClient.parseIntent(query, 'quick');

      // Generate response based on intent
      let response = '';
      const filters = intentResult.filters;

      if (intentResult.intent === 'search_gigs') {
        const genre = filters.genre || 'musicians';
        const location = filters.location || 'your area';
        
        response = `Found ${genre} in ${location}! Let me show you the results.`;
        
        // Navigate to search
        setTimeout(() => {
          const searchParams = new URLSearchParams({
            genre: filters.genre || '',
            location: filters.location || '',
            budget: filters.budget_max || '',
          }).toString();
          
          router.push(`/musicians?${searchParams}`);
          onClose();
        }, 2000);
        
      } else if (intentResult.intent === 'book_musician') {
        response = `I'll help you book a ${filters.genre || 'musician'}! Opening booking page...`;
        
        setTimeout(() => {
          router.push('/musicians');
          onClose();
        }, 2000);
        
      } else if (intentResult.intent === 'create_event') {
        response = `Let's create your event! Opening event creation page...`;
        
        setTimeout(() => {
          router.push('/musician/my-events?action=create');
          onClose();
        }, 2000);
        
      } else {
        response = `I can help you:\n🎵 Find musicians\n🎤 Book gigs\n🎉 Create events\n\nWhat would you like to do?`;
      }

      setAmyResponse(response);

      // Text-to-speech
      const audioBlob = await aiClient.textToSpeech(response, 'nova', 1.0);
      const audioURL = URL.createObjectURL(audioBlob);
      
      if (amyAudioRef.current) {
        amyAudioRef.current.src = audioURL;
        amyAudioRef.current.play();
      }

    } catch (error) {
      console.error('Query processing error:', error);
      setAmyResponse('I can help with finding musicians, booking gigs, or creating events. What do you need?');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      processText();
    }
  };

  const handleQuickAction = async (action) => {
    setTextInput(action);
    setTranscript(action);
    await processQuery(action);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 relative animate-in slide-in-from-bottom duration-300">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Amy Header */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Quick Assist
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Ask me anything, get instant help
          </p>
        </div>

        {/* Voice Button */}
        <div className="mb-6 flex justify-center">
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={isProcessing}
            className={`
              relative w-32 h-32 rounded-full flex items-center justify-center
              transition-all duration-300 shadow-lg
              ${isListening 
                ? 'bg-red-500 animate-pulse scale-110' 
                : 'bg-gradient-to-br from-purple-600 to-pink-600 hover:scale-105'
              }
              ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
            `}
          >
            {isProcessing ? (
              <Loader2 className="w-16 h-16 text-white animate-spin" />
            ) : isListening ? (
              <MicOff className="w-16 h-16 text-white" />
            ) : (
              <Mic className="w-16 h-16 text-white" />
            )}

            {isListening && (
              <>
                <span className="absolute inset-0 rounded-full bg-red-400 opacity-75 animate-ping" />
                <span className="absolute inset-0 rounded-full bg-red-300 opacity-50 animate-pulse" />
              </>
            )}
          </button>
        </div>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-6">
          {isProcessing 
            ? '🤔 Thinking...' 
            : isListening 
            ? '🎤 Listening...' 
            : '💬 Tap mic or type below'}
        </p>

        {/* Text Input Alternative */}
        <div className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Or type your question here..."
              disabled={isProcessing || isListening}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 transition"
            />
            <button
              onClick={processText}
              disabled={!textInput.trim() || isProcessing || isListening}
              className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Transcript */}
        {transcript && (
          <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">You:</p>
            <p className="text-sm text-gray-900 dark:text-white">{transcript}</p>
          </div>
        )}

        {/* Amy's Response */}
        {amyResponse && (
          <div className="mb-4 p-4 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold">Amy:</p>
            </div>
            <p className="text-sm text-purple-900 dark:text-purple-100 whitespace-pre-wrap">{amyResponse}</p>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-medium">💡 Quick Actions:</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { text: "Find Afrobeat DJs in Lagos", icon: "🎵" },
              { text: "Book a live band", icon: "🎤" },
              { text: "Create a new event", icon: "🎉" },
              { text: "Show available gigs", icon: "📅" }
            ].map((action, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickAction(action.text)}
                disabled={isProcessing || isListening}
                className="px-3 py-3 text-left bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 transition disabled:opacity-50 border border-gray-200 dark:border-gray-700 group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg group-hover:scale-110 transition-transform">{action.icon}</span>
                  <span className="text-xs font-medium line-clamp-2">{action.text}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Redirect */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={() => {
              router.push('/messages');
              onClose();
            }}
            className="w-full text-center text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition"
          >
            💬 Or chat with Amy in Messages for detailed help
          </button>
        </div>

        {/* Hidden audio player */}
        <audio ref={amyAudioRef} className="hidden" />
      </div>
    </div>
  );
}