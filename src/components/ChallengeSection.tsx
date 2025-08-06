import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, Users, Play, Upload, Star, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { VideoUpload } from './VideoUpload';
import { ChallengeReminder } from './ChallengeReminder';

interface Challenge {
  id: string;
  title: string;
  description: string;
  duration_days: number;
  points: number;
  is_active: boolean;
  created_at: string;
}

interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  user_id: string;
  progress: number;
  points_earned: number;
  status: string;
  video_proof_url?: string;
  completed_at?: string;
  profiles?: {
    username?: string;
    display_name?: string;
  };
}

interface ChallengeSectionProps {
  userId: string;
}

const ChallengeSection: React.FC<ChallengeSectionProps> = ({ userId }) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [participants, setParticipants] = useState<ChallengeParticipant[]>([]);
  const [userParticipations, setUserParticipations] = useState<ChallengeParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showVideoUpload, setShowVideoUpload] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchChallenges();
    fetchLeaderboard();
    fetchUserParticipations();
  }, [userId]);

  const fetchChallenges = async () => {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChallenges(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch challenges',
        variant: 'destructive'
      });
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('challenge_participants')
        .select('*')
        .order('points_earned', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      // Fetch user profiles separately
      const participantsWithProfiles = await Promise.all(
        (data || []).map(async (participant) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, display_name')
            .eq('user_id', participant.user_id)
            .single();
          
          return {
            ...participant,
            profiles: profile
          };
        })
      );
      
      setParticipants(participantsWithProfiles);
    } catch (error: any) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const fetchUserParticipations = async () => {
    try {
      const { data, error } = await supabase
        .from('challenge_participants')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      setUserParticipations(data || []);
    } catch (error: any) {
      console.error('Error fetching user participations:', error);
    }
  };

  const joinChallenge = async (challengeId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('challenge_participants')
        .insert({
          challenge_id: challengeId,
          user_id: userId,
          progress: 0,
          points_earned: 0,
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'You have joined the challenge!',
      });

      fetchUserParticipations();
      fetchLeaderboard();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to join challenge',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProgress = async (participationId: string, newProgress: number) => {
    try {
      const participation = userParticipations.find(p => p.id === participationId);
      if (!participation) return;

      const challenge = challenges.find(c => c.id === participation.challenge_id);
      if (!challenge) return;

      const isCompleted = newProgress >= 100;
      const pointsEarned = isCompleted ? challenge.points : Math.floor((newProgress / 100) * challenge.points);

      const { error } = await supabase
        .from('challenge_participants')
        .update({
          progress: newProgress,
          points_earned: pointsEarned,
          status: isCompleted ? 'completed' : 'active',
          completed_at: isCompleted ? new Date().toISOString() : null
        })
        .eq('id', participationId);

      if (error) throw error;

      toast({
        title: 'Progress Updated',
        description: `Progress updated to ${newProgress}%${isCompleted ? '. Challenge completed!' : ''}`,
      });

      fetchUserParticipations();
      fetchLeaderboard();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update progress',
        variant: 'destructive'
      });
    }
  };

  const isUserParticipating = (challengeId: string) => {
    return userParticipations.some(p => p.challenge_id === challengeId);
  };

  const getUserParticipation = (challengeId: string) => {
    return userParticipations.find(p => p.challenge_id === challengeId);
  };

  const handleVideoVerified = async (challengeId: string, videoUrl: string, verificationData: any) => {
    try {
      const participation = getUserParticipation(challengeId);
      if (participation) {
        const newProgress = Math.min(participation.progress + 10, 100);
        await updateProgress(participation.id, newProgress);
        
        // Update video proof URL
        const { error } = await supabase
          .from('challenge_participants')
          .update({ 
            video_proof_url: videoUrl,
            points_earned: participation.points_earned + 100
          })
          .eq('id', participation.id);

        if (error) throw error;
        
        setShowVideoUpload(null);
        toast({
          title: 'Success',
          description: 'Challenge progress updated with video proof!',
        });
      }
    } catch (error) {
      console.error('Error updating challenge with video:', error);
      toast({
        title: 'Error',
        description: 'Failed to update challenge progress',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      <ChallengeReminder userId={userId} />
      
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">Health Challenges</h2>
        <p className="text-muted-foreground">
          Join health challenges, earn points, and compete with others!
        </p>
      </div>

      <Tabs defaultValue="challenges" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="challenges">Active Challenges</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="my-challenges">My Challenges</TabsTrigger>
        </TabsList>

        <TabsContent value="challenges" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {challenges.map((challenge) => {
              const userParticipation = getUserParticipation(challenge.id);
              const isParticipating = isUserParticipating(challenge.id);

              return (
                <Card key={challenge.id} className="relative">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{challenge.title}</CardTitle>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {challenge.points}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {challenge.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {challenge.duration_days} days
                      </div>
                    </div>

                    {isParticipating && userParticipation ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{userParticipation.progress}%</span>
                        </div>
                        <Progress value={userParticipation.progress} />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowVideoUpload(challenge.id)}
                          >
                            <Camera className="h-4 w-4 mr-1" />
                            Video Proof
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => updateProgress(userParticipation.id, Math.min(100, userParticipation.progress + 10))}
                          >
                            +10%
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button 
                        className="w-full" 
                        onClick={() => joinChallenge(challenge.id)}
                        disabled={isLoading}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Join Challenge
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {participants.map((participant, index) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : index === 1
                            ? 'bg-gray-100 text-gray-800'
                            : index === 2
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold">
                          {participant.profiles?.username || 
                           participant.profiles?.display_name || 
                           'Anonymous User'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {participant.status === 'completed' ? 'Completed' : 'In Progress'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary">
                        {participant.points_earned} pts
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {participant.progress}% complete
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-challenges" className="space-y-4">
          <div className="grid gap-4">
            {userParticipations.map((participation) => {
              const challenge = challenges.find(c => c.id === participation.challenge_id);
              if (!challenge) return null;

              return (
                <Card key={participation.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{challenge.title}</CardTitle>
                      <Badge 
                        variant={participation.status === 'completed' ? 'default' : 'secondary'}
                        className="flex items-center gap-1"
                      >
                        <Star className="h-3 w-3" />
                        {participation.points_earned} / {challenge.points}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{participation.progress}%</span>
                      </div>
                      <Progress value={participation.progress} />
                    </div>
                    
                    {participation.status !== 'completed' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateProgress(participation.id, Math.min(100, participation.progress + 10))}
                        >
                          +10%
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updateProgress(participation.id, 100)}
                        >
                          Complete Challenge
                        </Button>
                      </div>
                    )}

                    {participation.completed_at && (
                      <div className="text-sm text-muted-foreground">
                        Completed on {new Date(participation.completed_at).toLocaleDateString()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            
            {userParticipations.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Challenges Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Join a challenge to start earning points!
                  </p>
                  <Button onClick={() => {
                    const challengesTab = document.querySelector('[value="challenges"]') as HTMLElement;
                    challengesTab?.click();
                  }}>
                    Browse Challenges
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {showVideoUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg p-6 max-w-md w-full">
            <VideoUpload
              challengeId={showVideoUpload}
              challengeTitle={challenges.find(c => c.id === showVideoUpload)?.title || ''}
              challengeDescription={challenges.find(c => c.id === showVideoUpload)?.description || ''}
              onVideoVerified={(videoUrl, verificationData) => 
                handleVideoVerified(showVideoUpload, videoUrl, verificationData)
              }
            />
            <Button
              variant="outline"
              onClick={() => setShowVideoUpload(null)}
              className="w-full mt-4"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallengeSection;