import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  ChatSession, 
  ChatMessage as StoredMessage, 
  GuidanceMode, 
  User 
} from '@/types/mathTutor';
import { 
  createSession, 
  updateSession, 
  getSession, 
  getCurrentSessionId, 
  setCurrentSessionId,
  addScore
} from '@/lib/storage';

interface Message {
  role: "user" | "assistant";
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/math-tutor`;

export const useMathTutor = (user: User | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [guidanceMode, setGuidanceMode] = useState<GuidanceMode | null>(null);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const { toast } = useToast();

  // Load existing session on mount
  useEffect(() => {
    const sessionId = getCurrentSessionId();
    if (sessionId && user) {
      const session = getSession(sessionId);
      if (session && session.userId === user.id && !session.isCompleted) {
        setCurrentSession(session);
        setGuidanceMode(session.guidanceMode);
        setUploadedImage(session.problemImageUrl);
        setHasStarted(true);
        
        const uiMessages: Message[] = session.messages.map(m => ({
          role: m.role === 'bot' ? 'assistant' : 'user',
          content: m.content,
        }));
        setMessages(uiMessages);
      }
    }
  }, [user]);

  // Save session whenever messages change
  useEffect(() => {
    if (currentSession && messages.length > 0) {
      const storedMessages: StoredMessage[] = messages.map((m, i) => ({
        id: `msg-${i}`,
        role: m.role === 'assistant' ? 'bot' : 'student',
        content: m.content,
        timestamp: new Date().toISOString(),
      }));
      
      const updatedSession: ChatSession = {
        ...currentSession,
        messages: storedMessages,
        updatedAt: new Date().toISOString(),
      };
      
      updateSession(updatedSession);
      setCurrentSession(updatedSession);
    }
  }, [messages]);

  const streamChat = useCallback(async (
    chatMessages: Message[],
    image?: string | null,
    mode: GuidanceMode = 'guided'
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
        guidanceMode: mode,
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

  const selectMode = useCallback((mode: GuidanceMode) => {
    setGuidanceMode(mode);
  }, []);

  const startWithImage = useCallback(async (base64: string) => {
    if (!user || !guidanceMode) return;

    setUploadedImage(base64);
    setIsLoading(true);
    setHasStarted(true);

    // Create new session
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      userId: user.id,
      problemText: '',
      problemImageUrl: base64,
      guidanceMode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
      currentStepIndex: 0,
      solutionSteps: [],
      isCompleted: false,
      currentQuestion: '',
    };

    createSession(newSession);
    setCurrentSessionId(newSession.id);
    setCurrentSession(newSession);

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
      const response = await streamChat([], base64, guidanceMode);
      await processStream(response, updateAssistant, () => setIsLoading(false));
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  }, [user, guidanceMode, streamChat, processStream, toast]);

  const sendMessage = useCallback(async (content: string) => {
    if (!guidanceMode) return;
    
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
      const response = await streamChat(allMessages, uploadedImage, guidanceMode);
      await processStream(response, updateAssistant, () => {
        setIsLoading(false);
        
        // Check if problem is completed
        if (assistantContent.toLowerCase().includes('congratulations') || 
            assistantContent.toLowerCase().includes("you've solved") ||
            assistantContent.toLowerCase().includes('excellent work')) {
          if (currentSession && user) {
            const completedSession = { ...currentSession, isCompleted: true };
            updateSession(completedSession);
            setCurrentSession(completedSession);
            
            const score = guidanceMode === 'guided' ? 100 : 50;
            addScore(user.id, user.name, score);
          }
        }
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  }, [messages, uploadedImage, guidanceMode, currentSession, user, streamChat, processStream, toast]);

  const reset = useCallback(() => {
    setMessages([]);
    setUploadedImage(null);
    setHasStarted(false);
    setIsLoading(false);
    setGuidanceMode(null);
    setCurrentSession(null);
    setCurrentSessionId(null);
  }, []);

  return {
    messages,
    isLoading,
    hasStarted,
    uploadedImage,
    guidanceMode,
    startWithImage,
    sendMessage,
    selectMode,
    reset,
  };
};