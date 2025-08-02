import React from 'react';
import { Brain, FileText, TrendingUp, Download, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import HealthMetrics from './HealthMetrics';
import HealthCharts from './HealthCharts';

interface AnalysisResultsProps {
  fileName: string;
  analysisComplete: boolean;
  analysisResults?: any;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ fileName, analysisComplete, analysisResults }) => {
  // Mock data for demonstration
  const mockMetrics = [
    {
      name: 'Hemoglobin',
      value: '11.2',
      normalRange: '12.0-15.5',
      status: 'low' as const,
      unit: 'g/dL',
      trend: 'down' as const,
      explanation: 'Your hemoglobin is slightly below normal range, which may indicate mild anemia. Consider iron-rich foods and consult your doctor.'
    },
    {
      name: 'White Blood Cells',
      value: '8,500',
      normalRange: '4,000-11,000',
      status: 'normal' as const,
      unit: '/μL',
      trend: 'stable' as const,
      explanation: 'Your white blood cell count is within normal range, indicating a healthy immune system.'
    },
    {
      name: 'Cholesterol',
      value: '220',
      normalRange: '<200',
      status: 'high' as const,
      unit: 'mg/dL',
      trend: 'up' as const,
      explanation: 'Your cholesterol is elevated. Consider reducing saturated fats and increasing fiber in your diet.'
    },
    {
      name: 'Blood Sugar',
      value: '95',
      normalRange: '70-99',
      status: 'normal' as const,
      unit: 'mg/dL',
      trend: 'stable' as const,
      explanation: 'Your blood sugar level is excellent and within the healthy range.'
    },
    {
      name: 'Creatinine',
      value: '1.3',
      normalRange: '0.6-1.2',
      status: 'high' as const,
      unit: 'mg/dL',
      trend: 'up' as const,
      explanation: 'Slightly elevated creatinine may indicate mild kidney function change. Stay hydrated and follow up with your doctor.'
    },
    {
      name: 'Vitamin D',
      value: '18',
      normalRange: '30-100',
      status: 'low' as const,
      unit: 'ng/mL',
      trend: 'down' as const,
      explanation: 'Your vitamin D is deficient. Consider supplements and more sunlight exposure after consulting your doctor.'
    }
  ];

  // Use real analysis results or fallback to mock data
  const actualMetrics = analysisResults?.keyFindings?.map((finding: any) => ({
    name: finding.metric,
    value: finding.value,
    normalRange: finding.normalRange,
    status: finding.status,
    unit: '',
    explanation: finding.explanation
  })) || mockMetrics;

  const aiInsights = analysisResults?.recommendations || [
    "Your blood work shows mostly normal values with a few areas for attention.",
    "The low hemoglobin and vitamin D levels suggest you may benefit from dietary changes and supplements.",
    "Your kidney function shows a slight elevation in creatinine - monitor hydration and follow up.",
    "Overall cardiovascular health looks good, but cholesterol management would be beneficial."
  ];

  if (!analysisComplete) {
    return (
      <Card className="mb-8">
        <CardContent className="p-12 text-center">
          <div className="animate-pulse space-y-4">
            <Brain className="w-16 h-16 text-primary mx-auto animate-bounce" />
            <div>
              <h3 className="text-xl font-semibold text-primary">AI is Analyzing Your Report</h3>
              <p className="text-muted-foreground mt-2">
                Processing {fileName} with advanced medical NLP...
              </p>
            </div>
            <div className="w-64 h-2 bg-muted rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-primary-muted animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analysis Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                <Brain className="w-5 h-5 text-success" />
              </div>
              <div>
                <CardTitle>Analysis Complete</CardTitle>
                <p className="text-sm text-muted-foreground">{fileName}</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              ✓ Processed
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* AI Summary */}
      {analysisResults?.summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-primary" />
              <span>AI Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{analysisResults.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            <span>AI Health Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {aiInsights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-primary/5 rounded-lg">
                <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-primary">{index + 1}</span>
                </div>
                <p className="text-sm leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Concerns */}
      {analysisResults?.concerns?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-warning">
              <MessageCircle className="w-5 h-5" />
              <span>Areas of Concern</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysisResults.concerns.map((concern: string, index: number) => (
                <div key={index} className="flex items-start space-x-2 p-3 bg-warning/10 rounded-lg">
                  <div className="w-2 h-2 bg-warning rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm leading-relaxed">{concern}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Tabs */}
      <Tabs defaultValue="metrics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="metrics" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Health Metrics</span>
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Visual Analysis</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metrics">
          <HealthMetrics metrics={actualMetrics} />
        </TabsContent>

        <TabsContent value="charts">
          <HealthCharts metrics={actualMetrics} />
        </TabsContent>
      </Tabs>

      {/* Disclaimer */}
      {analysisResults?.disclaimer && (
        <Card className="border-muted bg-muted/30">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>Disclaimer:</strong> {analysisResults.disclaimer}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button variant="default" size="lg" className="flex-1">
          <Download className="w-4 h-4 mr-2" />
          Download Report Summary
        </Button>
        <Button variant="outline" size="lg" className="flex-1">
          <MessageCircle className="w-4 h-4 mr-2" />
          Ask AI Questions
        </Button>
      </div>
    </div>
  );
};

export default AnalysisResults;