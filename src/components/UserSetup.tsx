import { useState } from 'react';
import { User } from '@/types/mathTutor';
import { createUser, setCurrentUser, getUsers } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User as UserIcon } from 'lucide-react';

interface UserSetupProps {
  onUserReady: (user: User) => void;
}

export function UserSetup({ onUserReady }: UserSetupProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [showExisting, setShowExisting] = useState(false);
  
  const existingUsers = getUsers();

  const handleCreate = () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (name.length > 100) {
      setError('Name must be less than 100 characters');
      return;
    }
    
    const user = createUser(name.trim());
    setCurrentUser(user.id);
    onUserReady(user);
  };

  const handleSelectUser = (user: User) => {
    setCurrentUser(user.id);
    onUserReady(user);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <UserIcon className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Welcome to Math Tutor</h2>
        <p className="text-muted-foreground">Enter your name to get started</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            className="text-center"
          />
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
        </div>
        
        <Button onClick={handleCreate} className="w-full">
          Start Learning
        </Button>

        {existingUsers.length > 0 && (
          <div className="pt-4 border-t border-border">
            <button
              onClick={() => setShowExisting(!showExisting)}
              className="text-sm text-muted-foreground hover:text-foreground w-full text-center"
            >
              {showExisting ? 'Hide existing users' : 'Or select an existing user'}
            </button>
            
            {showExisting && (
              <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                {existingUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="w-full p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors text-left"
                  >
                    <span className="font-medium text-foreground">{user.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
