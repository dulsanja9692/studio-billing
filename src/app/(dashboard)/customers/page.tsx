"use client";
import { useState, useEffect } from "react";
import { getCustomers, createCustomer, deleteCustomer, updateCustomerPayment } from "@/lib/actions/customerActions";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Eye, Edit, Loader2, Trash2, CreditCard, Printer } from "lucide-react";
import Link from "next/link";

interface Customer {
  _id: string;
  name?: string;
  phone: string;
  totalOrders: number;
  totalPaid: number;
  totalAmount: number;
  lastVisit: string;
  latestOrderId: string | null;
  purchasedProducts: { name: string; price: number }[];
  payments: { step: number; amount: number; date: string }[];
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [isUpdatingPayment, setIsUpdatingPayment] = useState<string | null>(null);

  const fetch = async () => {
    try {
      setTableError(null);
      const res = await window.fetch("/api/customers", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setCustomers(data);
          return;
        }
      }
      // Fallback to server action
      const data = await getCustomers();
      if (Array.isArray(data)) {
        setCustomers(data);
      }
    } catch (err: any) {
      console.warn("API fetch error, trying server action:", err);
      try {
        const data = await getCustomers();
        if (Array.isArray(data)) {
          setCustomers(data);
          return;
        }
      } catch (fallbackErr: any) {
        console.error("Failed to fetch customers:", fallbackErr);
        setTableError("Failed to load customers list. Please check your internet connection.");
      }
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const handleSaveCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createCustomer(formData);

    if (result.success) {
      setIsAdding(false);
      setFormError(null);
      fetch();
    } else {
      setFormError(result.error || "Failed to save customer");
    }
    setLoading(false);
  };

  const handleDeleteCustomer = async (name: string) => {
    if (!confirm(`Are you sure you want to delete customer "${name}"?`)) return;
    
    const result = await deleteCustomer(name);
    if (result.success) {
      fetch();
    } else {
      alert(result.error || "Failed to delete customer");
    }
  };

  const handleUpdatePayment = async (orderId: string | null, totalAmount: number) => {
    if (!orderId) return alert("No active order found for this customer");
    const amount = Number(paymentAmount);
    if (isNaN(amount) || amount <= 0) return alert("Please enter a valid amount");

    setLoading(true);
    try {
      await updateCustomerPayment(orderId, amount);
      setPaymentAmount("");
      setIsUpdatingPayment(null);
      fetch();
      alert("Payment updated successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to update payment");
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c._id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Customer Directory</h2>
        
        {/* ADD CUSTOMER POPUP */}
        <Dialog open={isAdding} onOpenChange={(open) => { setIsAdding(open); if (open) setFormError(null); }}>
          <DialogTrigger render={<Button className="bg-blue-600 hover:bg-blue-700" />}>
            <UserPlus className="mr-2 h-4 w-4" /> Add New Customer
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Customer Information</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveCustomer} className="space-y-4 py-4">
              {formError && <p className="text-sm text-red-600 bg-red-50 p-2.5 rounded-md border border-red-200">{formError}</p>}
              <Input name="name" placeholder="Customer Full Name" required />
              <Input name="phone" placeholder="Phone Number" />
              <Button type="submit" disabled={loading} className="w-full">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Customer
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {tableError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center justify-between">
          <p className="text-sm">{tableError}</p>
          <Button variant="outline" size="sm" onClick={() => fetch()} className="border-red-300 text-red-700 hover:bg-red-100">
            Retry Connection
          </Button>
        </div>
      )}

      {/* SEARCH BAR */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Search by name..." 
          className="pl-10" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* CUSTOMER TABLE */}
      <div className="bg-white rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Balance Due</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.map((customer) => {
              const balance = customer.totalAmount - customer.totalPaid;
              return (
                <TableRow key={customer._id}>
                  <TableCell className="font-medium">{customer._id}</TableCell>
                  <TableCell>{customer.phone || "N/A"}</TableCell>
                  <TableCell>
                    {balance > 0 ? (
                      <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Partial</Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Completed</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-bold text-red-600">
                    Rs. {balance}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {/* VIEW POPUP */}
                    <Dialog>
                      <DialogTrigger render={<Button variant="ghost" size="icon" />}>
                        <Eye className="h-4 w-4" />
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Customer History: {customer._id}</DialogTitle>
                        </DialogHeader>
                        <div className="text-sm space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-3 rounded-lg text-center">
                              <p className="text-[10px] text-slate-400 font-bold uppercase">Total Orders</p>
                              <p className="text-xl font-bold">{customer.totalOrders}</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg text-center">
                              <p className="text-[10px] text-slate-400 font-bold uppercase">Total Spent</p>
                              <p className="text-xl font-bold text-blue-600">Rs. {customer.totalAmount}</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">All Purchased Products</p>
                            <div className="flex flex-wrap gap-1.5">
                              {customer.purchasedProducts?.length > 0 ? (
                                customer.purchasedProducts.map((p: any, i: number) => (
                                  <Badge key={i} variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none px-2 py-0.5">
                                    {p.name}
                                  </Badge>
                                ))
                              ) : (
                                <p className="text-xs text-slate-400 italic">No products found</p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Payment Step History</p>
                            <div className="space-y-1">
                              {customer.payments?.length > 0 ? (
                                customer.payments
                                  .sort((a: any, b: any) => a.step - b.step)
                                  .map((p: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100 text-xs">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[9px] h-4">Step {p.step}</Badge>
                                        <span className="text-slate-500">{new Date(p.date).toLocaleDateString()}</span>
                                      </div>
                                      <span className="font-bold text-green-600">Rs. {p.amount}</span>
                                    </div>
                                  ))
                              ) : (
                                <p className="text-xs text-slate-400 italic">No payment steps recorded</p>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-slate-400 border-t pt-4">
                            <strong>Last Visit:</strong> {new Date(customer.lastVisit).toLocaleDateString()}
                          </p>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* EDIT/PAY BALANCE POPUP */}
                    <Dialog open={isUpdatingPayment === customer._id} onOpenChange={(open) => setIsUpdatingPayment(open ? customer._id : null)}>
                      <DialogTrigger render={<Button variant="ghost" size="icon" />}>
                        <Edit className="h-4 w-4" />
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Update Payment</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <p className="text-sm">Enter amount paid by <strong>{customer._id}</strong> to settle balance.</p>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase">Amount (Rs.)</label>
                            <Input 
                              type="number" 
                              placeholder={`Remaining: Rs. ${balance}`} 
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(e.target.value)}
                            />
                          </div>
                          <Button 
                            className="w-full bg-green-600 hover:bg-green-700"
                            onClick={() => handleUpdatePayment(customer.latestOrderId, customer.totalAmount)}
                            disabled={loading}
                          >
                            {loading ? "Processing..." : "Complete Payment"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Link href={`/pos?name=${encodeURIComponent(customer.name || customer._id)}&phone=${encodeURIComponent(customer.phone || "")}`}>
                      <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700" title="New Order in POS">
                        <CreditCard className="h-4 w-4" />
                      </Button>
                    </Link>

                    {/* VIEW INVOICES & PRINT BILL */}
                    <Link href={`/orders?q=${encodeURIComponent(customer.name || customer._id)}`}>
                      <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-700" title="View Invoices & Print Bill">
                        <Printer className="h-4 w-4" />
                      </Button>
                    </Link>

                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteCustomer(customer._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}