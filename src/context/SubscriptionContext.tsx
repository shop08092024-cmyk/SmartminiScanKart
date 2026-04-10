import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export interface Plan {
  id: "free" | "starter" | "pro";
  name: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  product_limit: number | null;
  order_limit: number | null;
  features: string[];
  is_popular: boolean;
}

// Fallback plans used if DB is not seeded yet
const DEFAULT_PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price_monthly: 0,
    price_yearly: 0,
    currency: "INR",
    product_limit: 50,
    order_limit: 100,
    features: ["Up to 50 products", "100 orders/month", "Basic invoice download", "Cash & UPI payments", "1 shop profile"],
    is_popular: false,
  },
  {
    id: "starter",
    name: "Starter",
    price_monthly: 199,
    price_yearly: 1499,
    currency: "INR",
    product_limit: 500,
    order_limit: 1000,
    features: ["Up to 500 products", "1,000 orders/month", "GST invoices with logo", "Razorpay digital payments", "Customer management", "Basic analytics", "Low stock alerts", "Email support"],
    is_popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    price_monthly: 499,
    price_yearly: 3999,
    currency: "INR",
    product_limit: null,
    order_limit: null,
    features: ["Unlimited products", "Unlimited orders", "Custom branded invoices", "All payment methods", "Advanced analytics & reports", "Multi-staff access", "Loyalty points system", "Priority support", "Data export (CSV/PDF)"],
    is_popular: false,
  },
];

export interface Subscription {
  id: string;
  plan_id: string;
  status: "trialing" | "active" | "cancelled" | "expired" | "past_due";
  billing_cycle: "monthly" | "yearly";
  trial_ends_at: string | null;
  current_period_end: string | null;
  cancelled_at: string | null;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  status: string;
  plan_id: string;
  billing_cycle: string;
  created_at: string;
}

interface SubscriptionContextType {
  plans: Plan[];
  subscription: Subscription | null;
  currentPlan: Plan | null;
  paymentHistory: PaymentRecord[];
  loading: boolean;
  isActive: boolean;
  isTrialing: boolean;
  trialDaysLeft: number;
  canAddProduct: (currentCount: number) => boolean;
  canAddOrder: (currentMonthCount: number) => boolean;
  refresh: () => Promise<void>;
  subscribeToPlan: (planId: string, cycle: "monthly" | "yearly") => Promise<void>;
  cancelSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>(DEFAULT_PLANS);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    const [{ data: plansData }, { data: subData }, { data: paymentsData }] = await Promise.all([
      supabase.from("plans").select("*").order("price_monthly"),
      supabase.from("subscriptions").select("*").eq("user_id", user.id).single(),
      supabase.from("payment_history").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);

    if (plansData && plansData.length > 0) {
      const parsedPlans: Plan[] = plansData.map(p => ({
        ...p,
        features: Array.isArray(p.features) ? p.features : JSON.parse(p.features as string),
      }));
      setPlans(parsedPlans);
    }
    // else keep DEFAULT_PLANS

    setSubscription(subData ?? null);
    setPaymentHistory(paymentsData ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const currentPlan = plans.find(p => p.id === subscription?.plan_id) ?? null;

  const isActive =
    subscription?.status === "active" ||
    (subscription?.status === "trialing" && !!subscription.trial_ends_at && new Date(subscription.trial_ends_at) > new Date());

  const isTrialing = subscription?.status === "trialing";

  const trialDaysLeft = (() => {
    if (!subscription?.trial_ends_at) return 0;
    const diff = new Date(subscription.trial_ends_at).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();

  const canAddProduct = (count: number) => {
    if (!currentPlan?.product_limit) return true;
    return count < currentPlan.product_limit;
  };

  const canAddOrder = (monthCount: number) => {
    if (!currentPlan?.order_limit) return true;
    return monthCount < currentPlan.order_limit;
  };

  const subscribeToPlan = async (planId: string, cycle: "monthly" | "yearly") => {
    if (!user || !subscription) throw new Error("Not authenticated");

    const plan = plans.find(p => p.id === planId) ?? DEFAULT_PLANS.find(p => p.id === planId);
    if (!plan) throw new Error("Plan not found");

    const amount = cycle === "yearly" ? plan.price_yearly : plan.price_monthly;
    const now = new Date();
    const periodEnd = new Date(now);
    if (cycle === "yearly") periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    else periodEnd.setMonth(periodEnd.getMonth() + 1);

    const { error: subError } = await supabase
      .from("subscriptions")
      .update({
        plan_id: planId,
        status: "active",
        billing_cycle: cycle,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        trial_ends_at: null,
        updated_at: now.toISOString(),
      })
      .eq("user_id", user.id);

    if (subError) throw subError;

    if (amount > 0) {
      await supabase.from("payment_history").insert({
        user_id: user.id,
        subscription_id: subscription.id,
        plan_id: planId,
        amount,
        currency: plan.currency,
        status: "paid",
        billing_cycle: cycle,
        payment_method: "razorpay",
      });
    }

    await refresh();
  };

  const cancelSubscription = async () => {
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase
      .from("subscriptions")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("user_id", user.id);
    if (error) throw error;
    await refresh();
  };

  return (
    <SubscriptionContext.Provider value={{
      plans, subscription, currentPlan, paymentHistory, loading,
      isActive, isTrialing, trialDaysLeft,
      canAddProduct, canAddOrder,
      refresh, subscribeToPlan, cancelSubscription,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used inside SubscriptionProvider");
  return ctx;
}
