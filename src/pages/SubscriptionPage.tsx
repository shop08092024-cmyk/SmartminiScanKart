import { useState } from "react";
import { Check, Crown, Zap, Star, Clock, CreditCard, Receipt, AlertCircle, Sparkles, Shield, BarChart3, Package, Users, Download, Headphones } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/context/SubscriptionContext";
import { toast } from "sonner";

declare global { interface Window { Razorpay: unknown; } }

const RAZORPAY_KEY = "rzp_live_SWWyQlxsSLcyD0";

const loadRazorpay = (): Promise<boolean> => new Promise((resolve) => {
  if ((window as { Razorpay?: unknown }).Razorpay) { resolve(true); return; }
  const script = document.createElement("script");
  script.src = "https://checkout.razorpay.com/v1/checkout.js";
  script.onload = () => resolve(true); script.onerror = () => resolve(false);
  document.body.appendChild(script);
});

const PLANS = [
  {
    id: "free",
    name: "Free",
    price_monthly: 0,
    price_yearly: 0,
    gradient: "from-slate-400 to-slate-500",
    ring: "ring-slate-200",
    icon: Zap,
    is_popular: false,
    tagline: "Get started for free",
    features: [
      "Up to 50 products",
      "100 orders/month",
      "Basic invoice download",
      "Cash & UPI payments",
      "1 shop profile",
    ],
    limits: { products: 50, orders: 100 },
  },
  {
    id: "starter",
    name: "Starter",
    price_monthly: 199,
    price_yearly: 1499,
    gradient: "from-primary to-blue-600",
    ring: "ring-primary/30",
    icon: Star,
    is_popular: true,
    tagline: "Perfect for growing shops",
    features: [
      "Up to 500 products",
      "1,000 orders/month",
      "GST invoices with logo",
      "Razorpay digital payments",
      "Customer management",
      "Basic analytics",
      "Low stock alerts",
      "Email support",
    ],
    limits: { products: 500, orders: 1000 },
  },
  {
    id: "pro",
    name: "Pro",
    price_monthly: 499,
    price_yearly: 3999,
    gradient: "from-violet-500 to-purple-600",
    ring: "ring-violet-300",
    icon: Crown,
    is_popular: false,
    tagline: "Full-featured for serious retailers",
    features: [
      "Unlimited products",
      "Unlimited orders",
      "Custom branded invoices",
      "All payment methods",
      "Advanced analytics & reports",
      "Multi-staff access",
      "Loyalty points system",
      "Priority support",
      "Data export (CSV/PDF)",
    ],
    limits: { products: null, orders: null },
  },
];

const planIcons: Record<string, React.ElementType> = { free: Zap, starter: Star, pro: Crown };
const planGradients: Record<string, string> = { free: "from-slate-400 to-slate-500", starter: "from-primary to-blue-600", pro: "from-violet-500 to-purple-600" };

export default function SubscriptionPage() {
  const { subscription, currentPlan, paymentHistory, isTrialing, trialDaysLeft, subscribeToPlan, cancelSubscription } = useSubscription();

  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [showCancel, setShowCancel] = useState(false);
  const [tab, setTab] = useState<"plans" | "history">("plans");

  const yearlyDiscount = (plan: typeof PLANS[0]) => {
    if (!plan.price_monthly) return 0;
    return Math.round((1 - plan.price_yearly / (plan.price_monthly * 12)) * 100);
  };

  const handleSubscribeWithRazorpay = async (planId: string) => {
    const plan = PLANS.find(p => p.id === planId);
    if (!plan) return;
    const amount = cycle === "yearly" ? plan.price_yearly : plan.price_monthly;

    if (amount === 0) {
      // Free plan - no payment needed
      setLoadingPlan(planId);
      try {
        await subscribeToPlan(planId, cycle);
        toast.success("Downgraded to Free plan");
      } catch { toast.error("Something went wrong. Please try again."); }
      finally { setLoadingPlan(null); }
      return;
    }

    // Razorpay payment for paid plans
    setLoadingPlan(planId);
    const loaded = await loadRazorpay();
    if (!loaded) { toast.error("Razorpay unavailable. Check your connection."); setLoadingPlan(null); return; }

    const rzpWindow = window as { Razorpay?: new (opts: unknown) => { open: () => void } };
    if (!rzpWindow.Razorpay) { setLoadingPlan(null); return; }

    const cycleLabel = cycle === "yearly" ? "Yearly" : "Monthly";
    const options = {
      key: RAZORPAY_KEY,
      amount: amount * 100, // paise
      currency: "INR",
      name: "ShopScan POS",
      description: `${plan.name} Plan — ${cycleLabel}`,
      notes: { plan_id: planId, billing_cycle: cycle },
      theme: { color: "#6366f1" },
      handler: async (response: { razorpay_payment_id: string; razorpay_order_id?: string }) => {
        try {
          await subscribeToPlan(planId, cycle);
          toast.success(`🎉 Subscribed to ${plan.name} Plan! Payment ID: ${response.razorpay_payment_id}`);
        } catch {
          toast.error("Payment received but subscription update failed. Contact support.");
        } finally { setLoadingPlan(null); }
      },
      modal: {
        ondismiss: () => { setLoadingPlan(null); toast.error("Payment cancelled"); },
      },
      prefill: { name: "Shop Owner" },
    };

    new rzpWindow.Razorpay(options).open();
  };

  const handleCancel = async () => {
    try {
      await cancelSubscription();
      toast.success("Subscription cancelled. Access continues until end of period.");
      setShowCancel(false);
    } catch { toast.error("Failed to cancel. Please try again."); }
  };

  const isCurrentPlan = (planId: string) => subscription?.plan_id === planId && subscription?.status !== "cancelled";

  return (
    <div className="page-container pb-10">
      <div className="mb-6 animate-fade-in">
        <h1 className="page-title">Subscription</h1>
        <p className="text-sm text-muted-foreground">Choose the right plan for your store</p>
      </div>

      {/* Current plan banner */}
      {subscription && (
        <div className="mb-5 animate-slide-up">
          <Card className="border-none shadow-soft overflow-hidden">
            <div className={`h-1 w-full bg-gradient-to-r ${planGradients[subscription.plan_id] ?? "from-slate-400 to-slate-500"}`} />
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${planGradients[subscription.plan_id]}`}>
                    {(() => { const Icon = planIcons[subscription.plan_id] ?? Zap; return <Icon className="h-5 w-5 text-white" />; })()}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{currentPlan?.name ?? subscription.plan_id} Plan</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {subscription.status === "trialing" ? `Trial · ${trialDaysLeft} days left` : subscription.status === "cancelled" ? "Cancelled" : `${subscription.billing_cycle} · Active`}
                    </p>
                  </div>
                </div>
                {isTrialing && trialDaysLeft <= 3 && <Badge variant="destructive" className="gap-1 text-[11px]"><Clock className="h-3 w-3" /> Expiring soon</Badge>}
                {subscription.status === "active" && <Badge className="bg-accent/10 text-accent border-0 text-[11px]">Active</Badge>}
              </div>
              {isTrialing && (
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] text-muted-foreground mb-1"><span>Trial progress</span><span>{trialDaysLeft} days remaining</span></div>
                  <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-blue-500 transition-all" style={{ width: `${Math.max(5, (trialDaysLeft / 14) * 100)}%` }} />
                  </div>
                </div>
              )}
              {subscription.current_period_end && subscription.status === "active" && (
                <p className="mt-3 text-[11px] text-muted-foreground">
                  Renews on {new Date(subscription.current_period_end).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-5 flex rounded-xl bg-secondary p-1 animate-fade-in">
        {(["plans", "history"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all duration-200 capitalize ${tab === t ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"}`}>
            {t === "plans" ? "📦 Plans" : "🧾 Billing History"}
          </button>
        ))}
      </div>

      {tab === "plans" && (
        <>
          {/* Billing cycle toggle */}
          <div className="mb-5 flex items-center justify-center gap-3 animate-fade-in">
            <button onClick={() => setCycle("monthly")} className={`text-sm font-semibold transition-colors ${cycle === "monthly" ? "text-foreground" : "text-muted-foreground"}`}>Monthly</button>
            <button onClick={() => setCycle(c => c === "monthly" ? "yearly" : "monthly")}
              className={`relative h-7 w-12 rounded-full transition-colors duration-300 ${cycle === "yearly" ? "bg-primary" : "bg-secondary"}`}>
              <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-300 ${cycle === "yearly" ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setCycle("yearly")} className={`text-sm font-semibold transition-colors ${cycle === "yearly" ? "text-foreground" : "text-muted-foreground"}`}>Yearly</button>
              <Badge className="bg-accent/10 text-accent border-0 text-[10px] px-1.5 py-0.5">Save up to 37%</Badge>
            </div>
          </div>

          {/* Plan cards */}
          <div className="space-y-3">
            {PLANS.map((plan, i) => {
              const Icon = plan.icon;
              const current = isCurrentPlan(plan.id);
              const price = cycle === "yearly" ? plan.price_yearly : plan.price_monthly;
              const discount = yearlyDiscount(plan);

              return (
                <Card key={plan.id}
                  className={`border-none shadow-soft overflow-hidden transition-all duration-200 animate-slide-up ring-2 ${current ? plan.ring : "ring-transparent"} ${plan.is_popular ? "shadow-medium" : ""}`}
                  style={{ animationDelay: `${i * 80}ms` }}>
                  {plan.is_popular && (
                    <div className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-primary to-blue-600 py-1.5">
                      <Sparkles className="h-3 w-3 text-white" />
                      <span className="text-[11px] font-bold text-white tracking-wide uppercase">Most Popular for Small Shops</span>
                    </div>
                  )}
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${plan.gradient}`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-bold">{plan.name}</p>
                          <p className="text-[11px] text-muted-foreground">{plan.tagline}</p>
                          {current && <Badge className="mt-0.5 bg-accent/10 text-accent border-0 text-[10px] px-1.5">Current plan</Badge>}
                        </div>
                      </div>
                      <div className="text-right">
                        {price === 0 ? (
                          <p className="text-2xl font-extrabold">Free</p>
                        ) : (
                          <>
                            <p className="text-2xl font-extrabold">₹{price.toLocaleString("en-IN")}</p>
                            <p className="text-[11px] text-muted-foreground">{cycle === "yearly" ? "/year" : "/month"}</p>
                            {cycle === "yearly" && discount > 0 && <p className="text-[11px] font-semibold text-accent">Save {discount}%</p>}
                            {cycle === "monthly" && <p className="text-[10px] text-muted-foreground">≈ ₹{Math.round(price / 30)}/day</p>}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Limits */}
                    <div className="mb-4 flex gap-3">
                      <div className="flex-1 rounded-xl bg-secondary/60 p-2.5 text-center">
                        <p className="text-sm font-bold">{plan.limits.products ?? "∞"}</p>
                        <p className="text-[10px] text-muted-foreground">Products</p>
                      </div>
                      <div className="flex-1 rounded-xl bg-secondary/60 p-2.5 text-center">
                        <p className="text-sm font-bold">{plan.limits.orders ? `${plan.limits.orders}/mo` : "∞"}</p>
                        <p className="text-[10px] text-muted-foreground">Orders</p>
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="mb-4 space-y-2">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-center gap-2">
                          <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${plan.gradient}`}>
                            <Check className="h-2.5 w-2.5 text-white" />
                          </div>
                          <span className="text-xs text-muted-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Button
                      className={`w-full h-11 rounded-xl font-semibold text-sm transition-all ${current ? "bg-secondary text-muted-foreground" : plan.is_popular ? "gradient-primary text-white shadow-glow-primary" : plan.id === "pro" ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white" : ""}`}
                      variant={current ? "secondary" : plan.is_popular || plan.id === "pro" ? "default" : "outline"}
                      disabled={current || !!loadingPlan}
                      onClick={() => handleSubscribeWithRazorpay(plan.id)}>
                      {loadingPlan === plan.id ? "Processing..." : current ? "Current Plan" : plan.id === "free" ? "Downgrade to Free" : `Upgrade to ${plan.name} · ₹${price.toLocaleString("en-IN")}${cycle === "yearly" ? "/yr" : "/mo"}`}
                    </Button>

                    {/* Razorpay note for paid plans */}
                    {!current && plan.id !== "free" && (
                      <p className="text-[10px] text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
                        <Shield className="h-3 w-3" /> Secure payment via Razorpay
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Feature comparison teaser */}
          <div className="mt-6 rounded-2xl bg-secondary/40 p-4 animate-fade-in">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">What's included</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Package, label: "Product Management" },
                { icon: BarChart3, label: "Sales Analytics" },
                { icon: Download, label: "Invoice Downloads" },
                { icon: Users, label: "Customer History" },
                { icon: Shield, label: "Secure Payments" },
                { icon: Headphones, label: "Support" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cancel subscription */}
          {subscription?.status === "active" && subscription.plan_id !== "free" && (
            <div className="mt-6 text-center animate-fade-in">
              {!showCancel ? (
                <button onClick={() => setShowCancel(true)} className="text-xs text-muted-foreground hover:text-destructive transition-colors underline underline-offset-2">
                  Cancel subscription
                </button>
              ) : (
                <Card className="border-destructive/20 shadow-soft">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold">Cancel subscription?</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          You'll keep access until {subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString("en-IN") : "end of period"}. After that, you'll be moved to Free plan.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 h-9 text-xs rounded-lg" onClick={() => setShowCancel(false)}>Keep Plan</Button>
                      <Button variant="destructive" className="flex-1 h-9 text-xs rounded-lg" onClick={handleCancel}>Yes, Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Trust badges */}
          <div className="mt-8 flex justify-center gap-6 animate-fade-in">
            {[{ icon: "🔒", label: "Secure via Razorpay" }, { icon: "🔄", label: "Cancel anytime" }, { icon: "🇮🇳", label: "GST invoice" }].map(({ icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <span className="text-xl">{icon}</span>
                <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "history" && (
        <div className="animate-fade-in">
          {paymentHistory.length === 0 ? (
            <Card className="border-none shadow-soft">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Receipt className="mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm font-medium text-muted-foreground">No payments yet</p>
                <p className="text-xs text-muted-foreground/60">Your subscription invoices will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {paymentHistory.map(p => (
                <Card key={p.id} className="border-none shadow-soft">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8">
                        <CreditCard className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold capitalize">{PLANS.find(pl => pl.id === p.plan_id)?.name ?? p.plan_id} Plan</p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(p.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {p.billing_cycle}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">₹{p.amount.toLocaleString("en-IN")}</p>
                      <Badge className={`text-[10px] border-0 ${p.status === "paid" ? "bg-accent/10 text-accent" : p.status === "failed" ? "bg-destructive/10 text-destructive" : "bg-warning/10"}`}>
                        {p.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
