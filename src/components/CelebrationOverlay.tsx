import { useEffect, useState } from 'react';
import { Trophy, Star, TrendingUp, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CelebrationOverlayProps {
  show: boolean;
  pointsEarned: number;
  newRank?: number;
  previousRank?: number;
  onComplete: () => void;
}

export const CelebrationOverlay = ({
  show,
  pointsEarned,
  newRank,
  previousRank,
  onComplete,
}: CelebrationOverlayProps) => {
  const [phase, setPhase] = useState<'points' | 'rank' | 'done'>('points');
  const [displayPoints, setDisplayPoints] = useState(0);

  const rankImproved = previousRank && newRank && newRank < previousRank;

  useEffect(() => {
    if (!show) {
      setPhase('points');
      setDisplayPoints(0);
      return;
    }

    // Animate points counting up
    const duration = 1000;
    const steps = 20;
    const increment = pointsEarned / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= pointsEarned) {
        setDisplayPoints(pointsEarned);
        clearInterval(timer);
        
        // Move to rank phase after points animation
        setTimeout(() => {
          if (rankImproved) {
            setPhase('rank');
            setTimeout(() => {
              setPhase('done');
              setTimeout(onComplete, 1000);
            }, 2000);
          } else {
            setPhase('done');
            setTimeout(onComplete, 1500);
          }
        }, 800);
      } else {
        setDisplayPoints(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [show, pointsEarned, rankImproved, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Backdrop with particles */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in" />
      
      {/* Confetti particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 rounded-full animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              top: '-10%',
              backgroundColor: ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--success))', 'hsl(var(--warning))'][i % 4],
              animationDelay: `${Math.random() * 0.5}s`,
              animationDuration: `${2 + Math.random()}s`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center">
        {/* Points earned */}
        <div className={cn(
          "transition-all duration-500",
          phase === 'points' ? "scale-100 opacity-100" : "scale-90 opacity-60"
        )}>
          <div className="relative inline-block">
            <Sparkles className="absolute -top-6 -left-6 w-8 h-8 text-warning animate-pulse" />
            <Sparkles className="absolute -top-4 -right-8 w-6 h-6 text-accent animate-pulse delay-100" />
            <Star className="absolute -bottom-4 -left-4 w-5 h-5 text-primary animate-pulse delay-200" />
            
            <div className="bg-card border-2 border-success rounded-3xl px-12 py-8 shadow-glow animate-celebration-pop">
              <p className="text-muted-foreground text-sm uppercase tracking-wider mb-2">
                Correct Answer!
              </p>
              <div className="flex items-center justify-center gap-3">
                <Trophy className="w-10 h-10 text-warning animate-bounce" />
                <span className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  +{displayPoints}
                </span>
              </div>
              <p className="text-muted-foreground mt-2">points earned</p>
            </div>
          </div>
        </div>

        {/* Rank improvement */}
        {rankImproved && phase === 'rank' && (
          <div className="mt-8 animate-slide-up">
            <div className="bg-card border-2 border-accent rounded-2xl px-8 py-6 shadow-medium inline-block">
              <div className="flex items-center gap-4">
                <TrendingUp className="w-8 h-8 text-success animate-bounce" />
                <div className="text-left">
                  <p className="text-sm text-muted-foreground">Rank Up!</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl text-muted-foreground line-through">#{previousRank}</span>
                    <span className="text-lg">→</span>
                    <span className="text-3xl font-bold text-success">#{newRank}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
