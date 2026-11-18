"use client";
import { useState, useEffect, useMemo, Suspense } from "react";
import { getInventoryItems, createStepOrder } from "@/lib/actions/posActions";
import { getCustomerByName } from "@/lib/actions/customerActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, Trash2, CreditCard, ChevronRight, History, Printer, 
  Search, Percent, Tag, CheckCircle2, AlertCircle, FileText, X
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from "@/components/ui/dialog";
import A5Receipt from "@/components/billing/A5Receipt";

interface Discount {
  _id: string;
  id: string;
  name: string;
  code?: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  customerType: "ALL" | "SPECIFIC";
  customerName?: string;
  customerPhone?: string;
  minSpend?: number;
  active: boolean;
}

interface BillHistoryOrder {
  _id: string;
  billNo?: string;
  customerName: string;
  customerPhone?: string;
  items?: Array<{ name: string; price: number }>;
  subtotal?: number;
  discount?: {
    name: string;
    amount: number;
    type?: string;
    value?: number;
  };
  totalAmount: number;
  advancePaid: number;
  paymentStep?: number;
  status: string;
  createdAt: string;
}

function OrderContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [customer, setCustomer] = useState(searchParams.get("name") || "");
  const [customerPhone, setCustomerPhone] = useState(searchParams.get("phone") || "");
  const [customerData, setCustomerData] = useState<any>(null);
  const [customersList, setCustomersList] = useState<Array<{ name: string; phone?: string }>>([]);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [step, setStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(3);
  const [activeCategory, setActiveCategory] = useState<string>("");

  // Discounts state
  const [availableDiscounts, setAvailableDiscounts] = useState<Discount[]>([]);
  const [selectedDiscountId, setSelectedDiscountId] = useState<string>("");
  const [promoCodeInput, setPromoCodeInput] = useState<string>("");
  const [promoMessage, setPromoMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Bill Reference Search state
  const [billSearchQuery, setBillSearchQuery] = useState("");
  const [isSearchingBill, setIsSearchingBill] = useState(false);
  const [searchedBill, setSearchedBill] = useState<BillHistoryOrder | null>(null);
  const [billSearchError, setBillSearchError] = useState<string | null>(null);
  const [showBillHistoryModal, setShowBillHistoryModal] = useState(false);

  // Receipt modal state
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<{
    customer: string;
    phone: string;
    items: any[];
    subtotal: number;
    discount?: {
      name: string;
      amount: number;
      type?: string;
      value?: number;
    } | null;
    totalAmount: number;
    paidAmount: number;
    balanceDue: number;
    step: number;
    billNo: string;
    date: string;
  } | null>(null);

  useEffect(() => {
    const name = searchParams.get("name");
    const phone = searchParams.get("phone");
    if (name) setCustomer(name);
    if (phone) setCustomerPhone(phone);
  }, [searchParams]);

  // Load registered customers for instant name & phone auto-completion
  useEffect(() => {
    fetch("/api/customers", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: any[]) => {
        if (Array.isArray(data)) {
          setCustomersList(data.map((c) => ({ name: c.name || c._id, phone: c.phone || "" })));
        }
      })
      .catch((err) => console.error("Failed to load customers for autocomplete:", err));
  }, []);

  // Load customer history & phone if name matches
  useEffect(() => {
    if (customer.trim()) {
      getCustomerByName(customer.trim()).then((data) => {
        setCustomerData(data);
        if (data) {
          if (data.phone && !customerPhone) {
            setCustomerPhone(data.phone);
          }
          const nextStep = Math.min(3, (data.latestPaymentStep || 0) + 1);
          setStep(nextStep);
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

  // Load Inventory Products
  useEffect(() => {
    getInventoryItems().then((data) => {
      setProducts(data);
      if (data.length > 0) {
        setActiveCategory(data[0].category);
      }
    });
  }, []);

  // Load active discounts
  useEffect(() => {
    fetch("/api/discounts", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Discount[]) => {
        const activeOnly = Array.isArray(data) ? data.filter((d) => d.active !== false) : [];
        setAvailableDiscounts(activeOnly);
      })
      .catch((err) => console.error("Failed to load discounts:", err));
  }, []);

  const categories = Array.from(new Set(products.map((p) => p.category)));

  const addToCart = (product: any) => {
    setCart((prev) => [...prev, { ...product, cartId: `${product._id}-${Math.random()}` }]);
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  }, [cart]);

  // Applicable discounts matching current customer
  const customerApplicableDiscounts = useMemo(() => {
    const custClean = customer.trim().toLowerCase();
    const phoneClean = customerPhone.trim();

    return availableDiscounts.filter((d) => {
      if (d.active === false) return false;
      if (d.customerType === "ALL") return true;
      if (d.customerType === "SPECIFIC") {
        const nameMatches = d.customerName && custClean && d.customerName.trim().toLowerCase() === custClean;
        const phoneMatches = d.customerPhone && phoneClean && d.customerPhone.trim() === phoneClean;
        return Boolean(nameMatches || phoneMatches);
      }
      return false;
    });
  }, [availableDiscounts, customer, customerPhone]);

  // Selected discount object
  const activeDiscountObj = useMemo(() => {
    if (!selectedDiscountId) return null;
    return availableDiscounts.find((d) => d._id === selectedDiscountId || d.id === selectedDiscountId) || null;
  }, [selectedDiscountId, availableDiscounts]);

  // Calculate discount amount
  const discountAmount = useMemo(() => {
    if (!activeDiscountObj || cartTotal <= 0) return 0;
    if (activeDiscountObj.minSpend && cartTotal < activeDiscountObj.minSpend) {
      return 0;
    }
    if (activeDiscountObj.type === "PERCENTAGE") {
      return Math.round((cartTotal * Number(activeDiscountObj.value)) / 100);
    }
    return Math.min(cartTotal, Number(activeDiscountObj.value));
  }, [activeDiscountObj, cartTotal]);

  const finalOrderTotal = Math.max(0, cartTotal - discountAmount);
  const remainingBalance = Math.max(0, finalOrderTotal - paymentAmount);

  // Apply promo code manually
  const handleApplyPromoCode = () => {
    const codeClean = promoCodeInput.trim().toUpperCase();
    if (!codeClean) return;

    const matched = availableDiscounts.find(
      (d) => d.code && d.code.trim().toUpperCase() === codeClean
    );

    if (!matched) {
      setPromoMessage({ type: "error", text: "Invalid promo code" });
      return;
    }

    if (matched.customerType === "SPECIFIC") {
      const custClean = customer.trim().toLowerCase();
      if (!custClean || matched.customerName?.trim().toLowerCase() !== custClean) {
        setPromoMessage({ 
          type: "error", 
          text: `This code is exclusively reserved for customer: ${matched.customerName}` 
        });
        return;
      }
    }

    if (matched.minSpend && cartTotal < matched.minSpend) {
      setPromoMessage({
        type: "error",
        text: `Minimum bill of Rs. ${matched.minSpend.toLocaleString()} required for this offer`
      });
      return;
    }

    setSelectedDiscountId(matched._id || matched.id);
    setPromoMessage({
      type: "success",
      text: `Applied: ${matched.name} (${matched.type === "PERCENTAGE" ? `${matched.value}%` : `Rs. ${matched.value}`} off)`
    });
  };

  // Bill Reference Search Function
  const handleSearchBill = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = billSearchQuery.trim();
    if (!query) return;

    setIsSearchingBill(true);
    setBillSearchError(null);
    setSearchedBill(null);

    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      if (!res.ok) throw new Error("Could not connect to orders database");
      const allOrders: BillHistoryOrder[] = await res.json();

      const term = query.toLowerCase().replace("#", "");
      const found = allOrders.find((o) => {
        const b = (o.billNo || "").toLowerCase().replace("#", "");
        const id = (o._id || "").toLowerCase();
        return b === term || b.includes(term) || id.slice(0, 5) === term;
      });

      if (found) {
        setSearchedBill(found);
        setShowBillHistoryModal(true);
      } else {
        setBillSearchError(`No invoice found matching Reference #${query}`);
      }
    } catch (err: any) {
      setBillSearchError(err.message || "Failed to search bill reference number");
    } finally {
      setIsSearchingBill(false);
    }
  };

  // Load searched bill's customer and details into POS
  const handleLoadBillIntoPOS = (order: BillHistoryOrder) => {
    setCustomer(order.customerName);
    if (order.customerPhone) {
      setCustomerPhone(order.customerPhone);
    }
    const nextStep = Math.min(3, (order.paymentStep || 1) + 1);
    setStep(nextStep);
    setShowBillHistoryModal(false);
  };

  const handleSaveOrder = async () => {
    if (!customer) return alert("Please enter or select a customer name.");
    if (cart.length === 0) return alert("Please add at least one item to the cart.");

    const paid = Number(paymentAmount) || 0;
    const currentBillNo = `#GS-${Math.floor(1000 + Math.random() * 9000)}`;

    const discountPayload = activeDiscountObj && discountAmount > 0 ? {
      id: activeDiscountObj._id || activeDiscountObj.id,
      name: activeDiscountObj.name,
      code: activeDiscountObj.code || "",
      type: activeDiscountObj.type,
      value: activeDiscountObj.value,
      amount: discountAmount
    } : null;

    const finalPhone = (customerPhone || customerData?.phone || "").trim();

    const result = await createStepOrder({
      billNo: currentBillNo,
      customerName: customer,
      customerPhone: finalPhone,
      items: cart,
      subtotal: cartTotal,
      discount: discountPayload,
      totalAmount: finalOrderTotal,
      paidNow: paid,
      currentStep: step
    });

    if (result.success) {
      const confirmedPhone = result.customerPhone || finalPhone || "";
      setLastReceipt({
        customer: customer,
        phone: confirmedPhone,
        items: [...cart],
        subtotal: cartTotal,
        discount: discountPayload,
        totalAmount: finalOrderTotal,
        paidAmount: paid,
        balanceDue: remainingBalance,
        step: step,
        billNo: currentBillNo,
        date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }),
      });

      if (remainingBalance <= 0) {
        alert("Transaction Fully Completed!");
        setCustomer("");
        setCustomerPhone("");
        setSelectedDiscountId("");
        setPromoCodeInput("");
        setPromoMessage(null);
        setStep(1);
        setTotalSteps(3);
      } else {
        alert(`Step ${step} Completed! Remaining: Rs. ${remainingBalance.toLocaleString()}`);

        if (totalSteps === 1) {
          setCustomer("");
          setCustomerPhone("");
          setStep(1);
        } else if (totalSteps === 2) {
          if (step === 1) setStep(3);
          else { setCustomer(""); setCustomerPhone(""); setStep(1); }
        } else {
          if (step === 1) setStep(2);
          else if (step === 2) setStep(3);
          else { setCustomer(""); setCustomerPhone(""); setStep(1); }
        }
      }

      setCart([]);
      setPaymentAmount(0);
      setShowReceipt(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* TOP BAR: BILL REFERENCE NUMBER SEARCH & QUICK ACTIONS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-blue-600" />
            Studio POS &amp; Billing
          </h2>
          <p className="text-xs text-slate-500">
            Create invoices, assign customer discounts, or look up previous bill references.
          </p>
        </div>

        {/* Bill Reference Search Input */}
        <form onSubmit={handleSearchBill} className="flex items-center gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search Bill # (e.g. GS-2518 or 2518)..."
              value={billSearchQuery}
              onChange={(e) => {
                setBillSearchQuery(e.target.value);
                if (billSearchError) setBillSearchError(null);
              }}
              className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 focus-visible:ring-blue-600"
            />
            {billSearchQuery && (
              <button 
                type="button" 
                onClick={() => { setBillSearchQuery(""); setBillSearchError(null); }}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button 
            type="submit" 
            size="sm" 
            disabled={isSearchingBill || !billSearchQuery.trim()}
            className="h-9 px-3 bg-slate-900 hover:bg-slate-800 text-xs font-semibold gap-1.5 shrink-0"
          >
            <FileText className="h-3.5 w-3.5" />
            {isSearchingBill ? "Searching..." : "Lookup Bill"}
          </Button>
        </form>
      </div>

      {billSearchError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center justify-between">
          <span>{billSearchError}</span>
          <button onClick={() => setBillSearchError(null)} className="font-bold underline text-red-700">Dismiss</button>
        </div>
      )}

      {/* MAIN TWO-COLUMN POS WORKSPACE */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* LEFT: Dynamic Inventory System */}
        <div className="xl:col-span-3 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">Select Studio Services &amp; Items</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Payment Step:</span>
              {[1, 2, 3].map((s) => (
                <Badge 
                  key={s} 
                  variant={step === s ? "default" : "outline"}
                  className="cursor-pointer px-2.5 py-0.5 text-xs font-bold"
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
                <TabsTrigger key={cat} value={cat} className="capitalize px-6 text-xs font-semibold">
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
                      className="cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all border-none shadow-sm hover:shadow bg-white"
                      onClick={() => addToCart(product)}
                    >
                      <CardContent className="p-4 space-y-2 text-center">
                        <p className="font-bold text-sm truncate text-slate-900">{product.name}</p>
                        <p className="text-blue-600 font-black">Rs. {Number(product.price).toLocaleString()}</p>
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          className="w-full text-[11px] h-7 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 font-semibold"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                          }}
                        >
                          + Add to Bill
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* RIGHT: Billing, Discount & Multi-Step Logic */}
        <div className="space-y-4">
          <Card className="border-none shadow-xl bg-white">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <ShoppingCart size={18} className="text-blue-600" />
                <h3 className="font-bold text-slate-900">Checkout Summary</h3>
              </div>

              {/* Customer Inputs with Autocomplete */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer Details</label>
                <div className="space-y-1">
                  <Input 
                    list="registered-customers"
                    placeholder="Customer Full Name *" 
                    value={customer} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomer(val);
                      const matched = customersList.find((c) => c.name.toLowerCase() === val.toLowerCase());
                      if (matched && matched.phone) {
                        setCustomerPhone(matched.phone);
                      }
                    }}
                    className="bg-slate-50 border-slate-200 text-xs h-9"
                  />
                  <datalist id="registered-customers">
                    {customersList.map((c, i) => (
                      <option key={i} value={c.name}>
                        {c.phone ? `${c.phone}` : ""}
                      </option>
                    ))}
                  </datalist>
                </div>
                <Input 
                  placeholder="Customer Phone Number (e.g. 0715926263)" 
                  value={customerPhone} 
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="bg-slate-50 border-slate-200 text-xs h-9 font-medium"
                />
                
                <div className="space-y-1 pt-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Installment Plan</label>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((num) => (
                      <Badge 
                        key={num} 
                        variant={totalSteps === num ? "default" : "secondary"}
                        className="cursor-pointer px-3 py-1 text-[10px] font-semibold"
                        onClick={() => setTotalSteps(num)}
                      >
                        {num} {num === 1 ? 'Step (Full)' : 'Steps'}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Customer Past Balance & History Warning */}
              {customerData && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-100 space-y-1.5 animate-in fade-in">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5 text-red-700">
                      <History size={13} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Previous Balance</span>
                    </div>
                    <Badge variant="outline" className="bg-white text-red-600 border-red-200 font-mono text-[11px] font-bold">
                      Rs. {Number(customerData.balance).toLocaleString()}
                    </Badge>
                  </div>
                  {customerData.purchasedProducts?.length > 0 && (
                    <div className="space-y-0.5">
                      <p className="text-[9px] text-red-500 font-bold uppercase">Past Purchases:</p>
                      <div className="flex flex-wrap gap-1">
                        {customerData.purchasedProducts.slice(0, 3).map((p: any, i: number) => (
                          <Badge key={i} variant="secondary" className="text-[9px] bg-white text-red-700 border-red-100">
                            {p.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Cart Items List */}
              <div className="max-h-[200px] overflow-auto space-y-2 py-2 border-y border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Current Order Items ({cart.length})</p>
                {cart.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No items added to cart</p>}
                {cart.map((item) => (
                  <div key={item.cartId} className="flex justify-between items-center text-xs group py-1 border-b border-slate-50 last:border-none">
                    <span className="truncate w-36 font-semibold text-slate-800">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600 font-mono font-medium">Rs.{Number(item.price).toLocaleString()}</span>
                      <button 
                        onClick={() => setCart(cart.filter(i => i.cartId !== item.cartId))}
                        className="text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* DISCOUNT & PROMO CODE SECTION */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Percent className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Customer Discount</span>
                  </div>
                  {activeDiscountObj && (
                    <button 
                      onClick={() => { setSelectedDiscountId(""); setPromoMessage(null); }}
                      className="text-[10px] text-red-500 hover:underline font-semibold"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* Applicable Discounts Dropdown */}
                {customerApplicableDiscounts.length > 0 ? (
                  <select 
                    value={selectedDiscountId} 
                    onChange={(e) => {
                      setSelectedDiscountId(e.target.value);
                      setPromoMessage(null);
                    }}
                    className="w-full h-8 text-xs bg-white border border-slate-200 rounded-md px-2 focus:ring-1 focus:ring-blue-600 font-medium"
                  >
                    <option value="">Select applicable discount...</option>
                    {customerApplicableDiscounts.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name} ({d.type === "PERCENTAGE" ? `${d.value}% Off` : `Rs. ${d.value} Off`})
                        {d.customerType === "SPECIFIC" ? ` [Customer: ${d.customerName}]` : " [All]"}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    No automatic discounts assigned to {customer || "this customer"}.
                  </p>
                )}

                {/* Promo Code Input */}
                <div className="flex gap-1.5 pt-1">
                  <Input 
                    placeholder="Enter Promo Code..." 
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                    className="h-8 text-xs bg-white uppercase font-mono"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handleApplyPromoCode}
                    disabled={!promoCodeInput.trim()}
                    className="h-8 text-xs font-semibold px-2.5"
                  >
                    Apply
                  </Button>
                </div>

                {promoMessage && (
                  <p className={`text-[10px] font-bold ${promoMessage.type === "success" ? "text-emerald-600" : "text-red-500"}`}>
                    {promoMessage.text}
                  </p>
                )}

                {activeDiscountObj && discountAmount > 0 && (
                  <div className="flex justify-between items-center text-xs text-emerald-700 bg-emerald-50 p-1.5 rounded border border-emerald-200 font-bold">
                    <span>Discount Applied:</span>
                    <span>- Rs. {discountAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* FINANCIAL CALCULATION BREAKDOWN */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-mono">Rs. {cartTotal.toLocaleString()}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-600 font-bold">
                    <span>Discount ({activeDiscountObj?.name})</span>
                    <span>- Rs. {discountAmount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between font-black text-lg text-slate-900 pt-1 border-t border-slate-100">
                  <span>Total Amount</span>
                  <span>Rs. {finalOrderTotal.toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-xs font-bold text-slate-500 pb-1">
                  <span>Balance Due</span>
                  <span className={remainingBalance > 0 ? "text-red-600 font-mono font-bold" : "text-emerald-600 font-mono font-bold"}>
                    Rs. {remainingBalance.toLocaleString()}
                  </span>
                </div>
                
                {/* Step Payment Input */}
                <div className="bg-blue-50 p-3 rounded-lg space-y-1.5 border border-blue-100">
                  <label className="text-[10px] font-bold text-blue-700 uppercase">
                    Step {step} Payment Amount (Rs.)
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-blue-400" />
                    <Input 
                      type="number" 
                      className="pl-9 bg-white border-blue-200 h-9 text-sm font-bold" 
                      placeholder="Paying now..."
                      value={paymentAmount || ""}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-blue-600 pt-0.5">
                    <button 
                      type="button" 
                      onClick={() => setPaymentAmount(finalOrderTotal)} 
                      className="hover:underline font-bold"
                    >
                      Pay Full (Rs. {finalOrderTotal.toLocaleString()})
                    </button>
                    {totalSteps > 1 && (
                      <button 
                        type="button" 
                        onClick={() => setPaymentAmount(Math.round(finalOrderTotal / totalSteps))} 
                        className="hover:underline font-bold"
                      >
                        Pay 1/{totalSteps} (Rs. {Math.round(finalOrderTotal / totalSteps).toLocaleString()})
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleSaveOrder}
                className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-base font-bold shadow-md shadow-blue-200"
              >
                Complete Step {step} <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MODAL 1: SEARCHED BILL REFERENCE DETAILS & HISTORY */}
      <Dialog open={showBillHistoryModal} onOpenChange={setShowBillHistoryModal}>
        <DialogContent className="max-w-md">
          {searchedBill && (
            <div className="space-y-4 p-1">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Bill Reference: {searchedBill.billNo || `#GS-${searchedBill._id?.slice(0, 5).toUpperCase()}`}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Complete history and balance status for this invoice
                </DialogDescription>
              </DialogHeader>

              {/* Customer & Bill Overview */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 grid grid-cols-2 gap-2.5 text-xs">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Customer Name</p>
                  <p className="font-bold text-slate-900 text-sm">{searchedBill.customerName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</p>
                  <p className="font-medium text-slate-700">{searchedBill.customerPhone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Order Date</p>
                  <p className="text-slate-700">
                    {searchedBill.createdAt ? new Date(searchedBill.createdAt).toLocaleDateString() : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Payment Status</p>
                  <span className={`inline-block font-bold text-[10px] px-2 py-0.5 rounded-full ${
                    Math.max(0, searchedBill.totalAmount - searchedBill.advancePaid) <= 0 
                      ? "bg-emerald-100 text-emerald-800" 
                      : "bg-orange-100 text-orange-800"
                  }`}>
                    {Math.max(0, searchedBill.totalAmount - searchedBill.advancePaid) <= 0 
                      ? "Fully Paid" 
                      : `Step ${searchedBill.paymentStep || 1} Due`}
                  </span>
                </div>
              </div>

              {/* Purchased Products / Services */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Purchased Products / Services</p>
                <div className="max-h-36 overflow-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                      <tr>
                        <th className="text-left p-2">Item</th>
                        <th className="text-right p-2">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Array.isArray(searchedBill.items) && searchedBill.items.length > 0 ? (
                        searchedBill.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="p-2 font-medium text-slate-800">{item.name}</td>
                            <td className="p-2 text-right font-mono font-bold text-slate-900">
                              Rs. {Number(item.price).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2} className="p-2 text-center text-slate-400">
                            Studio Service / Photography
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Balance Summary */}
              <div className="bg-slate-900 text-white p-3.5 rounded-lg space-y-1.5 text-xs">
                {searchedBill.discount && searchedBill.discount.amount > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Discount ({searchedBill.discount.name})</span>
                    <span className="text-emerald-400">- Rs. {Number(searchedBill.discount.amount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Invoiced Amount</span>
                  <span className="font-bold">Rs. {Number(searchedBill.totalAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Paid to Date</span>
                  <span className="font-bold text-emerald-400">Rs. {Number(searchedBill.advancePaid).toLocaleString()}</span>
                </div>
                <div className="border-t border-slate-700 pt-1.5 flex justify-between font-black text-sm">
                  <span>Balance Due</span>
                  <span className={Math.max(0, searchedBill.totalAmount - searchedBill.advancePaid) > 0 ? "text-red-400" : "text-emerald-400"}>
                    Rs. {Math.max(0, searchedBill.totalAmount - searchedBill.advancePaid).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs font-bold"
                  onClick={() => handleLoadBillIntoPOS(searchedBill)}
                >
                  Load Customer into POS
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setLastReceipt({
                      customer: searchedBill.customerName,
                      phone: searchedBill.customerPhone || "",
                      items: searchedBill.items || [],
                      subtotal: searchedBill.subtotal || searchedBill.totalAmount,
                      discount: searchedBill.discount || null,
                      totalAmount: searchedBill.totalAmount,
                      paidAmount: searchedBill.advancePaid,
                      balanceDue: Math.max(0, searchedBill.totalAmount - searchedBill.advancePaid),
                      step: searchedBill.paymentStep || 1,
                      billNo: searchedBill.billNo || `#GS-${searchedBill._id?.slice(0, 5).toUpperCase()}`,
                      date: searchedBill.createdAt ? new Date(searchedBill.createdAt).toLocaleDateString("en-GB") : new Date().toLocaleDateString("en-GB"),
                    });
                    setShowBillHistoryModal(false);
                    setShowReceipt(true);
                  }}
                  className="text-xs font-semibold gap-1 text-slate-700"
                >
                  <Printer className="h-3.5 w-3.5" /> Print Bill (A4)
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowBillHistoryModal(false)}
                  className="text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 2: A5 PROFESSIONAL STUDIO RECEIPT */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-2xl p-4 sm:p-6 bg-slate-50 overflow-y-auto max-h-[92vh]">
          {lastReceipt && (
            <A5Receipt 
              billNo={lastReceipt.billNo}
              date={lastReceipt.date}
              customerName={lastReceipt.customer}
              customerPhone={lastReceipt.phone}
              items={lastReceipt.items}
              subtotal={lastReceipt.subtotal}
              discount={lastReceipt.discount}
              totalAmount={lastReceipt.totalAmount}
              paidAmount={lastReceipt.paidAmount}
              balanceDue={lastReceipt.balanceDue}
              paymentStep={lastReceipt.step}
              totalSteps={totalSteps}
              onClose={() => setShowReceipt(false)}
            />
          )}
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
