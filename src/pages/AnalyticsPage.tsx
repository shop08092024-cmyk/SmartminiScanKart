import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/store/useStore";
import { IndianRupee, TrendingUp, ShoppingBag, Package, ArrowUpRight } from "lucide-react";

const COLORS = ["hsl(221,83%,53%)", "hsl(160,84%,39%)", "hsl(38,92%,50%)", "hsl(0,84%,60%)", "hsl(280,60%,50%)", "hsl(190,80%,50%)"];

const AnalyticsPage = () => {
  const { orders, products } = useStore();

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  // Profit cannot be computed from OrderItem alone (no costPrice stored), use revenue as proxy
  const totalProfit = orders.reduce((s, o) => s + o.items.reduce((a, i) => a + i.lineTotal, 0), 0);
  const totalOrders = orders.length;
  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  const dailySales = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayStr = date.toLocaleDateString("en-IN", { weekday: "short" });
    const dayStart = new Date(date.setHours(0, 0, 0, 0)).getTime();
    const dayEnd = dayStart + 86400000;
    const sales = orders.filter((o) => { const t = new Date(o.createdAt).getTime(); return t >= dayStart && t < dayEnd; }).reduce((s, o) => s + o.total, 0);
    return { name: dayStr, sales: Math.round(sales) };
  });

  const categoryMap: Record<string, number> = {};
  orders.forEach((o) => o.items.forEach((i) => {
    const key = i.productName;
    categoryMap[key] = (categoryMap[key] || 0) + i.unitPrice * i.quantity;
  }));
  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value: Math.round(value) }));

  const paymentMap: Record<string, number> = {};
  orders.forEach((o) => { paymentMap[o.paymentMethod] = (paymentMap[o.paymentMethod] || 0) + 1; });
  const paymentData = Object.entries(paymentMap).map(([name, value]) => ({ name, value }));

  const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
  orders.forEach((o) => o.items.forEach((i) => {
    const key = i.productId || i.productName;
    if (!productSales[key]) productSales[key] = { name: i.productName, qty: 0, revenue: 0 };
    productSales[key].qty += i.quantity;
    productSales[key].revenue += i.lineTotal;
  }));
  const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const stats = [
    { label: "Revenue", value: `₹${totalRevenue.toFixed(0)}`, icon: IndianRupee, gradient: "from-primary to-primary/80" },
    { label: "Profit", value: `₹${totalProfit.toFixed(0)}`, icon: TrendingUp, gradient: "from-accent to-accent/80" },
    { label: "Orders", value: totalOrders, icon: ShoppingBag, gradient: "from-warning to-warning/80" },
    { label: "Low Stock", value: lowStockCount, icon: Package, gradient: "from-destructive to-destructive/80" },
  ];

  return (
    <div className="page-container">
      <div className="mb-6 animate-fade-in">
        <h1 className="page-title">Analytics</h1>
        <p className="text-sm text-muted-foreground">Business performance overview</p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        {stats.map(({ label, value, icon: Icon, gradient }, i) => (
          <Card key={label} className="border-none shadow-soft transition-all duration-200 hover:shadow-medium animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
            <CardContent className="p-4">
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient}`}>
                <Icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <p className="text-2xl font-extrabold text-foreground">{value}</p>
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Daily Sales */}
      <Card className="mb-5 border-none shadow-soft animate-slide-up" style={{ animationDelay: "200ms" }}>
        <CardContent className="p-4">
          <p className="mb-4 text-sm font-semibold text-foreground">Daily Sales (Last 7 Days)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(215,16%,47%)" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(215,16%,47%)" }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 16px -4px rgba(0,0,0,0.12)" }} />
              <Bar dataKey="sales" fill="hsl(221,83%,53%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category & Payment */}
      <div className="mb-5 grid grid-cols-2 gap-3">
        <Card className="border-none shadow-soft">
          <CardContent className="p-4">
            <p className="mb-3 text-xs font-semibold text-foreground">By Category</p>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" cx="50%" cy="50%" outerRadius={50} innerRadius={28}>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 16px -4px rgba(0,0,0,0.12)" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-none shadow-soft">
          <CardContent className="p-4">
            <p className="mb-3 text-xs font-semibold text-foreground">Payment Methods</p>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={paymentData} dataKey="value" cx="50%" cy="50%" outerRadius={50} innerRadius={28}>
                  {paymentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 16px -4px rgba(0,0,0,0.12)" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card className="border-none shadow-soft animate-slide-up" style={{ animationDelay: "300ms" }}>
        <CardContent className="p-4">
          <p className="mb-4 text-sm font-semibold text-foreground">Top Selling Products</p>
          <div className="space-y-2.5">
            {topProducts.map((p, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl bg-secondary/50 px-4 py-3 transition-colors hover:bg-secondary/80">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.qty} units sold</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-foreground">₹{p.revenue}</span>
              </div>
            ))}
            {topProducts.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">No sales data yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsPage;
