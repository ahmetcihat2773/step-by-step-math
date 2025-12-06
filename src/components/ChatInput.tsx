import { useState, KeyboardEvent } from "react";
import { Send, Loader2, ArrowRight, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput = ({ onSend, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    { label: "Next Step", value: "next step", icon: ArrowRight },
    { label: "Help", value: "I need help with this step", icon: HelpCircle },
  ];

  return (
    <div className="space-y-3">
      {/* Quick actions */}
      <div className="flex gap-2 justify-center">
        {quickActions.map((action) => (
          <Button
            key={action.value}
            variant="outline"
            size="sm"
            onClick={() => onSend(action.value)}
            disabled={disabled}
            className="text-xs"
          >
            <action.icon className="w-3 h-3 mr-1" />
            {action.label}
          </Button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-3 items-end">
        <Textarea
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
};
