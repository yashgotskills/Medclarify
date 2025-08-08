import React, { useState, useEffect } from 'react';
import { Zap, ArrowRight, FileText, BarChart3, MessageCircle, LogOut, User as UserIcon, Trophy, Activity, Users, Bot, Sparkles, Rocket, Globe, Brain, Shield, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FileUpload from '@/components/FileUpload';
import AnalysisResults from '@/components/AnalysisResults';
import AuthModal from '@/components/AuthModal';
import LanguageSelector from '@/components/LanguageSelector';
import ReportHistory from '@/components/ReportHistory';
import UserStats from '@/components/UserStats';
import VoiceAI from '@/components/VoiceAI';
import ChallengeSection from '@/components/ChallengeSection';
import CommentSection from '@/components/CommentSection';
import LiveDashboard from '@/components/LiveDashboard';
import heroImage from '@/assets/futuristic-hero.jpg';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { User, Session } from '@supabase/supabase-js';

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analysisStarted, setAnalysisStarted] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [currentView, setCurrentView] = useState<'upload' | 'history' | 'challenges' | 'comments' | 'dashboard'>('upload');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleFileUpload = async (file: File, fileUrl?: string) => {
    if (!user) return;

    setUploadedFile(file);
    setAnalysisStarted(true);
    setAnalysisComplete(false);

    try {
      // Save report to database
      const { data: reportData, error: dbError } = await supabase
        .from('reports')
        .insert({
          user_id: user.id,
          title: `Medical Report - ${new Date().toLocaleDateString()}`,
          original_filename: file.name,
          file_url: fileUrl,
          file_type: file.type,
          processing_status: 'processing'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Extract text from file
      let textContent = '';
      if (file.type === 'application/pdf') {
        // For PDF files, we'll need a PDF parser
        textContent = 'PDF parsing not implemented - using sample text for demo';
      } else if (file.type.startsWith('image/')) {
        // For images, we'll use OCR
        textContent = 'OCR not implemented - using sample text for demo';
      } else {
        // For text files
        textContent = await file.text();
      }

      // Analyze with Gemini API
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
        'analyze-medical-report',
        {
          body: {
            text: textContent || 'Sample medical report text for analysis demonstration. Hemoglobin: 11.2 g/dL (Low), WBC: 8500/μL (Normal), Cholesterol: 220 mg/dL (High)',
            language: selectedLanguage
          }
        }
      );

      if (analysisError) throw analysisError;

      // Update report with analysis results
      const { error: updateError } = await supabase
        .from('reports')
        .update({
          ai_analysis: JSON.stringify(analysisData.analysis),
          ai_summary: analysisData.analysis.summary,
          processing_status: 'completed'
        })
        .eq('id', reportData.id);

      if (updateError) throw updateError;

      setAnalysisResults(analysisData.analysis);
      setAnalysisComplete(true);

    } catch (error: any) {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze medical report",
        variant: "destructive",
      });
      setAnalysisStarted(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    } else {
      setUser(null);
      setSession(null);
      setAnalysisStarted(false);
      setAnalysisComplete(false);
      setSelectedReport(null);
      toast({
        title: "Success",
        description: "Signed out successfully",
      });
    }
  };

  const handleViewReport = (report: any) => {
    setSelectedReport(report);
    setCurrentView('upload');
    if (report.ai_analysis) {
      try {
        const analysis = JSON.parse(report.ai_analysis);
        setAnalysisResults(analysis);
        setAnalysisComplete(true);
        setAnalysisStarted(true);
      } catch (error) {
        console.error('Error parsing analysis:', error);
      }
    }
  };

  const features = [
    {
      icon: <Bot className="w-6 h-6" />,
      title: "Voice AI Assistant",
      description: "Talk naturally with AI - voice-enabled conversations about anything"
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "Smart Analytics",
      description: "Advanced AI processes and analyzes your data intelligently"
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Real-time Insights",
      description: "Get instant AI-powered insights and recommendations"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Universal Platform",
      description: "One platform for all your AI-powered productivity needs"
    }
  ];

  const benefits = [
    "Voice-enabled AI conversations for natural interactions",
    "Multi-modal AI processing for documents, images, and voice", 
    "Real-time analytics and intelligent insights",
    "Seamless workflow automation with AI assistance"
  ];

  if (user && (analysisStarted || selectedReport)) {
    return (
      <div className="min-h-screen bg-gradient-bg">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-neon">
                  <Bot className="w-6 h-6 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">NexusAI</h1>
              </div>
              <Badge variant="outline" className="bg-primary/20 text-primary border-primary/40 shadow-card">
                Next-Gen AI Platform
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <LanguageSelector value={selectedLanguage} onValueChange={setSelectedLanguage} />
              <Button
                variant="outline"
                onClick={() => {
                  setAnalysisStarted(false);
                  setAnalysisComplete(false);
                  setSelectedReport(null);
                  setCurrentView('upload');
                }}
                className="border-primary/40 text-primary hover:bg-primary/10"
              >
                New Analysis
              </Button>
              <Button variant="ghost" onClick={handleSignOut} className="hover:bg-primary/10">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>

          <AnalysisResults 
            fileName={selectedReport?.original_filename || uploadedFile?.name || ''} 
            analysisComplete={analysisComplete}
            analysisResults={analysisResults}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-bg relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-glow opacity-30 pointer-events-none"></div>
      <div className="absolute top-20 left-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-20 w-64 h-64 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <header className="text-center mb-16">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-neon animate-glow-pulse">
                <Bot className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">NexusAI</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <LanguageSelector value={selectedLanguage} onValueChange={setSelectedLanguage} />
              {user ? (
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" onClick={handleSignOut} className="hover:bg-primary/10">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <AuthModal>
                  <Button variant="outline" className="border-primary/40 text-primary hover:bg-primary/10">
                    <UserIcon className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                </AuthModal>
              )}
            </div>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <h2 className="text-5xl md:text-7xl font-bold leading-tight">
              Next-Level
              <span className="bg-gradient-primary bg-clip-text text-transparent"> AI Platform </span>
              for Everything
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Experience the future of AI interaction. Voice-enabled conversations, intelligent document processing, 
              and seamless workflow automation - all in one powerful platform.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <Badge variant="secondary" className="text-sm bg-primary/20 text-primary border-primary/40 shadow-card animate-fade-in">
              <Bot className="w-3 h-3 mr-1" />
              Voice AI
            </Badge>
            <Badge variant="secondary" className="text-sm bg-secondary/20 text-secondary border-secondary/40 shadow-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <Brain className="w-3 h-3 mr-1" />
              Smart Processing
            </Badge>
            <Badge variant="secondary" className="text-sm bg-accent/20 text-accent border-accent/40 shadow-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <Shield className="w-3 h-3 mr-1" />
              Secure & Private
            </Badge>
            <Badge variant="secondary" className="text-sm bg-warning/20 text-warning border-warning/40 shadow-card animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <Zap className="w-3 h-3 mr-1" />
              Lightning Fast
            </Badge>
          </div>
        </header>

        {user ? (
          <div className="mb-16">
            <UserStats userId={user.id} />
          </div>
        ) : null}

        {/* Main Content */}
        {user ? (
          <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as typeof currentView)} className="mb-16">
            <TabsList className="grid w-full grid-cols-5 max-w-5xl mx-auto bg-card/50 backdrop-blur-sm border border-primary/20 shadow-card">
              <TabsTrigger value="upload" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">AI Processing</TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">History</TabsTrigger>
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Dashboard</TabsTrigger>
              <TabsTrigger value="challenges" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Challenges</TabsTrigger>
              <TabsTrigger value="comments" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Community</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-8">
              <section>
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <div className="order-2 lg:order-1">
                    <div className="relative">
                      <img 
                        src={heroImage} 
                        alt="Futuristic AI interface" 
                        className="w-full h-auto rounded-3xl shadow-elevated border border-primary/20"
                      />
                      <div className="absolute inset-0 bg-gradient-primary/20 rounded-3xl"></div>
                    </div>
                  </div>
                  
                  <div className="order-1 lg:order-2 space-y-6">
                    <Card className="p-8 bg-gradient-card border border-primary/20 shadow-elevated">
                      <CardContent className="space-y-6">
                        <div className="text-center">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-4 shadow-neon animate-glow-pulse">
                            <Rocket className="w-8 h-8 text-primary-foreground" />
                          </div>
                          <h3 className="text-2xl font-bold mb-2">AI-Powered Processing</h3>
                          <p className="text-muted-foreground">Upload any document for intelligent analysis</p>
                        </div>
                        <FileUpload onFileUpload={handleFileUpload} userId={user.id} />
                      </CardContent>
                    </Card>
                    
                    <div className="text-center text-sm text-muted-foreground">
                      <Shield className="w-4 h-4 inline mr-1 text-accent" />
                      Your data is processed securely with enterprise-grade encryption
                    </div>
                  </div>
                </div>
              </section>
            </TabsContent>

            <TabsContent value="history" className="mt-8">
              <ReportHistory userId={user.id} onViewReport={handleViewReport} />
            </TabsContent>

            <TabsContent value="dashboard" className="mt-8">
              <LiveDashboard />
            </TabsContent>

            <TabsContent value="challenges" className="mt-8">
              <ChallengeSection userId={user.id} />
            </TabsContent>

            <TabsContent value="comments" className="mt-8">
              <CommentSection userId={user.id} />
            </TabsContent>
          </Tabs>
        ) : (
          <section className="mb-16">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="relative">
                  <img 
                    src={heroImage} 
                    alt="Futuristic AI interface" 
                    className="w-full h-auto rounded-3xl shadow-elevated border border-primary/20"
                  />
                  <div className="absolute inset-0 bg-gradient-primary/20 rounded-3xl"></div>
                </div>
              </div>
              
              <div className="order-1 lg:order-2 space-y-6">
                <Card className="p-8 text-center bg-gradient-card border border-primary/20 shadow-elevated">
                  <CardContent className="space-y-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto shadow-neon animate-glow-pulse">
                      <UserIcon className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h3 className="text-2xl font-bold">Join the Future</h3>
                    <p className="text-muted-foreground">
                      Sign in to access next-generation AI capabilities
                    </p>
                    <AuthModal>
                      <Button size="lg" className="w-full bg-gradient-primary border-0 shadow-neon hover:shadow-elevated transition-all duration-300">
                        <UserIcon className="w-4 h-4 mr-2" />
                        Enter NexusAI
                      </Button>
                    </AuthModal>
                  </CardContent>
                </Card>
                
                <div className="text-center text-sm text-muted-foreground">
                  <Shield className="w-4 h-4 inline mr-1 text-accent" />
                  Your data is processed securely with enterprise-grade encryption
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Features */}
        <section className="mb-16">
          <div className="text-center mb-12 animate-fade-in">
            <h3 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">Revolutionary AI Features</h3>
            <p className="text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed">
              Experience cutting-edge AI capabilities that transform how you work, communicate, and process information
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-elevated transition-all duration-300 border border-primary/20 bg-gradient-card shadow-card group animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardContent className="pt-6">
                  <div className="w-14 h-14 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-neon group-hover:animate-glow-pulse transition-all duration-300">
                    <div className="text-primary-foreground">{feature.icon}</div>
                  </div>
                  <h4 className="font-semibold mb-3 text-lg">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section className="mb-16">
          <Card className="p-8 bg-gradient-card border border-primary/20 shadow-elevated relative overflow-hidden animate-fade-in">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-primary/20 rounded-full blur-3xl"></div>
            <div className="grid lg:grid-cols-2 gap-8 items-center relative z-10">
              <div>
                <h3 className="text-3xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">Why Choose NexusAI?</h3>
                <div className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start space-x-3 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                      <div className="w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-neon">
                        <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                      </div>
                      <span className="leading-relaxed">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-gradient-card border border-primary/20 rounded-2xl p-8 shadow-card">
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 bg-gradient-primary rounded-3xl flex items-center justify-center mx-auto shadow-neon animate-glow-pulse">
                    <Rocket className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <h4 className="font-semibold text-xl">Launch Into the Future</h4>
                  <p className="text-muted-foreground">
                    Experience next-generation AI capabilities in seconds
                  </p>
                  {user ? (
                    <Button 
                      size="lg" 
                      className="w-full bg-gradient-primary border-0 shadow-neon hover:shadow-elevated transition-all duration-300" 
                      onClick={() => setCurrentView('upload')}
                    >
                      Start Your AI Journey
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <AuthModal>
                      <Button 
                        size="lg" 
                        className="w-full bg-gradient-primary border-0 shadow-neon hover:shadow-elevated transition-all duration-300"
                      >
                        Enter the Future
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </AuthModal>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </section>

        <VoiceAI />

        {/* CTA Section */}
        <section className="text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h3 className="text-3xl font-bold">Ready to Understand Your Health?</h3>
            <p className="text-muted-foreground text-lg">
              Join thousands who've already simplified their medical reports with MedClarity
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Button variant="default" size="xl" onClick={() => setCurrentView('upload')}>
                  <FileText className="w-5 h-5 mr-2" />
                  Start Analysis
                </Button>
              ) : (
                <AuthModal>
                  <Button variant="default" size="xl">
                    <FileText className="w-5 h-5 mr-2" />
                    Start Analysis
                  </Button>
                </AuthModal>
              )}
              <Button variant="outline" size="xl">
                <Download className="w-5 h-5 mr-2" />
                See Sample Report
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Index;