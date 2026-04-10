import { useState, useCallback } from "react";
import { ScanBarcode, Camera, Search, Zap, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/store/useStore";
import BarcodeScanner from "@/components/BarcodeScanner";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const playBeep = (success = true) => {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = success ? 1200 : 400;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  } catch (_) {}
};

const ScanPage = () => {
  const { getProductByBarcode, addToCart, products } = useStore();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [quantityDialog, setQuantityDialog] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<ReturnType<typeof getProductByBarcode>>(undefined);
  const [quantity, setQuantity] = useState(1);
  const navigate = useNavigate();

  const handleBarcode = useCallback((barcode: string) => {
    setScannerOpen(false);
    const product = getProductByBarcode(barcode);
    if (product) {
      if (product.stock <= 0) {
        playBeep(false);
        toast({ title: "Out of stock", description: `${product.name} has 0 units available`, variant: "destructive" });
        return;
      }
      playBeep(true);
      setScannedProduct(product);
      setQuantity(1);
      setQuantityDialog(true);
    } else {
      playBeep(false);
      toast({ title: "Product not found", description: `Barcode: ${barcode} — Add it in Products`, variant: "destructive" });
    }
  }, [getProductByBarcode]);

  const handleAddToCart = () => {
    if (scannedProduct && quantity > 0) {
      if (quantity > scannedProduct.stock) {
        toast({ title: "Insufficient stock", description: `Only ${scannedProduct.stock} units available`, variant: "destructive" });
        return;
      }
      addToCart(scannedProduct, quantity);
      playBeep(true);
      toast({ title: `${scannedProduct.name} added to cart`, description: `Qty: ${quantity}` });
      setQuantityDialog(false);
      setScannedProduct(undefined);
      navigate("/cart");
    }
  };

  const handleManualSearch = () => {
    if (manualBarcode.trim()) { handleBarcode(manualBarcode.trim()); setManualBarcode(""); }
  };

  const handleQuickAdd = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      if (product.stock <= 0) {
        playBeep(false);
        toast({ title: "Out of stock", description: `${product.name} has no available units`, variant: "destructive" });
        return;
      }
      setScannedProduct(product);
      setQuantity(1);
      setQuantityDialog(true);
    }
  };

  // Show in-stock products first, out-of-stock last
  const sortedProducts = [...products].sort((a, b) => {
    if (a.stock > 0 && b.stock <= 0) return -1;
    if (a.stock <= 0 && b.stock > 0) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="page-container">
      <h1 className="page-title mb-5 animate-fade-in">Scan & Bill</h1>

      {/* Scanner Area */}
      <Card className="mb-5 overflow-hidden border-none shadow-medium animate-slide-up">
        <CardContent className="relative flex flex-col items-center justify-center py-16">
          <div className="absolute inset-6 rounded-2xl border-2 border-dashed border-primary/15" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl gradient-primary shadow-glow-primary">
              <ScanBarcode className="h-10 w-10 text-primary-foreground" />
            </div>
            <p className="mb-1 text-base font-semibold text-foreground">Scan barcode to add product</p>
            <p className="mb-5 text-sm text-muted-foreground text-center">Point your camera at any product barcode</p>
            <Button className="h-12 gap-2.5 rounded-xl px-6 gradient-primary shadow-glow-primary transition-all duration-200 active:scale-[0.97]" onClick={() => setScannerOpen(true)}>
              <Camera className="h-5 w-5" /> Open Scanner
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Manual Entry */}
      <Card className="mb-5 border-none shadow-soft animate-slide-up" style={{ animationDelay: "100ms" }}>
        <CardContent className="p-4">
          <p className="mb-3 text-sm font-semibold text-foreground">Manual Barcode Entry</p>
          <div className="flex gap-2">
            <Input placeholder="Enter barcode number..." value={manualBarcode} onChange={(e) => setManualBarcode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualSearch()} className="h-11 rounded-xl" />
            <Button variant="secondary" className="h-11 rounded-xl px-4" onClick={handleManualSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Add */}
      <div className="animate-slide-up" style={{ animationDelay: "200ms" }}>
        <div className="mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4 text-accent" />
          <p className="section-title">Quick Add Products</p>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {sortedProducts.slice(0, 8).map((p) => (
            <button key={p.id} onClick={() => handleQuickAdd(p.id)}
              className={`rounded-2xl border border-border/40 bg-card p-3.5 text-left shadow-soft transition-all duration-200 hover:shadow-medium active:scale-[0.98] ${p.stock <= 0 ? "opacity-50" : ""}`}>
              <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
              <p className="text-sm font-bold text-primary">₹{p.price}</p>
              <div className="mt-0.5 flex items-center gap-1">
                {p.stock <= 0
                  ? <span className="flex items-center gap-0.5 text-[10px] font-semibold text-destructive"><AlertTriangle className="h-2.5 w-2.5" /> Out of stock</span>
                  : p.stock <= p.minStock
                    ? <span className="text-[10px] font-semibold text-warning">{p.stock} left (low)</span>
                    : <span className="text-xs text-muted-foreground">Stock: {p.stock}</span>
                }
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Quantity Dialog */}
      <Dialog open={quantityDialog} onOpenChange={setQuantityDialog}>
        <DialogContent className="max-w-xs rounded-2xl">
          <DialogHeader><DialogTitle className="text-lg">Add to Cart</DialogTitle></DialogHeader>
          {scannedProduct && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-secondary/60 p-4 text-center">
                <p className="text-base font-bold text-foreground">{scannedProduct.name}</p>
                <p className="text-2xl font-extrabold text-primary">₹{scannedProduct.price}</p>
                {scannedProduct.mrp > scannedProduct.price && (
                  <p className="text-xs text-muted-foreground line-through">MRP ₹{scannedProduct.mrp}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {scannedProduct.stock} in stock · GST {scannedProduct.taxPercent}%
                </p>
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quantity</label>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" className="h-10 w-10 rounded-xl" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</Button>
                  <Input type="number" value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(scannedProduct.stock, +e.target.value)))}
                    className="h-10 rounded-xl text-center text-lg font-bold" />
                  <Button variant="outline" size="sm" className="h-10 w-10 rounded-xl" onClick={() => setQuantity(Math.min(scannedProduct.stock, quantity + 1))}>+</Button>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-primary/5 px-4 py-3">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-lg font-extrabold text-foreground">₹{(scannedProduct.price * quantity).toFixed(2)}</span>
              </div>
              <Button className="h-12 w-full rounded-xl gradient-primary shadow-glow-primary transition-all active:scale-[0.98]" onClick={handleAddToCart}>
                Add to Cart
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {scannerOpen && <BarcodeScanner onScan={handleBarcode} onClose={() => setScannerOpen(false)} />}
    </div>
  );
};

export default ScanPage;
