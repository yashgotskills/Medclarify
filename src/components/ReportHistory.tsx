import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, Download, Eye, Trash2, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Report {
  id: string;
  title: string;
  original_filename: string;
  processing_status: string;
  upload_timestamp: string;
  ai_summary?: string;
}

interface ReportHistoryProps {
  userId: string;
  onViewReport: (report: Report) => void;
}

const ReportHistory: React.FC<ReportHistoryProps> = ({ userId, onViewReport }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchReports();
  }, [userId]);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', userId)
        .order('upload_timestamp', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch reports",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      setReports(reports.filter(report => report.id !== reportId));
      toast({
        title: "Success",
        description: "Report deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete report",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success/10 text-success border-success/20';
      case 'processing': return 'bg-warning/10 text-warning border-warning/20';
      case 'failed': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-muted';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4 mx-auto"></div>
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded"></div>
              <div className="h-3 bg-muted rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Reports Yet</h3>
          <p className="text-muted-foreground">
            Upload your first medical report to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Your Reports</h3>
        <Badge variant="outline" className="text-sm">
          {reports.length} {reports.length === 1 ? 'Report' : 'Reports'}
        </Badge>
      </div>

      <div className="grid gap-4">
        {reports.map((report) => (
          <Card key={report.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base">{report.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{report.original_filename}</p>
                </div>
                <Badge variant="outline" className={getStatusColor(report.processing_status)}>
                  {report.processing_status}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDistanceToNow(new Date(report.upload_timestamp), { addSuffix: true })}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewReport(report)}
                    disabled={report.processing_status !== 'completed'}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={report.processing_status !== 'completed'}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteReport(report.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {report.ai_summary && (
                <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {report.ai_summary.substring(0, 150)}...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ReportHistory;