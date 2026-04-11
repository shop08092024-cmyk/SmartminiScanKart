import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export interface ShopProfile {
  id?: string;
  shopName: string;
  ownerName: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin?: string;
  fssaiNumber?: string;
  upiId?: string;
  logoUrl?: string;
  thankYouMessage?: string;
  currency: string;
  invoicePrefix: string;
}

const DEFAULT_PROFILE: ShopProfile = {
  shopName: "",
  ownerName: "",
  phone: "",
  alternatePhone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  gstin: "",
  fssaiNumber: "",
  upiId: "",
  logoUrl: "",
  thankYouMessage: "Thank you for your purchase! Visit again.",
  currency: "INR",
  invoicePrefix: "INV",
};

interface ShopProfileContextType {
  profile: ShopProfile;
  loading: boolean;
  isProfileComplete: boolean;
  saveProfile: (p: ShopProfile) => Promise<void>;
  refresh: () => Promise<void>;
}

const ShopProfileContext = createContext<ShopProfileContextType | null>(null);

export function ShopProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ShopProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data } = await supabase
        .from("shop_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setProfile({
          id: data.id,
          shopName: data.shop_name ?? "",
          ownerName: data.owner_name ?? "",
          phone: data.phone ?? "",
          alternatePhone: data.alternate_phone ?? "",
          email: data.email ?? "",
          address: data.address ?? "",
          city: data.city ?? "",
          state: data.state ?? "",
          pincode: data.pincode ?? "",
          gstin: data.gstin ?? "",
          fssaiNumber: data.fssai_number ?? "",
          upiId: data.upi_id ?? "",
          logoUrl: data.logo_url ?? "",
          thankYouMessage: data.thank_you_message ?? DEFAULT_PROFILE.thankYouMessage,
          currency: data.currency ?? "INR",
          invoicePrefix: data.invoice_prefix ?? "INV",
        });
      }
    } catch (_) { /* no profile yet */ }
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const isProfileComplete = !!(profile.shopName && profile.ownerName && profile.phone && profile.address);

  const saveProfile = async (p: ShopProfile) => {
    if (!user) throw new Error("Not authenticated");
    const payload = {
      user_id: user.id,
      shop_name: p.shopName,
      owner_name: p.ownerName,
      phone: p.phone,
      alternate_phone: p.alternatePhone ?? null,
      email: p.email ?? null,
      address: p.address,
      city: p.city,
      state: p.state,
      pincode: p.pincode,
      gstin: p.gstin ?? null,
      fssai_number: p.fssaiNumber ?? null,
      upi_id: p.upiId ?? null,
      logo_url: p.logoUrl ?? null,
      thank_you_message: p.thankYouMessage ?? null,
      currency: p.currency ?? "INR",
      invoice_prefix: p.invoicePrefix ?? "INV",
      updated_at: new Date().toISOString(),
    };

    if (profile.id) {
      const { error } = await supabase.from("shop_profiles").update(payload).eq("id", profile.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("shop_profiles").insert(payload);
      if (error) throw error;
    }
    await refresh();
  };

  return (
    <ShopProfileContext.Provider value={{ profile, loading, isProfileComplete, saveProfile, refresh }}>
      {children}
    </ShopProfileContext.Provider>
  );
}

export function useShopProfile() {
  const ctx = useContext(ShopProfileContext);
  if (!ctx) throw new Error("useShopProfile must be used inside ShopProfileProvider");
  return ctx;
}
