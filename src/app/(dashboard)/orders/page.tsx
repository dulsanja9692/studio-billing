"use client";
import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eye, CheckCircle, Clock } from "lucide-react";

export default function OrdersHistoryPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetch('/api/orders').then(res => res.json()).then(setOrders);
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Order History & Payments</h2>

      <Card className="border-none shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Payment Step</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order: any) => (
              <TableRow key={order._id}>
                <TableCell className="text-xs">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="font-bold">{order.customerName}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-none">
                    Step {order.paymentStep || 1}
                  </Badge>
                </TableCell>
                <TableCell>
                  {order.status === "COMPLETED" ? (
                    <Badge className="bg-green-100 text-green-700 border-none"><CheckCircle className="h-3 w-3 mr-1"/> Full</Badge>
                  ) : (
                    <Badge className="bg-orange-100 text-orange-700 border-none"><Clock className="h-3 w-3 mr-1"/> Partial</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">Rs. {order.totalAmount}</TableCell>
                <TableCell className="text-right text-green-600 font-bold">Rs. {order.advancePaid}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    Update Payment
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}