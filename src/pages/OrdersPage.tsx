import { ClipboardList, Receipt, CreditCard, Smartphone, Banknote, CheckCircle2, Search, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStore, Order } from "@/store/useStore";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { downloadInvoice } from "@/lib/invoiceGenerator";
import { useShopProfile } from "@/context/ShopProfileContext";

const paymentIcon = (method: string) => {
  if (method === "UPI") return <Smartphone className="h-3.5 w-3.5" />;
  if (method === "Card") return <CreditCard className="h-3.5 w-3.5" />;
  return <Banknote className="h-3.5 w-3.5" />;
};

const paymentColor = (method: string) => {
  if (method === "UPI") return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  if (method === "Card") return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
  if (method === "Razorpay") return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400";
  return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};
const formatDateShort = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
};

function OrderDetailModal({ order, open, onClose }: { order: Order; open: boolean; onClose: () => void }) {
  const { profile } = useShopProfile();
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Receipt className="h-5 w-5 text-primary" />
            {order.orderNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-xl bg-secondary/50 p-3.5 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{formatDate(order.createdAt)}</span></div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Payment</span>
            <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 text-xs font-semibold ${paymentColor(order.paymentMethod)}`}>
              {paymentIcon(order.paymentMethod)} {order.paymentMethod}
            </span>
          </div>
          {order.customerName && <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span className="font-medium">{order.customerName}</span></div>}
          {order.customerPhone && <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium">{order.customerPhone}</span></div>}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Status</span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> Paid</span>
          </div>
          {order.razorpayPaymentId && <div className="flex justify-between"><span className="text-muted-foreground">Txn ID</span><span className="font-mono text-xs truncate max-w-[150px]">{order.razorpayPaymentId}</span></div>}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Items Purchased</p>
          <div className="space-y-1.5">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-start justify-between rounded-xl bg-secondary/30 px-3.5 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">₹{item.unitPrice.toFixed(2)} × {item.quantity}{item.taxPercent > 0 && ` · GST ${item.taxPercent}%`}</p>
                </div>
                <span className="ml-3 text-sm font-bold">₹{item.lineTotal.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border/60 p-3.5 space-y-2 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">Bill Summary</p>
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">₹{order.subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">GST / Tax</span><span className="font-medium">₹{order.tax.toFixed(2)}</span></div>
          {order.discount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="font-medium text-destructive">− ₹{order.discount.toFixed(2)}</span></div>}
          <div className="flex justify-between border-t border-border/60 pt-2.5 text-base font-extrabold"><span>Total Paid</span><span className="text-primary">₹{order.total.toFixed(2)}</span></div>
        </div>

        <Button className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white gap-2 font-semibold" onClick={() => downloadInvoice(order, profile)}>
          <Download className="h-4 w-4" /> Download Invoice
        </Button>
      </DialogContent>
    </Dialog>
  );
}

const OrdersPage = () => {
  const { orders } = useStore();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [search, setSearch] = useState("");

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    return o.orderNumber.toLowerCase().includes(q) || (o.customerName ?? "").toLowerCase().includes(q) || (o.customerPhone ?? "").includes(q) || o.paymentMethod.toLowerCase().includes(q);
  });

  if (orders.length === 0) {
    return (
      <div className="page-container">
        <h1 className="page-title mb-5">Sales History</h1>
        <Card className="border-none shadow-soft">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
              <ClipboardList className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="mb-1 text-base font-semibold text-muted-foreground">No orders yet</p>
            <p className="text-sm text-muted-foreground/60">Completed bills will appear here</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString());

  return (
    <div className="page-container">
      <div className="mb-5 animate-fade-in">
        <h1 className="page-title">Sales History</h1>
        <p className="text-sm text-muted-foreground">{orders.length} orders · ₹{totalRevenue.toFixed(0)} total</p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2.5 animate-slide-up">
        <Card className="border-none shadow-soft">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Today</p>
            <p className="text-xl font-extrabold">{todayOrders.length}</p>
            <p className="text-xs text-muted-foreground">orders</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-soft">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Today Revenue</p>
            <p className="text-xl font-extrabold text-primary">₹{todayOrders.reduce((s, o) => s + o.total, 0).toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">collected</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 relative animate-slide-up">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search order, customer, payment..." value={search} onChange={e => setSearch(e.target.value)} className="h-11 rounded-xl pl-10" />
      </div>

      <div className="space-y-2.5">
        {filtered.map((o, i) => (
          <Card key={o.id}
            className="border-none shadow-soft transition-all duration-200 hover:shadow-medium cursor-pointer animate-slide-up active:scale-[0.99]"
            style={{ animationDelay: `${i * 40}ms` }}
            onClick={() => setSelectedOrder(o)}>
            <CardContent className="flex items-center gap-3.5 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/8">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-bold">{o.orderNumber}</p>
                  <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold ${paymentColor(o.paymentMethod)}`}>
                    {paymentIcon(o.paymentMethod)} {o.paymentMethod}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{formatDateShort(o.createdAt)}{o.customerName && ` · ${o.customerName}`}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{o.items.length} item{o.items.length !== 1 ? "s" : ""} · {o.items.reduce((s, i) => s + i.quantity, 0)} qty</p>
              </div>
              <div className="text-right">
                <p className="text-base font-extrabold">₹{o.total.toFixed(2)}</p>
                <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 justify-end">
                  <CheckCircle2 className="h-3 w-3" /> Paid
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">tap for invoice</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <div className="py-12 text-center"><p className="text-sm text-muted-foreground">No orders match your search</p></div>}
      </div>

      {selectedOrder && <OrderDetailModal order={selectedOrder} open={!!selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
};

export default OrdersPage;
