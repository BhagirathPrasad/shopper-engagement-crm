import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface Customer {
  _id: string;
  name: string;
  email: string;
  clv: number;
  totalOrders: number;
  lastPurchaseDate: string;
}

const fetchCustomers = async (page: number) => {
  const { data } = await api.get(`/customers?page=${page}&limit=20`);
  return data;
};

const Customers = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['customers', page],
    queryFn: () => fetchCustomers(page),
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Customer Profiles</h1>
      </div>

      <Card className="shadow-md border-0">
        <CardHeader className="bg-slate-50 border-b pb-4 rounded-t-lg">
          <CardTitle className="text-slate-700">All Customers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading customers...</div>
          ) : isError ? (
            <div className="p-8 text-center text-red-500">Failed to load customers.</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>CLV</TableHead>
                    <TableHead>Last Purchase</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.customers.map((c: Customer) => (
                    <TableRow key={c._id} className="hover:bg-slate-50">
                      <TableCell className="font-medium text-slate-900">{c.name}</TableCell>
                      <TableCell className="text-slate-500">{c.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                          {c.totalOrders}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        ₹{c.clv.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {c.lastPurchaseDate ? new Date(c.lastPurchaseDate).toLocaleDateString() : 'N/A'}
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

export default Customers;
