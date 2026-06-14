import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShoppingCart, DollarSign, Activity, Sparkles, Database, TrendingUp, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import api from '../lib/api';
import { useState } from 'react';

const fetchDashboard = async () => {
  const { data } = await api.get('/analytics/dashboard');
  return data;
};

const StatCard = ({ title, value, icon: Icon, iconColor, loading }: { title: string; value: string; icon: any; iconColor: string; loading: boolean }) => (
  <Card className="border-0 shadow-md bg-white hover:shadow-lg transition-shadow">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
      <div className={`p-2 rounded-lg bg-slate-50`}>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
    </CardHeader>
    <CardContent>
      {loading ? (
        <div className="h-8 w-24 bg-slate-100 animate-pulse rounded" />
      ) : (
        <div className="text-2xl font-bold text-slate-900">{value}</div>
      )}
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const queryClient = useQueryClient();
  const [seedSuccess, setSeedSuccess] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    retry: 2,
    staleTime: 30000,
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/analytics/seed');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['chartsData'] });
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 4000);
    },
    onError: (err) => {
      console.error(err);
    },
  });

  const metrics = data?.metrics;
  const hasData = metrics && metrics.totalCustomers > 0;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 mt-1 text-sm">Welcome to Xeno AI CRM</p>
        </div>
        <div className="flex items-center gap-3">
          {seedSuccess && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
              <TrendingUp className="w-4 h-4" />
              Database seeded successfully!
            </span>
          )}
          {seedMutation.isError && (
            <span className="flex items-center gap-1.5 text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-full border border-red-200">
              <AlertCircle className="w-4 h-4" />
              Seed failed — check console
            </span>
          )}
          <Button
            variant="outline"
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            className="border-slate-300 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
          >
            <Database className="w-4 h-4 mr-2 text-blue-500" />
            {seedMutation.isPending ? 'Seeding...' : 'Generate Seed Data'}
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Customers"
          value={metrics?.totalCustomers?.toLocaleString() ?? '0'}
          icon={Users}
          iconColor="text-indigo-500"
          loading={isLoading}
        />
        <StatCard
          title="Total Orders"
          value={metrics?.totalOrders?.toLocaleString() ?? '0'}
          icon={ShoppingCart}
          iconColor="text-blue-500"
          loading={isLoading}
        />
        <StatCard
          title="Total Revenue"
          value={metrics?.totalRevenue ? `₹${Math.round(metrics.totalRevenue).toLocaleString()}` : '₹0'}
          icon={DollarSign}
          iconColor="text-emerald-500"
          loading={isLoading}
        />
        <StatCard
          title="Active Campaigns"
          value={metrics?.activeCampaigns?.toString() ?? '0'}
          icon={Activity}
          iconColor="text-rose-500"
          loading={isLoading}
        />
      </div>

      {/* No-data CTA */}
      {!isLoading && !hasData && (
        <Card className="border border-amber-200 bg-amber-50 shadow-sm mb-8">
          <CardContent className="py-6 flex items-center gap-4">
            <div className="p-3 rounded-full bg-amber-100">
              <Database className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-amber-800">No data yet</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Click <strong>"Generate Seed Data"</strong> above to populate 500 customers and 5,000 orders to explore all features.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {seedMutation.isPending ? 'Seeding...' : 'Seed Now'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* API Error */}
      {isError && (
        <Card className="border border-red-200 bg-red-50 shadow-sm mb-8">
          <CardContent className="py-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">
              Could not connect to backend. Make sure the server is running on port 5050.
            </p>
          </CardContent>
        </Card>
      )}

      {/* AI Insight */}
      <div className="mb-8">
        <Card className="border border-indigo-100 shadow-md bg-gradient-to-br from-indigo-50 via-purple-50 to-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-800">
              <Sparkles className="h-5 w-5 text-indigo-500" />
              AI Insight
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-4 bg-indigo-100 animate-pulse rounded w-3/4" />
                <div className="h-4 bg-indigo-100 animate-pulse rounded w-1/2" />
              </div>
            ) : (
              <p className="text-slate-700 text-base leading-relaxed italic">
                "{data?.aiInsight || 'Add your Gemini API key to enable AI insights.'}"
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
