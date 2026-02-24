"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, ArrowLeft, Image as ImageIcon, X, Check, CheckCheck, Mic, MicOff, Sparkles, Loader2 } from 'lucide-react';
import { useSocial } from '@/context/SocialContext';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '@/components/Avatar';
import { useMarkMessagesRead } from '@/hooks/useMarkMessagesRead';
import { aiClient } from '@/lib/ai/client';

const AMY_USER_ID = '00000000-0000-0000-0000-000000000001';

export default function ChatWindow({ conversation, onBack }) {
  const { user } = useAuth();
  const { messages, fetchMessages, sendMessage, subscribeToMessages } = useSocial();

  const [messageText, setMessageText] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [amyIsThinking, setAmyIsThinking] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const amyAudioRef = useRef(null);

  const [isMobile, setIsMobile] = useState(false);

  // ✅ Detect if chatting with Amy
  const isAmyChat = conversation?.otherUser?.id === AMY_USER_ID;

  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useMarkMessagesRead(conversation?.otherUser?.id);

  useEffect(() => {
    if (!conversation?.id) return;

    fetchMessages(conversation.id);
    const channel = subscribeToMessages(conversation.id);

    return () => {
      channel?.unsubscribe();
    };
  }, [conversation?.id, fetchMessages, subscribeToMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [messageText]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File must be less than 10MB');
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setError('Only images and videos allowed');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setMediaFile(file);
    setError(null);

    const reader = new FileReader();
    reader.onloadend = () => setMediaPreview(reader.result);
    reader.readAsDataURL(file);
  }, []);

  const removeMedia = useCallback(() => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);
  // ⭐ ADD THIS HELPER FUNCTION AT THE TOP OF YOUR COMPONENT (JAVASCRIPT)
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ============================================
  // AMY AI RESPONSE GENERATION
  // ============================================

  const getAmyResponse = async (userMessage) => {
    try {
      // Parse intent
      const intentResult = await aiClient.parseIntent(userMessage, 'chat');

      let amyResponseText = '';
      const filters = intentResult.filters;

      // Generate contextual response based on intent
      if (intentResult.intent === 'search_gigs') {
        const genre = filters.genre || 'musicians';
        const location = filters.location || 'your area';
        const budget = filters.budget_max ? `under ₦${filters.budget_max.toLocaleString()}` : '';

        amyResponseText = `I found ${genre} in ${location} ${budget}! Here are the top matches:\n\n`;

        // TODO: Actually fetch musicians from database
        // For now, placeholder:
        amyResponseText += `🎵 3 verified ${genre} available\n`;
        amyResponseText += `💰 Rates starting from ₦50,000\n`;
        amyResponseText += `⭐ Average rating: 4.8/5\n\n`;
        amyResponseText += `Would you like me to show you their profiles?`;

      } else if (intentResult.intent === 'book_musician') {
        amyResponseText = `I can help you book a ${filters.genre || 'musician'} for your ${filters.event_type || 'event'}!\n\n`;
        amyResponseText += `Here's what I need:\n`;
        amyResponseText += `📅 Date & time\n`;
        amyResponseText += `📍 Venue location\n`;
        amyResponseText += `💰 Your budget\n`;
        amyResponseText += `🎵 Music genre preference\n\n`;
        amyResponseText += `Can you provide these details?`;

      } else if (intentResult.intent === 'create_event') {
        amyResponseText = `Exciting! Let's create your event. 🎉\n\n`;
        amyResponseText += `I'll guide you through:\n`;
        amyResponseText += `1️⃣ Event details (name, date, venue)\n`;
        amyResponseText += `2️⃣ Ticket tiers and pricing\n`;
        amyResponseText += `3️⃣ Artist lineup\n\n`;
        amyResponseText += `Ready to start? Tell me about your event!`;

      } else {
        // General assistance
        amyResponseText = `I'm here to help! I can assist with:\n\n`;
        amyResponseText += `🎵 Finding musicians for your events\n`;
        amyResponseText += `🎤 Booking gigs and artists\n`;
        amyResponseText += `🎉 Creating and managing events\n`;
        amyResponseText += `💬 Answering questions about AmplyGigs\n\n`;
        amyResponseText += `What would you like to do?`;
      }

      return amyResponseText;

    } catch (error) {
      console.error('Amy response generation error:', error);
      return "I'm having a bit of trouble right now, but I'm here to help! Could you try asking again? 😊";
    }
  };

  // ============================================
  // VOICE RECORDING
  // ============================================

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await handleVoiceMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Recording error:', error);
      setError('Could not access microphone');
      setTimeout(() => setError(null), 3000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleVoiceMessage = async (audioBlob) => {
    setSending(true);
    setError(null);

    try {
      if (isAmyChat) {
        // ✅ AMY MODE: Transcribe and respond with AI
        setAmyIsThinking(true);

        // Transcribe
        const transcription = await aiClient.transcribe(audioBlob);

        // Send user's transcribed message
        await sendMessage(conversation.id, `🎤 ${transcription.text}`, null);

        // Get Amy's response
        const amyResponseText = await getAmyResponse(transcription.text);

        // Send Amy's text response
        await sendMessage(conversation.id, amyResponseText, null);

        // Convert to speech and play
        const audioResponse = await aiClient.textToSpeech(amyResponseText, 'nova', 1.0);
        const audioURL = URL.createObjectURL(audioResponse);

        if (amyAudioRef.current) {
          amyAudioRef.current.src = audioURL;
          amyAudioRef.current.play();
        }

        setAmyIsThinking(false);

      } else {
        // ✅ REGULAR MODE: Just send voice message
        const audioFile = new File([audioBlob], 'voice.wav', { type: 'audio/wav' });
        await sendMessage(conversation.id, '🎤 Voice message', audioFile);
      }

      scrollToBottom();

    } catch (err) {
      setError(err.message || 'Failed to send voice message');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSending(false);
      setAmyIsThinking(false);
    }
  };

  // ============================================
  // TEXT MESSAGE SENDING
  // ============================================

  const handleSend = useCallback(async (e) => {
    e?.preventDefault();

    const trimmedText = messageText.trim();
    if (!trimmedText && !mediaFile) return;
    if (sending) return;

    setSending(true);
    setError(null);

    try {
      // Send user's message
      const result = await sendMessage(conversation.id, trimmedText, mediaFile);

      if (result.error) {
        throw new Error(result.error.message || 'Failed to send');
      }

      setMessageText('');
      removeMedia();

      // ✅ If chatting with Amy, get AI response
      if (isAmyChat && trimmedText) {
        setAmyIsThinking(true);

        try {
          const amyResponseText = await getAmyResponse(trimmedText);

          // Send Amy's response
          await sendMessage(conversation.id, amyResponseText, null);

          // Convert to speech and play
          const audioBlob = await aiClient.textToSpeech(amyResponseText, 'nova', 1.0);
          const audioURL = URL.createObjectURL(audioBlob);

          if (amyAudioRef.current) {
            amyAudioRef.current.src = audioURL;
            amyAudioRef.current.play();
          }

        } catch (amyError) {
          console.error('Amy response error:', amyError);
        } finally {
          setAmyIsThinking(false);
        }
      }

      setTimeout(() => {
        textareaRef.current?.focus();
        scrollToBottom();
      }, 100);

    } catch (err) {
      setError(err.message || 'Failed to send');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSending(false);
    }
  }, [messageText, mediaFile, sending, conversation?.id, sendMessage, removeMedia, scrollToBottom, isAmyChat]);

  const handleKeyDown = useCallback((e) => {
    if (isMobile) {
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  }, [handleSend, isMobile]);

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-6">
          <div className="w-20 h-20 mx-auto mb-4 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Select a conversation
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose a chat to start messaging
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-white dark:bg-gray-900">

      {/* HEADER */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-10">
        <button
          onClick={onBack}
          className="lg:hidden -ml-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors active:scale-95"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>

        {/* ✅ Special Amy Avatar */}
        {isAmyChat ? (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        ) : (
          <Avatar
            user={conversation.otherUser}
            size="sm"
            className="flex-shrink-0"
          />
        )}

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-900 dark:text-white truncate">
            {isAmyChat ? (
              <span className="flex items-center gap-2">
                Amy - AI Assistant
                <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
                  Online
                </span>
              </span>
            ) : (
              `${conversation.otherUser?.first_name} ${conversation.otherUser?.last_name}`
            )}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isAmyChat
              ? 'Your AI assistant • Powered by OpenAI'
              : conversation.otherUser?.role?.toLowerCase() || 'User'}
          </p>
        </div>

        {/* Amy Thinking Indicator */}
        {amyIsThinking && (
          <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/20 rounded-full">
            <Loader2 className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-spin" />
            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">Thinking...</span>
          </div>
        )}
      </div>

      {/* MESSAGES */}
      <div
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-gray-950"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >
        <div className="px-4 py-4 space-y-4 min-h-full flex flex-col">
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center px-4">
                <div className="w-16 h-16 mx-auto mb-3 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                  {isAmyChat ? (
                    <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  ) : (
                    <Send className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {isAmyChat
                    ? "👋 Hi! I'm Amy, your AI assistant"
                    : 'No messages yet. Say hi! 👋'}
                </p>
                {isAmyChat && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Try: "Find Afrobeat DJs in Lagos"
                  </p>
                )}
              </div>
            </div>
          ) : (
            <>

              {/* MESSAGES SECTION - UPDATE THIS PART */}
              {messages.map((message) => {
                const isOwn = message.sender_id === user?.id;
                const isFromAmy = message.sender_id === AMY_USER_ID;

                return (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Avatar */}
                    {!isOwn && (
                      isFromAmy ? (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0 mt-auto">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                      ) : (
                        <Avatar
                          user={message.sender || conversation.otherUser}
                          size="xs"
                          className="flex-shrink-0 mt-auto"
                        />
                      )
                    )}

                    <div className={`flex flex-col max-w-[75%] sm:max-w-[60%] ${isOwn ? 'items-end' : 'items-start'}`}>

                      {/* ⭐ MEDIA HANDLING - FIXED FOR MOBILE */}
                      {message.media_url && (
                        <div className="mb-1 rounded-2xl overflow-hidden shadow-md">
                          {message.media_type === 'image' ? (
                            <img
                              src={message.media_url}
                              alt="Shared"
                              className="max-w-full max-h-60 rounded-2xl cursor-pointer active:opacity-90"
                              onClick={() => window.open(message.media_url, '_blank')}
                            />
                          ) : message.media_type === 'video' ? (
                            <video
                              src={message.media_url}
                              controls
                              playsInline
                              className="max-w-full max-h-60 rounded-2xl"
                            />
                          ) : message.media_type === 'audio' ? (
                            // ⭐ VOICE MESSAGE BUBBLE - MOBILE OPTIMIZED
                            <div className={`
                px-3 py-3 rounded-2xl shadow-sm min-w-[200px] max-w-[280px]
                ${isFromAmy
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                                : isOwn
                                  ? 'bg-purple-600'
                                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                              }
              `}>
                              {/* Voice Message Label */}
                              <div className="flex items-center gap-2 mb-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isOwn || isFromAmy
                                    ? 'bg-white/20'
                                    : 'bg-purple-100 dark:bg-purple-900/30'
                                  }`}>
                                  <Mic className={`w-4 h-4 ${isOwn || isFromAmy
                                      ? 'text-white'
                                      : 'text-purple-600 dark:text-purple-400'
                                    }`} />
                                </div>
                                <span className={`text-xs font-medium ${isOwn || isFromAmy
                                    ? 'text-white'
                                    : 'text-gray-700 dark:text-gray-300'
                                  }`}>
                                  Voice Message
                                </span>
                              </div>

                              {/* ⭐ MOBILE-OPTIMIZED AUDIO PLAYER */}
                              <audio
                                src={message.media_url}
                                controls
                                controlsList="nodownload noplaybackrate"
                                preload="metadata"
                                className="w-full h-10"
                                style={{
                                  // Force native controls to show properly on mobile
                                  width: '100%',
                                  height: '40px',
                                  borderRadius: '8px',
                                }}
                              />

                              {/* Duration Indicator (if available) */}
                              {message.media_duration && (
                                <div className={`text-xs mt-1 ${isOwn || isFromAmy
                                    ? 'text-white/80'
                                    : 'text-gray-500 dark:text-gray-400'
                                  }`}>
                                  {formatDuration(message.media_duration)}
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      )}

                      {/* Text Content */}
                      {message.content && (
                        <div
                          className={`px-4 py-2 rounded-2xl shadow-sm ${isFromAmy
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-bl-md border-2 border-purple-300'
                              : isOwn
                                ? 'bg-purple-600 text-white rounded-br-md'
                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md border border-gray-200 dark:border-gray-700'
                            }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        </div>
                      )}

                      {/* Timestamp & Read Status */}
                      <div className="flex items-center gap-1 mt-1 px-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </span>
                        {isOwn && (
                          message.read ? (
                            <CheckCheck className="w-3 h-3 text-purple-600" />
                          ) : (
                            <Check className="w-3 h-3 text-gray-400" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="flex-shrink-0 px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2">
            <span className="flex-1 text-xs text-red-800 dark:text-red-200">
              {error}
            </span>
            <button
              onClick={() => setError(null)}
              className="text-red-600 dark:text-red-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* RECORDING INDICATOR */}
      {isRecording && (
        <div className="flex-shrink-0 px-4 py-3 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm text-red-700 dark:text-red-300">
                {isAmyChat ? 'Recording for Amy...' : 'Recording voice message...'}
              </span>
            </div>
            <button
              onClick={stopRecording}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 active:scale-95"
            >
              Stop & Send
            </button>
          </div>
        </div>
      )}

      {/* INPUT */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg">
        {mediaPreview && (
          <div className="mb-3 relative inline-block">
            <div className="relative">
              <img
                src={mediaPreview}
                alt="Preview"
                className="w-20 h-20 rounded-lg object-cover border-2 border-purple-200 dark:border-purple-800"
              />
              <button
                type="button"
                onClick={removeMedia}
                className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-lg active:scale-95"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending || isRecording || amyIsThinking}
            className="flex-shrink-0 p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors active:scale-95 disabled:opacity-50"
          >
            <ImageIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={sending || amyIsThinking}
            className={`flex-shrink-0 p-2.5 rounded-full transition-colors active:scale-95 disabled:opacity-50 ${isRecording
                ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 animate-pulse'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
          >
            {isRecording ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>

          <textarea
            ref={textareaRef}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              amyIsThinking
                ? "Amy is thinking..."
                : isAmyChat
                  ? "Ask Amy anything..."
                  : isMobile
                    ? "Type a message..."
                    : "Type a message... (Enter to send)"
            }
            disabled={sending || isRecording || amyIsThinking}
            maxLength={1000}
            rows={1}
            className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-2xl text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 resize-none overflow-y-auto"
            style={{ maxHeight: '120px' }}
          />

          <button
            type="submit"
            disabled={(!messageText.trim() && !mediaFile) || sending || isRecording || amyIsThinking}
            className="flex-shrink-0 p-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

        {isAmyChat && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            💡 Amy can help you find musicians, book gigs, or create events
          </p>
        )}
      </div>

      {/* Hidden audio player for Amy's voice */}
      <audio ref={amyAudioRef} className="hidden" />
    </div>
  );
}