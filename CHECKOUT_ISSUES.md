# Checkout Issues - Complete Diagnosis & Fix Guide

## Problems Found
Your checkout isn't working due to **missing database columns** that the code is trying to use but don't exist in Supabase.

### 1. **400 Bad Request on POST to orders** ⚠️ PRIMARY ISSUE
```
POST https://tntujmcsiwjpaufoqrsx.supabase.co/rest/v1/orders?select=* 400 (Bad Request)
```

**Root Cause:** The `orders` table is missing these columns:
- `payment_status` ← **app sends this, column doesn't exist**
- `order_number` ← database has this in schema but not applied
- `razorpay_order_id` ← app sends this
- `razorpay_payment_id` ← app sends this

When Supabase REST API receives these unknown columns, it returns 406/400 error.

### 2. **Products Table Incomplete**
App tries to track `mrp` and `sold_quantity` but these columns missing:
- `mrp` (Maximum Retail Price) - used for discount display
- `sold_quantity` - used for inventory tracking

### 3. **406 Not Acceptable - shop_profiles & subscriptions**
```
GET .../shop_profiles?select=*&user_id=eq.a63c41e2... 406 (Not Acceptable)
GET .../subscriptions?select=*&user_id=eq.a63c41e2... 406 (Not Acceptable)
```
These might fail due to RLS policy issues or missing Accept headers.

### 4. **Dialog Accessibility Issue** ✅ FIXED
Missing `aria-describedby` attributes in checkout dialogs - now fixed!

---

## Fixes Applied

### ✅ Already Fixed
1. Fixed dialog accessibility by adding `DialogDescription` components
   - Updated cart quantity dialog
   - Updated checkout dialog
   - All accessibility warnings should be resolved

### ⏳ Still Needed
2. **Add missing database columns** - Must run SQL in Supabase

---

## Step-by-Step Fix Guide

### Step 1: Run SQL Migration in Supabase

1. Open Supabase Console:
   - Go to: https://app.supabase.com
   - Select your project `tntujmcsiwjpaufoqrsx`

2. Navigate to SQL Editor:
   - Left sidebar → SQL Editor
   - New Query

3. **Copy and run this SQL:**

```sql
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
-- Backfill missing order_numbers for existing orders
-- ============================================================
UPDATE orders 
SET order_number = 'ORD-' || EXTRACT(YEAR FROM created_at)::TEXT || '-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 4, '0')
WHERE order_number IS NULL;
```

4. Click **"Run"** button

5. **Verify Success:**
   - Go to Table Editor
   - Check `products` table has: `mrp`, `sold_quantity`
   - Check `orders` table has: `order_number`, `payment_status`, `razorpay_order_id`, `razorpay_payment_id`

### Step 2: Restart Dev Server

In your terminal:
```bash
# If server is running, press Ctrl+C to stop it
npm run dev
```

### Step 3: Test Checkout

1. Scan/add a product to cart
2. Click "Checkout"
3. Select payment method (Cash/UPI recommended for testing)
4. Click "Complete Order"

**Expected Result:**
- ✅ Order saves to database (no 400 error)
- ✅ Order complete screen displays
- ✅ Invoice download works
- ✅ Products stock updated
- ✅ No console errors

---

## Why This Happened

The schema.sql file has ALTER TABLE statements (lines 192-199) that add these columns, but they **weren't executed in your Supabase database**. The file exists locally but never got applied to Supabase.

It's similar to having a migration file in your git repo - you have to actually run it against the database.

---

## Files Modified

✅ [src/pages/CartPage.tsx](src/pages/CartPage.tsx) - Added DialogDescription for accessibility

---

## If It Still Doesn't Work

1. **Check Supabase Policy:**
   - SQL Editor → `DESCRIBE orders;` 
   - Verify all 4 columns appear in output

2. **Check Browser Console:**
   - F12 → Console tab
   - Look for red errors

3. **Check RLS Policies:**
   - Check "Authentication" → "Policies"
   - Ensure INSERT policy allows your user

---

## Summary
| Issue | Status | Action |
|-------|--------|--------|
| Missing database columns | 🔴 Critical | Run SQL migration |
| Dialog accessibility | ✅ Fixed | Already applied |
| 400 error on checkout | 🔴 Will be fixed | After SQL migration |
| 406 errors shop_profiles | ⏳ TBD | Monitor after migration |

**Expected time to fix: ~5 minutes**

