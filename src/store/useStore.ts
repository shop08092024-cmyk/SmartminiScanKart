import { create } from "zustand";
import { supabase } from "@/lib/supabase";

const getUserId = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
};

export interface Product {
  id: string;
  name: string;
  barcode: string;
  price: number;
  mrp: number;
  costPrice: number;
  category: string;
  stock: number;
  soldQuantity: number;
  minStock: number;
  taxPercent: number;
  image?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  total: number;
  tax: number;
  discount: number;
  paymentMethod: string;
  paymentStatus: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  customerName?: string;
  customerPhone?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  totalSpent: number;
  orderCount: number;
  loyaltyPoints: number;
  lastVisit: string;
}

interface AppState {
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  customers: Customer[];
  loading: boolean;
  orderCounter: number;

  fetchAll: () => Promise<void>;

  addProduct: (p: Omit<Product, "id" | "soldQuantity">) => Promise<void>;
  updateProduct: (id: string, p: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProductByBarcode: (barcode: string) => Product | undefined;

  addToCart: (product: Product, quantity: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;

  checkout: (
    paymentMethod: string,
    discount: number,
    customerName?: string,
    customerPhone?: string,
    razorpayOrderId?: string,
    razorpayPaymentId?: string,
  ) => Promise<Order>;

  addCustomer: (
    c: Omit<Customer, "id" | "totalSpent" | "orderCount" | "loyaltyPoints" | "lastVisit">
  ) => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toProduct = (r: any): Product => ({
  id: r.id,
  name: r.name,
  barcode: r.barcode,
  price: r.price,
  mrp: r.mrp ?? r.price,
  costPrice: r.cost_price,
  category: r.category,
  stock: r.stock,
  soldQuantity: r.sold_quantity ?? 0,
  minStock: r.min_stock,
  taxPercent: r.tax_percent,
  image: r.image ?? undefined,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toCustomer = (r: any): Customer => ({
  id: r.id,
  name: r.name,
  phone: r.phone,
  email: r.email ?? undefined,
  totalSpent: r.total_spent,
  orderCount: r.order_count,
  loyaltyPoints: r.loyalty_points,
  lastVisit: r.last_visit,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toOrderItem = (r: any): OrderItem => ({
  productId: r.product_id ?? "",
  productName: r.product_name,
  quantity: r.quantity,
  unitPrice: r.unit_price,
  taxPercent: r.tax_percent,
  lineTotal: r.unit_price * r.quantity,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toOrder = (r: any): Order => {
  const items: OrderItem[] = (r.order_items ?? []).map(toOrderItem);
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  return {
    id: r.id,
    orderNumber: r.order_number ?? `ORD-${r.id.slice(0, 8).toUpperCase()}`,
    items,
    subtotal,
    total: r.total,
    tax: r.tax,
    discount: r.discount,
    paymentMethod: r.payment_method,
    paymentStatus: r.payment_status ?? "paid",
    razorpayOrderId: r.razorpay_order_id ?? undefined,
    razorpayPaymentId: r.razorpay_payment_id ?? undefined,
    customerName: r.customer_name ?? undefined,
    customerPhone: r.customer_phone ?? undefined,
    createdAt: r.created_at,
  };
};

const generateOrderNumber = (counter: number): string => {
  const year = new Date().getFullYear();
  const seq = String(counter).padStart(4, "0");
  return `ORD-${year}-${seq}`;
};

export const useStore = create<AppState>((set, get) => ({
  products: [],
  cart: [],
  orders: [],
  customers: [],
  loading: false,
  orderCounter: 1,

  fetchAll: async () => {
    set({ loading: true });
    const [{ data: products }, { data: orders }, { data: customers }] = await Promise.all([
      supabase.from("products").select("*").order("name"),
      supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }),
      supabase.from("customers").select("*").order("name"),
    ]);
    const mappedOrders = (orders ?? []).map(toOrder);
    const maxCounter = mappedOrders.length > 0
      ? Math.max(...mappedOrders.map((o) => {
          const m = o.orderNumber.match(/(\d+)$/);
          return m ? parseInt(m[1]) : 0;
        }))
      : 0;
    set({
      products: (products ?? []).map(toProduct),
      orders: mappedOrders,
      customers: (customers ?? []).map(toCustomer),
      loading: false,
      orderCounter: maxCounter + 1,
    });
  },

  addProduct: async (p) => {
    const user_id = await getUserId();
    const { data, error } = await supabase
      .from("products")
      .insert({
        user_id,
        name: p.name,
        barcode: p.barcode,
        price: p.price,
        mrp: p.mrp ?? p.price,
        cost_price: p.costPrice,
        category: p.category,
        stock: p.stock,
        sold_quantity: 0,
        min_stock: p.minStock,
        tax_percent: p.taxPercent,
        image: p.image ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    set((s) => ({ products: [...s.products, toProduct(data)] }));
  },

  updateProduct: async (id, p) => {
    const patch: Record<string, unknown> = {};
    if (p.name !== undefined) patch.name = p.name;
    if (p.barcode !== undefined) patch.barcode = p.barcode;
    if (p.price !== undefined) patch.price = p.price;
    if (p.mrp !== undefined) patch.mrp = p.mrp;
    if (p.costPrice !== undefined) patch.cost_price = p.costPrice;
    if (p.category !== undefined) patch.category = p.category;
    if (p.stock !== undefined) patch.stock = p.stock;
    if (p.soldQuantity !== undefined) patch.sold_quantity = p.soldQuantity;
    if (p.minStock !== undefined) patch.min_stock = p.minStock;
    if (p.taxPercent !== undefined) patch.tax_percent = p.taxPercent;
    if (p.image !== undefined) patch.image = p.image;
    const { data, error } = await supabase
      .from("products")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    set((s) => ({
      products: s.products.map((pr) => (pr.id === id ? toProduct(data) : pr)),
    }));
  },

  deleteProduct: async (id) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({ products: s.products.filter((p) => p.id !== id) }));
  },

  getProductByBarcode: (barcode) => get().products.find((p) => p.barcode === barcode),

  addToCart: (product, quantity) =>
    set((s) => {
      const existing = s.cart.find((c) => c.product.id === product.id);
      if (existing) {
        return {
          cart: s.cart.map((c) =>
            c.product.id === product.id ? { ...c, quantity: c.quantity + quantity } : c
          ),
        };
      }
      return { cart: [...s.cart, { product, quantity }] };
    }),

  updateCartQuantity: (productId, quantity) =>
    set((s) => ({
      cart:
        quantity <= 0
          ? s.cart.filter((c) => c.product.id !== productId)
          : s.cart.map((c) =>
              c.product.id === productId ? { ...c, quantity } : c
            ),
    })),

  removeFromCart: (productId) =>
    set((s) => ({ cart: s.cart.filter((c) => c.product.id !== productId) })),

  clearCart: () => set({ cart: [] }),

  checkout: async (paymentMethod, discount, customerName, customerPhone, razorpayOrderId, razorpayPaymentId) => {
    const user_id = await getUserId();
    const s = get();

    if (s.cart.length === 0) throw new Error("Cart is empty");

    // Validate stock availability before hitting the DB
    for (const c of s.cart) {
      if (c.quantity > c.product.stock) {
        throw new Error(`Insufficient stock for "${c.product.name}". Only ${c.product.stock} left.`);
      }
    }

    const tax = s.cart.reduce(
      (sum, c) => sum + (c.product.price * c.quantity * c.product.taxPercent) / 100, 0
    );
    const subtotal = s.cart.reduce((sum, c) => sum + c.product.price * c.quantity, 0);
    // Ensure discount never makes total negative
    const safeDiscount = Math.min(discount, subtotal + tax);
    const total = Math.max(0, subtotal + tax - safeDiscount);
    const orderNumber = generateOrderNumber(s.orderCounter);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id,
        order_number: orderNumber,
        total,
        tax,
        discount: safeDiscount,
        payment_method: paymentMethod,
        payment_status: "paid",
        razorpay_order_id: razorpayOrderId ?? null,
        razorpay_payment_id: razorpayPaymentId ?? null,
        customer_name: customerName ?? null,
        customer_phone: customerPhone ?? null,
      })
      .select()
      .single();
    if (orderError) throw orderError;

    const { error: itemsError } = await supabase.from("order_items").insert(
      s.cart.map((c) => ({
        order_id: order.id,
        product_id: c.product.id,
        product_name: c.product.name,
        quantity: c.quantity,
        unit_price: c.product.price,
        tax_percent: c.product.taxPercent,
      }))
    );
    if (itemsError) throw itemsError;

    await Promise.all(
      s.cart.map((c) =>
        supabase
          .from("products")
          .update({
            stock: Math.max(0, c.product.stock - c.quantity),
            sold_quantity: (c.product.soldQuantity ?? 0) + c.quantity,
          })
          .eq("id", c.product.id)
      )
    );

    if (customerName && customerPhone) {
      const existing = s.customers.find((c) => c.phone === customerPhone);
      if (existing) {
        await supabase.from("customers").update({
          total_spent: existing.totalSpent + total,
          order_count: existing.orderCount + 1,
          loyalty_points: existing.loyaltyPoints + Math.floor(total / 10),
          last_visit: new Date().toISOString(),
        }).eq("id", existing.id);
      } else {
        await supabase.from("customers").insert({
          user_id,
          name: customerName,
          phone: customerPhone,
          total_spent: total,
          order_count: 1,
          loyalty_points: Math.floor(total / 10),
          last_visit: new Date().toISOString(),
        });
      }
    }

    // Build the complete order object from local cart data — avoids race condition
    // where fetchAll() state update hasn't propagated yet when we read get().orders
    const builtItems: OrderItem[] = s.cart.map((c) => ({
      productId: c.product.id,
      productName: c.product.name,
      quantity: c.quantity,
      unitPrice: c.product.price,
      taxPercent: c.product.taxPercent,
      lineTotal: c.product.price * c.quantity,
    }));
    const builtOrder: Order = {
      id: order.id,
      orderNumber,
      items: builtItems,
      subtotal,
      total,
      tax,
      discount: safeDiscount,
      paymentMethod,
      paymentStatus: "paid",
      razorpayOrderId: razorpayOrderId ?? undefined,
      razorpayPaymentId: razorpayPaymentId ?? undefined,
      customerName: customerName ?? undefined,
      customerPhone: customerPhone ?? undefined,
      createdAt: order.created_at ?? new Date().toISOString(),
    };

    // Refresh store data in background (don't await — we already have what we need)
    get().fetchAll();
    set({ cart: [], orderCounter: s.orderCounter + 1 });

    return builtOrder;
  },

  addCustomer: async (c) => {
    const user_id = await getUserId();
    const { data, error } = await supabase
      .from("customers")
      .insert({
        user_id,
        name: c.name,
        phone: c.phone,
        email: c.email ?? null,
        total_spent: 0,
        order_count: 0,
        loyalty_points: 0,
        last_visit: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    set((s) => ({ customers: [...s.customers, toCustomer(data)] }));
  },
}));
