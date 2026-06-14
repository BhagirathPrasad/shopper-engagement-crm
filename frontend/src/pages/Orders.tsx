import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ChevronLeft, ChevronRight, AlertCircle, PackageX } from 'lucide-react';

interface Order {
  _id: string;
  customerId: {
    _id: string;
    name: string;
    email: string;
  };
  amount: number;
  status: string;
  orderDate: string;
  products?: { name: string; category: string; price: number; quantity: number }[];
}

const fetchOrders = async (page: number) => {
  const { data } = await api.get(`/orders?page=${page}&limit=20`);
  return data;
};

const statusColors: Record<string, string> = {
  Completed: 'bg-emerald-100 text-emerald-700',
  Pending: 'bg-amber-100 text-amber-700',
  Cancelled: 'bg-slate-100 text-slate-600',
  Refunded: 'bg-red-100 text-red-700',
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

const Orders = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['orders', page],
    queryFn: () => fetchOrders(page),
    retry: 1,
    staleTime: 60000,
  });

  const orders: Order[] = data?.orders || [];
  const totalPages = data?.pages || 1;
  const total = data?.total || 0;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Order Management</h1>
          {!isLoading && total > 0 && (
            <p className="text-slate-500 mt-1 text-sm">{total.toLocaleString()} orders total</p>
          )}
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <ShoppingCart className="w-5 h-5" />
          <span className="text-sm font-medium">All Orders</span>
        </div>
      </div>

      <Card className="shadow-md border-0">
        <CardHeader className="bg-slate-50 border-b pb-4 rounded-t-lg">
          <CardTitle className="text-slate-700 flex items-center gap-2">
            All Orders
            {!isLoading && total > 0 && (
              <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
                {total.toLocaleString()}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isError ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <p className="text-red-600 font-medium">Failed to load orders</p>
              <p className="text-slate-500 text-sm mt-1">Make sure the backend server is running on port 5050</p>
            </div>
          ) : !isLoading && orders.length === 0 ? (
            <div className="p-12 text-center">
              <PackageX className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No orders yet</p>
              <p className="text-slate-400 text-sm mt-1">Go to the Dashboard and click "Generate Seed Data" to add sample orders.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-semibold text-slate-600">Order ID</TableHead>
                    <TableHead className="font-semibold text-slate-600">Customer</TableHead>
                    <TableHead className="font-semibold text-slate-600">Items</TableHead>
                    <TableHead className="font-semibold text-slate-600">Amount</TableHead>
                    <TableHead className="font-semibold text-slate-600">Status</TableHead>
                    <TableHead className="font-semibold text-slate-600">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading
                    ? [...Array(10)].map((_, i) => <SkeletonRow key={i} />)
                    : orders.map((o) => (
                        <TableRow key={o._id} className="hover:bg-blue-50/30 transition-colors">
                          <TableCell className="font-mono text-xs text-slate-400">#{o._id.slice(-8).toUpperCase()}</TableCell>
                          <TableCell>
                            <div className="font-medium text-slate-900">{o.customerId?.name || 'Unknown'}</div>
                            <div className="text-xs text-slate-400">{o.customerId?.email}</div>
                          </TableCell>
                          <TableCell>
                            {o.products && o.products.length > 0 ? (
                              <div className="text-xs text-slate-500">
                                {o.products[0].name}
                                {o.products.length > 1 && (
                                  <span className="ml-1 text-slate-400">+{o.products.length - 1} more</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell className="font-semibold text-slate-800">
                            ₹{Math.round(o.amount).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-xs font-medium border-0 ${statusColors[o.status] || 'bg-slate-100 text-slate-600'}`}>
                              {o.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-500 text-sm">
                            {new Date(o.orderDate).toLocaleDateString('en-IN')}
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

export default Orders;
