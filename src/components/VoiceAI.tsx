import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, User, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useConversation } from '@11labs/react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

const VoiceAI = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hey there! I\'m your AI companion. I can chat about anything - from tech to travel, philosophy to fun facts. I also have voice capabilities! How can I help you today?',
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Voice recognition setup
  const recognition = useRef<any>(null);

  useEffect(() => {
    // Setup speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;

      recognition.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setInputMessage(transcript);
      };

      recognition.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startListening = () => {
    if (recognition.current) {
      setIsListening(true);
      recognition.current.start();
    }
  };

  const stopListening = () => {
    if (recognition.current) {
      setIsListening(false);
      recognition.current.stop();
    }
  };

  const speakResponse = (text: string) => {
    if (!isMuted && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      speechSynthesis.speak(utterance);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    stopListening();

    try {
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          message: inputMessage,
          conversationHistory: messages.slice(-10),
          systemPrompt: "You are a friendly AI assistant. You can discuss any topic - technology, science, philosophy, entertainment, daily life, etc. Be conversational, helpful, and engaging. Keep responses concise but informative."
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || 'I apologize, but I couldn\'t process your request at the moment. Please try again.',
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Speak the response if not muted
      if (!isMuted) {
        speakResponse(assistantMessage.content);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to get response from AI assistant',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-neon z-50 animate-glow-pulse bg-gradient-primary border-0 ${isOpen ? 'hidden' : 'flex'}`}
        size="icon"
      >
        <Bot className="h-8 w-8" />
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[650px] shadow-elevated z-50 flex flex-col bg-gradient-card border-primary/20 animate-slide-up">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-primary/20">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary animate-glow-pulse" />
              <span className="bg-gradient-primary bg-clip-text text-transparent">AI Assistant</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs bg-primary/20 text-primary border-primary/30">
                Voice Enabled
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
                className="h-8 w-8 text-muted-foreground hover:text-primary"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-muted-foreground hover:text-primary"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl p-3 ${
                          message.role === 'user'
                            ? 'bg-gradient-primary text-primary-foreground shadow-neon'
                            : 'bg-muted/50 border border-primary/20'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {message.role === 'assistant' && (
                            <Bot className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                          )}
                          {message.role === 'user' && (
                            <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="text-sm whitespace-pre-wrap break-words">{message.content}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start animate-fade-in">
                      <div className="bg-muted/50 border border-primary/20 rounded-xl p-3 max-w-[85%]">
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4 text-primary animate-glow-pulse" />
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </div>
            
            {/* Input Area */}
            <div className="flex-shrink-0 p-4 border-t border-primary/20 bg-background/50 backdrop-blur-sm">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type or speak your message..."
                    disabled={isLoading}
                    className="pr-12 bg-muted/50 border-primary/20 focus:border-primary"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={isListening ? stopListening : startListening}
                    className={`absolute right-1 top-1 h-8 w-8 ${isListening ? 'text-destructive animate-glow-pulse' : 'text-muted-foreground hover:text-primary'}`}
                    disabled={isLoading}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </div>
                <Button 
                  onClick={sendMessage} 
                  disabled={!inputMessage.trim() || isLoading}
                  size="icon"
                  className="bg-gradient-primary border-0 shadow-neon hover:shadow-elevated transition-all duration-300"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground mt-2 text-center">
                {isListening ? (
                  <span className="text-destructive">🎤 Listening...</span>
                ) : (
                  <span>Click mic to speak or type your message</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default VoiceAI;