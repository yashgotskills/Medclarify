import React, { useState } from 'react';
import { Stethoscope, Brain, Shield, Zap, ArrowRight, FileText, BarChart3, MessageCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import FileUpload from '@/components/FileUpload';
import AnalysisResults from '@/components/AnalysisResults';
import heroImage from '@/assets/medclarity-hero.png';

const Index = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analysisStarted, setAnalysisStarted] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setAnalysisStarted(true);
    
    // Simulate analysis completion after 3 seconds
    setTimeout(() => {
      setAnalysisComplete(true);
    }, 3000);
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

  if (analysisStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Stethoscope className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold text-primary">MedClarity</h1>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              AI-Powered Medical Report Analysis
            </Badge>
          </div>

          <AnalysisResults 
            fileName={uploadedFile?.name || ''} 
            analysisComplete={analysisComplete} 
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
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Stethoscope className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-primary">MedClarity</h1>
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

        {/* Hero Image & Upload */}
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
              <FileUpload onFileUpload={handleFileUpload} />
              
              <div className="text-center text-sm text-muted-foreground">
                <Shield className="w-4 h-4 inline mr-1" />
                Your reports are processed securely and never stored
              </div>
            </div>
          </div>
        </section>

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
                  <Button variant="upload" size="lg" className="w-full">
                    Upload Your First Report
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h3 className="text-3xl font-bold">Ready to Understand Your Health?</h3>
            <p className="text-muted-foreground text-lg">
              Join thousands who've already simplified their medical reports with MedClarity
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="default" size="xl">
                <FileText className="w-5 h-5 mr-2" />
                Start Analysis
              </Button>
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