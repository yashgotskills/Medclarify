import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle, Clock, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Challenge {
  id: string;
  title: string;
  description: string;
  duration_days: number;
  points: number;
}

interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  progress: number;
  status: string;
  created_at: string;
  video_proof_url?: string;
}

interface ChallengeReminderProps {
  userId: string;
}

export const ChallengeReminder: React.FC<ChallengeReminderProps> = ({ userId }) => {
  const [todaysReminders, setTodaysReminders] = useState<Array<{
    challenge: Challenge;
    participation: ChallengeParticipant;
    dayNumber: number;
    isCompleted: boolean;
  }>>([]);

  useEffect(() => {
    const checkTodaysProgress = () => {
      const today = new Date();
      const todayStr = today.toDateString();
      
      // Check if we've already shown today's reminder
      const lastReminderDate = localStorage.getItem('lastReminderDate');
      if (lastReminderDate === todayStr) {
        return;
      }

      // Mock data - in real app, fetch from Supabase
      const mockChallenges = [
        {
          challenge: {
            id: '1',
            title: '10,000 Steps Daily',
            description: 'Walk 10,000 steps every day',
            duration_days: 30,
            points: 1000
          },
          participation: {
            id: '1',
            challenge_id: '1',
            progress: 15,
            status: 'active',
            created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
          },
          dayNumber: 16,
          isCompleted: !!localStorage.getItem(`challenge_1_day_${16}`)
        }
      ];

      setTodaysReminders(mockChallenges);

      // Show notification if there are incomplete challenges
      const incompleteCount = mockChallenges.filter(r => !r.isCompleted).length;
      if (incompleteCount > 0) {
        toast.info(`You have ${incompleteCount} challenge${incompleteCount > 1 ? 's' : ''} to complete today!`, {
          duration: 5000,
          action: {
            label: 'View',
            onClick: () => {
              const element = document.getElementById('challenge-reminders');
              element?.scrollIntoView({ behavior: 'smooth' });
            }
          }
        });
      }

      localStorage.setItem('lastReminderDate', todayStr);
    };

    // Check immediately and then every hour
    checkTodaysProgress();
    const interval = setInterval(checkTodaysProgress, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [userId]);

  const markDayCompleted = (challengeId: string, dayNumber: number) => {
    localStorage.setItem(`challenge_${challengeId}_day_${dayNumber}`, 'completed');
    setTodaysReminders(prev => 
      prev.map(reminder => 
        reminder.challenge.id === challengeId 
          ? { ...reminder, isCompleted: true }
          : reminder
      )
    );
    toast.success('Great job! Day marked as completed.');
  };

  if (todaysReminders.length === 0) {
    return null;
  }

  return (
    <div id="challenge-reminders" className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Today's Challenge Reminders</h3>
      </div>

      {todaysReminders.map((reminder) => (
        <Card key={reminder.challenge.id} className="border-l-4 border-l-primary">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                {reminder.challenge.title}
              </CardTitle>
              <Badge variant={reminder.isCompleted ? "default" : "secondary"}>
                Day {reminder.dayNumber}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {reminder.challenge.description}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>Progress: {reminder.participation.progress}/{reminder.challenge.duration_days} days</span>
              </div>
              
              {reminder.isCompleted ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Completed Today!</span>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => markDayCompleted(reminder.challenge.id, reminder.dayNumber)}
                  className="bg-primary hover:bg-primary/90"
                >
                  Complete Today
                </Button>
              )}
            </div>

            {!reminder.isCompleted && (
              <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  <strong>Remember:</strong> Submit a video proof of your activity to complete today's challenge!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};