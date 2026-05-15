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
  const [error, setError] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [isUpdatingPayment, setIsUpdatingPayment] = useState<string | null>(null);

  const fetch = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error("Failed to fetch customers:", err);
      setError("Failed to load customers list.");
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const handleSaveCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createCustomer(formData);

    if (result.success) {
      setIsAdding(false);
      fetch();
    } else {
      setError(result.error || "Failed to save customer");
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
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger render={<Button className="bg-blue-600 hover:bg-blue-700" />}>
            <UserPlus className="mr-2 h-4 w-4" /> Add New Customer
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Customer Information</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveCustomer} className="space-y-4 py-4">
              {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100">{error}</p>}
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

                    <Link href={`/pos?name=${encodeURIComponent(customer._id)}&phone=${encodeURIComponent(customer.phone || "")}`}>
                      <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700">
                        <CreditCard className="h-4 w-4" />
                      </Button>
                    </Link>

                    {/* BILL VIEW */}
                    <Dialog>
                      <DialogTrigger render={<Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-700" />}>
                        <Printer className="h-4 w-4" />
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <div id={`bill-${customer._id}`} className="p-8 bg-white text-slate-900 space-y-6 font-serif">
                          <div className="text-center border-b pb-4">
                            <div className="flex justify-center mb-2">
                              <img src="/logo.jpg" alt="Logo" className="h-16 w-auto" />
                            </div>
                            <h2 className="text-2xl font-black uppercase tracking-widest">Godage Studio</h2>
                            <p className="text-[10px] text-slate-500 italic">Professional Photography & Videography</p>
                          </div>

                          <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400">
                            <div>
                              <p>Customer: <span className="text-slate-900">{customer._id}</span></p>
                              <p>Phone: <span className="text-slate-900">{customer.phone}</span></p>
                            </div>
                            <div className="text-right">
                              <p>Date: {new Date().toLocaleDateString()}</p>
                              <p>Bill No: #GS-{Math.floor(1000 + Math.random() * 9000)}</p>
                            </div>
                          </div>

                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b-2 border-slate-900">
                                <th className="text-left py-2">Service/Item</th>
                                <th className="text-right py-2">Price</th>
                              </tr>
                            </thead>
                            <tbody>
                              {customer.purchasedProducts?.map((p: any, i: number) => (
                                <tr key={i} className="border-b border-slate-100">
                                  <td className="py-2">{p.name}</td>
                                  <td className="text-right py-2">Rs. {p.price}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          <div className="space-y-2 pt-4 border-t-2 border-slate-900">
                            <div className="flex justify-between text-sm font-black">
                              <span>Total Amount</span>
                              <span>Rs. {customer.totalAmount}</span>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold uppercase text-slate-400">Payment Breakdown</p>
                              {customer.payments?.sort((a: any, b: any) => a.step - b.step).map((p: any, i: number) => (
                                <div key={i} className="flex justify-between text-[10px]">
                                  <span>Step {p.step} Payment</span>
                                  <span>Rs. {p.amount}</span>
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-between text-sm font-black pt-2 border-t border-dashed border-slate-300">
                              <span>Balance Due</span>
                              <span className="text-red-600">Rs. {customer.totalAmount - customer.totalPaid}</span>
                            </div>
                          </div>

                          <div className="text-center pt-8">
                            <p className="text-[8px] uppercase tracking-tighter text-slate-400">Thank you for choosing Godage Studio!</p>
                          </div>
                        </div>
                        <Button className="w-full no-print" onClick={() => window.print()}>Print Bill</Button>
                      </DialogContent>
                    </Dialog>

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