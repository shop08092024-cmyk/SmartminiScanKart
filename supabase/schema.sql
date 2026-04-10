-- ============================================================
-- shop-scan-pay: Supabase schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Products
create table if not exists products (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  name         text not null,
  barcode      text not null,
  price        numeric(10,2) not null,
  cost_price   numeric(10,2) not null default 0,
  category     text not null default '',
  stock        integer not null default 0,
  min_stock    integer not null default 0,
  tax_percent  numeric(5,2) not null default 0,
  image        text,
  created_at   timestamptz default now()
);

alter table products enable row level security;
create policy "Users manage own products" on products
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Customers
create table if not exists customers (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete cascade not null,
  name           text not null,
  phone          text not null,
  email          text,
  total_spent    numeric(10,2) not null default 0,
  order_count    integer not null default 0,
  loyalty_points integer not null default 0,
  last_visit     timestamptz default now(),
  created_at     timestamptz default now()
);

alter table customers enable row level security;
create policy "Users manage own customers" on customers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Orders
create table if not exists orders (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  total           numeric(10,2) not null,
  tax             numeric(10,2) not null default 0,
  discount        numeric(10,2) not null default 0,
  payment_method  text not null,
  customer_name   text,
  customer_phone  text,
  created_at      timestamptz default now()
);

alter table orders enable row level security;
create policy "Users manage own orders" on orders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Order Items
create table if not exists order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid references orders(id) on delete cascade not null,
  product_id   uuid references products(id) on delete set null,
  product_name text not null,
  quantity     integer not null,
  unit_price   numeric(10,2) not null,
  tax_percent  numeric(5,2) not null default 0
);

-- order_items inherits security through orders (no direct RLS needed)
-- but we restrict reads to the order owner via a security definer function
-- or simply rely on join-based queries that only return rows owned by the user.
alter table order_items enable row level security;
create policy "Order items visible to order owner" on order_items
  for all using (
    exists (
      select 1 from orders
      where orders.id = order_items.order_id
        and orders.user_id = auth.uid()
    )
  );

-- ============================================================
-- Indexes for common lookups
-- ============================================================
create index if not exists products_barcode_idx on products(barcode);
create index if not exists products_user_idx on products(user_id);
create index if not exists customers_phone_idx on customers(phone);
create index if not exists customers_user_idx on customers(user_id);
create index if not exists orders_user_idx on orders(user_id);
create index if not exists order_items_order_idx on order_items(order_id);

-- ============================================================
-- Subscription / Pricing tables
-- ============================================================

-- Plans catalogue (managed by admin, readable by all authenticated users)
create table if not exists plans (
  id            text primary key,          -- 'free' | 'starter' | 'pro'
  name          text not null,
  price_monthly numeric(10,2) not null,
  price_yearly  numeric(10,2) not null,
  currency      text not null default 'INR',
  product_limit integer,                   -- null = unlimited
  order_limit   integer,                   -- null = unlimited
  features      jsonb not null default '[]',
  is_popular    boolean not null default false,
  created_at    timestamptz default now()
);

-- Seed default plans
insert into plans (id, name, price_monthly, price_yearly, product_limit, order_limit, features, is_popular) values
  ('free',    'Free',    0,    0,    50,   200,  '["Up to 50 products","Up to 200 orders/mo","Barcode scanning","Basic analytics","1 store"]', false),
  ('starter', 'Starter', 299,  2990, 500,  null, '["Up to 500 products","Unlimited orders","All Free features","Customer management","GST reports","Priority support"]', true),
  ('pro',     'Pro',     799,  7990, null, null, '["Unlimited products","Unlimited orders","All Starter features","Multi-store support","Advanced analytics","API access","Dedicated support"]', false)
on conflict (id) do nothing;

-- User subscriptions
create table if not exists subscriptions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users(id) on delete cascade not null unique,
  plan_id           text references plans(id) not null default 'free',
  status            text not null default 'trialing',  -- trialing | active | cancelled | expired | past_due
  billing_cycle     text not null default 'monthly',   -- monthly | yearly
  trial_ends_at     timestamptz,
  current_period_start timestamptz,
  current_period_end   timestamptz,
  cancelled_at      timestamptz,
  payment_method    text,                              -- 'razorpay' | 'manual' | null
  razorpay_sub_id   text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

alter table subscriptions enable row level security;
create policy "Users read own subscription" on subscriptions
  for select using (auth.uid() = user_id);
create policy "Users insert own subscription" on subscriptions
  for insert with check (auth.uid() = user_id);
create policy "Users update own subscription" on subscriptions
  for update using (auth.uid() = user_id);

-- Payment history
create table if not exists payment_history (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  subscription_id uuid references subscriptions(id) on delete set null,
  plan_id         text references plans(id),
  amount          numeric(10,2) not null,
  currency        text not null default 'INR',
  status          text not null default 'pending', -- pending | paid | failed | refunded
  payment_method  text,
  razorpay_order_id   text,
  razorpay_payment_id text,
  billing_cycle   text,
  created_at      timestamptz default now()
);

alter table payment_history enable row level security;
create policy "Users read own payments" on payment_history
  for select using (auth.uid() = user_id);
create policy "Users insert own payments" on payment_history
  for insert with check (auth.uid() = user_id);

-- Allow all authenticated users to read plans
alter table plans enable row level security;
create policy "Anyone can read plans" on plans
  for select using (auth.role() = 'authenticated');

-- Auto-create a free trial subscription when a new user signs up
create or replace function handle_new_user_subscription()
returns trigger language plpgsql security definer as $$
begin
  insert into subscriptions (user_id, plan_id, status, trial_ends_at)
  values (new.id, 'free', 'trialing', now() + interval '14 days');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_subscription on auth.users;
create trigger on_auth_user_created_subscription
  after insert on auth.users
  for each row execute procedure handle_new_user_subscription();

-- ============================================================
-- MIGRATION: Enhanced fields (run after initial schema)
-- ============================================================

-- Add MRP and sold_quantity to products
alter table products add column if not exists mrp numeric(10,2) not null default 0;
alter table products add column if not exists sold_quantity integer not null default 0;

-- Add order_number and payment fields to orders
alter table orders add column if not exists order_number text;
alter table orders add column if not exists payment_status text not null default 'paid';
alter table orders add column if not exists razorpay_order_id text;
alter table orders add column if not exists razorpay_payment_id text;

-- Backfill order_number for existing orders
update orders set order_number = 'ORD-' || extract(year from created_at)::text || '-' || lpad(row_number() over (order by created_at)::text, 4, '0')
where order_number is null;

-- Index for fast order number lookups
create index if not exists orders_number_idx on orders(order_number);

-- ============================================================
-- v2 ADDITIONS: Shop Profiles & Plan Price Updates
-- ============================================================

-- Shop profiles table (for invoice branding)
create table if not exists shop_profiles (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete cascade not null unique,
  shop_name        text not null default '',
  owner_name       text not null default '',
  phone            text not null default '',
  alternate_phone  text,
  email            text,
  address          text not null default '',
  city             text,
  state            text,
  pincode          text,
  gstin            text,
  fssai_number     text,
  upi_id           text,
  logo_url         text,
  thank_you_message text default 'Thank you for your purchase! Visit again.',
  currency         text default 'INR',
  invoice_prefix   text default 'INV',
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table shop_profiles enable row level security;
create policy "Users manage own shop profile" on shop_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists shop_profiles_user_idx on shop_profiles(user_id);

-- Update plan prices to affordable grocery shop rates
update plans set
  price_monthly = 0, price_yearly = 0,
  product_limit = 50, order_limit = 100,
  features = '["Up to 50 products","100 orders/month","Basic invoice download","Cash & UPI payments","1 shop profile"]',
  is_popular = false
where id = 'free';

update plans set
  price_monthly = 199, price_yearly = 1499,
  product_limit = 500, order_limit = 1000,
  features = '["Up to 500 products","1,000 orders/month","GST invoices with logo","Razorpay digital payments","Customer management","Basic analytics","Low stock alerts","Email support"]',
  is_popular = true
where id = 'starter';

update plans set
  price_monthly = 499, price_yearly = 3999,
  product_limit = null, order_limit = null,
  features = '["Unlimited products","Unlimited orders","Custom branded invoices","All payment methods","Advanced analytics & reports","Multi-staff access","Loyalty points system","Priority support","Data export (CSV/PDF)"]',
  is_popular = false
where id = 'pro';

