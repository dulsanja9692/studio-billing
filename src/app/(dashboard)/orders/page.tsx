"use client";
import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Search, Eye, Printer, CheckCircle, Clock, AlertCircle, 
  CreditCard, Phone, User, Calendar, FileText, RefreshCw 
} from "lucide-react";
import { updateCustomerPayment } from "@/lib/actions/customerActions";
import A5Receipt from "@/components/billing/A5Receipt";

interface OrderItem {
  name: string;
  price: number;
}

interface OrderDiscount {
  id?: string;
  name: string;
  code?: string;
  type?: "PERCENTAGE" | "FIXED";
  value?: number;
  amount: number;
}

interface Order {
  _id: string;
  id: string;
  billNo?: string;
  customerName: string;
  customerPhone?: string;
  items?: OrderItem[];
  subtotal?: number;
  discount?: OrderDiscount;
  totalAmount: number;
  advancePaid: number;
  paymentStep?: number;
  status: "COMPLETED" | "PARTIAL" | string;
  createdAt: string;
}

function OrdersContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PARTIAL" | "COMPLETED">("ALL");
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [paymentUpdateOrder, setPaymentUpdateOrder] = useState<Order | null>(null);
  const [newPaidAmount, setNewPaidAmount] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setSearchTerm(q);
    if (q && orders.length > 0) {
      const cleanQ = q.trim().toLowerCase().replace("#", "");
      const match = orders.find(
        (o) => (o.billNo || "").toLowerCase().replace("#", "") === cleanQ ||
               (o._id || "").toLowerCase().slice(0, 5) === cleanQ
      );
      if (match) {
        setSelectedOrder(match);
      }
    }
  }, [searchParams, orders]);

  // Filter orders by search term (Bill #, Customer Name, Phone) and Status
  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return orders.filter((order) => {
      const bill = (order.billNo || `#GS-${order._id?.slice(0, 5)}`).toLowerCase();
      const name = (order.customerName || "").toLowerCase();
      const phone = (order.customerPhone || "").toLowerCase();

      const matchesSearch =
        !term ||
        bill.includes(term) ||
        bill.replace("#", "").includes(term) ||
        name.includes(term) ||
        phone.includes(term);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "COMPLETED" && order.status === "COMPLETED") ||
        (statusFilter === "PARTIAL" && order.status !== "COMPLETED");

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  // Stats calculation
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const totalInvoiced = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const totalCollected = orders.reduce((sum, o) => sum + (Number(o.advancePaid) || 0), 0);
    const totalBalance = Math.max(0, totalInvoiced - totalCollected);
    return { totalOrders, totalInvoiced, totalCollected, totalBalance };
  }, [orders]);

  const handlePaymentSubmit = async () => {
    if (!paymentUpdateOrder) return;
    const amount = Number(newPaidAmount);
    if (isNaN(amount) || amount < 0) {
      alert("Please enter a valid payment amount.");
      return;
    }

    setIsUpdating(true);
    try {
      await updateCustomerPayment(paymentUpdateOrder._id, amount);
      alert("Payment updated successfully!");
      setPaymentUpdateOrder(null);
      setNewPaidAmount("");
      fetchOrders();
    } catch (err: any) {
      alert(err.message || "Failed to update payment");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Quick Stats */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Bill & Order History</h2>
          <p className="text-sm text-slate-500">
            Search past invoices by Bill Reference #, customer name, or phone number
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchOrders} 
          disabled={loading}
          className="self-start sm:self-auto gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] font-bold uppercase text-slate-400">Total Invoices</p>
            <p className="text-2xl font-black text-slate-900">{stats.totalOrders}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] font-bold uppercase text-slate-400">Total Invoiced</p>
            <p className="text-2xl font-black text-slate-900">Rs. {stats.totalInvoiced.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] font-bold uppercase text-slate-400">Total Paid</p>
            <p className="text-2xl font-black text-emerald-600">Rs. {stats.totalCollected.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-4 space-y-1">
            <p className="text-[11px] font-bold uppercase text-slate-400">Total Outstanding Due</p>
            <p className="text-2xl font-black text-red-600">Rs. {stats.totalBalance.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar & Filter Tabs */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search by Bill # (e.g. GS-2518), Customer, or Phone..." 
            className="pl-10 h-10 bg-white" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm("")} 
              className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
          <Button 
            size="sm" 
            variant={statusFilter === "ALL" ? "default" : "ghost"}
            className="h-8 text-xs font-semibold"
            onClick={() => setStatusFilter("ALL")}
          >
            All Bills
          </Button>
          <Button 
            size="sm" 
            variant={statusFilter === "PARTIAL" ? "default" : "ghost"}
            className="h-8 text-xs font-semibold"
            onClick={() => setStatusFilter("PARTIAL")}
          >
            Pending Due
          </Button>
          <Button 
            size="sm" 
            variant={statusFilter === "COMPLETED" ? "default" : "ghost"}
            className="h-8 text-xs font-semibold"
            onClick={() => setStatusFilter("COMPLETED")}
          >
            Fully Paid
          </Button>
        </div>
      </div>

      {/* Orders Table */}
      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Bill Reference #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Services / Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Balance Due</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-10 text-slate-400">
                  Loading invoices...
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12 text-slate-400">
                  <FileText className="mx-auto h-8 w-8 mb-2 opacity-30" />
                  <p className="font-medium">No matching bills found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Try searching with another Bill Reference #, customer name, or phone number.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => {
                const billNo = order.billNo || `#GS-${order._id?.slice(0, 5).toUpperCase()}`;
                const total = Number(order.totalAmount) || 0;
                const paid = Number(order.advancePaid) || 0;
                const balance = Math.max(0, total - paid);
                const itemsCount = Array.isArray(order.items) ? order.items.length : 0;

                return (
                  <TableRow key={order._id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Bill # */}
                    <TableCell>
                      <Badge variant="outline" className="font-mono font-bold text-xs bg-slate-100 text-slate-900 border-slate-300">
                        {billNo}
                      </Badge>
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}
                    </TableCell>

                    {/* Customer */}
                    <TableCell className="font-bold text-slate-900">
                      {order.customerName}
                    </TableCell>

                    {/* Phone */}
                    <TableCell className="text-xs text-slate-600">
                      {order.customerPhone || "N/A"}
                    </TableCell>

                    {/* Items */}
                    <TableCell className="text-xs max-w-[200px] truncate text-slate-600" title={order.items?.map(i => i.name).join(", ")}>
                      {itemsCount > 0 ? (
                        <span>
                          {order.items![0]?.name}
                          {itemsCount > 1 ? ` +${itemsCount - 1} more` : ""}
                        </span>
                      ) : (
                        "Custom Order"
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {balance <= 0 || order.status === "COMPLETED" ? (
                        <Badge className="bg-emerald-100 text-emerald-800 border-none font-semibold text-[11px]">
                          <CheckCircle className="h-3 w-3 mr-1 inline" /> Paid
                        </Badge>
                      ) : (
                        <Badge className="bg-orange-100 text-orange-800 border-none font-semibold text-[11px]">
                          <Clock className="h-3 w-3 mr-1 inline" /> Due
                        </Badge>
                      )}
                    </TableCell>

                    {/* Financials */}
                    <TableCell className="text-right font-bold text-slate-900">
                      Rs. {total.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-emerald-600 font-bold">
                      Rs. {paid.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-black">
                      <span className={balance > 0 ? "text-red-600" : "text-slate-400"}>
                        Rs. {balance.toLocaleString()}
                      </span>
                    </TableCell>

                    {/* Action Buttons */}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {/* VIEW HISTORY / DETAILS BUTTON */}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => setSelectedOrder(order)}
                          title="View Bill History"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {/* REPRINT RECEIPT BUTTON */}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          onClick={() => setReceiptOrder(order)}
                          title="Print Receipt"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>

                        {/* UPDATE PAYMENT BUTTON */}
                        {balance > 0 && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            onClick={() => {
                              setPaymentUpdateOrder(order);
                              setNewPaidAmount(String(total)); // default to full payment
                            }}
                            title="Settle / Update Payment"
                          >
                            <CreditCard className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* MODAL 1: VIEW FULL BILL HISTORY DETAILS */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          {selectedOrder && (
            <div className="space-y-5 p-2">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Bill Details: {selectedOrder.billNo || `#GS-${selectedOrder._id?.slice(0, 5).toUpperCase()}`}
                  </DialogTitle>
                </div>
              </DialogHeader>

              {/* Customer Info Card */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Customer Name</p>
                  <p className="font-bold text-slate-900 text-base">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Phone Number</p>
                  <p className="font-semibold text-slate-700">{selectedOrder.customerPhone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Order Date</p>
                  <p className="text-slate-700">
                    {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Payment Plan</p>
                  <p className="font-semibold text-blue-600">
                    Step {selectedOrder.paymentStep || 1}
                  </p>
                </div>
              </div>

              {/* Product/Service Items List */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Services / Products Purchased</p>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs">
                      <tr>
                        <th className="text-left p-2.5 font-bold">Item Description</th>
                        <th className="text-right p-2.5 font-bold">Price (Rs.)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="p-2.5 font-medium text-slate-800">{item.name}</td>
                            <td className="p-2.5 text-right font-bold text-slate-900">
                              Rs. {Number(item.price).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2} className="p-3 text-center text-slate-400 text-xs">
                            No individual item breakdown recorded
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Balance Summary */}
              <div className="bg-slate-900 text-white p-4 rounded-lg space-y-2">
                {selectedOrder.subtotal !== undefined && selectedOrder.subtotal > selectedOrder.totalAmount && (
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Subtotal</span>
                    <span>Rs. {Number(selectedOrder.subtotal).toLocaleString()}</span>
                  </div>
                )}
                {selectedOrder.discount && Number(selectedOrder.discount.amount) > 0 && (
                  <div className="flex justify-between text-xs text-emerald-400 font-bold">
                    <span>Discount ({selectedOrder.discount.name})</span>
                    <span>- Rs. {Number(selectedOrder.discount.amount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Total Order Amount</span>
                  <span className="font-bold">Rs. {Number(selectedOrder.totalAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Amount Paid (Advance)</span>
                  <span className="font-bold text-emerald-400">Rs. {Number(selectedOrder.advancePaid).toLocaleString()}</span>
                </div>
                <div className="border-t border-slate-700 pt-2 flex justify-between text-base font-black">
                  <span>Balance Due</span>
                  <span className={Math.max(0, selectedOrder.totalAmount - selectedOrder.advancePaid) > 0 ? "text-red-400" : "text-emerald-400"}>
                    Rs. {Math.max(0, selectedOrder.totalAmount - selectedOrder.advancePaid).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2"
                  onClick={() => {
                    const ord = selectedOrder;
                    setSelectedOrder(null);
                    setReceiptOrder(ord);
                  }}
                >
                  <Printer className="h-4 w-4" /> View / Print Receipt
                </Button>
                {Math.max(0, selectedOrder.totalAmount - selectedOrder.advancePaid) > 0 && (
                  <Button 
                    variant="outline"
                    className="border-green-600 text-green-700 hover:bg-green-50"
                    onClick={() => {
                      const ord = selectedOrder;
                      setSelectedOrder(null);
                      setPaymentUpdateOrder(ord);
                      setNewPaidAmount(String(ord.totalAmount));
                    }}
                  >
                    Update Payment
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 2: A5 PROFESSIONAL STUDIO RECEIPT */}
      <Dialog open={!!receiptOrder} onOpenChange={(open) => !open && setReceiptOrder(null)}>
        <DialogContent className="max-w-xl p-2 sm:p-5 bg-slate-100 overflow-y-auto max-h-[96vh]">
          {receiptOrder && (
            <A5Receipt 
              billNo={receiptOrder.billNo || `#GS-${receiptOrder._id?.slice(0, 5).toUpperCase()}`}
              date={receiptOrder.createdAt ? new Date(receiptOrder.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }) : undefined}
              customerName={receiptOrder.customerName}
              customerPhone={receiptOrder.customerPhone}
              items={receiptOrder.items}
              subtotal={receiptOrder.subtotal}
              discount={receiptOrder.discount}
              totalAmount={receiptOrder.totalAmount}
              paidAmount={receiptOrder.advancePaid}
              balanceDue={Math.max(0, receiptOrder.totalAmount - receiptOrder.advancePaid)}
              paymentStep={receiptOrder.paymentStep || 1}
              onClose={() => setReceiptOrder(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 3: UPDATE PAYMENT POPUP */}
      <Dialog open={!!paymentUpdateOrder} onOpenChange={(open) => !open && setPaymentUpdateOrder(null)}>
        <DialogContent className="max-w-md">
          {paymentUpdateOrder && (
            <div className="space-y-4 py-2">
              <DialogHeader>
                <DialogTitle>Update Payment: {paymentUpdateOrder.billNo || paymentUpdateOrder.customerName}</DialogTitle>
              </DialogHeader>
              <div className="text-sm bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
                <p><strong>Customer:</strong> {paymentUpdateOrder.customerName}</p>
                <p><strong>Total Bill:</strong> Rs. {paymentUpdateOrder.totalAmount.toLocaleString()}</p>
                <p><strong>Currently Paid:</strong> Rs. {paymentUpdateOrder.advancePaid.toLocaleString()}</p>
                <p className="text-red-600 font-bold">
                  <strong>Remaining Due:</strong> Rs. {Math.max(0, paymentUpdateOrder.totalAmount - paymentUpdateOrder.advancePaid).toLocaleString()}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-500">New Total Amount Paid (Rs.)</label>
                <Input 
                  type="number" 
                  value={newPaidAmount} 
                  onChange={(e) => setNewPaidAmount(e.target.value)} 
                  placeholder={`Full amount: ${paymentUpdateOrder.totalAmount}`}
                />
                <p className="text-[11px] text-slate-400">
                  Enter the new cumulative amount paid (enter {paymentUpdateOrder.totalAmount} to mark fully paid).
                </p>
              </div>
              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold"
                onClick={handlePaymentSubmit}
                disabled={isUpdating}
              >
                {isUpdating ? "Saving..." : "Save Payment"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function OrdersHistoryPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-400">Loading Order History...</div>}>
      <OrdersContent />
    </Suspense>
  );
}
