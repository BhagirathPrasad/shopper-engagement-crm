import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Users, ChevronLeft, ChevronRight, AlertCircle, UserX } from 'lucide-react';

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  clv: number;
  totalOrders: number;
  lastPurchaseDate: string;
  location?: string;
  gender?: string;
}

const fetchCustomers = async (page: number) => {
  const { data } = await api.get(`/customers?page=${page}&limit=20`);
  return data;
};

const SkeletonRow = () => (
  <TableRow>
    {[...Array(5)].map((_, i) => (
      <TableCell key={i}>
        <div className="h-4 bg-slate-100 animate-pulse rounded" />
      </TableCell>
    ))}
  </TableRow>
);

const Customers = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['customers', page],
    queryFn: () => fetchCustomers(page),
    retry: 1,
    staleTime: 60000,
  });

  const customers: Customer[] = data?.customers || [];
  const totalPages = data?.pages || 1;
  const total = data?.total || 0;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Customer Profiles</h1>
          {!isLoading && total > 0 && (
            <p className="text-slate-500 mt-1 text-sm">{total.toLocaleString()} customers total</p>
          )}
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <Users className="w-5 h-5" />
          <span className="text-sm font-medium">All Customers</span>
        </div>
      </div>

      <Card className="shadow-md border-0">
        <CardHeader className="bg-slate-50 border-b pb-4 rounded-t-lg">
          <CardTitle className="text-slate-700 flex items-center gap-2">
            All Customers
            {!isLoading && total > 0 && (
              <Badge variant="secondary" className="ml-2 bg-indigo-100 text-indigo-700">
                {total.toLocaleString()}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isError ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <p className="text-red-600 font-medium">Failed to load customers</p>
              <p className="text-slate-500 text-sm mt-1">Make sure the backend server is running on port 5050</p>
            </div>
          ) : !isLoading && customers.length === 0 ? (
            <div className="p-12 text-center">
              <UserX className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No customers yet</p>
              <p className="text-slate-400 text-sm mt-1">Go to the Dashboard and click "Generate Seed Data" to add sample customers.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-semibold text-slate-600">Name</TableHead>
                    <TableHead className="font-semibold text-slate-600">Email</TableHead>
                    <TableHead className="font-semibold text-slate-600">Location</TableHead>
                    <TableHead className="font-semibold text-slate-600">Orders</TableHead>
                    <TableHead className="font-semibold text-slate-600">Lifetime Value</TableHead>
                    <TableHead className="font-semibold text-slate-600">Last Purchase</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading
                    ? [...Array(10)].map((_, i) => <SkeletonRow key={i} />)
                    : customers.map((c) => (
                        <TableRow key={c._id} className="hover:bg-indigo-50/30 transition-colors">
                          <TableCell>
                            <div className="font-medium text-slate-900">{c.name}</div>
                            {c.gender && <div className="text-xs text-slate-400">{c.gender}</div>}
                          </TableCell>
                          <TableCell className="text-slate-500 text-sm">{c.email}</TableCell>
                          <TableCell className="text-slate-500 text-sm">{c.location || '—'}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                              {c.totalOrders}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-emerald-600">
                            ₹{Math.round(c.clv).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-slate-500 text-sm">
                            {c.lastPurchaseDate ? new Date(c.lastPurchaseDate).toLocaleDateString('en-IN') : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>

              {!isLoading && totalPages > 1 && (
                <div className="flex justify-between items-center p-4 border-t bg-slate-50/50">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((old) => Math.max(old - 1, 1))}
                    disabled={page === 1}
                    className="gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </Button>
                  <span className="text-sm text-slate-500">
                    Page <strong>{page}</strong> of <strong>{totalPages}</strong>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((old) => (old < totalPages ? old + 1 : old))}
                    disabled={page === totalPages}
                    className="gap-1"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Customers;
