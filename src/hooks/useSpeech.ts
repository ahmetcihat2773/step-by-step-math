import { useState, useCallback, useRef, useEffect } from 'react';

interface UseSpeechReturn {
  // Speech recognition (voice-to-text)
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  speechSupported: boolean;
  
  // Text-to-speech
  isSpeaking: boolean;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  
  // Let's Talk mode
  letsTalkMode: boolean;
  setLetsTalkMode: (enabled: boolean) => void;
}

// Clean text for speech (remove markdown, emojis for cleaner TTS)
function cleanTextForSpeech(text: string): string {
  return text
    // Remove [TOPIC: ...] tags
    .replace(/\[TOPIC:\s*[^\]]+\]/gi, '')
    // Remove markdown bold/italic
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove markdown code blocks
    .replace(/```[^`]*```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Remove markdown headers
    .replace(/#{1,6}\s+/g, '')
    // Remove markdown links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove LaTeX/KaTeX expressions for cleaner speech
    .replace(/\$\$[^$]+\$\$/g, 'mathematical expression')
    .replace(/\$[^$]+\$/g, 'expression')
    // Clean up extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

const MAX_LISTEN_TIME = 30000; // 30 seconds max
const SILENCE_TIMEOUT = 3000; // 3 seconds of silence to auto-stop

export const useSpeech = (): UseSpeechReturn => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [letsTalkMode, setLetsTalkMode] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const maxTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasReceivedSpeechRef = useRef(false);
  const isListeningRef = useRef(false);
  const letsTalkModeRef = useRef(false);

  // Keep refs in sync with state
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    letsTalkModeRef.current = letsTalkMode;
  }, [letsTalkMode]);

  // Check browser support
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition && !!window.speechSynthesis);
  }, []);

  // Track finalized text outside the effect to persist across re-renders
  const finalizedTextRef = useRef('');

  // Initialize speech recognition ONCE
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition && !recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        // Clear silence timeout on any speech
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
        
        let currentInterim = '';

        // Process all results
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          const transcriptText = result[0].transcript;
          
          if (result.isFinal) {
            // Only add to finalized if we haven't processed this result before
            if (i >= event.resultIndex) {
              finalizedTextRef.current += transcriptText + ' ';
              hasReceivedSpeechRef.current = true;
            }
          } else {
            // Interim result - just show current progress, don't accumulate
            currentInterim = transcriptText;
          }
        }

        // Set transcript: finalized text + current interim (replacing, not appending)
        setTranscript(finalizedTextRef.current + currentInterim);
        
        // Start silence timeout after receiving speech
        if (hasReceivedSpeechRef.current) {
          silenceTimeoutRef.current = setTimeout(() => {
            console.log('Silence detected, stopping listening');
            if (recognitionRef.current) {
              try {
                recognitionRef.current.stop();
              } catch (e) {
                console.error('Error stopping recognition:', e);
              }
            }
            setIsListening(false);
          }, SILENCE_TIMEOUT);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        console.log('Recognition ended, isListening:', isListeningRef.current, 'letsTalkMode:', letsTalkModeRef.current);
        // Only auto-restart if we're supposed to be listening and in Let's Talk mode
        // AND no transcript has been collected yet
        if (isListeningRef.current && letsTalkModeRef.current && !hasReceivedSpeechRef.current) {
          try {
            console.log('Restarting recognition...');
            recognition.start();
          } catch (e) {
            console.error('Failed to restart recognition:', e);
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.error('Error aborting recognition:', e);
        }
      }
    };
  }, []); // Empty dependency - only run once

  const clearAllTimeouts = useCallback(() => {
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = null;
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListeningRef.current) {
      setTranscript('');
      finalizedTextRef.current = ''; // Reset finalized text for new session
      hasReceivedSpeechRef.current = false;
      clearAllTimeouts();
      
      try {
        recognitionRef.current.start();
        setIsListening(true);
        console.log('Started listening');
        
        // Set max listening timeout (30 seconds)
        maxTimeoutRef.current = setTimeout(() => {
          console.log('Max listening time reached, stopping');
          if (recognitionRef.current) {
            try {
              recognitionRef.current.stop();
            } catch (e) {
              console.error('Error stopping recognition:', e);
            }
          }
          setIsListening(false);
        }, MAX_LISTEN_TIME);
      } catch (e) {
        console.error('Failed to start recognition:', e);
      }
    }
  }, [clearAllTimeouts]);

  const stopListening = useCallback(() => {
    console.log('Stop listening called');
    clearAllTimeouts();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
    }
    setIsListening(false);
  }, [clearAllTimeouts]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;

    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    const cleanText = cleanTextForSpeech(text);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1;
    
    // Try to find a good English voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => 
      v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural'))
    ) || voices.find(v => v.lang.startsWith('en'));
    
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    speechSupported,
    isSpeaking,
    speak,
    stopSpeaking,
    letsTalkMode,
    setLetsTalkMode,
  };
};
