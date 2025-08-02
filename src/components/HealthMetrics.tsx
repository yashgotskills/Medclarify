import React from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface HealthMetric {
  name: string;
  value: string;
  normalRange: string;
  status: 'normal' | 'low' | 'high' | 'critical';
  unit: string;
  trend?: 'up' | 'down' | 'stable';
  explanation: string;
}

interface HealthMetricsProps {
  metrics: HealthMetric[];
  className?: string;
}

const HealthMetrics: React.FC<HealthMetricsProps> = ({ metrics, className }) => {
  const getStatusColor = (status: HealthMetric['status']) => {
    switch (status) {
      case 'normal': return 'bg-success/10 text-success border-success/20';
      case 'low': return 'bg-warning/10 text-warning border-warning/20';
      case 'high': return 'bg-warning/10 text-warning border-warning/20';
      case 'critical': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const getStatusIcon = (status: HealthMetric['status']) => {
    switch (status) {
      case 'normal': return null;
      case 'low': return <TrendingDown className="w-4 h-4" />;
      case 'high': return <TrendingUp className="w-4 h-4" />;
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      default: return null;
    }
  };

  const getTrendIcon = (trend?: HealthMetric['trend']) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-3 h-3 text-muted-foreground" />;
      case 'down': return <TrendingDown className="w-3 h-3 text-muted-foreground" />;
      case 'stable': return <Minus className="w-3 h-3 text-muted-foreground" />;
      default: return null;
    }
  };

  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-3", className)}>
      {metrics.map((metric, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.name}
              </CardTitle>
              <Badge 
                variant="outline" 
                className={cn("capitalize text-xs", getStatusColor(metric.status))}
              >
                {getStatusIcon(metric.status)}
                {metric.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold">{metric.value}</span>
                <span className="text-sm text-muted-foreground">{metric.unit}</span>
                {getTrendIcon(metric.trend)}
              </div>
              
              <div className="text-xs text-muted-foreground">
                Normal: {metric.normalRange}
              </div>
              
              <p className="text-sm leading-relaxed">{metric.explanation}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default HealthMetrics;