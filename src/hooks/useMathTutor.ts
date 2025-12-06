import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/math-tutor`;

export const useMathTutor = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const { toast } = useToast();

  const streamChat = useCallback(async (
    chatMessages: Message[],
    image?: string | null
  ) => {
    const response = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: chatMessages,
        imageBase64: image,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please wait a moment and try again.");
      }
      if (response.status === 402) {
        throw new Error("Credits required. Please add credits to continue.");
      }
      throw new Error("Failed to get response");
    }

    if (!response.body) {
      throw new Error("No response body");
    }

    return response;
  }, []);

  const processStream = useCallback(async (
    response: Response,
    onDelta: (text: string) => void,
    onDone: () => void
  ) => {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          onDone();
          return;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch {
          buffer = line + "\n" + buffer;
          break;
        }
      }
    }

    onDone();
  }, []);

  const startWithImage = useCallback(async (base64: string) => {
    setImageBase64(base64);
    setIsLoading(true);
    setHasStarted(true);

    let assistantContent = "";

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    try {
      const response = await streamChat([], base64);
      await processStream(response, updateAssistant, () => setIsLoading(false));
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Bir hata oluştu",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  }, [streamChat, processStream, toast]);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: Message = { role: "user", content };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    let assistantContent = "";

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    try {
      const allMessages = [...messages, userMessage];
      const response = await streamChat(allMessages, imageBase64);
      await processStream(response, updateAssistant, () => setIsLoading(false));
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "Bir hata oluştu",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  }, [messages, imageBase64, streamChat, processStream, toast]);

  const reset = useCallback(() => {
    setMessages([]);
    setImageBase64(null);
    setHasStarted(false);
    setIsLoading(false);
  }, []);

  return {
    messages,
    isLoading,
    hasStarted,
    imageBase64,
    startWithImage,
    sendMessage,
    reset,
  };
};
