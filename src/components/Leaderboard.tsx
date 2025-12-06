import { getLeaderboard } from '@/lib/storage';
import { Trophy, Medal } from 'lucide-react';

interface LeaderboardProps {
  currentUserId?: string;
}

export function Leaderboard({ currentUserId }: LeaderboardProps) {
  const entries = getLeaderboard().slice(0, 10);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm text-muted-foreground">{index + 1}</span>;
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Leaderboard</h3>
      </div>
      
      <div className="space-y-2">
        {entries.map((entry, index) => (
          <div
            key={entry.userId}
            className={`flex items-center gap-3 p-3 rounded-lg border ${
              entry.userId === currentUserId
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card'
            }`}
          >
            <div className="w-8 flex justify-center">
              {getRankIcon(index)}
            </div>
            <span className="flex-1 font-medium text-foreground truncate">
              {entry.userName}
            </span>
            <span className="text-sm font-semibold text-primary">
              {entry.score.toLocaleString()} pts
            </span>
          </div>
        ))}
        
        {entries.length === 0 && (
          <p className="text-center text-muted-foreground py-4">No scores yet</p>
        )}
      </div>
    </div>
  );
}
