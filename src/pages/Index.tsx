import React, { useState, useEffect } from 'react';
import { Stethoscope, Brain, Shield, Zap, ArrowRight, FileText, BarChart3, MessageCircle, Download, LogOut, User as UserIcon, Trophy, Activity, Users } from 'lucide-react';
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
import Chatbot from '@/components/Chatbot';
import ChallengeSection from '@/components/ChallengeSection';
import CommentSection from '@/components/CommentSection';
import LiveDashboard from '@/components/LiveDashboard';
import heroImage from '@/assets/medclarity-hero.png';
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
      icon: <FileText className="w-6 h-6" />,
      title: "Smart Upload",
      description: "PDF, images, or text - our AI reads all formats instantly"
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI Analysis",
      description: "Advanced medical NLP breaks down complex reports into simple insights"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Visual Dashboard",
      description: "Beautiful charts show your health metrics at a glance"
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Ask Questions",
      description: "Chat with AI about your results and get personalized advice"
    }
  ];

  const benefits = [
    "Understand your health reports in plain English",
    "Get instant insights without waiting for doctor visits", 
    "Track your health trends over time",
    "Download simplified reports to share with family"
  ];

  if (user && (analysisStarted || selectedReport)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Stethoscope className="w-8 h-8 text-primary" />
                <h1 className="text-2xl font-bold text-primary">MedClarity</h1>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                AI-Powered Medical Report Analysis
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
              >
                New Analysis
              </Button>
              <Button variant="ghost" onClick={handleSignOut}>
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
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-16">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Stethoscope className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-primary">MedClarity</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <LanguageSelector value={selectedLanguage} onValueChange={setSelectedLanguage} />
              {user ? (
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <AuthModal>
                  <Button variant="outline">
                    <UserIcon className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                </AuthModal>
              )}
            </div>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              Understand Your
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"> Medical Reports </span>
              Instantly
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Upload any medical report and get AI-powered insights in simple, human-readable language. 
              No more confusion about your health metrics.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-6">
            <Badge variant="secondary" className="text-sm">✨ AI-Powered</Badge>
            <Badge variant="secondary" className="text-sm">🔒 Secure & Private</Badge>
            <Badge variant="secondary" className="text-sm">📱 Mobile Friendly</Badge>
            <Badge variant="secondary" className="text-sm">⚡ Instant Results</Badge>
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
            <TabsList className="grid w-full grid-cols-5 max-w-4xl mx-auto">
              <TabsTrigger value="upload">Upload Report</TabsTrigger>
              <TabsTrigger value="history">Report History</TabsTrigger>
              <TabsTrigger value="dashboard">Live Dashboard</TabsTrigger>
              <TabsTrigger value="challenges">Challenges</TabsTrigger>
              <TabsTrigger value="comments">Community</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-8">
              <section>
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <div className="order-2 lg:order-1">
                    <img 
                      src={heroImage} 
                      alt="Medical analysis dashboard" 
                      className="w-full h-auto rounded-2xl shadow-2xl"
                    />
                  </div>
                  
                  <div className="order-1 lg:order-2 space-y-6">
                    <FileUpload onFileUpload={handleFileUpload} userId={user.id} />
                    
                    <div className="text-center text-sm text-muted-foreground">
                      <Shield className="w-4 h-4 inline mr-1" />
                      Your reports are processed securely with end-to-end encryption
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
                <img 
                  src={heroImage} 
                  alt="Medical analysis dashboard" 
                  className="w-full h-auto rounded-2xl shadow-2xl"
                />
              </div>
              
              <div className="order-1 lg:order-2 space-y-6">
                <Card className="p-8 text-center">
                  <CardContent className="space-y-4">
                    <h3 className="text-xl font-semibold">Sign In Required</h3>
                    <p className="text-muted-foreground">
                      Please sign in to upload and analyze your medical reports
                    </p>
                    <AuthModal>
                      <Button size="lg" className="w-full">
                        <UserIcon className="w-4 h-4 mr-2" />
                        Sign In to Continue
                      </Button>
                    </AuthModal>
                  </CardContent>
                </Card>
                
                <div className="text-center text-sm text-muted-foreground">
                  <Shield className="w-4 h-4 inline mr-1" />
                  Your reports are processed securely with end-to-end encryption
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Features */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">How MedClarity Works</h3>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Our advanced AI transforms complex medical jargon into clear, actionable insights
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-lg transition-all duration-200 border-0 bg-white/60 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <div className="text-primary">{feature.icon}</div>
                  </div>
                  <h4 className="font-semibold mb-2">{feature.title}</h4>
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
          <Card className="p-8 bg-gradient-to-r from-primary/5 to-secondary/5 border-0">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-6">Why Choose MedClarity?</h3>
                <div className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-success/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 bg-success rounded-full" />
                      </div>
                      <span className="text-sm leading-relaxed">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Zap className="w-8 h-8 text-primary" />
                  </div>
                  <h4 className="font-semibold text-lg">Get Started in Seconds</h4>
                  <p className="text-sm text-muted-foreground">
                    Simply upload your report and let our AI do the rest
                  </p>
                  {user ? (
                    <Button variant="upload" size="lg" className="w-full" onClick={() => setCurrentView('upload')}>
                      Upload Your First Report
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <AuthModal>
                      <Button variant="upload" size="lg" className="w-full">
                        Get Started Now
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </AuthModal>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Chatbot Component */}
        {user && <Chatbot />}

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