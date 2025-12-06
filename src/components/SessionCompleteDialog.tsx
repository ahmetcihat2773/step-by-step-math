import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PlusCircle, LogOut, Trophy, Target } from 'lucide-react';

interface SessionCompleteDialogProps {
  show: boolean;
  topic?: string;
  onNewProblem: () => void;
  onEndSession: () => void;
  onPracticeSimilar?: () => void;
}

export const SessionCompleteDialog = ({
  show,
  topic,
  onNewProblem,
  onEndSession,
  onPracticeSimilar,
}: SessionCompleteDialogProps) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <Card className="max-w-md w-full mx-4 p-6 shadow-medium animate-scale-in">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
            <Trophy className="w-8 h-8 text-success" />
          </div>
          
          <div>
            <h2 className="text-xl font-bold text-foreground">Problem Solved!</h2>
            <p className="text-muted-foreground mt-1">
              Great job! Would you like to continue practicing?
            </p>
            {topic && (
              <p className="text-sm text-primary mt-2 font-medium">
                Topic: {topic}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 pt-4">
            {topic && onPracticeSimilar && (
              <Button
                onClick={onPracticeSimilar}
                variant="default"
                className="w-full gap-2 bg-accent hover:bg-accent/90"
                size="lg"
              >
                <Target className="w-5 h-5" />
                Practice Similar Questions
              </Button>
            )}
            
            <Button
              onClick={onNewProblem}
              variant={topic ? "outline" : "default"}
              className="w-full gap-2"
              size="lg"
            >
              <PlusCircle className="w-5 h-5" />
              Add New Problem
            </Button>
            
            <Button
              variant="ghost"
              onClick={onEndSession}
              className="w-full gap-2 text-muted-foreground"
              size="lg"
            >
              <LogOut className="w-5 h-5" />
              End Session
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
