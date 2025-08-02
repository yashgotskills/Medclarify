import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, TrendingUp, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface UserStatsProps {
  userId: string;
}

const UserStats: React.FC<UserStatsProps> = ({ userId }) => {
  const [userReportCount, setUserReportCount] = useState(0);
  const [totalReportCount, setTotalReportCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState<string>('');

  useEffect(() => {
    fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    try {
      // Get user's report count
      const { data: userReports, error: userError } = await supabase
        .from('reports')
        .select('id, upload_timestamp')
        .eq('user_id', userId);

      if (userError) throw userError;

      setUserReportCount(userReports?.length || 0);
      
      if (userReports && userReports.length > 0) {
        const lastReport = userReports[0];
        const lastDate = new Date(lastReport.upload_timestamp);
        setRecentActivity(lastDate.toLocaleDateString());
      }

      // Get total report count from all users
      const { count: totalCount, error: totalError } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;
      
      setTotalReportCount(totalCount || 0);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const stats = [
    {
      title: 'Your Reports',
      value: userReportCount,
      icon: <FileText className="w-5 h-5" />,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: 'Total Platform Reports',
      value: totalReportCount.toLocaleString(),
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10'
    },
    {
      title: 'Last Activity',
      value: recentActivity || 'No activity yet',
      icon: <Calendar className="w-5 h-5" />,
      color: 'text-accent',
      bgColor: 'bg-accent/10'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.bgColor}`}>
              <div className={stat.color}>
                {stat.icon}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default UserStats;