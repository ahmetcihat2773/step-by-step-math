import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { useMemo } from "react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

// Parse content and render LaTeX expressions
const MathContent = ({ content }: { content: string }) => {
  const parts = useMemo(() => {
    const result: { type: 'text' | 'inline' | 'block'; content: string }[] = [];
    
    // Match block math ($$...$$) and inline math ($...$)
    // Also handle \[...\] for block and \(...\) for inline
    const regex = /\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]|\$([^$\n]+?)\$|\\\(([^)]+?)\\\)/g;
    
    let lastIndex = 0;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        result.push({
          type: 'text',
          content: content.slice(lastIndex, match.index)
        });
      }
      
      // Determine the type and content of the math
      if (match[1] !== undefined) {
        // Block math with $$
        result.push({ type: 'block', content: match[1].trim() });
      } else if (match[2] !== undefined) {
        // Block math with \[...\]
        result.push({ type: 'block', content: match[2].trim() });
      } else if (match[3] !== undefined) {
        // Inline math with $
        result.push({ type: 'inline', content: match[3].trim() });
      } else if (match[4] !== undefined) {
        // Inline math with \(...\)
        result.push({ type: 'inline', content: match[4].trim() });
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < content.length) {
      result.push({
        type: 'text',
        content: content.slice(lastIndex)
      });
    }
    
    return result;
  }, [content]);

  return (
    <span className="text-sm leading-relaxed">
      {parts.map((part, index) => {
        if (part.type === 'block') {
          return (
            <span key={index} className="block my-2">
              <BlockMath math={part.content} />
            </span>
          );
        }
        if (part.type === 'inline') {
          return <InlineMath key={index} math={part.content} />;
        }
        return (
          <span key={index} className="whitespace-pre-wrap">
            {part.content}
          </span>
        );
      })}
    </span>
  );
};

export const ChatMessage = ({ role, content }: ChatMessageProps) => {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 animate-slide-up",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={cn(
          "max-w-[80%]",
          isUser ? "chat-bubble-user" : "chat-bubble-assistant"
        )}
      >
        <MathContent content={content} />
      </div>
    </div>
  );
};
