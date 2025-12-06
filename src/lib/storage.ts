import { User, ChatSession, LeaderboardEntry, TopicStats, UserTopicStats } from "@/types/mathTutor";

const USERS_KEY = "math_tutor_users";
const SESSIONS_KEY = "math_tutor_sessions";
const LEADERBOARD_KEY = "math_tutor_leaderboard";
const CURRENT_USER_KEY = "math_tutor_current_user";
const CURRENT_SESSION_KEY = "math_tutor_current_session";
const TOPIC_STATS_KEY = "math_tutor_topic_stats";

// Demo data
const DEMO_USERS: User[] = [
  { id: "demo-1", name: "Alexander Schmidt", createdAt: new Date().toISOString() },
  { id: "demo-2", name: "Emma Johnson", createdAt: new Date().toISOString() },
  { id: "demo-3", name: "Lucas Müller", createdAt: new Date().toISOString() },
  { id: "demo-4", name: "Sophia Williams", createdAt: new Date().toISOString() },
  { id: "demo-5", name: "Oliver Brown", createdAt: new Date().toISOString() },
];

const DEMO_LEADERBOARD: LeaderboardEntry[] = [
  { userId: "demo-1", userName: "Alexander Schmidt", score: 1250 },
  { userId: "demo-2", userName: "Emma Johnson", score: 980 },
  { userId: "demo-3", userName: "Lucas Müller", score: 240 },
  { userId: "demo-4", userName: "Sophia Williams", score: 110 },
  { userId: "demo-5", userName: "Oliver Brown", score: 30 },
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
  return users.find((u) => u.id === id) || null;
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
  return sessions.find((s) => s.id === id) || null;
}

export function getUserSessions(userId: string): ChatSession[] {
  const sessions = getSessions();
  return sessions.filter((s) => s.userId === userId);
}

export function createSession(session: ChatSession): ChatSession {
  const sessions = getSessions();
  sessions.push(session);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  return session;
}

export function updateSession(session: ChatSession): ChatSession {
  const sessions = getSessions();
  const index = sessions.findIndex((s) => s.id === session.id);
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

export function getUserRank(userId: string): number | null {
  const leaderboard = getLeaderboard();
  const index = leaderboard.findIndex((e) => e.userId === userId);
  return index !== -1 ? index + 1 : null;
}

export interface ScoreResult {
  previousRank: number | null;
  newRank: number;
  totalScore: number;
}

export function addScore(userId: string, userName: string, score: number): ScoreResult {
  const leaderboard = getLeaderboard();
  const previousRank = getUserRank(userId);
  const existing = leaderboard.find((e) => e.userId === userId);

  let totalScore = score;

  if (existing) {
    existing.score += score;
    totalScore = existing.score;
  } else {
    leaderboard.push({ userId, userName, score });
  }

  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));

  const newRank = getUserRank(userId) || leaderboard.length;

  return { previousRank, newRank, totalScore };
}

// Topic Statistics
export function getAllTopicStats(): UserTopicStats[] {
  const data = localStorage.getItem(TOPIC_STATS_KEY);
  return data ? JSON.parse(data) : [];
}

export function getUserTopicStats(userId: string): TopicStats[] {
  const allStats = getAllTopicStats();
  const userStats = allStats.find((s) => s.userId === userId);
  return userStats?.stats || [];
}

export function updateTopicStats(userId: string, topic: string, isCorrect: boolean, registerOnly: boolean = false): void {
  const allStats = getAllTopicStats();
  let userStats = allStats.find((s) => s.userId === userId);

  if (!userStats) {
    userStats = { userId, stats: [] };
    allStats.push(userStats);
  }

  let topicStats = userStats.stats.find((s) => s.topic === topic);

  if (!topicStats) {
    topicStats = { topic, totalQuestions: 0, correctlyAnswered: 0 };
    userStats.stats.push(topicStats);
  }

  // If registerOnly is true, just ensure the topic exists without incrementing counts
  if (!registerOnly) {
    topicStats.totalQuestions += 1;
    if (isCorrect) {
      topicStats.correctlyAnswered += 1;
    }
  }

  localStorage.setItem(TOPIC_STATS_KEY, JSON.stringify(allStats));
}

export function getAvailableTopics(): string[] {
  const allStats = getAllTopicStats();
  const topicsSet = new Set<string>();

  allStats.forEach((userStats) => {
    userStats.stats.forEach((stat) => {
      topicsSet.add(stat.topic);
    });
  });

  return Array.from(topicsSet).sort();
}
