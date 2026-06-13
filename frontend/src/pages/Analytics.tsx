import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend, FunnelChart, Funnel, LabelList } from 'recharts';

const fetchChartsData = async () => {
  const { data } = await api.get('/analytics/charts');
  return data;
};

const Analytics = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['chartsData'],
    queryFn: fetchChartsData,
  });

  if (isLoading) return <div className="p-8 text-slate-500">Loading analytics...</div>;
  if (isError) return <div className="p-8 text-red-500">Failed to load analytics data.</div>;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Line Chart */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-slate-700">Revenue Trend (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.revenueTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={(value) => `₹${value}`} />
                  <RechartsTooltip formatter={(value) => [`₹${value}`, 'Revenue']} cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }} />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Funnel Chart */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-slate-700">Communication Lifecycle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                  <RechartsTooltip />
                  <Funnel
                    dataKey="value"
                    data={data?.funnel || []}
                    isAnimationActive
                  >
                    <LabelList position="right" fill="#475569" stroke="none" dataKey="name" />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Campaign Comparison Bar Chart */}
        <Card className="border-0 shadow-md lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-slate-700">Campaign Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.campaignComparison || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <RechartsTooltip cursor={{ fill: '#f1f5f9' }} />
                  <Legend />
                  <Bar dataKey="audienceSize" name="Audience Size" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="engaged" name="Engaged Customers" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
