import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Store, User, CreditCard, Bell, HelpCircle, LogOut, ChevronRight, Shield, Crown, Star, Zap,
  Phone, MapPin, Building, FileText, Save, ArrowLeft, ExternalLink, CheckCircle, AlertCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { useShopProfile } from "@/context/ShopProfileContext";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const planIcons: Record<string, React.ElementType> = { free: Zap, starter: Star, pro: Crown };
const planColors: Record<string, string> = {
  free: "bg-slate-100 text-slate-600",
  starter: "bg-primary/10 text-primary",
  pro: "bg-violet-100 text-violet-600",
};

// Shop Profile Form
function ShopProfileForm({ onClose }: { onClose: () => void }) {
  const { profile, saveProfile, loading } = useShopProfile();
  const [form, setForm] = useState({ ...profile });
  const [saving, setSaving] = useState(false);

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.shopName.trim()) { toast({ title: "Shop name is required", variant: "destructive" }); return; }
    if (!form.ownerName.trim()) { toast({ title: "Owner name is required", variant: "destructive" }); return; }
    if (!form.phone.trim()) { toast({ title: "Phone number is required", variant: "destructive" }); return; }
    if (!form.address.trim()) { toast({ title: "Address is required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      await saveProfile(form);
      toast({ title: "Shop profile saved!", description: "Your details will appear on invoices." });
      onClose();
    } catch (e) {
      toast({ title: "Failed to save", description: String(e), variant: "destructive" });
    } finally { setSaving(false); }
  };

  if (loading) return <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-5 max-h-[70vh] overflow-y-auto">
      {/* Required Fields */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Required Information</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Shop / Store Name *</label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="e.g., Sharma General Store" value={form.shopName} onChange={e => set("shopName", e.target.value)} className="pl-10 h-11 rounded-xl" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Owner Name *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="e.g., Ramesh Sharma" value={form.ownerName} onChange={e => set("ownerName", e.target.value)} className="pl-10 h-11 rounded-xl" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Phone Number *</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="e.g., +91 98765 43210" value={form.phone} onChange={e => set("phone", e.target.value)} className="pl-10 h-11 rounded-xl" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Shop Address *</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <textarea placeholder="Shop address, street, landmark..." value={form.address} onChange={e => set("address", e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 h-20 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">City</label>
              <Input placeholder="e.g., Mumbai" value={form.city} onChange={e => set("city", e.target.value)} className="h-10 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">State</label>
              <Input placeholder="e.g., Maharashtra" value={form.state} onChange={e => set("state", e.target.value)} className="h-10 rounded-xl text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Pincode</label>
            <Input placeholder="e.g., 400001" value={form.pincode} onChange={e => set("pincode", e.target.value)} className="h-10 rounded-xl text-sm" />
          </div>
        </div>
      </div>

      {/* Optional Fields */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Optional Information</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Alternate Phone</label>
            <Input placeholder="+91 ..." value={form.alternatePhone ?? ""} onChange={e => set("alternatePhone", e.target.value)} className="h-10 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Email</label>
            <Input placeholder="shop@email.com" value={form.email ?? ""} onChange={e => set("email", e.target.value)} className="h-10 rounded-xl text-sm" type="email" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">GSTIN</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="22AAAAA0000A1Z5" value={form.gstin ?? ""} onChange={e => set("gstin", e.target.value.toUpperCase())} className="pl-10 h-10 rounded-xl text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">FSSAI License No.</label>
            <Input placeholder="12345678901234" value={form.fssaiNumber ?? ""} onChange={e => set("fssaiNumber", e.target.value)} className="h-10 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">UPI ID (shown on invoice QR)</label>
            <Input placeholder="shopname@upi" value={form.upiId ?? ""} onChange={e => set("upiId", e.target.value)} className="h-10 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Invoice Prefix</label>
            <Input placeholder="INV" value={form.invoicePrefix} onChange={e => set("invoicePrefix", e.target.value.toUpperCase())} className="h-10 rounded-xl text-sm" maxLength={6} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Thank You Message (on invoice)</label>
            <Input placeholder="Thank you for shopping with us!" value={form.thankYouMessage ?? ""} onChange={e => set("thankYouMessage", e.target.value)} className="h-10 rounded-xl text-sm" />
          </div>
        </div>
      </div>

      <Button className="h-12 w-full rounded-xl gradient-primary font-semibold gap-2" onClick={handleSave} disabled={saving}>
        <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Shop Profile"}
      </Button>
    </div>
  );
}

// Notification settings
function NotificationSettings({ onClose }: { onClose: () => void }) {
  const [lowStock, setLowStock] = useState(true);
  const [dailySummary, setDailySummary] = useState(false);
  const [paymentAlert, setPaymentAlert] = useState(true);

  const Toggle = ({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between py-3 border-b border-border/40 last:border-0">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors duration-300 ${checked ? "bg-primary" : "bg-secondary"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <Toggle label="Low Stock Alerts" desc="Notify when products fall below minimum stock" checked={lowStock} onChange={setLowStock} />
      <Toggle label="Daily Sales Summary" desc="Get a summary of daily sales at end of day" checked={dailySummary} onChange={setDailySummary} />
      <Toggle label="Payment Confirmations" desc="Alert when payment is confirmed" checked={paymentAlert} onChange={setPaymentAlert} />
      <Button className="w-full h-11 rounded-xl gradient-primary font-semibold gap-2" onClick={() => { toast({ title: "Notification preferences saved" }); onClose(); }}>
        <Save className="h-4 w-4" /> Save Preferences
      </Button>
    </div>
  );
}

// Security settings
function SecuritySettings({ onClose }: { onClose: () => void }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const handleChangePassword = async () => {
    if (!currentPw) { toast({ title: "Enter current password", variant: "destructive" }); return; }
    if (newPw.length < 6) { toast({ title: "New password must be at least 6 characters", variant: "destructive" }); return; }
    if (newPw !== confirmPw) { toast({ title: "Passwords don't match", variant: "destructive" }); return; }
    toast({ title: "Password change requires email confirmation", description: "Check your email for a password reset link." });
    onClose();
  };

  const handleSignOutAllDevices = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Change Password</p>
        <div className="space-y-3">
          <Input type="password" placeholder="Current password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} className="h-11 rounded-xl" />
          <Input type="password" placeholder="New password (min 6 chars)" value={newPw} onChange={e => setNewPw(e.target.value)} className="h-11 rounded-xl" />
          <Input type="password" placeholder="Confirm new password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} className="h-11 rounded-xl" />
          <Button className="w-full h-11 rounded-xl gradient-primary" onClick={handleChangePassword}>Update Password</Button>
        </div>
      </div>
      <div className="border-t border-border/60 pt-4">
        <Button variant="destructive" className="w-full h-11 rounded-xl" onClick={handleSignOutAllDevices}>
          Sign Out of All Devices
        </Button>
      </div>
    </div>
  );
}

// Help & FAQ
function HelpSection({ onClose }: { onClose: () => void }) {
  const faqs = [
    { q: "How do I add products?", a: "Go to Products page and tap the + button. You can add name, price, barcode, stock, and GST." },
    { q: "How do I scan barcodes?", a: "Go to Cart or Scan page and tap the Scan button. Allow camera access when prompted." },
    { q: "How do I download an invoice?", a: "After checkout, tap 'Download Invoice' on the order complete screen. Or go to Orders and tap any order." },
    { q: "How do I set up UPI?", a: "Go to Settings → Shop Profile and enter your UPI ID. It will appear as a QR code on invoices." },
    { q: "How does Razorpay work?", a: "Select Razorpay at checkout for digital payments. Customers can pay via card, UPI, net banking, or wallets." },
    { q: "How do I upgrade my plan?", a: "Go to Settings → Subscription to view plans and upgrade. Plans start at ₹199/month." },
  ];

  return (
    <div className="space-y-3 max-h-[60vh] overflow-y-auto">
      {faqs.map((f, i) => (
        <div key={i} className="rounded-xl bg-secondary/40 p-3.5">
          <p className="text-sm font-semibold text-foreground mb-1">{f.q}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{f.a}</p>
        </div>
      ))}
      <div className="pt-2 rounded-xl bg-primary/5 p-4 text-center">
        <p className="text-sm font-semibold text-foreground mb-1">Need more help?</p>
        <p className="text-xs text-muted-foreground mb-3">Contact us at support@shopscan.app</p>
        <Button variant="outline" className="w-full h-10 rounded-xl gap-2 text-sm" onClick={() => { toast({ title: "Support email copied!" }); }}>
          <ExternalLink className="h-4 w-4" /> Contact Support
        </Button>
      </div>
    </div>
  );
}

const SettingsPage = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { subscription, currentPlan, isTrialing, trialDaysLeft } = useSubscription();
  const { profile, isProfileComplete } = useShopProfile();
  const [activeModal, setActiveModal] = useState<null | "shop" | "account" | "notifications" | "security" | "help">(null);

  const handleSignOut = async () => { await signOut(); navigate("/login"); };

  const PlanIcon = planIcons[subscription?.plan_id ?? "free"] ?? Zap;
  const planBadgeClass = planColors[subscription?.plan_id ?? "free"];

  const menuItems = [
    {
      label: "Shop Profile",
      description: isProfileComplete ? `${profile.shopName} · ${profile.phone}` : "⚠ Complete your shop details for invoices",
      icon: Store,
      onClick: () => setActiveModal("shop"),
      badge: !isProfileComplete ? <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600"><AlertCircle className="h-3 w-3" /> Incomplete</span> : <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600"><CheckCircle className="h-3 w-3" /> Set up</span>,
    },
    {
      label: "Account",
      description: user?.email ?? "Email, password, phone",
      icon: User,
      onClick: () => setActiveModal("account"),
    },
    {
      label: "Subscription",
      description: isTrialing ? `Free trial · ${trialDaysLeft} days left` : `${currentPlan?.name ?? "Free"} plan · ${subscription?.status ?? ""}`,
      icon: CreditCard,
      onClick: () => navigate("/settings/subscription"),
      badge: <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${planBadgeClass}`}>
        <PlanIcon className="h-3 w-3" />{currentPlan?.name ?? "Free"}
      </span>,
    },
    {
      label: "Notifications",
      description: "Low stock alerts, daily summary, payment alerts",
      icon: Bell,
      onClick: () => setActiveModal("notifications"),
    },
    {
      label: "Security",
      description: "Change password, active sessions",
      icon: Shield,
      onClick: () => setActiveModal("security"),
    },
    {
      label: "Help & Support",
      description: "FAQs, contact us",
      icon: HelpCircle,
      onClick: () => setActiveModal("help"),
    },
  ];

  const modalTitles: Record<string, string> = {
    shop: "Shop Profile",
    account: "Account Settings",
    notifications: "Notifications",
    security: "Security",
    help: "Help & Support",
  };

  return (
    <div className="page-container">
      <div className="mb-6 animate-fade-in">
        <h1 className="page-title">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your store preferences</p>
      </div>

      {/* Shop profile incomplete banner */}
      {!isProfileComplete && (
        <div className="mb-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 animate-slide-up">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">📋 Complete your shop profile</p>
          <p className="text-xs text-amber-700 dark:text-amber-500 mt-0.5">Add shop name, owner name, and contact info. This appears on all invoices.</p>
          <button onClick={() => setActiveModal("shop")} className="mt-2 text-xs font-semibold text-amber-800 dark:text-amber-400 hover:underline">Set up now →</button>
        </div>
      )}

      {/* Trial warning */}
      {isTrialing && trialDaysLeft <= 5 && (
        <div className="mb-4 rounded-2xl bg-warning/10 border border-warning/20 p-4 animate-slide-up">
          <p className="text-sm font-semibold">⏰ Trial ending soon</p>
          <p className="text-xs text-muted-foreground mt-0.5">{trialDaysLeft} days left. Upgrade to keep your data.</p>
          <button onClick={() => navigate("/settings/subscription")} className="mt-2 text-xs font-semibold text-primary hover:underline">View plans →</button>
        </div>
      )}

      {/* User info card */}
      {user && (
        <Card className="mb-5 border-none shadow-soft animate-slide-up">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-lg">{(user.email?.[0] ?? "U").toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground truncate">{profile.ownerName || "Shop Owner"}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${planBadgeClass}`}>
              <PlanIcon className="h-3 w-3" />{currentPlan?.name ?? "Free"}
            </span>
          </CardContent>
        </Card>
      )}

      <Card className="mb-5 border-none shadow-soft animate-slide-up">
        <CardContent className="p-0">
          {menuItems.map(({ label, description, icon: Icon, onClick, badge }, i) => (
            <button key={label} onClick={onClick}
              className={`flex w-full items-center gap-3.5 px-5 py-4 text-left transition-all duration-200 hover:bg-secondary/50 active:scale-[0.99] ${i < menuItems.length - 1 ? "border-b border-border/40" : ""}`}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground truncate">{description}</p>
              </div>
              {badge ?? <ChevronRight className="h-4 w-4 text-muted-foreground/40" />}
            </button>
          ))}
        </CardContent>
      </Card>

      <button onClick={handleSignOut}
        className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-destructive/20 py-3.5 text-sm font-semibold text-destructive transition-all duration-200 hover:bg-destructive/5 active:scale-[0.98]">
        <LogOut className="h-4 w-4" /> Sign Out
      </button>

      <p className="mt-8 text-center text-xs text-muted-foreground/50">ShopScan POS v2.0.0</p>

      {/* Modals */}
      <Dialog open={!!activeModal} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-sm rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{activeModal ? modalTitles[activeModal] : ""}</DialogTitle>
            <DialogDescription>Manage your {activeModal ? modalTitles[activeModal].toLowerCase() : "settings"}</DialogDescription>
          </DialogHeader>
          {activeModal === "shop" && <ShopProfileForm onClose={() => setActiveModal(null)} />}
          {activeModal === "notifications" && <NotificationSettings onClose={() => setActiveModal(null)} />}
          {activeModal === "security" && <SecuritySettings onClose={() => setActiveModal(null)} />}
          {activeModal === "help" && <HelpSection onClose={() => setActiveModal(null)} />}
          {activeModal === "account" && (
            <div className="space-y-3">
              <div className="rounded-xl bg-secondary/50 p-4">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-semibold mt-1">{user?.email}</p>
              </div>
              <div className="rounded-xl bg-secondary/50 p-4">
                <p className="text-xs text-muted-foreground">Account created</p>
                <p className="font-semibold mt-1">{user?.created_at ? new Date(user.created_at).toLocaleDateString("en-IN") : "—"}</p>
              </div>
              <Button className="w-full h-11 rounded-xl" variant="outline" onClick={() => { setActiveModal("security"); }}>
                Change Password
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
