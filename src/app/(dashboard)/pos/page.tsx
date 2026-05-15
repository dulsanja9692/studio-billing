"use client";
import { useState, useEffect } from "react";
import { getInventoryItems, createStepOrder } from "@/lib/actions/posActions";
import { getCustomerByName } from "@/lib/actions/customerActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Trash2, CreditCard, ChevronRight, History, Printer } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";

function OrderContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [customer, setCustomer] = useState(searchParams.get("name") || "");
  const [customerPhone, setCustomerPhone] = useState(searchParams.get("phone") || "");
  const [customerData, setCustomerData] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [step, setStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(3);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    const name = searchParams.get("name");
    const phone = searchParams.get("phone");
    if (name) setCustomer(name);
    if (phone) setCustomerPhone(phone);
  }, [searchParams]);

  useEffect(() => {
    if (customer) {
      getCustomerByName(customer).then((data) => {
        setCustomerData(data);
        if (data) {
          // Auto-advance step: if last was 1, go to 2. If 2, go to 3.
          const nextStep = Math.min(3, (data.latestPaymentStep || 0) + 1);
          setStep(nextStep);
          
          // If they already paid everything, stay at Step 3 or mark as done
          if (data.balance === 0 && data.latestPaymentStep >= 3) {
             setStep(3);
          }
        }
      });
    } else {
      setCustomerData(null);
      setStep(1);
    }
  }, [customer]);

  useEffect(() => {
    getInventoryItems().then((data) => {
      setProducts(data);
      if (data.length > 0) {
        const firstCategory = data[0].category;
        setActiveCategory(firstCategory);
      }
    });
  }, []);

  const categories = Array.from(new Set(products.map((p) => p.category)));

  const addToCart = (product: any) => {
    setCart((prev) => [...prev, { ...product, cartId: `${product._id}-${Math.random()}` }]);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);
  const previousBalance = customerData?.balance || 0;
  const grandTotal = cartTotal + previousBalance;

  const handleSaveOrder = async () => {
    if (!customer || (cart.length === 0 && paymentAmount === 0)) return alert("Add customer and items/payment");
    
    const result = await createStepOrder({
      customerName: customer,
      customerPhone: customerPhone,
      items: cart,
      totalAmount: cartTotal, // This is the total for the CURRENT order
      paidNow: paymentAmount,
      currentStep: step
    });

    if (result.success) {
      const remainingBalance = grandTotal - paymentAmount;
      
      if (remainingBalance <= 0) {
        alert("Transaction Fully Completed!");
        setCustomer("");
        setCustomerPhone("");
        setStep(1);
        setTotalSteps(3); // Reset
      } else {
        alert(`Step ${step} Completed! Remaining: Rs. ${remainingBalance}`);
        
        // Logical progression based on plan
        if (totalSteps === 1) {
          // They chose 1 step but didn't pay all? Still finish or stay.
          setCustomer("");
          setStep(1);
        } else if (totalSteps === 2) {
          // 2 Step Plan: 1 -> 3
          if (step === 1) setStep(3);
          else { setCustomer(""); setStep(1); }
        } else {
          // 3 Step Plan: 1 -> 2 -> 3
          if (step === 1) setStep(2);
          else if (step === 2) setStep(3);
          else { setCustomer(""); setStep(1); }
        }
      }

      setCart([]);
      setPaymentAmount(0);
      
      if (customer) {
        getCustomerByName(customer).then(setCustomerData);
      }
      setShowReceipt(true);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      {/* LEFT: Dynamic Inventory System */}
      <div className="xl:col-span-3 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">New Studio Order</h2>
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <Badge 
                key={s} 
                variant={step === s ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setStep(s)}
              >
                Step {s}
              </Badge>
            ))}
          </div>
        </div>

        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="bg-slate-100 p-1 mb-4 overflow-x-auto justify-start">
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat} className="capitalize px-6">
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((cat) => (
            <TabsContent key={cat} value={cat} className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {products
                .filter((p) => p.category === cat)
                .map((product) => (
                  <Card 
                    key={product._id} 
                    className="cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all border-none shadow-sm"
                    onClick={() => addToCart(product)}
                  >
                    <CardContent className="p-4 space-y-2 text-center">
                      <p className="font-bold text-sm truncate">{product.name}</p>
                      <p className="text-blue-600 font-black">Rs. {product.price}</p>
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="w-full text-[10px] h-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                      >
                        Add to Bill
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* RIGHT: Billing & Multi-Step Logic */}
      <div className="space-y-4">
        <Card className="border-none shadow-xl bg-white">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart size={18} className="text-blue-600" />
              <h3 className="font-bold">Checkout Summary</h3>
            </div>

             <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Customer Info</label>
                <Input 
                  placeholder="Customer Name" 
                  value={customer} 
                  onChange={(e) => setCustomer(e.target.value)}
                  className="bg-slate-50 border-none"
                />
                <Input 
                  placeholder="Phone Number (Optional)" 
                  value={customerPhone} 
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="bg-slate-50 border-none"
                />
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Payment Plan</label>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((num) => (
                      <Badge 
                        key={num} 
                        variant={totalSteps === num ? "default" : "secondary"}
                        className="cursor-pointer px-3 py-1 text-[10px]"
                        onClick={() => setTotalSteps(num)}
                      >
                        {num} {num === 1 ? 'Step' : 'Steps'}
                      </Badge>
                    ))}
                  </div>
                </div>
             </div>

             {customerData && (
               <div className="p-3 bg-red-50 rounded-lg border border-red-100 space-y-2 animate-in fade-in slide-in-from-top-1">
                 <div className="flex justify-between items-center">
                   <div className="flex items-center gap-2 text-red-700">
                     <History size={14} />
                     <span className="text-[10px] font-bold uppercase tracking-wider">Previous Balance</span>
                   </div>
                   <Badge variant="outline" className="bg-white text-red-600 border-red-200">
                     Rs. {customerData.balance}
                   </Badge>
                 </div>
                 {customerData.purchasedProducts?.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight">Purchased Items:</p>
                    <div className="flex flex-wrap gap-1">
                      {customerData.purchasedProducts.map((p: any, i: number) => (
                        <Badge key={i} variant="secondary" className="text-[9px] bg-white/50 border-red-100 text-red-600">
                          {p.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {customerData.totalAmount > 0 && (
                  <p className="text-[10px] text-red-400 italic">
                    History: {customerData.totalOrders} previous orders.
                  </p>
                )}
               </div>
             )}

            <div className="max-h-[250px] overflow-auto space-y-3 py-2 border-y border-slate-50">
              {cart.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Cart is empty</p>}
              {cart.map((item) => (
                <div key={item.cartId} className="flex justify-between text-sm group">
                  <span className="truncate w-32 font-medium">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">Rs.{item.price}</span>
                    <button 
                      onClick={() => setCart(cart.filter(i => i.cartId !== item.cartId))}
                      className="opacity-0 group-hover:opacity-100 text-red-500 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-2">
              <div className="space-y-1 pb-2 border-b border-slate-100">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>New Items Total</span>
                  <span>Rs. {cartTotal}</span>
                </div>
                {previousBalance > 0 && (
                  <div className="flex justify-between text-xs text-red-400">
                    <span>Previous Balance</span>
                    <span>Rs. {previousBalance}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between font-black text-xl text-slate-900 pt-1">
                <span>Total Amount</span>
                <span>Rs. {grandTotal}</span>
              </div>

              <div className="flex justify-between text-sm font-bold text-slate-500 pb-2">
                <span>Balance</span>
                <span className={grandTotal - paymentAmount > 0 ? "text-red-600" : "text-green-600"}>
                  Rs. {Math.max(0, grandTotal - paymentAmount)}
                </span>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                <label className="text-[10px] font-bold text-blue-700 uppercase">Step {step} Payment Amount</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-blue-400" />
                  <Input 
                    type="number" 
                    className="pl-9 bg-white border-none" 
                    placeholder="Paying now..."
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSaveOrder}
              className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg font-bold shadow-lg shadow-blue-200"
            >
              Complete Step {step} <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* RECEIPT MODAL */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md">
          <div className="p-8 bg-white text-slate-900 space-y-6 font-serif">
            <div className="text-center border-b pb-4">
              <div className="flex justify-center mb-2">
                <img src="/logo.jpg" alt="Logo" className="h-16 w-auto" />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-widest">Godage Studio</h2>
              <p className="text-[10px] text-slate-500 italic">Professional Photography & Videography</p>
            </div>

            <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400">
              <div>
                <p>Customer: <span className="text-slate-900">{customer || (customerData?._id)}</span></p>
                <p>Phone: <span className="text-slate-900">{customerPhone || (customerData?.phone)}</span></p>
              </div>
              <div className="text-right">
                <p>Date: {new Date().toLocaleDateString()}</p>
                <p>Bill No: #GS-{Math.floor(1000 + Math.random() * 9000)}</p>
              </div>
            </div>

            <table className="w-full text-[10px] border-t pt-4">
              <thead>
                <tr className="border-b text-slate-400 uppercase font-bold">
                  <th className="text-left py-1">Item</th>
                  <th className="text-right py-1">Price</th>
                </tr>
              </thead>
              <tbody>
                {/* PREVIOUS ITEMS */}
                {customerData?.purchasedProducts?.map((p: any, i: number) => (
                  <tr key={`prev-${i}`} className="border-b border-slate-50 opacity-60">
                    <td className="py-1">{p.name}</td>
                    <td className="text-right py-1">Rs. {p.price}</td>
                  </tr>
                ))}
                {/* CURRENT CART ITEMS */}
                {cart.map((p: any, i: number) => (
                  <tr key={`curr-${i}`} className="border-b border-slate-50 font-bold">
                    <td className="py-1">{p.name}</td>
                    <td className="text-right py-1">Rs. {p.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="space-y-2 pt-4 border-t-2 border-slate-900">
              <div className="flex justify-between text-sm font-black">
                <span>Current Total Amount</span>
                <span>Rs. {cartTotal + (customerData?.balance || 0)}</span>
              </div>
              
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase text-slate-400">Transaction History</p>
                {customerData?.payments?.sort((a: any, b: any) => a.step - b.step).map((p: any, i: number) => (
                  <div key={i} className="flex justify-between text-[10px]">
                    <span>Step {p.step} Payment</span>
                    <span>Rs. {p.amount}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between text-sm font-black pt-2 border-t border-dashed border-slate-300">
                <span>Final Balance Due</span>
                <span className="text-red-600">Rs. {Math.max(0, (cartTotal + (customerData?.balance || 0)) - paymentAmount)}</span>
              </div>
            </div>

            <div className="text-center pt-8 border-t">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Step {step} Completed</p>
              <p className="text-[8px] uppercase tracking-tighter text-slate-400 mt-2">Thank you for choosing Godage Studio!</p>
            </div>
          </div>
          <Button className="w-full" onClick={() => window.print()}>Print Receipt</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Billing System...</div>}>
      <OrderContent />
    </Suspense>
  );
}