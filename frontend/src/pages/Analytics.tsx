import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts';
import { BarChart2, TrendingUp, Megaphone, AlertCircle, BarChartHorizontal } from 'lucide-react';

const fetchChartsData = async () => {
  const { data } = await api.get('/analytics/charts');
  return data;
};

// Custom funnel bar chart (avoids Recharts FunnelChart issues)
const FunnelBar = ({ name, value, maxValue, fill }: { name: string; value: number; maxValue: number; fill: string }) => {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  const rate = maxValue > 0 ? ((value / maxValue) * 100).toFixed(1) : '0.0';
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-500 w-20 text-right shrink-0">{name}</span>
      <div className="flex-1 bg-slate-100 rounded-full h-6 relative overflow-hidden">
        <div
          className="h-full rounded-full flex items-center justify-end pr-3 transition-all duration-700"
          style={{ width: `${Math.max(pct, 4)}%`, backgroundColor: fill }}
        >
          <span className="text-white text-xs font-semibold">{value.toLocaleString()}</span>
        </div>
      </div>
      <span className="text-xs text-slate-400 w-12 shrink-0">{rate}%</span>
    </div>
  );
};

const Analytics = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['chartsData'],
    queryFn: fetchChartsData,
    retry: 1,
    staleTime: 60000,
  });

  const hasRevenue = data?.revenueTrend?.length > 0;
  const hasFunnel = data?.funnel?.some((f: any) => f.value > 0);
  const hasCampaigns = data?.campaignComparison?.some((c: any) => c.audienceSize > 0);
  const maxFunnelValue = data?.funnel?.[0]?.value || 1;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Analytics</h1>
        <p className="text-slate-500 mt-1 text-sm">Campaign performance and revenue insights</p>
      </div>

      {isError && (
        <Card className="border border-red-200 bg-red-50">
          <CardContent className="py-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">Failed to load analytics. Make sure the backend is running on port 5050.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-slate-700 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Revenue Trend (Last 6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 bg-slate-50 animate-pulse rounded-lg" />
            ) : !hasRevenue ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
                <BarChart2 className="w-10 h-10 text-slate-200" />
                <p className="text-sm">No revenue data yet. Seed the database to see trends.</p>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <RechartsTooltip
                      formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Communication Funnel */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-slate-700 flex items-center gap-2">
              <BarChartHorizontal className="w-5 h-5 text-indigo-500" />
              Communication Lifecycle
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 bg-slate-50 animate-pulse rounded-lg" />
            ) : !hasFunnel ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
                <BarChart2 className="w-10 h-10 text-slate-200" />
                <p className="text-sm">No campaign communications yet. Launch a campaign from the Campaigns tab.</p>
              </div>
            ) : (
              <div className="space-y-3 pt-4">
                {data.funnel.map((item: any) => (
                  <FunnelBar
                    key={item.name}
                    name={item.name}
                    value={item.value}
                    maxValue={maxFunnelValue}
                    fill={item.fill}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Campaign Comparison */}
        <Card className="border-0 shadow-md lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-slate-700 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-purple-500" />
              Campaign Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 bg-slate-50 animate-pulse rounded-lg" />
            ) : !hasCampaigns ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Megaphone className="w-10 h-10 text-slate-200" />
                <p className="text-sm">No campaigns launched yet. Go to the Campaigns tab to create one.</p>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.campaignComparison} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                    <Legend />
                    <Bar dataKey="audienceSize" name="Audience Size" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="engaged" name="Engaged" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
