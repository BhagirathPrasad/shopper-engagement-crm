import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Copilot from '../components/Copilot';
import api from '../lib/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Campaigns = () => {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data } = await api.get('/campaigns');
      return data;
    },
    refetchInterval: 5000,
  });

  const { data: communications } = useQuery({
    queryKey: ['communications', selectedCampaignId],
    queryFn: async () => {
      if (!selectedCampaignId) return [];
      const { data } = await api.get(`/campaigns/${selectedCampaignId}/communications`);
      return data;
    },
    enabled: !!selectedCampaignId,
    refetchInterval: 5000,
  });

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Campaign Builder</h1>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col h-[calc(100vh-140px)]">
          <Copilot />
        </div>
        
        <div className="hidden lg:block bg-slate-50 rounded-xl p-6 border border-slate-200 shadow-sm h-full overflow-y-auto">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Recent Campaigns</h2>
          <div className="space-y-3">
            {campaigns?.map((c: any) => (
              <div 
                key={c._id} 
                onClick={() => setSelectedCampaignId(c._id)}
                className={`p-3 bg-white rounded shadow-sm border cursor-pointer hover:border-indigo-400 transition-colors ${selectedCampaignId === c._id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-100'}`}
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-slate-700 truncate pr-2">{c.name}</h3>
                  <Badge variant="outline" className="text-xs">
                    {c.status}
                  </Badge>
                </div>
                <div className="text-xs text-slate-500 mt-2 flex justify-between">
                  <span>Target: {c.audienceSize} users</span>
                  <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            {(!campaigns || campaigns.length === 0) && (
              <p className="text-sm text-slate-500 italic">No campaigns yet. Launch one using the Copilot!</p>
            )}
          </div>
        </div>
      </div>

      {selectedCampaignId && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Communication Lifecycle Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b">
                    <tr>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {communications?.map((comm: any) => (
                      <tr key={comm._id} className="border-b last:border-0 hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{comm.customerId?.name || 'Unknown'}</td>
                        <td className="px-4 py-3 text-slate-600">{comm.customerId?.phone || 'Unknown'}</td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className={`
                            ${comm.status === 'Delivered' ? 'bg-blue-100 text-blue-800' : ''}
                            ${comm.status === 'Opened' ? 'bg-indigo-100 text-indigo-800' : ''}
                            ${comm.status === 'Clicked' ? 'bg-purple-100 text-purple-800' : ''}
                            ${comm.status === 'Converted' ? 'bg-green-100 text-green-800' : ''}
                            ${comm.status === 'Failed' ? 'bg-red-100 text-red-800' : ''}
                            ${comm.status === 'Sent' ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${comm.status === 'Pending' ? 'bg-slate-100 text-slate-800' : ''}
                          `}>
                            {comm.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {new Date(comm.updatedAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                    {(!communications || communications.length === 0) && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500 italic">
                          No communications tracked yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Campaigns;
