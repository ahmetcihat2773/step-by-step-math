import { User, ChatSession, LeaderboardEntry } from '@/types/mathTutor';

const USERS_KEY = 'math_tutor_users';
const SESSIONS_KEY = 'math_tutor_sessions';
const LEADERBOARD_KEY = 'math_tutor_leaderboard';
const CURRENT_USER_KEY = 'math_tutor_current_user';
const CURRENT_SESSION_KEY = 'math_tutor_current_session';

// Demo data
const DEMO_USERS: User[] = [
  { id: 'demo-1', name: 'Alexander Schmidt', createdAt: new Date().toISOString() },
  { id: 'demo-2', name: 'Emma Johnson', createdAt: new Date().toISOString() },
  { id: 'demo-3', name: 'Lucas Müller', createdAt: new Date().toISOString() },
  { id: 'demo-4', name: 'Sophia Williams', createdAt: new Date().toISOString() },
  { id: 'demo-5', name: 'Oliver Brown', createdAt: new Date().toISOString() },
];

const DEMO_LEADERBOARD: LeaderboardEntry[] = [
  { userId: 'demo-1', userName: 'Alexander Schmidt', score: 1250 },
  { userId: 'demo-2', userName: 'Emma Johnson', score: 980 },
  { userId: 'demo-3', userName: 'Lucas Müller', score: 750 },
  { userId: 'demo-4', userName: 'Sophia Williams', score: 620 },
  { userId: 'demo-5', userName: 'Oliver Brown', score: 450 },
];

// Initialize demo data if not exists
export function initializeDemoData(): void {
  const users = getUsers();
  if (users.length === 0) {
    localStorage.setItem(USERS_KEY, JSON.stringify(DEMO_USERS));
  }
  
  const leaderboard = getLeaderboard();
  if (leaderboard.length === 0) {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(DEMO_LEADERBOARD));
  }
}

// Users
export function getUsers(): User[] {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
}

export function getUser(id: string): User | null {
  const users = getUsers();
  return users.find(u => u.id === id) || null;
}

export function createUser(name: string): User {
  const users = getUsers();
  const newUser: User = {
    id: crypto.randomUUID(),
    name,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return newUser;
}

export function getCurrentUser(): User | null {
  const id = localStorage.getItem(CURRENT_USER_KEY);
  return id ? getUser(id) : null;
}

export function setCurrentUser(userId: string): void {
  localStorage.setItem(CURRENT_USER_KEY, userId);
}

// Sessions
export function getSessions(): ChatSession[] {
  const data = localStorage.getItem(SESSIONS_KEY);
  return data ? JSON.parse(data) : [];
}

export function getSession(id: string): ChatSession | null {
  const sessions = getSessions();
  return sessions.find(s => s.id === id) || null;
}

export function getUserSessions(userId: string): ChatSession[] {
  const sessions = getSessions();
  return sessions.filter(s => s.userId === userId);
}

export function createSession(session: ChatSession): ChatSession {
  const sessions = getSessions();
  sessions.push(session);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  return session;
}

export function updateSession(session: ChatSession): ChatSession {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === session.id);
  if (index !== -1) {
    sessions[index] = { ...session, updatedAt: new Date().toISOString() };
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  }
  return session;
}

export function getCurrentSessionId(): string | null {
  return localStorage.getItem(CURRENT_SESSION_KEY);
}

export function setCurrentSessionId(sessionId: string | null): void {
  if (sessionId) {
    localStorage.setItem(CURRENT_SESSION_KEY, sessionId);
  } else {
    localStorage.removeItem(CURRENT_SESSION_KEY);
  }
}

// Leaderboard
export function getLeaderboard(): LeaderboardEntry[] {
  const data = localStorage.getItem(LEADERBOARD_KEY);
  const entries: LeaderboardEntry[] = data ? JSON.parse(data) : [];
  return entries.sort((a, b) => b.score - a.score);
}

export function addScore(userId: string, userName: string, score: number): void {
  const leaderboard = getLeaderboard();
  const existing = leaderboard.find(e => e.userId === userId);
  
  if (existing) {
    existing.score += score;
  } else {
    leaderboard.push({ userId, userName, score });
  }
  
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
}
