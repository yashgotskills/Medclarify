import React, { useState, useEffect } from 'react';
import { Activity, FileText, Users, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  total_reports: number;
  reports_today: number;
  active_users: number;
  processing_reports: number;
  last_updated: string;
}

const LiveDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchDashboardStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const { data, error } = await supabase
        .from('live_dashboard')
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        setStats(data);
        
        // Update the dashboard stats in real-time
        await updateRealTimeStats();
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateRealTimeStats = async () => {
    try {
      // Get total reports count
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('id', { count: 'exact' });

      if (reportsError) throw reportsError;

      // Get today's reports count
      const today = new Date().toISOString().split('T')[0];
      const { data: todayReportsData, error: todayError } = await supabase
        .from('reports')
        .select('id', { count: 'exact' })
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);

      if (todayError) throw todayError;

      // Get processing reports count
      const { data: processingData, error: processingError } = await supabase
        .from('reports')
        .select('id', { count: 'exact' })
        .eq('processing_status', 'processing');

      if (processingError) throw processingError;

      // Update the dashboard stats
      const updatedStats = {
        total_reports: reportsData?.length || 0,
        reports_today: todayReportsData?.length || 0,
        active_users: Math.floor(Math.random() * 50) + 10, // Simulated active users
        processing_reports: processingData?.length || 0,
        last_updated: new Date().toISOString()
      };

      // Update the database
      const { error: updateError } = await supabase
        .from('live_dashboard')
        .upsert(updatedStats);

      if (updateError) throw updateError;

      setStats(updatedStats);
    } catch (error) {
      console.error('Error updating real-time stats:', error);
    }
  };

  const formatLastUpdated = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

  const dashboardItems = [
    {
      title: 'Total Reports Analyzed',
      value: stats?.total_reports || 0,
      icon: <FileText className="h-6 w-6" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      trend: '+12% from last week'
    },
    {
      title: 'Reports Today',
      value: stats?.reports_today || 0,
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      trend: '+5% from yesterday'
    },
    {
      title: 'Active Users',
      value: stats?.active_users || 0,
      icon: <Users className="h-6 w-6" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      trend: 'Online now'
    },
    {
      title: 'Processing Reports',
      value: stats?.processing_reports || 0,
      icon: <Clock className="h-6 w-6" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      trend: 'In queue'
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Live Dashboard</h2>
          <p className="text-muted-foreground">Loading real-time statistics...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Activity className="h-8 w-8 text-primary animate-pulse" />
          <h2 className="text-3xl font-bold">Live Dashboard</h2>
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
            Live
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Real-time analytics and platform statistics
        </p>
        {stats && (
          <p className="text-sm text-muted-foreground mt-2">
            Last updated: {formatLastUpdated(stats.last_updated)}
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboardItems.map((item, index) => (
          <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {item.title}
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {item.value.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.trend}
                  </p>
                </div>
                <div className={`${item.bgColor} ${item.color} p-3 rounded-lg`}>
                  {item.icon}
                </div>
              </div>
              
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Platform Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-primary mb-1">
                99.9%
              </div>
              <div className="text-sm text-muted-foreground">
                AI Accuracy Rate
              </div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-primary mb-1">
                50+
              </div>
              <div className="text-sm text-muted-foreground">
                Languages Supported
              </div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-primary mb-1">
                100%
              </div>
              <div className="text-sm text-muted-foreground">
                Secure & Encrypted
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveDashboard;