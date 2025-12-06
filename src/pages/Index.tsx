import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMathTutor } from '@/hooks/useMathTutor';
import { ImageUpload } from '@/components/ImageUpload';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput, ChatInputRef } from '@/components/ChatInput';
import { ModeSelector } from '@/components/ModeSelector';
import { UserSetup } from '@/components/UserSetup';
import { Leaderboard } from '@/components/Leaderboard';
import { CelebrationOverlay } from '@/components/CelebrationOverlay';
import { SessionCompleteDialog } from '@/components/SessionCompleteDialog';
import { Button } from '@/components/ui/button';
import { RefreshCw, Trophy, BookOpen, Zap, Target } from 'lucide-react';
import { User } from '@/types/mathTutor';
import { getCurrentUser, initializeDemoData } from '@/lib/storage';

interface LocationState {
  practiceMode?: boolean;
  practiceTopic?: string;
}

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const chatInputRef = useRef<ChatInputRef>(null);
  
  const {
    messages,
    isLoading,
    hasStarted,
    uploadedImage,
    guidanceMode,
    celebration,
    showSessionComplete,
    detectedTopic,
    sendMessage,
    startWithImage,
    selectMode,
    reset,
    dismissCelebration,
    startNewProblem,
    endSession,
    practiceSimilarQuestions,
    startPracticeSession,
  } = useMathTutor(user);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize demo data and check for existing user
  useEffect(() => {
    initializeDemoData();
    const existingUser = getCurrentUser();
    if (existingUser) {
      setUser(existingUser);
    }
  }, []);

  // Handle practice mode from navigation
  useEffect(() => {
    const state = location.state as LocationState | null;
    if (state?.practiceMode && state?.practiceTopic && user && guidanceMode) {
      startPracticeSession(state.practiceTopic);
      // Clear the navigation state
      navigate('/', { replace: true, state: {} });
    }
  }, [location.state, user, guidanceMode, startPracticeSession, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageSelect = (base64: string) => {
    startWithImage(base64);
  };

  const handleReset = () => {
    reset();
    setShowLeaderboard(false);
  };

  const handleSendMessage = (message: string) => {
    sendMessage(message);
    // Focus will be handled by ChatInput component
  };

  // User setup screen
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <UserSetup onUserReady={setUser} />
      </div>
    );
  }

  // Leaderboard view
  if (showLeaderboard) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Leaderboard currentUserId={user.id} />
        <Button 
          variant="outline" 
          onClick={() => setShowLeaderboard(false)}
          className="mt-6"
        >
          Back to Tutor
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">π</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Math Tutor</h1>
              <p className="text-xs text-muted-foreground">Welcome, {user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {guidanceMode && (
              <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                guidanceMode === 'guided' 
                  ? 'bg-primary/10 text-primary' 
                  : 'bg-accent/10 text-accent'
              }`}>
                {guidanceMode === 'guided' ? <BookOpen className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                {guidanceMode === 'guided' ? 'Guided' : 'Soft'} Mode
              </div>
            )}
            {detectedTopic && hasStarted && (
              <div className="px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                {detectedTopic}
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/practice')}
              className="text-muted-foreground hover:text-foreground"
            >
              <Target className="w-4 h-4 mr-1" />
              Practice
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLeaderboard(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Trophy className="w-4 h-4 mr-1" />
              Leaderboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col">
        {!guidanceMode ? (
          // Mode selection
          <div className="flex-1 flex items-center justify-center">
            <ModeSelector onSelectMode={selectMode} />
          </div>
        ) : !hasStarted ? (
          // Image upload
          <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Upload Your Problem</h2>
              <p className="text-muted-foreground">
                Take a photo of your math problem and I'll help you solve it step by step
              </p>
            </div>
            <ImageUpload onImageSelect={handleImageSelect} disabled={isLoading} />
          </div>
        ) : (
          // Chat interface
          <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
            {/* Uploaded image preview */}
            {uploadedImage && (
              <div className="mb-4 p-3 bg-card rounded-xl border border-border">
                <img
                  src={uploadedImage}
                  alt="Math problem"
                  className="max-h-32 rounded-lg object-contain mx-auto"
                />
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.map((msg, i) => (
                <ChatMessage key={i} role={msg.role} content={msg.content} />
              ))}
              {isLoading && messages.length === 0 && (
                <div className="flex justify-start">
                  <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-75" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="space-y-3">
              <ChatInput ref={chatInputRef} onSend={handleSendMessage} disabled={isLoading} />
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  New Problem
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 text-center text-sm text-muted-foreground">
        Learn math step by step with AI guidance
      </footer>

      {/* Celebration Overlay */}
      <CelebrationOverlay
        show={celebration.show}
        pointsEarned={celebration.pointsEarned}
        newRank={celebration.newRank}
        previousRank={celebration.previousRank}
        onComplete={dismissCelebration}
      />

      {/* Session Complete Dialog */}
      <SessionCompleteDialog
        show={showSessionComplete}
        topic={detectedTopic || undefined}
        onNewProblem={startNewProblem}
        onEndSession={endSession}
        onPracticeSimilar={practiceSimilarQuestions}
      />
    </div>
  );
}
