"use client";
import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Plus, Search, Tag, Percent, Trash2, Edit2, CheckCircle2, 
  XCircle, User, Users, RefreshCw, AlertCircle, Loader2 
} from "lucide-react";

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
  createdAt?: string;
}

interface CustomerOption {
  _id: string;
  name: string;
  phone?: string;
}

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form States
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [value, setValue] = useState("");
  const [customerType, setCustomerType] = useState<"ALL" | "SPECIFIC">("ALL");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [minSpend, setMinSpend] = useState("");
  const [active, setActive] = useState(true);

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/discounts", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setDiscounts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch discounts:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setCustomers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch customers list:", err);
    }
  };

  useEffect(() => {
    fetchDiscounts();
    fetchCustomers();
  }, []);

  const resetForm = () => {
    setEditingDiscount(null);
    setName("");
    setCode("");
    setType("PERCENTAGE");
    setValue("");
    setCustomerType("ALL");
    setSelectedCustomer("");
    setCustomerPhone("");
    setMinSpend("");
    setActive(true);
    setFormError(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (discount: Discount) => {
    setEditingDiscount(discount);
    setName(discount.name || "");
    setCode(discount.code || "");
    setType(discount.type || "PERCENTAGE");
    setValue(String(discount.value || ""));
    setCustomerType(discount.customerType || "ALL");
    setSelectedCustomer(discount.customerName || "");
    setCustomerPhone(discount.customerPhone || "");
    setMinSpend(discount.minSpend ? String(discount.minSpend) : "");
    setActive(discount.active !== false);
    setFormError(null);
    setIsDialogOpen(true);
  };

  const handleSaveDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Discount name is required.");
      return;
    }

    const numValue = Number(value);
    if (isNaN(numValue) || numValue <= 0) {
      setFormError("Please enter a valid discount amount or percentage greater than 0.");
      return;
    }

    if (type === "PERCENTAGE" && numValue > 100) {
      setFormError("Percentage discount cannot exceed 100%.");
      return;
    }

    if (customerType === "SPECIFIC" && !selectedCustomer.trim()) {
      setFormError("Please select or enter the specific customer name.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        type,
        value: numValue,
        customerType,
        customerName: customerType === "SPECIFIC" ? selectedCustomer.trim() : "",
        customerPhone: customerType === "SPECIFIC" ? customerPhone.trim() : "",
        minSpend: Number(minSpend) || 0,
        active,
      };

      const url = editingDiscount ? `/api/discounts/${editingDiscount._id}` : "/api/discounts";
      const method = editingDiscount ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save discount.");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchDiscounts();
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (discount: Discount) => {
    try {
      const res = await fetch(`/api/discounts/${discount._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !discount.active }),
      });
      if (res.ok) {
        fetchDiscounts();
      }
    } catch (err) {
      console.error("Failed to toggle discount active state:", err);
    }
  };

  const handleDelete = async (id: string, discountName: string) => {
    if (!confirm(`Are you sure you want to permanently delete discount "${discountName}"?`)) return;

    try {
      const res = await fetch(`/api/discounts/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchDiscounts();
      } else {
        alert("Failed to delete discount.");
      }
    } catch (err) {
      alert("Error deleting discount.");
    }
  };

  const filteredDiscounts = discounts.filter((d) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      d.name.toLowerCase().includes(term) ||
      (d.code && d.code.toLowerCase().includes(term)) ||
      (d.customerName && d.customerName.toLowerCase().includes(term))
    );
  });

  const activeCount = discounts.filter((d) => d.active).length;
  const customerSpecificCount = discounts.filter((d) => d.customerType === "SPECIFIC").length;
  const generalCount = discounts.filter((d) => d.customerType === "ALL").length;

  return (
    <div className="space-y-6">
      {/* Title & Action Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Discounts & Customer Offers</h2>
          <p className="text-sm text-slate-500">
            Create store-wide promo discounts or assign special rate offers to specific customers
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchDiscounts} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Plus className="h-4 w-4" /> Create Discount
          </Button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-400">Active Discounts</p>
              <p className="text-2xl font-black text-slate-900">{activeCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <User className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-400">Customer-Specific</p>
              <p className="text-2xl font-black text-slate-900">{customerSpecificCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-400">All Customers (General)</p>
              <p className="text-2xl font-black text-slate-900">{generalCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Search by discount name, code, or customer..." 
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

      {/* Discounts Table */}
      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Discount Name</TableHead>
              <TableHead>Promo Code</TableHead>
              <TableHead>Discount Value</TableHead>
              <TableHead>Applicable Customer</TableHead>
              <TableHead>Min. Spend</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-slate-400">
                  Loading discounts...
                </TableCell>
              </TableRow>
            ) : filteredDiscounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                  <Tag className="mx-auto h-8 w-8 mb-2 opacity-30" />
                  <p className="font-medium">No discounts found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Click "Create Discount" to set up your first customer discount or promo offer.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredDiscounts.map((discount) => (
                <TableRow key={discount._id} className="hover:bg-slate-50/80 transition-colors">
                  <TableCell className="font-bold text-slate-900">
                    {discount.name}
                  </TableCell>

                  <TableCell>
                    {discount.code ? (
                      <Badge variant="outline" className="font-mono text-xs bg-slate-100 text-slate-800 border-slate-300">
                        {discount.code}
                      </Badge>
                    ) : (
                      <span className="text-slate-400 text-xs italic">Auto-applied</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-bold border-none">
                      {discount.type === "PERCENTAGE" ? `${discount.value}% OFF` : `Rs. ${discount.value.toLocaleString()} OFF`}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    {discount.customerType === "SPECIFIC" ? (
                      <div className="flex items-center gap-1.5 text-xs text-purple-700 font-medium bg-purple-50 px-2.5 py-1 rounded-md w-fit">
                        <User className="h-3.5 w-3.5" />
                        <span>{discount.customerName || "Specific Customer"}</span>
                        {discount.customerPhone && <span className="text-slate-400 font-normal">({discount.customerPhone})</span>}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md w-fit">
                        <Users className="h-3.5 w-3.5" />
                        <span>All Customers</span>
                      </div>
                    )}
                  </TableCell>

                  <TableCell className="text-xs text-slate-600">
                    {discount.minSpend && discount.minSpend > 0 ? `Rs. ${discount.minSpend.toLocaleString()}` : "None"}
                  </TableCell>

                  <TableCell>
                    <button 
                      onClick={() => handleToggleActive(discount)}
                      className="cursor-pointer focus:outline-none"
                      title="Click to toggle status"
                    >
                      {discount.active ? (
                        <Badge className="bg-emerald-100 text-emerald-800 border-none font-semibold text-[11px] gap-1 hover:bg-emerald-200">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-500 border-none font-semibold text-[11px] gap-1 hover:bg-slate-200">
                          <XCircle className="h-3 w-3" /> Inactive
                        </Badge>
                      )}
                    </button>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => openEditDialog(discount)}
                        title="Edit Discount"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(discount._id, discount.name)}
                        title="Delete Discount"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* CREATE / EDIT DISCOUNT DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Percent className="h-5 w-5 text-blue-600" />
              {editingDiscount ? "Edit Discount / Offer" : "Create New Discount"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveDiscount} className="space-y-4 py-2">
            {formError && (
              <div className="p-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Discount Title */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-600">Discount Title *</label>
              <Input 
                placeholder="e.g. Regular Customer 10% Off, Summer Offer" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Promo Code */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-600">Promo Code (Optional)</label>
              <Input 
                placeholder="e.g. LOYAL10, WEDDING2000" 
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
              <p className="text-[11px] text-slate-400">If left blank, cashier can apply it by name in POS.</p>
            </div>

            {/* Type & Value */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-600">Discount Type</label>
                <select 
                  className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  value={type}
                  onChange={(e) => setType(e.target.value as "PERCENTAGE" | "FIXED")}
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (Rs.)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-600">
                  {type === "PERCENTAGE" ? "Value (%) *" : "Value (Rs.) *"}
                </label>
                <Input 
                  type="number" 
                  step="any"
                  placeholder={type === "PERCENTAGE" ? "e.g. 10" : "e.g. 2500"} 
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Target Audience: All vs Specific Customer */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold uppercase text-slate-600">Applicable To</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCustomerType("ALL")}
                  className={`p-3 rounded-lg border text-left text-xs font-bold flex items-center gap-2 transition-all ${
                    customerType === "ALL" 
                      ? "border-blue-600 bg-blue-50/50 text-blue-700" 
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Users className="h-4 w-4" /> All Customers
                </button>

                <button
                  type="button"
                  onClick={() => setCustomerType("SPECIFIC")}
                  className={`p-3 rounded-lg border text-left text-xs font-bold flex items-center gap-2 transition-all ${
                    customerType === "SPECIFIC" 
                      ? "border-purple-600 bg-purple-50/50 text-purple-700" 
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <User className="h-4 w-4" /> Specific Customer
                </button>
              </div>
            </div>

            {/* If Specific Customer: Select or Enter Name */}
            {customerType === "SPECIFIC" && (
              <div className="space-y-3 bg-purple-50/50 p-3.5 rounded-lg border border-purple-100 animate-in fade-in">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-purple-900">Select Customer</label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-purple-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                    value={selectedCustomer}
                    onChange={(e) => {
                      const nameVal = e.target.value;
                      setSelectedCustomer(nameVal);
                      const found = customers.find((c) => c.name === nameVal);
                      if (found?.phone) setCustomerPhone(found.phone);
                    }}
                  >
                    <option value="">-- Choose Existing Customer --</option>
                    {customers.map((c) => (
                      <option key={c._id} value={c.name}>
                        {c.name} {c.phone ? `(${c.phone})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-purple-900">Or Type Customer Name</label>
                  <Input 
                    placeholder="Customer full name..." 
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                    required={customerType === "SPECIFIC"}
                    className="bg-white border-purple-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-purple-900">Phone (Optional)</label>
                  <Input 
                    placeholder="Customer phone..." 
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="bg-white border-purple-200"
                  />
                </div>
              </div>
            )}

            {/* Minimum Spend */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-600">Minimum Order Spend (Optional, Rs.)</label>
              <Input 
                type="number" 
                placeholder="e.g. 5000 (applies only if order >= this amount)" 
                value={minSpend}
                onChange={(e) => setMinSpend(e.target.value)}
              />
            </div>

            {/* Active Toggle */}
            <div className="flex items-center gap-2 pt-2">
              <input 
                type="checkbox" 
                id="activeToggle" 
                checked={active} 
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="activeToggle" className="text-sm font-medium text-slate-700 cursor-pointer">
                Set as Active (Available immediately in POS)
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 font-bold">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingDiscount ? "Update Discount" : "Save Discount"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
