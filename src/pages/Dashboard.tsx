import { IndianRupee, TrendingUp, ShoppingBag, Package, ScanBarcode, Plus, BarChart3, Users, AlertTriangle, ArrowUpRight, Crown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/context/SubscriptionContext";
import { useStore } from "@/store/useStore";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { orders, products, cart } = useStore();
  const { isTrialing, trialDaysLeft, currentPlan } = useSubscription();

  const todaySales = orders.filter((o) => new Date(o.createdAt).toDateString() === new Date().toDateString()).reduce((s, o) => s + o.total, 0);
  const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === new Date().toDateString()).length;
  const lowStock = products.filter((p) => p.stock <= p.minStock).length;
  const monthRevenue = orders.filter((o) => { const d = new Date(o.createdAt); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).reduce((s, o) => s + o.total, 0);

  const stats = [
    { label: "Today's Sales", value: `₹${todaySales.toFixed(0)}`, icon: IndianRupee, change: `${todayOrders} orders`, color: "from-primary to-primary/80" },
    { label: "Total Orders", value: String(orders.length), icon: ShoppingBag, change: `${todayOrders} today`, color: "from-accent to-accent/80" },
    { label: "Products", value: String(products.length), icon: Package, change: `${lowStock} low stock`, color: "from-warning to-warning/80" },
    { label: "Revenue", value: `₹${monthRevenue.toFixed(0)}`, icon: TrendingUp, change: "This month", color: "from-success to-success/80" },
  ];

  const quickActions = [
    { label: "Add Product", icon: Plus, path: "/products", variant: "outline" as const },
    { label: "Analytics", icon: BarChart3, path: "/analytics", variant: "outline" as const },
    { label: "Customers", icon: Users, path: "/customers", variant: "outline" as const },
    { label: "Orders", icon: ShoppingBag, path: "/orders", variant: "outline" as const },
  ];

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between animate-fade-in">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{getGreeting()} 👋</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">MiniScanKart</h1>
        </div>
        <div className="flex items-center gap-2.5">
          {cart.length > 0 && (
            <button onClick={() => navigate("/cart")} className="relative rounded-xl bg-card p-2.5 shadow-soft transition-all hover:shadow-medium">
              <ShoppingBag className="h-5 w-5 text-foreground" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full gradient-primary text-[10px] font-bold text-primary-foreground shadow-sm">{cart.length}</span>
            </button>
          )}
          {lowStock > 0 && (
            <Badge variant="destructive" className="gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium shadow-soft">
              <AlertTriangle className="h-3 w-3" /> {lowStock} low
            </Badge>
          )}
        </div>
      </div>

      {/* Trial / Plan Banner */}
      {isTrialing && trialDaysLeft <= 7 && (
        <div
          className="mb-5 flex items-center justify-between rounded-2xl bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/20 px-4 py-3 animate-slide-up cursor-pointer"
          onClick={() => navigate("/settings/subscription")}
        >
          <div className="flex items-center gap-2.5">
            <Crown className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs font-bold text-foreground">Trial ends in {trialDaysLeft} days</p>
              <p className="text-[11px] text-muted-foreground">Upgrade to keep all features</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-primary">Upgrade →</span>
        </div>
      )}

            {/* Stats Grid */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        {stats.map(({ label, value, icon: Icon, change, color }, i) => (
          <Card key={label} className="group border-none shadow-soft transition-all duration-300 hover:shadow-medium animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
            <CardContent className="p-4">
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-sm`}>
                <Icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <p className="text-2xl font-extrabold text-foreground">{value}</p>
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <div className="mt-1.5 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3 text-accent" />
                <p className="text-[11px] font-medium text-accent">{change}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-6 animate-fade-in" style={{ animationDelay: "200ms" }}>
        <h2 className="section-title mb-3">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-2">
          {quickActions.map(({ label, icon: Icon, path }) => (
            <button key={label} onClick={() => navigate(path)}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border/50 bg-card p-3.5 shadow-soft transition-all duration-200 hover:shadow-medium active:scale-[0.97]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                <Icon className="h-5 w-5 text-foreground" />
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="animate-fade-in" style={{ animationDelay: "300ms" }}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-title">Recent Transactions</h2>
          <button onClick={() => navigate("/orders")} className="text-xs font-semibold text-primary hover:underline">View all</button>
        </div>
        {recentOrders.length > 0 ? (
          <div className="space-y-2">
            {recentOrders.map((o) => (
              <Card key={o.id} className="border-none shadow-soft transition-all duration-200 hover:shadow-medium">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8">
                      <ShoppingBag className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{o.id}</p>
                      <p className="text-[11px] text-muted-foreground">{o.items.length} items · {o.paymentMethod} {o.customerName && `· ${o.customerName}`}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-foreground">₹{o.total.toFixed(2)}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-none shadow-soft">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingBag className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">No recent orders</p>
              <p className="text-xs text-muted-foreground/60">Start scanning to create your first bill</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Floating Scan Button */}
      <button
        onClick={() => navigate("/scan")}
        className="floating-button gradient-primary flex items-center gap-2.5 text-primary-foreground shadow-glow-primary active:scale-95"
      >
        <ScanBarcode className="h-5 w-5" />
        <span className="text-sm font-semibold">Scan & Bill</span>
      </button>
    </div>
  );
};

export default Dashboard;
