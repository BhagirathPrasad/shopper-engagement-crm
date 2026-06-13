import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

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
}

const fetchOrders = async (page: number) => {
  const { data } = await api.get(`/orders?page=${page}&limit=20`);
  return data;
};

const Orders = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['orders', page],
    queryFn: () => fetchOrders(page),
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Order Management</h1>
      </div>

      <Card className="shadow-md border-0">
        <CardHeader className="bg-slate-50 border-b pb-4 rounded-t-lg">
          <CardTitle className="text-slate-700">All Orders</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading orders...</div>
          ) : isError ? (
            <div className="p-8 text-center text-red-500">Failed to load orders.</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.orders.map((o: Order) => (
                    <TableRow key={o._id} className="hover:bg-slate-50">
                      <TableCell className="font-mono text-xs text-slate-500">{o._id.slice(-8)}</TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {o.customerId?.name || 'Unknown'}
                        <div className="text-xs text-slate-500 font-normal">{o.customerId?.email}</div>
                      </TableCell>
                      <TableCell className="font-semibold text-slate-800">
                        ₹{o.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={o.status === 'Completed' ? 'default' : o.status === 'Refunded' ? 'destructive' : 'secondary'}
                        >
                          {o.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {new Date(o.orderDate).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-between items-center p-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setPage((old) => Math.max(old - 1, 1))} 
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-slate-500">
                  Page {page} of {data?.pages}
                </span>
                <Button 
                  variant="outline" 
                  onClick={() => setPage((old) => (old < data?.pages ? old + 1 : old))} 
                  disabled={page === data?.pages}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Orders;
