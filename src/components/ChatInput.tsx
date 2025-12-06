import { useState, useRef, useEffect, KeyboardEvent, forwardRef, useImperativeHandle } from "react";
import { Send, Loader2, ArrowRight, HelpCircle, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MathKeyboard } from "@/components/MathKeyboard";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export interface ChatInputRef {
  focus: () => void;
}

export const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(({ onSend, disabled }, ref) => {
  const [message, setMessage] = useState("");
  const [showMathKeyboard, setShowMathKeyboard] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      textareaRef.current?.focus();
    }
  }));

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  // Refocus input after loading completes
  useEffect(() => {
    if (!disabled) {
      textareaRef.current?.focus();
    }
  }, [disabled]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (value: string) => {
    onSend(value);
  };

  const handleMathInsert = (symbol: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = message.slice(0, start) + symbol + message.slice(end);
    setMessage(newValue);
    
    // Set cursor position after inserted symbol
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + symbol.length, start + symbol.length);
    }, 0);
  };

  const quickActions = [
    { label: "Next Step", value: "next step", icon: ArrowRight },
    { label: "Help", value: "I need help with this step", icon: HelpCircle },
  ];

  return (
    <div className="space-y-3">
      {/* Quick actions */}
      <div className="flex gap-2 justify-center flex-wrap">
        {quickActions.map((action) => (
          <Button
            key={action.value}
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction(action.value)}
            disabled={disabled}
            className="text-xs"
          >
            <action.icon className="w-3 h-3 mr-1" />
            {action.label}
          </Button>
        ))}
        <Button
          variant={showMathKeyboard ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowMathKeyboard(!showMathKeyboard)}
          disabled={disabled}
          className="text-xs"
        >
          <Calculator className="w-3 h-3 mr-1" />
          Math
        </Button>
      </div>

      {/* Math keyboard */}
      {showMathKeyboard && (
        <MathKeyboard onInsert={handleMathInsert} disabled={disabled} />
      )}

      {/* Input */}
      <div className="flex gap-3 items-end">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your answer..."
          disabled={disabled}
          className="min-h-[52px] max-h-32 resize-none bg-card border-border focus-visible:ring-primary"
          rows={1}
        />
        <Button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          size="icon"
          className="h-[52px] w-[52px] shrink-0"
        >
          {disabled ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
});

ChatInput.displayName = "ChatInput";
