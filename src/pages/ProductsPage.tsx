import { useState } from "react";
import { Plus, Search, Edit2, Trash2, ScanBarcode, Package, AlertTriangle, TrendingUp, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore, Product } from "@/store/useStore";
import BarcodeScanner from "@/components/BarcodeScanner";
import { toast } from "@/hooks/use-toast";

const categories = ["Snacks", "Dairy", "Grocery", "Beverages", "Household", "Bakery", "Personal Care", "Other"];

const emptyForm = {
  name: "", barcode: "", price: 0, mrp: 0, costPrice: 0, category: "Other",
  stock: 0, minStock: 5, taxPercent: 5,
};

// Beep helper
const playBeep = (success = true) => {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = success ? 1200 : 400;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } catch (_) {}
};

const ProductsPage = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useStore();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [newStockInput, setNewStockInput] = useState<number>(0);
  const [existingProductBarcode, setExistingProductBarcode] = useState<Product | null>(null);

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search);
    const matchesCat = catFilter === "All" || p.category === catFilter;
    return matchesSearch && matchesCat;
  });

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setNewStockInput(0); setDialogOpen(true); };
  const openEdit = (p: Product) => {
    setForm({ name: p.name, barcode: p.barcode, price: p.price, mrp: p.mrp ?? p.price, costPrice: p.costPrice, category: p.category, stock: p.stock, minStock: p.minStock, taxPercent: p.taxPercent });
    setEditingId(p.id);
    setNewStockInput(0);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.barcode) {
      toast({ title: "Missing fields", description: "Name and barcode are required", variant: "destructive" });
      return;
    }
    try {
      if (editingId) {
        // If editing and newStockInput > 0, add to existing stock
        const finalStock = newStockInput > 0 ? form.stock + newStockInput : form.stock;
        await updateProduct(editingId, { ...form, stock: finalStock });
        toast({ title: "Product updated ✓", description: newStockInput > 0 ? `Stock updated: ${form.stock} + ${newStockInput} = ${finalStock}` : undefined });
      } else {
        await addProduct({ ...form, mrp: form.mrp || form.price });
        toast({ title: "Product added ✓" });
      }
      setDialogOpen(false);
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed to save product", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    await deleteProduct(id);
    toast({ title: "Product deleted" });
    setDeleteConfirm(null);
  };

  // When scanning barcode in Products page (inventory mode)
  const handleBarcodeScan = (barcode: string) => {
    setScannerOpen(false);
    playBeep(true);

    // Check if product with this barcode already exists
    const existing = products.find((p) => p.barcode === barcode);
    if (existing) {
      // Redirect to edit that product — show stock add dialog
      setExistingProductBarcode(existing);
      return;
    }

    // New product: prefill barcode and open add dialog
    setForm({ ...emptyForm, barcode });
    setEditingId(null);
    setNewStockInput(0);
    setDialogOpen(true);
    toast({ title: "Barcode scanned", description: barcode });
  };

  const handleAddStockToExisting = async () => {
    if (!existingProductBarcode || newStockInput <= 0) return;
    const newTotal = existingProductBarcode.stock + newStockInput;
    await updateProduct(existingProductBarcode.id, { stock: newTotal });
    toast({ title: "Stock updated ✓", description: `${existingProductBarcode.name}: ${existingProductBarcode.stock} + ${newStockInput} = ${newTotal}` });
    setExistingProductBarcode(null);
    setNewStockInput(0);
  };

  const uniqueCategories: string[] = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  return (
    <div className="page-container">
      <div className="mb-5 flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="text-sm text-muted-foreground">
            {products.length} items
            {lowStockCount > 0 && <span className="ml-1 text-warning font-medium">· {lowStockCount} low stock</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setScannerOpen(true)}>
            <ScanBarcode className="h-4 w-4" />
          </Button>
          <Button size="sm" className="gap-1.5 rounded-xl gradient-primary shadow-glow-primary" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-3 animate-slide-up">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search name or barcode..." className="h-11 rounded-xl pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Category Filters */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 animate-slide-up" style={{ animationDelay: "50ms" }}>
        {uniqueCategories.map((c) => (
          <button key={c} onClick={() => setCatFilter(c)}
            className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 ${
              catFilter === c
                ? "gradient-primary text-primary-foreground shadow-glow-primary"
                : "bg-card text-muted-foreground shadow-soft hover:shadow-medium"
            }`}>
            {c}
          </button>
        ))}
      </div>

      {/* Product List */}
      <div className="space-y-2.5">
        {filtered.map((p, i) => (
          <Card key={p.id} className="border-none shadow-soft transition-all duration-200 hover:shadow-medium animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
            <CardContent className="flex items-center gap-3.5 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/8">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                  {p.stock <= p.minStock && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warning" />}
                </div>
                <p className="text-xs text-muted-foreground">{p.barcode} · {p.category}</p>
                <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-foreground">₹{p.price}</span>
                  {p.mrp > p.price && (
                    <span className="text-xs text-muted-foreground line-through">MRP ₹{p.mrp}</span>
                  )}
                  <Badge variant={p.stock <= p.minStock ? "destructive" : "secondary"} className="rounded-lg text-[10px] px-2 py-0.5 font-medium">
                    {p.stock} in stock
                  </Badge>
                  {p.soldQuantity > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <TrendingUp className="h-3 w-3" /> {p.soldQuantity} sold
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <button onClick={() => openEdit(p)} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => setDeleteConfirm(p.id)} className="rounded-lg p-2 text-destructive transition-colors hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">No products found</p>
          </div>
        )}
      </div>

      {/* Existing product found via barcode scan - stock add dialog */}
      <Dialog open={!!existingProductBarcode} onOpenChange={() => { setExistingProductBarcode(null); setNewStockInput(0); }}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" /> Product Found
            </DialogTitle>
          </DialogHeader>
          {existingProductBarcode && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-secondary/60 p-4">
                <p className="font-bold text-foreground">{existingProductBarcode.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{existingProductBarcode.barcode} · {existingProductBarcode.category}</p>
                <div className="mt-2 flex items-center gap-3 text-sm">
                  <span className="font-bold text-foreground">₹{existingProductBarcode.price}</span>
                  <Badge variant={existingProductBarcode.stock <= existingProductBarcode.minStock ? "destructive" : "secondary"} className="rounded-lg text-[10px]">
                    Current stock: {existingProductBarcode.stock}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Add New Stock
                </label>
                <Input
                  type="number"
                  min={0}
                  value={newStockInput || ""}
                  placeholder="Enter qty to add..."
                  onChange={(e) => setNewStockInput(Math.max(0, +e.target.value))}
                  className="h-11 rounded-xl text-center text-lg font-bold"
                />
              </div>

              {newStockInput > 0 && (
                <div className="flex items-center justify-between rounded-xl bg-primary/5 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-muted-foreground">{existingProductBarcode.stock}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="font-bold text-foreground">{existingProductBarcode.stock} + {newStockInput}</span>
                    <span className="text-muted-foreground">=</span>
                    <span className="text-lg font-extrabold text-primary">{existingProductBarcode.stock + newStockInput}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => { setExistingProductBarcode(null); setNewStockInput(0); }}>
                  Cancel
                </Button>
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => {
                  setExistingProductBarcode(null);
                  openEdit(existingProductBarcode);
                }}>
                  Edit Product
                </Button>
                <Button
                  className="flex-1 rounded-xl gradient-primary shadow-glow-primary"
                  disabled={newStockInput <= 0}
                  onClick={handleAddStockToExisting}
                >
                  Add Stock
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-xs rounded-2xl">
          <DialogHeader><DialogTitle>Delete Product?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" className="flex-1 rounded-xl" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">{editingId ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Product name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11 rounded-xl" />
            <div className="flex gap-2">
              <Input placeholder="Barcode *" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className="h-11 flex-1 rounded-xl" />
              <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl" onClick={() => setScannerOpen(true)}>
                <ScanBarcode className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Selling Price (₹) *</label>
                <Input type="number" value={form.price || ""} placeholder="0.00" onChange={(e) => setForm({ ...form, price: +e.target.value })} className="h-11 rounded-xl" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">MRP (₹)</label>
                <Input type="number" value={form.mrp || ""} placeholder="0.00" onChange={(e) => setForm({ ...form, mrp: +e.target.value })} className="h-11 rounded-xl" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Cost / Purchase Price (₹)</label>
              <Input type="number" value={form.costPrice || ""} placeholder="0.00" onChange={(e) => setForm({ ...form, costPrice: +e.target.value })} className="h-11 rounded-xl" />
            </div>
            {form.price > 0 && form.costPrice > 0 && (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 px-3.5 py-2.5 text-xs">
                <span className="text-muted-foreground">Margin: </span>
                <span className="font-bold text-emerald-600">
                  ₹{(form.price - form.costPrice).toFixed(2)} ({((form.price - form.costPrice) / form.price * 100).toFixed(1)}%)
                </span>
              </div>
            )}
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Stock</label>
                <Input type="number" value={form.stock || ""} placeholder="0" onChange={(e) => setForm({ ...form, stock: +e.target.value })} className="h-11 rounded-xl" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Min Stock</label>
                <Input type="number" value={form.minStock || ""} placeholder="5" onChange={(e) => setForm({ ...form, minStock: +e.target.value })} className="h-11 rounded-xl" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">GST %</label>
                <Input type="number" value={form.taxPercent || ""} placeholder="5" onChange={(e) => setForm({ ...form, taxPercent: +e.target.value })} className="h-11 rounded-xl" />
              </div>
            </div>

            {/* Add additional stock when editing */}
            {editingId && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                  Add More Stock (current: {form.stock})
                </label>
                <Input
                  type="number"
                  min={0}
                  value={newStockInput || ""}
                  placeholder="Enter qty to add..."
                  onChange={(e) => setNewStockInput(Math.max(0, +e.target.value))}
                  className="h-11 rounded-xl"
                />
                {newStockInput > 0 && (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    New total stock: <span className="font-bold text-primary">{form.stock + newStockInput}</span>
                  </p>
                )}
              </div>
            )}

            <Button className="h-12 w-full rounded-xl gradient-primary shadow-glow-primary" onClick={handleSave}>
              {editingId ? "Update Product" : "Add Product"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {scannerOpen && <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setScannerOpen(false)} />}
    </div>
  );
};

export default ProductsPage;
