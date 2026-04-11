-- ============================================================
-- CRITICAL: Add missing columns to products table
-- ============================================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS mrp numeric(10,2) NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sold_quantity INTEGER NOT NULL DEFAULT 0;

-- ============================================================
-- CRITICAL: Add missing columns to orders table
-- ============================================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'paid';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;

-- ============================================================
-- Performance indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS orders_number_idx ON orders(order_number);
CREATE INDEX IF NOT EXISTS orders_payment_idx ON orders(payment_status);

-- ============================================================
-- Backfill missing order_numbers for existing orders (without window functions)
-- ============================================================
WITH numbered_orders AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM orders
  WHERE order_number IS NULL
)
UPDATE orders
SET order_number = 'ORD-' || EXTRACT(YEAR FROM orders.created_at)::TEXT || '-' || LPAD(numbered_orders.row_num::TEXT, 4, '0')
FROM numbered_orders
WHERE orders.id = numbered_orders.id AND orders.order_number IS NULL;
