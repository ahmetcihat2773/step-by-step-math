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
  addScore,
  ScoreResult,
  updateTopicStats
} from '@/lib/storage';

interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface CelebrationData {
  show: boolean;
  pointsEarned: number;
  previousRank?: number;
  newRank?: number;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/math-tutor`;

// Extract topic from AI response
function extractTopic(content: string): string | null {
  const match = content.match(/\[TOPIC:\s*([^\]]+)\]/i);
  return match ? match[1].trim() : null;
}

export const useMathTutor = (user: User | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [guidanceMode, setGuidanceMode] = useState<GuidanceMode | null>(null);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [celebration, setCelebration] = useState<CelebrationData>({ show: false, pointsEarned: 0 });
  const [showSessionComplete, setShowSessionComplete] = useState(false);
  const [detectedTopic, setDetectedTopic] = useState<string | null>(null);
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceTopic, setPracticeTopic] = useState<string | null>(null);
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
        setDetectedTopic(session.topic || null);
        
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
        topic: detectedTopic || currentSession.topic,
      };
      
      updateSession(updatedSession);
      setCurrentSession(updatedSession);
    }
  }, [messages, detectedTopic]);

  const streamChat = useCallback(async (
    chatMessages: Message[],
    image?: string | null,
    mode: GuidanceMode = 'guided',
    isPracticeMode: boolean = false,
    topic: string = ''
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
        practiceMode: isPracticeMode,
        practiceTopic: topic,
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

  const startPracticeSession = useCallback(async (topic: string) => {
    if (!user || !guidanceMode) return;

    setPracticeMode(true);
    setPracticeTopic(topic);
    setDetectedTopic(topic);
    setIsLoading(true);
    setHasStarted(true);

    // Create new session for practice
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      userId: user.id,
      problemText: '',
      problemImageUrl: '',
      guidanceMode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
      currentStepIndex: 0,
      solutionSteps: [],
      isCompleted: false,
      currentQuestion: '',
      topic,
    };

    createSession(newSession);
    setCurrentSessionId(newSession.id);
    setCurrentSession(newSession);

    let assistantContent = "";

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      
      // Try to extract topic from the response
      if (!detectedTopic) {
        const topic = extractTopic(assistantContent);
        if (topic) {
          setDetectedTopic(topic);
        }
      }
      
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
      const response = await streamChat([], null, guidanceMode, true, topic);
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
  }, [user, guidanceMode, streamChat, processStream, toast, detectedTopic]);

  const startWithImage = useCallback(async (base64: string) => {
    if (!user || !guidanceMode) return;

    setUploadedImage(base64);
    setIsLoading(true);
    setHasStarted(true);
    setPracticeMode(false);
    setPracticeTopic(null);

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
      
      // Try to extract topic from the response
      if (!detectedTopic) {
        const topic = extractTopic(assistantContent);
        if (topic) {
          setDetectedTopic(topic);
          // Register topic immediately when detected (with totalQuestions: 0 initially)
          if (user) {
            updateTopicStats(user.id, topic, false, true);
          }
        }
      }
      
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
  }, [user, guidanceMode, streamChat, processStream, toast, detectedTopic]);

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
      const response = await streamChat(allMessages, uploadedImage, guidanceMode, practiceMode, practiceTopic || '');
      await processStream(response, updateAssistant, () => {
        setIsLoading(false);
        
        // Only award points when the entire problem is completed
        const lowerContent = assistantContent.toLowerCase();
        const isProblemCompleted = lowerContent.includes('congratulations') || 
                                   lowerContent.includes("you've solved") ||
                                   lowerContent.includes('excellent work') ||
                                   lowerContent.includes('problem is complete') ||
                                   lowerContent.includes('successfully solved');
        
        if (isProblemCompleted && currentSession && user) {
          const score = guidanceMode === 'guided' ? 100 : 50;
          const result: ScoreResult = addScore(user.id, user.name, score);
          
          // Update topic stats
          const topicToUpdate = detectedTopic || currentSession.topic;
          if (topicToUpdate) {
            updateTopicStats(user.id, topicToUpdate, true);
          }
          
          // Show celebration
          setCelebration({
            show: true,
            pointsEarned: score,
            previousRank: result.previousRank || undefined,
            newRank: result.newRank,
          });
          
          const completedSession = { ...currentSession, isCompleted: true, topic: topicToUpdate };
          updateSession(completedSession);
          setCurrentSession(completedSession);
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
  }, [messages, uploadedImage, guidanceMode, currentSession, user, streamChat, processStream, toast, practiceMode, practiceTopic, detectedTopic]);

  const dismissCelebration = useCallback(() => {
    setCelebration({ show: false, pointsEarned: 0 });
    // Show session complete dialog after celebration
    if (currentSession?.isCompleted) {
      setShowSessionComplete(true);
    }
  }, [currentSession?.isCompleted]);

  const startNewProblem = useCallback(() => {
    // Keep mode, reset everything else for new problem
    setMessages([]);
    setUploadedImage(null);
    setHasStarted(false);
    setCurrentSession(null);
    setCurrentSessionId(null);
    setShowSessionComplete(false);
    setDetectedTopic(null);
    setPracticeMode(false);
    setPracticeTopic(null);
  }, []);

  const practiceSimilarQuestions = useCallback(() => {
    const topic = detectedTopic || currentSession?.topic;
    if (!topic) {
      startNewProblem();
      return;
    }
    
    // Reset for new practice session with same topic
    setMessages([]);
    setUploadedImage(null);
    setCurrentSession(null);
    setCurrentSessionId(null);
    setShowSessionComplete(false);
    
    // Start practice session with the detected topic
    startPracticeSession(topic);
  }, [detectedTopic, currentSession?.topic, startNewProblem, startPracticeSession]);

  const endSession = useCallback(() => {
    // Full reset including mode
    setMessages([]);
    setUploadedImage(null);
    setHasStarted(false);
    setIsLoading(false);
    setGuidanceMode(null);
    setCurrentSession(null);
    setCurrentSessionId(null);
    setCelebration({ show: false, pointsEarned: 0 });
    setShowSessionComplete(false);
    setDetectedTopic(null);
    setPracticeMode(false);
    setPracticeTopic(null);
  }, []);

  const reset = useCallback(() => {
    setMessages([]);
    setUploadedImage(null);
    setHasStarted(false);
    setIsLoading(false);
    setGuidanceMode(null);
    setCurrentSession(null);
    setCurrentSessionId(null);
    setCelebration({ show: false, pointsEarned: 0 });
    setShowSessionComplete(false);
    setDetectedTopic(null);
    setPracticeMode(false);
    setPracticeTopic(null);
  }, []);

  return {
    messages,
    isLoading,
    hasStarted,
    uploadedImage,
    guidanceMode,
    celebration,
    showSessionComplete,
    detectedTopic,
    startWithImage,
    sendMessage,
    selectMode,
    reset,
    dismissCelebration,
    startNewProblem,
    endSession,
    practiceSimilarQuestions,
    startPracticeSession,
  };
};
