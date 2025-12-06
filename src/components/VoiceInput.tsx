import { Mic, MicOff, Volume2, VolumeX, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoiceInputProps {
  isListening: boolean;
  isSpeaking: boolean;
  letsTalkMode: boolean;
  speechSupported: boolean;
  transcript: string;
  onStartListening: () => void;
  onStopListening: () => void;
  onStopSpeaking: () => void;
  onToggleLetsTalk: () => void;
  onSubmitVoice: () => void;
  disabled?: boolean;
}

export const VoiceInput = ({
  isListening,
  isSpeaking,
  letsTalkMode,
  speechSupported,
  transcript,
  onStartListening,
  onStopListening,
  onStopSpeaking,
  onToggleLetsTalk,
  onSubmitVoice,
  disabled,
}: VoiceInputProps) => {
  if (!speechSupported) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Let's Talk Mode Toggle */}
      <Button
        variant={letsTalkMode ? "default" : "outline"}
        size="sm"
        onClick={onToggleLetsTalk}
        disabled={disabled}
        className={cn(
          "gap-2 transition-all",
          letsTalkMode && "bg-primary text-primary-foreground animate-pulse"
        )}
      >
        <MessageCircle className="w-4 h-4" />
        {letsTalkMode ? "Let's Talk Mode ON" : "Let's Talk"}
      </Button>

      {/* Voice Controls */}
      <div className="flex items-center gap-3">
        {/* Microphone Button */}
        <Button
          variant={isListening ? "destructive" : "secondary"}
          size="icon"
          onClick={() => {
            if (isListening) {
              onStopListening();
              // If there's transcript, submit it
              if (transcript.trim()) {
                onSubmitVoice();
              }
            } else {
              onStartListening();
            }
          }}
          disabled={disabled || isSpeaking}
          className={cn(
            "w-12 h-12 rounded-full transition-all",
            isListening && "animate-pulse ring-2 ring-destructive ring-offset-2"
          )}
        >
          {isListening ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </Button>

        {/* Stop Speaking Button (only show when speaking) */}
        {isSpeaking && (
          <Button
            variant="outline"
            size="icon"
            onClick={onStopSpeaking}
            className="w-12 h-12 rounded-full"
          >
            <VolumeX className="w-5 h-5" />
          </Button>
        )}

        {/* Speaking Indicator */}
        {isSpeaking && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
            <Volume2 className="w-4 h-4 animate-pulse" />
            Speaking...
          </div>
        )}
      </div>

      {/* Transcript Display */}
      {transcript && !letsTalkMode && (
        <div className="w-full max-w-md">
          <div className="p-3 rounded-xl bg-muted/50 border border-border">
            <p className="text-sm text-foreground">{transcript}</p>
          </div>
          <div className="flex justify-center mt-2">
            <Button
              size="sm"
              onClick={onSubmitVoice}
              disabled={disabled || !transcript.trim()}
            >
              Submit Problem
            </Button>
          </div>
        </div>
      )}

      {/* Let's Talk Mode Instructions */}
      {letsTalkMode && !isListening && !isSpeaking && (
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Click the microphone to start speaking. I'll listen and respond verbally.
        </p>
      )}

      {/* Listening Indicator for Let's Talk Mode */}
      {letsTalkMode && isListening && (
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-destructive">
            <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-sm font-medium">Listening...</span>
          </div>
          {transcript && (
            <p className="text-sm text-muted-foreground max-w-sm text-center">
              "{transcript}"
            </p>
          )}
        </div>
      )}
    </div>
  );
};
