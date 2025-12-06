export interface User {
  id: string;
  name: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'bot' | 'student';
  content: string;
  timestamp: string;
}

export interface SolutionStep {
  stepNumber: number;
  description: string;
  expectedAnswer: string;
  hint: string;
  isCompleted: boolean;
}

export interface ChatSession {
  id: string;
  userId: string;
  problemText: string;
  problemImageUrl: string;
  guidanceMode: 'guided' | 'soft';
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  currentStepIndex: number;
  solutionSteps: SolutionStep[];
  isCompleted: boolean;
  currentQuestion: string;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  score: number;
}

export type GuidanceMode = 'guided' | 'soft';
