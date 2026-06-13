import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShoppingCart, DollarSign, Activity, Sparkles, Database } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import api from '../lib/api';

const fetchDashboard = async () => {
  const { data } = await api.get('/analytics/dashboard');
  return data;
};

const Dashboard = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      await api.post('/analytics/seed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      alert('Database seeded with 500 customers and 5000 orders!');
    },
    onError: (err) => {
      console.error(err);
      alert('Failed to seed database');
    }
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
        <Button 
          variant="outline" 
          onClick={() => seedMutation.mutate()} 
          disabled={seedMutation.isPending}
          className="border-slate-300"
        >
          <Database className="w-4 h-4 mr-2 text-blue-500" />
          {seedMutation.isPending ? 'Seeding...' : 'Generate Seed Data'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-0 shadow-md bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {isLoading ? '...' : data?.metrics?.totalCustomers?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {isLoading ? '...' : data?.metrics?.totalOrders?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {isLoading ? '...' : `₹${data?.metrics?.totalRevenue?.toLocaleString() || 0}`}
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Active Campaigns</CardTitle>
            <Activity className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {isLoading ? '...' : data?.metrics?.activeCampaigns || 0}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mb-8">
        <Card className="border border-indigo-100 shadow-md bg-gradient-to-r from-indigo-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-800">
              <Sparkles className="h-5 w-5 text-indigo-500" />
              AI Insight
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 text-lg font-medium italic">
              {isLoading ? 'Analyzing your data...' : `"${data?.aiInsight || 'No insights available yet.'}"`}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
