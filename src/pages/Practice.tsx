import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, BookOpen, Target, TrendingUp, Play } from 'lucide-react';
import { User, TopicStats } from '@/types/mathTutor';
import { getCurrentUser, getUserTopicStats, initializeDemoData } from '@/lib/storage';

export default function Practice() {
  const [user, setUser] = useState<User | null>(null);
  const [topicStats, setTopicStats] = useState<TopicStats[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    initializeDemoData();
    const existingUser = getCurrentUser();
    if (existingUser) {
      setUser(existingUser);
      const stats = getUserTopicStats(existingUser.id);
      setTopicStats(stats);
    } else {
      navigate('/');
    }
  }, [navigate]);

  const handlePracticeTopic = (topic: string) => {
    navigate('/', { state: { practiceMode: true, practiceTopic: topic } });
  };

  const totalQuestions = topicStats.reduce((sum, s) => sum + s.totalQuestions, 0);
  const totalCorrect = topicStats.reduce((sum, s) => sum + s.correctlyAnswered, 0);
  const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center">
              <Target className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Practice by Topic</h1>
              <p className="text-xs text-muted-foreground">Track your progress</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Overall Stats */}
        <Card className="p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Overall Progress</h2>
              <p className="text-sm text-muted-foreground">
                {totalCorrect} of {totalQuestions} problems solved correctly
              </p>
            </div>
          </div>
          <Progress value={overallAccuracy} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2 text-right">{overallAccuracy}% accuracy</p>
        </Card>

        {/* Topics */}
        {topicStats.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Topics
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {topicStats.map((stat) => {
                const accuracy = stat.totalQuestions > 0 
                  ? Math.round((stat.correctlyAnswered / stat.totalQuestions) * 100) 
                  : 0;
                
                return (
                  <Card key={stat.topic} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-foreground">{stat.topic}</h4>
                        <p className="text-sm text-muted-foreground">
                          {stat.correctlyAnswered}/{stat.totalQuestions} correct
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handlePracticeTopic(stat.topic)}
                        className="gap-1"
                      >
                        <Play className="w-4 h-4" />
                        Practice
                      </Button>
                    </div>
                    <Progress value={accuracy} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1 text-right">{accuracy}%</p>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          <Card className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No topics yet</h3>
            <p className="text-muted-foreground mb-4">
              Start solving problems to track your progress by topic
            </p>
            <Button onClick={() => navigate('/')}>
              Start Practicing
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
}
