import { GuidanceMode } from '@/types/mathTutor';
import { BookOpen, Zap } from 'lucide-react';

interface ModeSelectorProps {
  onSelectMode: (mode: GuidanceMode) => void;
}

export function ModeSelector({ onSelectMode }: ModeSelectorProps) {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Choose Your Learning Mode</h2>
        <p className="text-muted-foreground">Select how you'd like to solve problems</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => onSelectMode('guided')}
          className="group p-6 rounded-2xl border-2 border-border bg-card hover:border-primary hover:shadow-lg transition-all duration-300 text-left space-y-4"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Guided Mode</h3>
            <p className="text-sm text-muted-foreground">
              Step-by-step learning with hints and guidance. You control the pace - move to the next step only when you're ready.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-primary font-medium">
            <span className="px-2 py-1 bg-primary/10 rounded-full">Recommended</span>
          </div>
        </button>

        <button
          onClick={() => onSelectMode('soft')}
          className="group p-6 rounded-2xl border-2 border-border bg-card hover:border-accent hover:shadow-lg transition-all duration-300 text-left space-y-4"
        >
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
            <Zap className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Soft Mode</h3>
            <p className="text-sm text-muted-foreground">
              Faster progression with immediate feedback. Each response moves you to the next step automatically.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-accent font-medium">
            <span className="px-2 py-1 bg-accent/10 rounded-full">Quick Learning</span>
          </div>
        </button>
      </div>
    </div>
  );
}
