// AI Service API Client for Next.js

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';
//const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:3000/api/ai-proxy';
const AI_API_KEY = process.env.NEXT_PUBLIC_AI_API_KEY || 'cfcc9bcdce5fd009f84b520144799c0155d37100797fa47fe38b3b2d60fcd8183e28040d000803c4cc423ed9e9b85498cd346ad53f1c36c2ac519c884e3b587c';

class AIClient {
  constructor() {
    this.baseURL = AI_SERVICE_URL;
    this.apiKey = AI_API_KEY;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'X-API-Key': this.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `AI Service Error: ${response.statusText}`);
    }

    return response;
  }

  // ============================================
  // VOICE METHODS
  // ============================================

  /**
   * Transcribe audio to text (Speech-to-Text)
   */
  async transcribe(audioBlob, options = {}) {
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.wav');
    
    if (options.language) {
      formData.append('language', options.language);
    }

    const response = await this.request('/ai/voice/transcribe', {
      method: 'POST',
      body: formData,
    });

    return response.json();
  }

  /**
   * Check for wake word ("Hey Amy")
   */
  async checkWakeWord(audioBlob) {
    const formData = new FormData();
    formData.append('file', audioBlob, 'check.wav');

    const response = await this.request('/ai/voice/wake-word-check', {
      method: 'POST',
      body: formData,
    });

    return response.json();
  }

  /**
   * Full voice conversation with Amy
   */
  async voiceConversation(audioBlob, context = 'general') {
    const formData = new FormData();
    formData.append('file', audioBlob, 'voice.wav');
    formData.append('context', context);

    const response = await this.request('/ai/voice/conversation', {
      method: 'POST',
      body: formData,
    });

    // Response is audio (MP3)
    const audioData = await response.blob();
    const metadata = {
      userInput: response.headers.get('X-User-Input'),
      intent: response.headers.get('X-Intent'),
      amyResponse: response.headers.get('X-Amy-Response'),
    };

    return { audio: audioData, metadata };
  }

  /**
   * Text-to-Speech (Amy speaks)
   */
  async textToSpeech(text, voice = 'nova', speed = 1.0) {
    const response = await this.request('/ai/voice/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, voice, speed }),
    });

    // Returns audio blob
    return response.blob();
  }

  // ============================================
  // INTENT PARSING
  // ============================================

  /**
   * Parse natural language query
   */
  async parseIntent(text, context = 'search') {
    const response = await this.request('/ai/intent/parse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, context }),
    });

    return response.json();
  }

  /**
   * Get autocomplete suggestions
   */
  async getAutocompleteSuggestions(partialText, limit = 5) {
    const response = await this.request('/ai/intent/suggest-autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ partial_text: partialText, limit }),
    });

    return response.json();
  }

  // ============================================
  // MATCHING
  // ============================================

  /**
   * AI-powered musician matching
   */
  async matchMusicians(criteria) {
    const response = await this.request('/ai/matching/musicians', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(criteria),
    });

    return response.json();
  }

  /**
   * Predict booking success
   */
  async predictBookingSuccess(musicianId, eventDetails) {
    const response = await this.request('/ai/matching/predict-booking-success', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        musician_id: musicianId,
        ...eventDetails,
      }),
    });

    return response.json();
  }

  // ============================================
  // PROMO GENERATION
  // ============================================

  /**
   * Generate event promo audio
   */
  async generatePromo(eventDetails, generateAudio = true) {
    const response = await this.request(
      `/ai/promo/generate?generate_audio=${generateAudio}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventDetails),
      }
    );

    return response.json();
  }
}

// Singleton instance
export const aiClient = new AIClient();

// Export class for custom instances
export default AIClient;