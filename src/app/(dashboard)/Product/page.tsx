"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Package, Tag, AlertCircle, Eye, Pencil, Trash2 } from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isViewOnly, setIsViewOnly] = useState(false);

  const [tableError, setTableError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch products from database
  const fetchProducts = async () => {
    try {
      setTableError(null);
      const res = await fetch('/api/products', { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
        setTableError(null);
      } else {
        setProducts([]);
        setTableError(data.error || "Failed to load products");
      }
    } catch (err) {
      setTableError("Network error: Could not connect to server. Please check database connection.");
      setProducts([]);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setIsViewOnly(false);
    setIsAdding(true);
  };

  const handleView = (product: any) => {
    setEditingProduct(product);
    setIsViewOnly(true);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProducts();
      } else {
        const result = await res.json();
        alert(result.error || "Failed to delete item");
      }
    } catch (err) {
      alert("Network error: Could not delete item");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const data = {
        name: formData.get("name"),
        category: formData.get("category"),
        price: Number(formData.get("price")),
        type: "Service", // Default type
      };

      const url = editingProduct ? `/api/products/${editingProduct._id}` : '/api/products';
      const method = editingProduct ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok) {
        setIsAdding(false);
        setEditingProduct(null);
        setFormError(null);
        fetchProducts();
      } else {
        setFormError(result.error || "Failed to save item");
      }
    } catch (err: any) {
      setFormError("Network error: Could not save item. Ensure the server is running and internet is connected.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Studio Inventory</h2>
          <p className="text-sm text-slate-500">Manage your services and physical items</p>
        </div>

        <Dialog open={isAdding} onOpenChange={(open) => {
          setIsAdding(open);
          if (open) setFormError(null);
          if (!open) {
            setEditingProduct(null);
            setIsViewOnly(false);
          }
        }}>
          <DialogTrigger render={<Button className="bg-blue-600" />}>
            <Plus className="mr-2 h-4 w-4" /> Add New Item
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isViewOnly ? "View Item" : (editingProduct ? "Edit Item" : "Add New Product/Service")}
              </DialogTitle>
            </DialogHeader>
            <form className="space-y-4 py-4" onSubmit={handleSubmit}>
              {formError && (
                <div className="p-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                   <AlertCircle className="h-4 w-4 shrink-0" />
                   <span>{formError}</span>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input name="name" defaultValue={editingProduct?.name} placeholder="e.g. Wedding Album" required readOnly={isViewOnly} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Input name="category" defaultValue={editingProduct?.category} placeholder="e.g. Photography" required readOnly={isViewOnly} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price (Rs.)</label>
                  <Input name="price" type="number" defaultValue={editingProduct?.price} placeholder="5000" required readOnly={isViewOnly} />
                </div>
              </div>
              {!isViewOnly && (
                <Button type="submit" disabled={loading} className="w-full bg-blue-600">
                  {loading ? "Saving..." : (editingProduct ? "Update Item" : "Save to Inventory")}
                </Button>
              )}
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {tableError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center justify-between">
          <p className="text-sm">{tableError}</p>
          <Button variant="outline" size="sm" onClick={() => fetchProducts()} className="border-red-300 text-red-700 hover:bg-red-100">
            Retry Connection
          </Button>
        </div>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product: any) => (
              <TableRow key={product._id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell><Tag className="inline mr-2 h-3 w-3" />{product.category}</TableCell>
                <TableCell>{product.type}</TableCell>
                <TableCell className="text-right font-bold">Rs. {product.price}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleView(product)}>
                      <Eye className="h-4 w-4 text-slate-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                      <Pencil className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(product._id)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}