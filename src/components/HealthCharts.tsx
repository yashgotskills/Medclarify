import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface HealthMetric {
  name: string;
  value: string;
  normalRange: string;
  status: 'normal' | 'low' | 'high' | 'critical';
  unit: string;
  trend?: 'up' | 'down' | 'stable';
  explanation: string;
}

interface HealthChartsProps {
  metrics: HealthMetric[];
}

const HealthCharts: React.FC<HealthChartsProps> = ({ metrics }) => {
  // Convert metrics to chart data
  const barChartData = metrics.map(metric => ({
    name: metric.name.split(' ').join('\n'),
    value: parseFloat(metric.value.replace(/,/g, '')),
    status: metric.status,
    unit: metric.unit
  }));

  const statusData = [
    { name: 'Normal', value: metrics.filter(m => m.status === 'normal').length, color: 'hsl(142 76% 36%)' },
    { name: 'Needs Attention', value: metrics.filter(m => m.status === 'high' || m.status === 'low').length, color: 'hsl(43 96% 56%)' },
    { name: 'Critical', value: metrics.filter(m => m.status === 'critical').length, color: 'hsl(0 84% 60%)' }
  ].filter(item => item.value > 0);

  const trendData = [
    { name: 'Previous', Hemoglobin: 10.8, Cholesterol: 195, 'Blood Sugar': 92 },
    { name: 'Current', Hemoglobin: 11.2, Cholesterol: 220, 'Blood Sugar': 95 },
  ];

  const getBarColor = (status: string) => {
    switch (status) {
      case 'normal': return 'hsl(142 76% 36%)';
      case 'low': return 'hsl(43 96% 56%)';
      case 'high': return 'hsl(43 96% 56%)';
      case 'critical': return 'hsl(0 84% 60%)';
      default: return 'hsl(220 9% 46%)';
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-border rounded-lg shadow-lg">
          <p className="font-medium">{label.replace('\n', ' ')}</p>
          <p className="text-sm text-muted-foreground">
            Value: {payload[0].value} {data.unit}
          </p>
          <p className="text-sm capitalize">
            Status: <span className={`font-medium ${
              data.status === 'normal' ? 'text-success' : 
              data.status === 'critical' ? 'text-destructive' : 'text-warning'
            }`}>{data.status}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid gap-6">
      {/* Health Status Overview */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Health Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`${value} metrics`, 'Count']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {statusData.map((entry, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span>{entry.name}: {entry.value} metrics</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Trend Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(220 9% 46%)"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(220 9% 46%)"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid hsl(220 13% 91%)',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Hemoglobin" 
                  stroke="hsl(213 94% 68%)" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(213 94% 68%)', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Cholesterol" 
                  stroke="hsl(43 96% 56%)" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(43 96% 56%)', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Blood Sugar" 
                  stroke="hsl(142 76% 36%)" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(142 76% 36%)', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detailed Health Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
              <XAxis 
                dataKey="name" 
                stroke="hsl(220 9% 46%)"
                fontSize={11}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                stroke="hsl(220 9% 46%)"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                radius={[4, 4, 0, 0]}
              >
                {barChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.status)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthCharts;