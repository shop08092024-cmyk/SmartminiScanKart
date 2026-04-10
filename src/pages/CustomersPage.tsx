import { useState } from "react";
import { Search, Plus, User, Phone, Mail, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStore } from "@/store/useStore";
import { toast } from "@/hooks/use-toast";

const CustomersPage = () => {
  const { customers, addCustomer } = useStore();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  const handleAdd = () => {
    if (!form.name || !form.phone) {
      toast({ title: "Name and phone required", variant: "destructive" });
      return;
    }
    addCustomer(form);
    setForm({ name: "", phone: "", email: "" });
    setDialogOpen(false);
    toast({ title: "Customer added ✓" });
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  };

  return (
    <div className="page-container">
      <div className="mb-5 flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="text-sm text-muted-foreground">{customers.length} registered</p>
        </div>
        <Button size="sm" className="gap-1.5 rounded-xl gradient-primary shadow-glow-primary" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      <div className="relative mb-5 animate-slide-up">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by name or phone..." className="h-11 rounded-xl pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="space-y-2.5">
        {filtered.map((c, i) => (
          <Card key={c.id} className="border-none shadow-soft transition-all duration-200 hover:shadow-medium animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl gradient-primary text-base font-bold text-primary-foreground shadow-sm">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{c.name}</p>
                    <span className="text-xs text-muted-foreground">{timeAgo(c.lastVisit)}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>
                    {c.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>}
                  </div>
                  <div className="mt-2.5 flex items-center gap-2">
                    <Badge variant="secondary" className="rounded-lg text-[10px] px-2 py-0.5 font-medium">₹{c.totalSpent} spent</Badge>
                    <Badge variant="secondary" className="rounded-lg text-[10px] px-2 py-0.5 font-medium">{c.orderCount} orders</Badge>
                    <Badge className="rounded-lg bg-accent/15 text-accent text-[10px] px-2 py-0.5 font-semibold flex items-center gap-0.5 border-0">
                      <Award className="h-3 w-3" /> {c.loyaltyPoints} pts
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <User className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">No customers found</p>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle className="text-lg">Add Customer</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Name" className="h-11 rounded-xl pl-10" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Phone" className="h-11 rounded-xl pl-10" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Email (optional)" className="h-11 rounded-xl pl-10" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <Button className="h-12 w-full rounded-xl gradient-primary shadow-glow-primary" onClick={handleAdd}>Add Customer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomersPage;
