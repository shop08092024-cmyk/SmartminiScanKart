import { useState, useCallback, useEffect, useRef } from "react";
import {
  ShoppingCart, Plus, Minus, Trash2, CreditCard, ScanBarcode, Search,
  Tag, Smartphone, Banknote, Zap, CheckCircle, Download, ArrowRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore, Order } from "@/store/useStore";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import BarcodeScanner from "@/components/BarcodeScanner";
import { downloadInvoice } from "@/lib/invoiceGenerator";
import { useShopProfile } from "@/context/ShopProfileContext";
import { Product } from "@/store/useStore";

declare global { interface Window { Razorpay: unknown; } }
const RAZORPAY_KEY = "rzp_live_SWWyQlxsSLcyD0";

const playBeep = (success = true) => {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = success ? 1200 : 400;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.25);
  } catch (_) {}
};

const loadRazorpay = (): Promise<boolean> => new Promise((resolve) => {
  if ((window as { Razorpay?: unknown }).Razorpay) { resolve(true); return; }
  const script = document.createElement("script");
  script.src = "https://checkout.razorpay.com/v1/checkout.js";
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});

function ProductSearchDropdown({ onSelect }: { onSelect: (p: Product) => void }) {
  const { products } = useStore();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = products.filter(p => p.stock > 0 && (
    !query.trim() ||
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.barcode.includes(query) ||
    p.category.toLowerCase().includes(query.toLowerCase())
  )).slice(0, 8);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative flex-1">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search by name, barcode, category..."
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="h-11 pl-10 rounded-xl"
        />
      </div>
      {open && (
        <div className="absolute z-50 w-full top-12 left-0 bg-card border border-border/60 rounded-xl shadow-lg overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No products found</div>
          ) : (
            <div className="max-h-64 overflow-y-auto divide-y divide-border/40">
              {filtered.map(p => (
                <button key={p.id}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/60 transition-colors text-left"
                  onMouseDown={() => { onSelect(p); setQuery(""); setOpen(false); }}>
                  <div className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg bg-primary/10">
                    <Tag className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.category} · {p.stock} in stock</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-primary">₹{p.price}</p>
                    {p.mrp > p.price && <p className="text-xs text-muted-foreground line-through">₹{p.mrp}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="p-2 border-t border-border/40 bg-secondary/30">
            <p className="text-xs text-center text-muted-foreground">{products.filter(p => p.stock > 0).length} products in stock</p>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderCompleteScreen({ order, onClose, onNewOrder }: {
  order: Order; onClose: () => void; onNewOrder: () => void;
}) {
  const { profile } = useShopProfile();
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6 animate-scale-in">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-emerald-600" />
          </div>
        </div>
        <h1 className="text-2xl font-extrabold text-center text-foreground mb-1">Order Complete!</h1>
        <p className="text-sm text-center text-muted-foreground mb-6">{order.orderNumber} · ₹{order.total.toFixed(2)} collected</p>
        <Card className="border-none shadow-medium mb-6 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />
          <CardContent className="p-5 space-y-3">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Items</span><span className="font-semibold">{order.items.reduce((s, i) => s + i.quantity, 0)} qty ({order.items.length} products)</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Payment</span><span className="font-semibold">{order.paymentMethod}</span></div>
            {order.customerName && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Customer</span><span className="font-semibold">{order.customerName}</span></div>}
            {order.discount > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Discount</span><span className="font-semibold text-destructive">−₹{order.discount.toFixed(2)}</span></div>}
            <div className="flex justify-between text-base font-extrabold border-t border-border/60 pt-3"><span>Amount Paid</span><span className="text-emerald-600">₹{order.total.toFixed(2)}</span></div>
          </CardContent>
        </Card>
        <div className="space-y-3">
          <Button className="h-12 w-full rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold gap-2" onClick={() => downloadInvoice(order, profile)}>
            <Download className="h-4 w-4" /> Download Invoice
          </Button>
          <Button className="h-12 w-full rounded-xl gradient-primary shadow-glow-primary font-semibold gap-2" onClick={onNewOrder}>
            <ShoppingCart className="h-4 w-4" /> New Order
          </Button>
          <Button variant="outline" className="h-11 w-full rounded-xl font-medium gap-2" onClick={onClose}>
            <ArrowRight className="h-4 w-4" /> View Orders
          </Button>
        </div>
      </div>
    </div>
  );
}

const CartPage = () => {
  const { cart, updateCartQuantity, removeFromCart, checkout, getProductByBarcode, addToCart, products } = useStore();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [discount, setDiscount] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [quantityDialog, setQuantityDialog] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const navigate = useNavigate();

  const subtotal = cart.reduce((s, c) => s + c.product.price * c.quantity, 0);
  const tax = cart.reduce((s, c) => s + (c.product.price * c.quantity * c.product.taxPercent) / 100, 0);
  const total = subtotal + tax - discount;

  useEffect(() => { loadRazorpay(); }, []);

  const handleRazorpayPayment = async () => {
    setProcessing(true);
    const loaded = await loadRazorpay();
    if (!loaded) { toast({ title: "Razorpay unavailable", variant: "destructive" }); setProcessing(false); return; }
    const rzpWindow = window as { Razorpay?: new (opts: unknown) => { open: () => void } };
    if (!rzpWindow.Razorpay) { setProcessing(false); return; }
    const options = {
      key: RAZORPAY_KEY,
      amount: Math.round(total * 100),
      currency: "INR",
      name: "ShopScan POS",
      description: `Order — ${cart.length} items`,
      prefill: { name: customerName || undefined, contact: customerPhone || undefined },
      theme: { color: "#6366f1" },
      handler: async (response: { razorpay_payment_id: string; razorpay_order_id?: string }) => {
        try {
          const order = await checkout("Razorpay", discount, customerName || undefined, customerPhone || undefined, response.razorpay_order_id, response.razorpay_payment_id);
          playBeep(true);
          setCheckoutOpen(false);
          setDiscount(0); setCustomerName(""); setCustomerPhone("");
          setCompletedOrder(order);
        } catch (e) {
          toast({ title: "Order save failed", description: String(e), variant: "destructive" });
          setProcessing(false);
        }
      },
      modal: { ondismiss: () => { setProcessing(false); toast({ title: "Payment cancelled", variant: "destructive" }); } },
    };
    new rzpWindow.Razorpay(options).open();
  };

  const handleCashUpiCheckout = async () => {
    setProcessing(true);
    try {
      const order = await checkout(paymentMethod, discount, customerName || undefined, customerPhone || undefined);
      playBeep(true);
      setCheckoutOpen(false);
      setDiscount(0); setCustomerName(""); setCustomerPhone("");
      setCompletedOrder(order);
    } catch (e) {
      toast({ title: "Checkout failed", description: String(e), variant: "destructive" });
    } finally { setProcessing(false); }
  };

  const handleCheckout = () => {
    if (paymentMethod === "Razorpay") handleRazorpayPayment();
    else handleCashUpiCheckout();
  };

  const handleBarcode = useCallback((barcode: string) => {
    setScannerOpen(false);
    const product = getProductByBarcode(barcode);
    if (product) {
      if (product.stock <= 0) { playBeep(false); toast({ title: "Out of stock", variant: "destructive" }); return; }
      playBeep(true);
      setScannedProduct(product); setQuantity(1); setQuantityDialog(true);
    } else {
      playBeep(false);
      toast({ title: "Product not found", description: `Barcode: ${barcode}`, variant: "destructive" });
    }
  }, [getProductByBarcode]);

  const handleAddScanned = () => {
    if (scannedProduct && quantity > 0) {
      const alreadyInCart = cart.find(c => c.product.id === scannedProduct.id)?.quantity ?? 0;
      if (alreadyInCart + quantity > scannedProduct.stock) {
        toast({ title: "Insufficient stock", description: `Only ${scannedProduct.stock - alreadyInCart} more available`, variant: "destructive" });
        return;
      }
      addToCart(scannedProduct, quantity);
      playBeep(true);
      toast({ title: `${scannedProduct.name} added`, description: `Qty: ${quantity}` });
      setQuantityDialog(false);
      setScannedProduct(undefined);
    }
  };

  const handleQuantityChange = (productId: string, delta: number) => {
    const item = cart.find(c => c.product.id === productId);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty > item.product.stock) { toast({ title: "Max stock reached", variant: "destructive" }); return; }
    updateCartQuantity(productId, newQty);
  };

  if (completedOrder) {
    return <OrderCompleteScreen order={completedOrder} onClose={() => { setCompletedOrder(null); navigate("/orders"); }} onNewOrder={() => setCompletedOrder(null)} />;
  }

  return (
    <div className="page-container">
      <div className="mb-5 flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="page-title">Cart</h1>
          <p className="text-sm text-muted-foreground">{cart.length} item{cart.length !== 1 ? "s" : ""}</p>
        </div>
        <Button size="sm" variant="outline" className="gap-2 rounded-xl" onClick={() => setScannerOpen(true)}>
          <ScanBarcode className="h-4 w-4" /> Scan
        </Button>
      </div>

      <Card className="mb-5 border-none shadow-soft animate-slide-up">
        <CardContent className="p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add Item</p>
          <ProductSearchDropdown onSelect={(p) => { setScannedProduct(p); setQuantity(1); setQuantityDialog(true); }} />
          <div className="flex gap-2">
            <Input placeholder="Or scan / enter barcode..." value={manualBarcode} onChange={e => setManualBarcode(e.target.value)}
              onKeyDown={e => e.key === "Enter" && (getProductByBarcode(manualBarcode.trim()) ? (handleBarcode(manualBarcode.trim()), setManualBarcode("")) : null)}
              className="h-10 flex-1 rounded-xl text-sm" />
            <Button variant="secondary" size="sm" className="h-10 px-3 rounded-xl" onClick={() => { if (manualBarcode.trim()) { handleBarcode(manualBarcode.trim()); setManualBarcode(""); } }}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
          {products.filter(p => p.stock > 0).length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {products.filter(p => p.stock > 0).slice(0, 6).map(p => (
                <button key={p.id} onClick={() => { setScannedProduct(p); setQuantity(1); setQuantityDialog(true); }}
                  className="shrink-0 rounded-xl border border-border/40 bg-secondary/50 px-3 py-2 text-xs font-medium text-foreground transition-all hover:shadow-soft active:scale-[0.97]">
                  {p.name} · <span className="text-primary font-semibold">₹{p.price}</span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {cart.length === 0 ? (
        <Card className="border-none shadow-soft animate-scale-in">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
              <ShoppingCart className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="mb-1 text-base font-semibold text-muted-foreground">Your cart is empty</p>
            <p className="text-sm text-muted-foreground/60">Search a product or scan a barcode above</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-4 space-y-2.5">
            {cart.map((item, i) => (
              <Card key={item.product.id} className="border-none shadow-soft animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                <CardContent className="flex items-center gap-3.5 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/8">
                    <Tag className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">₹{item.product.price} × {item.quantity} = <span className="font-semibold text-foreground">₹{(item.product.price * item.quantity).toFixed(2)}</span></p>
                    <p className="text-[10px] text-muted-foreground/70">{item.product.stock - item.quantity} left{item.product.taxPercent > 0 && ` · GST ${item.product.taxPercent}%`}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => handleQuantityChange(item.product.id, -1)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary"><Minus className="h-3.5 w-3.5" /></button>
                    <span className="w-7 text-center text-sm font-bold">{item.quantity}</span>
                    <button onClick={() => handleQuantityChange(item.product.id, 1)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary"><Plus className="h-3.5 w-3.5" /></button>
                    <button onClick={() => removeFromCart(item.product.id)} className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="mb-4 border-none shadow-medium animate-fade-in">
            <CardContent className="space-y-2.5 p-5">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal ({cart.reduce((s, c) => s + c.quantity, 0)} items)</span><span className="font-medium">₹{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">GST / Tax</span><span className="font-medium">₹{tax.toFixed(2)}</span></div>
              <div className="border-t border-border/60 pt-3 flex justify-between text-lg font-extrabold">
                <span>Total</span><span className="text-primary">₹{total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
          <Button className="h-14 w-full gap-2.5 rounded-2xl gradient-primary text-base font-semibold shadow-glow-primary" onClick={() => setCheckoutOpen(true)}>
            <CreditCard className="h-5 w-5" /> Checkout — ₹{total.toFixed(2)}
          </Button>
        </>
      )}

      <Dialog open={quantityDialog} onOpenChange={setQuantityDialog}>
        <DialogContent className="max-w-xs rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add to Cart</DialogTitle>
            <DialogDescription>Select the quantity you want to add</DialogDescription>
          </DialogHeader>
          {scannedProduct && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-secondary/60 p-4 text-center">
                <p className="text-base font-bold">{scannedProduct.name}</p>
                <p className="text-2xl font-extrabold text-primary">₹{scannedProduct.price}</p>
                <p className="mt-1 text-xs text-muted-foreground">{scannedProduct.stock} available · GST {scannedProduct.taxPercent}%</p>
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quantity</label>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" className="h-10 w-10 rounded-xl" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</Button>
                  <Input type="number" value={quantity} onChange={e => setQuantity(Math.max(1, Math.min(scannedProduct.stock, +e.target.value)))} className="h-10 rounded-xl text-center text-lg font-bold" />
                  <Button variant="outline" size="sm" className="h-10 w-10 rounded-xl" onClick={() => setQuantity(Math.min(scannedProduct.stock, quantity + 1))}>+</Button>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-primary/5 px-4 py-3">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-lg font-extrabold">₹{(scannedProduct.price * quantity).toFixed(2)}</span>
              </div>
              <Button className="h-12 w-full rounded-xl gradient-primary" onClick={handleAddScanned}>Add to Cart</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-sm rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
            <DialogDescription>Complete your payment to finalize the order</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "Cash", label: "Cash", icon: <Banknote className="h-4 w-4" /> },
                  { id: "UPI", label: "UPI", icon: <Smartphone className="h-4 w-4" /> },
                  { id: "Card", label: "Card", icon: <CreditCard className="h-4 w-4" /> },
                  { id: "Razorpay", label: "Razorpay", icon: <Zap className="h-4 w-4" /> },
                ].map(({ id, label, icon }) => (
                  <button key={id} onClick={() => setPaymentMethod(id)}
                    className={`flex items-center gap-2 rounded-xl border-2 px-3.5 py-3 text-sm font-semibold transition-all ${paymentMethod === id ? "border-primary bg-primary/5 text-primary" : "border-border bg-secondary/30 text-muted-foreground hover:border-primary/40"}`}>
                    {icon} {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Discount (₹)</label>
              <Input type="number" value={discount || ""} placeholder="0" onChange={e => setDiscount(Math.max(0, Math.min(subtotal, +e.target.value)))} className="h-11 rounded-xl" />
            </div>
            <Input placeholder="Customer name (optional)" value={customerName} onChange={e => setCustomerName(e.target.value)} className="h-11 rounded-xl" />
            <Input placeholder="Customer phone (optional)" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="h-11 rounded-xl" />
            <div className="rounded-2xl bg-secondary/50 p-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">₹{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">GST / Tax</span><span className="font-medium">₹{tax.toFixed(2)}</span></div>
              {discount > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Discount</span><span className="font-medium text-destructive">−₹{discount.toFixed(2)}</span></div>}
              <div className="flex justify-between text-base font-extrabold border-t border-border/60 pt-2">
                <span>Amount to Pay</span><span className="text-primary">₹{total.toFixed(2)}</span>
              </div>
            </div>
            <Button className="h-12 w-full rounded-xl gradient-primary shadow-glow-primary" disabled={processing || total <= 0} onClick={handleCheckout}>
              {processing ? "Processing…" : paymentMethod === "Razorpay" ? `Pay ₹${total.toFixed(2)} via Razorpay` : `Complete Order — ₹${total.toFixed(2)}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {scannerOpen && <BarcodeScanner onScan={handleBarcode} onClose={() => setScannerOpen(false)} />}
    </div>
  );
};

export default CartPage;
