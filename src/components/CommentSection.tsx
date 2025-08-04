import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Heart, Reply, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Comment {
  id: string;
  user_id: string;
  content: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    username?: string;
    display_name?: string;
  };
  replies?: Comment[];
}

interface CommentSectionProps {
  userId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ userId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles and replies for each comment
      const commentsWithReplies = await Promise.all(
        (data || []).map(async (comment) => {
          // Fetch user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, display_name')
            .eq('user_id', comment.user_id)
            .single();

          // Fetch replies
          const { data: repliesData, error: repliesError } = await supabase
            .from('comments')
            .select('*')
            .eq('parent_id', comment.id)
            .order('created_at', { ascending: true });

          if (repliesError) throw repliesError;

          // Fetch profiles for replies
          const repliesWithProfiles = await Promise.all(
            (repliesData || []).map(async (reply) => {
              const { data: replyProfile } = await supabase
                .from('profiles')
                .select('username, display_name')
                .eq('user_id', reply.user_id)
                .single();

              return {
                ...reply,
                profiles: replyProfile
              };
            })
          );

          return {
            ...comment,
            profiles: profile,
            replies: repliesWithProfiles
          };
        })
      );

      setComments(commentsWithReplies);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch comments',
        variant: 'destructive'
      });
    }
  };

  const postComment = async () => {
    if (!newComment.trim()) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          user_id: userId,
          content: newComment.trim(),
          parent_id: null
        });

      if (error) throw error;

      setNewComment('');
      toast({
        title: 'Success',
        description: 'Comment posted successfully',
      });
      fetchComments();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to post comment',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const postReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          user_id: userId,
          content: replyContent.trim(),
          parent_id: parentId
        });

      if (error) throw error;

      setReplyContent('');
      setReplyTo(null);
      toast({
        title: 'Success',
        description: 'Reply posted successfully',
      });
      fetchComments();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to post reply',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Comment deleted successfully',
      });
      fetchComments();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete comment',
        variant: 'destructive'
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const getUserDisplayName = (comment: Comment) => {
    return comment.profiles?.username || 
           comment.profiles?.display_name || 
           'Anonymous User';
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">Community Discussion</h2>
        <p className="text-muted-foreground">
          Share your thoughts, ask questions, and connect with the community
        </p>
      </div>

      {/* New Comment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Start a Discussion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts, ask a question, or start a discussion..."
            className="min-h-[100px]"
          />
          <div className="flex justify-end">
            <Button 
              onClick={postComment}
              disabled={!newComment.trim() || isLoading}
            >
              <Send className="h-4 w-4 mr-2" />
              Post Comment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <Card key={comment.id}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Main Comment */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {getUserDisplayName(comment).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold">{getUserDisplayName(comment)}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(comment.created_at)}
                        </div>
                      </div>
                    </div>
                    
                    {comment.user_id === userId && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => deleteComment(comment.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  
                  <p className="text-sm leading-relaxed">{comment.content}</p>
                  
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                    >
                      <Reply className="h-4 w-4 mr-1" />
                      Reply
                    </Button>
                    
                    {comment.replies && comment.replies.length > 0 && (
                      <Badge variant="secondary">
                        {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Reply Form */}
                {replyTo === comment.id && (
                  <div className="ml-8 space-y-3 border-l-2 border-muted pl-4">
                    <Textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Write your reply..."
                      className="min-h-[80px]"
                    />
                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        onClick={() => postReply(comment.id)}
                        disabled={!replyContent.trim() || isLoading}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Reply
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setReplyTo(null);
                          setReplyContent('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-8 space-y-3 border-l-2 border-muted pl-4">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-secondary/50 rounded-full flex items-center justify-center">
                              <span className="text-xs font-semibold">
                                {getUserDisplayName(reply).charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-sm">{getUserDisplayName(reply)}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatDate(reply.created_at)}
                              </div>
                            </div>
                          </div>
                          
                          {reply.user_id === userId && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => deleteComment(reply.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed ml-9">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {comments.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Discussions Yet</h3>
              <p className="text-muted-foreground">
                Be the first to start a conversation in our community!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CommentSection;