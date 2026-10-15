-- ==============================================================================
-- ZENMART BD - PRODUCTION POSTGRESQL SCHEMA MIGRATION FOR SUPABASE
-- File: supabase/schema.sql
-- Description: Sets up all 16 tables, foreign keys, indexes, triggers,
--              hardened RLS policies, RBAC, storage bucket, and seed data.
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Drop existing triggers and functions to allow clean idempotent re-runs
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;
DROP TRIGGER IF EXISTS trg_sync_product_inventory ON public.products;
DROP TRIGGER IF EXISTS trg_decrement_inventory_on_order ON public.order_items;
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS set_categories_updated_at ON public.categories;
DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
DROP TRIGGER IF EXISTS set_orders_updated_at ON public.orders;
DROP TRIGGER IF EXISTS set_cart_items_updated_at ON public.cart_items;
DROP TRIGGER IF EXISTS set_addresses_updated_at ON public.addresses;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.prevent_role_escalation() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.sync_product_inventory() CASCADE;
DROP FUNCTION IF EXISTS public.decrement_inventory_on_order() CASCADE;
DROP FUNCTION IF EXISTS public.track_guest_order(text, text) CASCADE;

-- ------------------------------------------------------------------------------
-- 3. PROFILES TABLE (Customers & Admins)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    email TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    is_super_admin BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_super_admin ON public.profiles(is_super_admin);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ------------------------------------------------------------------------------
-- 4. SECURITY DEFINER HELPERS: is_admin() & is_super_admin()
-- Evaluates database status authoritatively without client-side spoofing.
-- STABLE + SECURITY DEFINER ensures zero infinite recursion in RLS.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_super_admin(check_uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = check_uid AND is_super_admin = true
    );
$$;

CREATE OR REPLACE FUNCTION public.is_admin(check_uid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = check_uid AND (role = 'admin' OR is_super_admin = true)
    );
$$;

-- ------------------------------------------------------------------------------
-- 5. TRIGGER: handle_new_user()
-- HARDENED: Defaults newly registered users to 'customer' role and is_super_admin = false.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, phone, role, is_super_admin)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone),
        'customer',
        false
    )
    ON CONFLICT (id) DO UPDATE
    SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
        role = public.profiles.role,
        is_super_admin = public.profiles.is_super_admin;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 6. TRIGGERS: prevent_role_escalation() & prevent_super_admin_deletion()
-- Strict server-side / database-side enforcement:
-- 1. Only Super Admin can manage admin roles (normal admins CANNOT change roles).
-- 2. Normal admins cannot modify, demote, delete, or impersonate the Super Admin.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- 1. Protect Super Admin from demotion or privilege removal
    IF (OLD.is_super_admin = true) THEN
        IF (NEW.is_super_admin = false OR NEW.role <> 'admin') THEN
            RAISE EXCEPTION 'Security Violation: Super Admin status cannot be revoked, demoted, or altered.';
        END IF;
        -- Prevent impersonation: email and ID cannot be altered on a Super Admin record
        IF (NEW.email IS DISTINCT FROM OLD.email OR NEW.id IS DISTINCT FROM OLD.id) THEN
            RAISE EXCEPTION 'Security Violation: Super Admin account cannot be renamed, transferred, or impersonated.';
        END IF;
    END IF;

    -- 2. Prevent non-super-admins from granting Super Admin status
    IF (NEW.is_super_admin = true AND OLD.is_super_admin = false AND NOT public.is_super_admin()) THEN
        RAISE EXCEPTION 'Security Violation: Only an existing Super Admin can grant Super Admin privileges.';
    END IF;

    -- 3. ONLY THE SUPER ADMIN CAN MANAGE ADMIN ROLES:
    -- If role is changing, caller MUST be a verified Super Admin (NOT just a normal admin)
    IF (NEW.role IS DISTINCT FROM OLD.role) THEN
        IF NOT public.is_super_admin() THEN
            RAISE EXCEPTION 'Privilege Escalation Blocked: Only the Super Admin can assign or modify administrator roles. Normal administrators do not have permission.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_escalation
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();

CREATE OR REPLACE FUNCTION public.prevent_super_admin_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF OLD.is_super_admin = true THEN
        RAISE EXCEPTION 'Security Violation: The Super Admin account is permanently protected and cannot be deleted.';
    END IF;
    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_super_admin_deletion ON public.profiles;
CREATE TRIGGER trg_prevent_super_admin_deletion
    BEFORE DELETE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.prevent_super_admin_deletion();

-- ------------------------------------------------------------------------------
-- 6B. SECURITY DEFINER RPC: manage_user_role()
-- Authoritative database-level role management:
-- Strictly enforces that only a Super Admin can promote/revoke admin roles.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.manage_user_role(
    target_user_id UUID DEFAULT NULL,
    target_email TEXT DEFAULT NULL,
    new_role TEXT DEFAULT 'customer'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    caller_uid UUID;
    caller_is_super BOOLEAN;
    target_is_super BOOLEAN;
    matched_profile_id UUID;
BEGIN
    caller_uid := auth.uid();
    caller_is_super := public.is_super_admin(caller_uid);

    -- STRICT DATABASE CHECK: Only Super Admin can manage roles
    IF NOT caller_is_super THEN
        RAISE EXCEPTION 'Access Denied: Only the Super Admin can manage administrator roles. Normal admins do not possess this capability.';
    END IF;

    IF new_role NOT IN ('customer', 'admin') THEN
        RAISE EXCEPTION 'Invalid role: must be customer or admin.';
    END IF;

    -- Locate target profile
    SELECT id, is_super_admin INTO matched_profile_id, target_is_super
    FROM public.profiles
    WHERE (target_user_id IS NOT NULL AND id = target_user_id)
       OR (target_email IS NOT NULL AND lower(email) = lower(trim(target_email)))
    LIMIT 1;

    -- Check if target is a Super Admin
    IF target_is_super AND new_role <> 'admin' THEN
        RAISE EXCEPTION 'Security Violation: Super Admin cannot be demoted or revoked.';
    END IF;

    IF matched_profile_id IS NOT NULL THEN
        UPDATE public.profiles
        SET role = new_role,
            updated_at = timezone('utc'::text, now())
        WHERE id = matched_profile_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'target_id', matched_profile_id,
        'role', new_role
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 7. CATEGORIES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories(is_active);

-- ------------------------------------------------------------------------------
-- 8. PRODUCTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    short_description TEXT,
    sku TEXT UNIQUE,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    compare_price NUMERIC(12, 2) CHECK (compare_price IS NULL OR compare_price >= 0),
    discount_percentage INTEGER DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    low_stock_threshold INTEGER NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
    brand TEXT DEFAULT 'ZenMart Curated',
    rating NUMERIC(3, 2) DEFAULT 5.00 CHECK (rating >= 0 AND rating <= 5.00),
    review_count INTEGER DEFAULT 0 CHECK (review_count >= 0),
    is_featured BOOLEAN DEFAULT false,
    is_best_seller BOOLEAN DEFAULT false,
    is_new BOOLEAN DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);

-- ------------------------------------------------------------------------------
-- 9. PRODUCT IMAGES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    sort_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);

-- ------------------------------------------------------------------------------
-- 10. PRODUCT VARIANTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    value TEXT NOT NULL,
    price_adjustment NUMERIC(12, 2) NOT NULL DEFAULT 0,
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    sku TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);

-- ------------------------------------------------------------------------------
-- 11. INVENTORY TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    available_quantity INTEGER GENERATED ALWAYS AS (GREATEST(0, quantity - reserved_quantity)) STORED,
    low_stock_threshold INTEGER NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON public.inventory(product_id);

-- Sync inventory table on product stock insertion/updates
CREATE OR REPLACE FUNCTION public.sync_product_inventory()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.inventory (product_id, quantity, low_stock_threshold)
    VALUES (NEW.id, NEW.stock_quantity, NEW.low_stock_threshold)
    ON CONFLICT (product_id) DO UPDATE
    SET
        quantity = EXCLUDED.quantity,
        low_stock_threshold = EXCLUDED.low_stock_threshold,
        updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_product_inventory
    AFTER INSERT OR UPDATE OF stock_quantity, low_stock_threshold ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.sync_product_inventory();

-- ------------------------------------------------------------------------------
-- 12. ORDERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    shipping_address TEXT NOT NULL,
    city TEXT NOT NULL,
    area TEXT,
    delivery_method TEXT NOT NULL DEFAULT 'Express Courier',
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    delivery_charge NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (delivery_charge >= 0),
    discount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    payment_method TEXT NOT NULL DEFAULT 'cod',
    payment_status TEXT NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid', 'Failed', 'Refunded')),
    order_status TEXT NOT NULL DEFAULT 'Pending' CHECK (order_status IN ('Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON public.orders(phone);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- ------------------------------------------------------------------------------
-- 13. ORDER ITEMS TABLE (Snapshot of product details at time of purchase)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_image TEXT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    total_price NUMERIC(12, 2) NOT NULL CHECK (total_price >= 0),
    variant_information JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- Decrement product stock when order item is created
CREATE OR REPLACE FUNCTION public.decrement_inventory_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.product_id IS NOT NULL THEN
        UPDATE public.products
        SET stock_quantity = GREATEST(0, stock_quantity - NEW.quantity)
        WHERE id = NEW.product_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_decrement_inventory_on_order
    AFTER INSERT ON public.order_items
    FOR EACH ROW EXECUTE FUNCTION public.decrement_inventory_on_order();

-- ------------------------------------------------------------------------------
-- 14. PAYMENTS TABLE (Explicit UUID for user_id)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    provider TEXT NOT NULL DEFAULT 'cod',
    transaction_id TEXT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid', 'Failed', 'Refunded')),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);

-- ------------------------------------------------------------------------------
-- 15. CART ITEMS TABLE (Database-backed cart for authenticated users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);

-- ------------------------------------------------------------------------------
-- 16. WISHLISTS & WISHLIST ITEMS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.wishlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (wishlist_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist_id ON public.wishlist_items(wishlist_id);

-- ------------------------------------------------------------------------------
-- 17. REVIEWS TABLE (Explicit UUID for user_id)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    author_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    is_verified_purchase BOOLEAN NOT NULL DEFAULT false,
    is_approved BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON public.reviews(is_approved);

-- ------------------------------------------------------------------------------
-- 18. COUPONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
    minimum_order NUMERIC(10, 2) DEFAULT 0,
    maximum_discount NUMERIC(10, 2),
    usage_limit INTEGER,
    used_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);

-- ------------------------------------------------------------------------------
-- 19. ADDRESSES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'Home',
    recipient_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address_line TEXT NOT NULL,
    city TEXT NOT NULL,
    area TEXT,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);

-- ------------------------------------------------------------------------------
-- 20. NOTIFICATIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'order_update',
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- ------------------------------------------------------------------------------
-- 21. SECURE RPC: track_guest_order()
-- Allows tracking by Order Number, Phone Number, or both (optional parameters).
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.track_guest_order(p_order_number TEXT DEFAULT NULL, p_phone TEXT DEFAULT NULL)
RETURNS SETOF public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
    clean_order TEXT;
    clean_phone TEXT;
BEGIN
    clean_order := NULLIF(lower(trim(COALESCE(p_order_number, ''))), '');
    clean_phone := NULLIF(replace(replace(trim(COALESCE(p_phone, '')), ' ', ''), '-', ''), '');

    -- At least one parameter must be provided
    IF clean_order IS NULL AND clean_phone IS NULL THEN
        RETURN;
    END IF;

    -- If BOTH provided, match both
    IF clean_order IS NOT NULL AND clean_phone IS NOT NULL THEN
        RETURN QUERY
        SELECT * FROM public.orders
        WHERE (lower(order_number) = clean_order OR id::text = clean_order)
          AND replace(replace(phone, ' ', ''), '-', '') LIKE '%' || right(clean_phone, 10)
        ORDER BY created_at DESC
        LIMIT 1;
        RETURN;
    END IF;

    -- If ONLY order number provided
    IF clean_order IS NOT NULL THEN
        RETURN QUERY
        SELECT * FROM public.orders
        WHERE lower(order_number) = clean_order OR id::text = clean_order
        ORDER BY created_at DESC
        LIMIT 1;
        RETURN;
    END IF;

    -- If ONLY phone number provided
    IF clean_phone IS NOT NULL THEN
        RETURN QUERY
        SELECT * FROM public.orders
        WHERE replace(replace(phone, ' ', ''), '-', '') LIKE '%' || right(clean_phone, 10)
        ORDER BY created_at DESC
        LIMIT 1;
        RETURN;
    END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- 22. AUTO-UPDATE TIMESTAMPS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_cart_items_updated_at BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_addresses_updated_at BEFORE UPDATE ON public.addresses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 23. ROW LEVEL SECURITY (RLS) POLICIES (Hardened & Audited)
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Clean existing policies for idempotency
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "categories_read_policy" ON public.categories;
DROP POLICY IF EXISTS "categories_admin_policy" ON public.categories;
DROP POLICY IF EXISTS "products_read_policy" ON public.products;
DROP POLICY IF EXISTS "products_admin_policy" ON public.products;
DROP POLICY IF EXISTS "product_images_read_policy" ON public.product_images;
DROP POLICY IF EXISTS "product_images_admin_policy" ON public.product_images;
DROP POLICY IF EXISTS "product_variants_read_policy" ON public.product_variants;
DROP POLICY IF EXISTS "product_variants_admin_policy" ON public.product_variants;
DROP POLICY IF EXISTS "inventory_select_policy" ON public.inventory;
DROP POLICY IF EXISTS "inventory_admin_policy" ON public.inventory;
DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_policy" ON public.orders;
DROP POLICY IF EXISTS "orders_update_policy" ON public.orders;
DROP POLICY IF EXISTS "order_items_select_policy" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert_policy" ON public.order_items;
DROP POLICY IF EXISTS "payments_select_policy" ON public.payments;
DROP POLICY IF EXISTS "payments_insert_policy" ON public.payments;
DROP POLICY IF EXISTS "payments_admin_policy" ON public.payments;
DROP POLICY IF EXISTS "cart_items_policy" ON public.cart_items;
DROP POLICY IF EXISTS "wishlists_policy" ON public.wishlists;
DROP POLICY IF EXISTS "wishlist_items_policy" ON public.wishlist_items;
DROP POLICY IF EXISTS "reviews_select_policy" ON public.reviews;
DROP POLICY IF EXISTS "reviews_insert_policy" ON public.reviews;
DROP POLICY IF EXISTS "reviews_admin_policy" ON public.reviews;
DROP POLICY IF EXISTS "coupons_select_policy" ON public.coupons;
DROP POLICY IF EXISTS "coupons_admin_policy" ON public.coupons;
DROP POLICY IF EXISTS "addresses_policy" ON public.addresses;
DROP POLICY IF EXISTS "notifications_policy" ON public.notifications;

-- PROFILES Policies
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_insert_policy" ON public.profiles
    FOR INSERT WITH CHECK (
        (auth.uid() = id AND role = 'customer')
        OR public.is_admin()
    );

CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- CATEGORIES Policies
CREATE POLICY "categories_read_policy" ON public.categories
    FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "categories_admin_policy" ON public.categories
    FOR ALL USING (public.is_admin());

-- PRODUCTS Policies
CREATE POLICY "products_read_policy" ON public.products
    FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "products_admin_policy" ON public.products
    FOR ALL USING (public.is_admin());

-- PRODUCT IMAGES Policies
CREATE POLICY "product_images_read_policy" ON public.product_images
    FOR SELECT USING (true);

CREATE POLICY "product_images_admin_policy" ON public.product_images
    FOR ALL USING (public.is_admin());

-- PRODUCT VARIANTS Policies
CREATE POLICY "product_variants_read_policy" ON public.product_variants
    FOR SELECT USING (true);

CREATE POLICY "product_variants_admin_policy" ON public.product_variants
    FOR ALL USING (public.is_admin());

-- INVENTORY Policies
CREATE POLICY "inventory_select_policy" ON public.inventory
    FOR SELECT USING (true);

CREATE POLICY "inventory_admin_policy" ON public.inventory
    FOR ALL USING (public.is_admin());

-- ORDERS Policies (HARDENED: No open SELECT for guest orders)
-- Authenticated customers can view ONLY their own orders. Admins view all orders.
-- Guest orders cannot be enumerated by third parties (guest tracking handled via track_guest_order RPC).
CREATE POLICY "orders_select_policy" ON public.orders
    FOR SELECT USING (
        (auth.uid() IS NOT NULL AND auth.uid() = user_id)
        OR public.is_admin()
    );

CREATE POLICY "orders_insert_policy" ON public.orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "orders_update_policy" ON public.orders
    FOR UPDATE USING (public.is_admin());

-- ORDER ITEMS Policies
CREATE POLICY "order_items_select_policy" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id
            AND ((auth.uid() IS NOT NULL AND o.user_id = auth.uid()) OR public.is_admin())
        )
    );

CREATE POLICY "order_items_insert_policy" ON public.order_items
    FOR INSERT WITH CHECK (true);

-- PAYMENTS Policies
CREATE POLICY "payments_select_policy" ON public.payments
    FOR SELECT USING (
        (auth.uid() IS NOT NULL AND auth.uid() = user_id)
        OR public.is_admin()
    );

CREATE POLICY "payments_insert_policy" ON public.payments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "payments_admin_policy" ON public.payments
    FOR ALL USING (public.is_admin());

-- CART ITEMS Policies (Strict user ownership)
CREATE POLICY "cart_items_policy" ON public.cart_items
    FOR ALL USING (auth.uid() = user_id OR public.is_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- WISHLISTS Policies
CREATE POLICY "wishlists_policy" ON public.wishlists
    FOR ALL USING (auth.uid() = user_id OR public.is_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "wishlist_items_policy" ON public.wishlist_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.wishlists w
            WHERE w.id = wishlist_items.wishlist_id
            AND (w.user_id = auth.uid() OR public.is_admin())
        )
    );

-- REVIEWS Policies
CREATE POLICY "reviews_select_policy" ON public.reviews
    FOR SELECT USING (is_approved = true OR public.is_admin());

CREATE POLICY "reviews_insert_policy" ON public.reviews
    FOR INSERT WITH CHECK (
        (auth.uid() IS NOT NULL AND auth.uid() = user_id)
        OR public.is_admin()
    );

CREATE POLICY "reviews_admin_policy" ON public.reviews
    FOR ALL USING (public.is_admin());

-- COUPONS Policies
CREATE POLICY "coupons_select_policy" ON public.coupons
    FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "coupons_admin_policy" ON public.coupons
    FOR ALL USING (public.is_admin());

-- ADDRESSES Policies
CREATE POLICY "addresses_policy" ON public.addresses
    FOR ALL USING (auth.uid() = user_id OR public.is_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- NOTIFICATIONS Policies
CREATE POLICY "notifications_policy" ON public.notifications
    FOR ALL USING (auth.uid() = user_id OR public.is_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 24. SUPABASE STORAGE BUCKET: product-images
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('product-images', 'product-images', true)
        ON CONFLICT (id) DO UPDATE SET public = true;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
        DROP POLICY IF EXISTS "Public product-images access" ON storage.objects;
        DROP POLICY IF EXISTS "Admin product-images upload" ON storage.objects;

        CREATE POLICY "Public product-images access" ON storage.objects
            FOR SELECT USING (bucket_id = 'product-images');

        CREATE POLICY "Admin product-images upload" ON storage.objects
            FOR ALL USING (bucket_id = 'product-images' AND (auth.role() = 'authenticated' OR public.is_admin()));
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 25. SEED DATA (Bangladeshi Taka BDT ৳, Curated Products & Real Categories)
-- ------------------------------------------------------------------------------

-- Seed Categories
INSERT INTO public.categories (id, name, slug, description, image_url, sort_order)
VALUES
('c0000000-0000-0000-0000-000000000001', 'Electronics', 'electronics', 'Fast multiport chargers, noise cancelling gear, adapters', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBy5F9dzBRUvCPPsodcaxnm7ub6azL6LYtJwHFXqNXghtZY_8B-OpJULuuPGyG6Z_DqfdStQQVnVMsvop_aB8BREVvePn_B4TtlUTJBQY6kLAg14hQytuXDhZ50euV682ui9l47vfpHgvuwLUAQj38zgavi9G3Jd225gW70_PGxIS1pdi3RSj7RTaSnjgTd_l5y2fKtZTcVHCHXilcbF6rQ5A6Q-aBPpV_sXUfHmXllgPllgHq9dVuz', 1),
('c0000000-0000-0000-0000-000000000002', 'Smart Gadgets', 'smart-gadgets', 'Smart wearables, health tracking rings, smart home hub', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBThQrvI3MVRqkIiz4oq2cAh9fw2cOuOwGuhzd4bf0MzEHmnQ-EUqjmLGTpagBJedzSJVhSuHyBfYSUwNM0xRDKPhncKSbAbXjRnAAHjbf2tLIbMNUDX9yWwl9-E2adXijm2QASZUgCWcJ31QToZ0SjadsALgx9pr7Ry7HKMudXfJ3cAQjMTCRzxl8dVgdNX9f8HDvA9HLIzO8DUxuUzDTqVqbYnwNNK0503JhvbUM6NCtMaR6cTNaJ', 2),
('c0000000-0000-0000-0000-000000000003', 'Home & Decor', 'home-decor', 'Nordic ceramic hollow vases, minimalist sculptures', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdCI6-5JbiuE86_6TjwsqFlIfcBHmxlHXHO_4-mw8eotOo5bBeon30-vRpqtFGeHdZVpdl7F7a0oaG1mmmndBDx8Hw1Mh5YdqNj4SikCL07shCIRQ3CO6_aGqi6lw5NER93vaIDB-TaIQPjs31Wik02SP5GjZ8JhfNZePNsUgk9PjO8owa_zdWGpSytWwXcxWezU5cFSmAj5cANdN4Vr8DkgWsVKJDgnzDxOp6FLQA8xP7V71W107O', 3),
('c0000000-0000-0000-0000-000000000004', 'Mobile Accessories', 'mobile-accessories', '3-in-1 MagSafe fast stands, Kevlar braided cables', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQ55lnlWPB6gI-17HYtHtnTIvGyUln_heYaUuGhWCsO7pMDVzjyre1Ndgpl5sS6uB72vHIGq5e9lDYLHOaYc-EkJUXlMh4lxFJ2Pj6lxuKJKuSOrzzvWCKkdb7dkTL-Vwg3FwfWkkAdgaruAG9gSDyzixOy19wshQc_4CIUZ1uMq9x4e8D-YWZ5AHKz5F64MKUYgxe98vXEa-pKKKmRrnapwO3Qj3_Aq6ACHHahdtDGR15eJkW6AST', 4),
('c0000000-0000-0000-0000-000000000005', 'Audio & Sound', 'audio-sound', 'Hi-Fi waterproof portable speakers, studio monitors', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAo3gsTIeOFu5K7-k_p4Vxdxchv0I0ur1lVhZcSxWznF_O7v0usa48zIh1H328aioZaXajrn-7JBfbRUc8ISXonSr8kLSo_RK_fGiM8hlFPNYwN2R4qOvEQJi5vUpiW6MmAxF_OIIlVX1fObez3SS0TplDEeqRehVAx89fDg0aGcTD_awT6n84MORM-BGonuBn8nWdS1ApGYqBzHpbLbm3fVLlVQ1O22WOGxzHH26-Iks1bo_beVQDo', 5),
('c0000000-0000-0000-0000-000000000006', 'Kitchen Essentials', 'kitchen-essentials', 'Smart digital temperature kettles, coffee grinders', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvra6uRGvlveFB99MnW_u0XvJ5ZPux-v5Ux5D3TG2skqE5UNBYLwNIB2LPFtFjKWUjeBzTQFvtIKURbFcmHvjSUD9rxVUIDN9KYKwa1Ti1069_Pk5WlY4vBWDBGxJ0DFlgQTThvseJ1OYah8eiRKDQ2Av3aNJA8c-CIQUFTShLf7MmLHNzkZeLkHmebXn-2tbil8fIam8AWdLpudApC1mc8MVhBSOiHFKpyzaNermHDJIU0WIQKOkQ', 6),
('c0000000-0000-0000-0000-000000000007', 'Office & Lifestyle', 'office-lifestyle', 'Aluminum laptop risers, vegan leather desk pads', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIcXzPloAOkoPgkoPx98SLXDV4jiTM8aeix4Nax7XSHpbe7Vw6ALAtAA_6sazzE_mbpC2JdCsClcZ6juXtmpNjq5isdbZQl3f_HlIeOtzxBQqzYqq5THj2zOfGEMur2asSym3Uy5BvmVotAXxASXQIVkYg4WK_3mDISVuzj11MnwDeyPqHaxpqK3RJqzTCdW2rylJbqcoIMPpxkREgcpo5ntomN26l1Kgu9KsiScpUk0PRQP_u9Lfd', 7),
('c0000000-0000-0000-0000-000000000008', 'New Arrivals', 'new-arrivals', 'Suspended magnetic levitation gadgets, kinetic art', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAgWm0g5LqsfyFBmtp2ZevQlUYvVZPhjo7CIsElwCpN7ehVbLINvltO7MGWV-4tkb5C2dBwwfIX1qircLpdC5mz7rCkSD5CkwMQO4eviBON1k9SE96Wu_3x-1WOnsLrHSNY6S0IOWvAVDGV0hQRkB43Mu5WBjkxk8yaDR4m-nVX-6ca53ZhNo200gASLqbMBoERFmUgLKp6uy0Z2EC-g4Iyvm-sbRoN35pxFA1_90a1Rztk5Z1T80R_', 8)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    image_url = EXCLUDED.image_url;

-- Seed 20 Products (Valid Hexadecimal RFC4122 UUIDs)
INSERT INTO public.products
(id, category_id, name, slug, brand, sku, price, compare_price, discount_percentage, stock_quantity, low_stock_threshold, rating, review_count, is_featured, is_best_seller, is_new, is_active, description, short_description)
VALUES
-- 1. Spotlight Product
('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000007', 'Minimalist Magnetic Desk Lamp', 'minimalist-magnetic-desk-lamp', 'Workspace Pro', 'ZMB-LMP-01', 2450, 3200, 23, 18, 5, 4.9, 240, true, true, false, true,
 'Asymmetric Optical Design with zero screen glare, magnetic 360° pivot mount, touch stepless dimming, and warm-to-cool CCT control. Built for long night work sessions in Bangladesh with 2400mAh backup battery.',
 'Asymmetric Optical Design • Zero Screen Glare'),

-- 2. TWS Earbuds
('a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000005', 'TWS Earbuds Pro Edition', 'tws-earbuds-pro-edition', 'Audio Pro', 'ZMB-AUD-02', 1590, 1990, 20, 42, 5, 4.8, 120, true, true, false, true,
 'Active Noise Cancellation, deep bass resonance, 32-hour playback battery life with pocket charging case, and dual ENC microphone for crystal-clear calls in busy traffic.',
 'ANC Active Noise Cancelling • 32h Battery Life'),

-- 3. Smart Watch Series 8
('a0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'Smart Watch Series 8', 'smart-watch-series-8', 'Smart Wear', 'ZMB-WCH-03', 2990, 3500, 15, 15, 5, 4.7, 85, true, true, false, true,
 'Vivid 1.95-inch AMOLED color touch screen, real-time heart rate and SpO2 health tracking, Bluetooth calling with loud built-in speaker, and 100+ customizable watch faces with Bangla font support.',
 'AMOLED Curved Display • Bluetooth Calling BD'),

-- 4. LED Desk Lamp Touch Control
('a0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000007', 'LED Desk Lamp Touch Control', 'led-desk-lamp-touch-control', 'Desk Setup', 'ZMB-LMP-04', 1190, 1490, 20, 29, 5, 4.8, 64, true, false, false, true,
 'Minimalist foldable LED desk lamp with smooth white aluminum arm, warm-to-cool touch dimming, and eye-friendly flicker-free emission. Ideal for study and remote work setups.',
 'Foldable Arm • 5 Brightness Levels'),

-- 5. Portable BT Speaker HD
('a0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000005', 'Portable BT Speaker HD', 'portable-bt-speaker-hd', 'Audio & Sound', 'ZMB-SPK-05', 1490, 1990, 25, 22, 5, 4.7, 96, true, true, false, true,
 'Cylindrical outdoor portable waterproof bluetooth speaker in forest green finish with rugged tactile lanyard clip and punchy passive bass radiators.',
 'IPX7 Waterproof • Deep Bass Sound'),

-- 6. Floating Plant Pot Bonsai
('a0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000003', 'Floating Plant Pot Bonsai', 'floating-plant-pot-bonsai', 'Home Decor', 'ZMB-DEC-06', 3250, 3950, 18, 8, 3, 4.6, 42, true, true, false, true,
 'Magnetic levitating geometric plant pot floating in midair with a slow serene rotation above a dark walnut finish base. A mesmerizing centerpiece for living rooms or executive desks.',
 'Magnetic Levitation • 360° Slow Rotation'),

-- 7. WiFi Security Camera 360°
('a0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000002', 'WiFi Security Camera 360°', 'wifi-security-camera-360', 'Security & Smart', 'ZMB-CAM-07', 2190, 2690, 18, 31, 5, 4.7, 58, true, true, false, true,
 'Modern indoor 360 pan-tilt smart WiFi security camera with full 2K resolution, infrared night vision, two-way intercom audio, and instant AI motion alert to your smartphone.',
 '2K Resolution • AI Motion Tracking'),

-- 8. MagSafe 3-in-1 Fast Wireless Station
('a0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000004', 'MagSafe 3-in-1 Fast Wireless Station', 'magsafe-3-in-1-fast-wireless-station', 'PowerTech', 'ZMB-CHG-08', 2650, 3200, 17, 19, 5, 4.9, 77, true, true, false, true,
 'Charge your iPhone, Apple Watch, and AirPods simultaneously on a single streamlined anodized aluminum dock with weighted non-slip silicone base.',
 '15W MagSafe Fast Alignment • Multi-Device'),

-- 9. Levitating Moon Lamp 3D Touch
('a0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000008', 'Levitating Moon Lamp 3D Touch', 'levitating-moon-lamp-3d-touch', 'ZenHome', 'ZMB-LMP-09', 3600, 4500, 20, 12, 3, 4.8, 38, true, false, true, true,
 'Suspended magnetic levitation moon lamp 3D printed with NASA satellite topography. Rotates gently in dark rooms with warm amber and cool white touch illumination.',
 '3D Printed Moon Surface • Magnetic Suspension'),

-- 10. Nordic Hollow Ceramic Donut Vase
('a0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000003', 'Nordic Hollow Ceramic Donut Vase', 'nordic-hollow-ceramic-donut-vase', 'ScandiLiving', 'ZMB-VAS-10', 1450, 1850, 21, 24, 5, 4.9, 52, false, true, false, true,
 'Matte sandstone ceramic donut centerpiece for dry pampas grass, minimalist dining tables, and bookshelf styling.',
 'Handcrafted Sandstone Matte Ceramic'),

-- 11. Anodized Aluminum Laptop Riser
('a0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000007', 'Anodized Aluminum Laptop Riser', 'anodized-aluminum-laptop-riser', 'Workspace Pro', 'ZMB-STN-11', 1850, 2300, 19, 35, 5, 4.8, 63, false, false, false, true,
 'Heavy-duty ergonomic laptop elevation stand crafted from 4mm aerospace-grade aluminum. Dissipates heat naturally and adjusts up to eye level.',
 'Ergonomic Neck Relief • Dual Axis Adjust'),

-- 12. Smart Constant Temp Electric Kettle
('a0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000006', 'Smart Constant Temp Electric Kettle', 'smart-constant-temp-electric-kettle', 'BrewCraft', 'ZMB-KTL-12', 2850, 3400, 16, 14, 4, 4.7, 33, false, false, false, true,
 'Digital gooseneck pouring kettle with 1-degree precision digital thermostat, OLED temperature display, and 60-minute warm keep function for pour-over coffee.',
 'Precision Gooseneck Spout • OLED Display'),

-- 13. 65W GaN Multiport Fast Charger
('a0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000001', '65W GaN Multiport Fast Charger', '65w-gan-multiport-fast-charger', 'PowerTech', 'ZMB-CHG-13', 1750, 2200, 20, 50, 8, 4.9, 114, false, true, false, true,
 'Compact Gallium Nitride (GaN 5) pocket wall charger with dual Type-C PD 65W + USB-A ports. Powers MacBook, iPad, and Galaxy / iPhone at maximum speed.',
 'Compact GaN Technology • 3 Simultaneous Ports'),

-- 14. Retro Mechanical Calculator & Numpad
('a0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000000007', 'Retro Mechanical Calculator & Numpad', 'retro-mechanical-calculator-numpad', 'TypeCraft', 'ZMB-CAL-14', 1650, 2100, 21, 16, 4, 4.8, 29, false, false, true, true,
 'Dot-matrix typewriter tactile blue switches with mechanical clicking feedback and large LCD 12-digit display.',
 'Tactile Clicky Keys • Retro Aesthetic'),

-- 15. Smart Body Composition Scale
('a0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000000002', 'Smart Body Composition Scale', 'smart-body-composition-scale', 'Smart Wear', 'ZMB-SCL-15', 1890, 2400, 21, 20, 5, 4.7, 48, false, false, false, true,
 'BIA high precision bio-impedance sensors calculating 14 essential body metrics including BMI, Body Fat %, Muscle Mass, and hydration syncing to Apple Health and Google Fit.',
 '14 Body Metrics • Bluetooth Health Sync'),

-- 16. Handheld Garment Steamer Pro
('a0000000-0000-0000-0000-000000000016', 'c0000000-0000-0000-0000-000000000006', 'Handheld Garment Steamer Pro', 'handheld-garment-steamer-pro', 'Home Comfort', 'ZMB-STM-16', 2250, 2800, 19, 17, 5, 4.6, 31, false, false, false, true,
 '1200W high-pressure continuous steam flow eliminates wrinkles from Panjabis, shirts, and curtains in seconds. 15-second instant heating.',
 '15s Rapid Heat • 99% Bacteria Sanitization'),

-- 17. Waterproof Leather Desk Mat (80x40cm)
('a0000000-0000-0000-0000-000000000017', 'c0000000-0000-0000-0000-000000000007', 'Waterproof Leather Desk Mat', 'waterproof-leather-desk-mat', 'ZenWorkspace', 'ZMB-MAT-17', 790, 1100, 28, 60, 10, 4.9, 142, false, true, false, true,
 'Dual-sided waterproof vegan PU leather pad protecting desks from scratches, coffee spills, and heat while providing smooth mouse glide.',
 '80x40cm Extended Size • Spill-proof Surface'),

-- 18. RGB Flowing Ambient Lightbar
('a0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000008', 'RGB Flowing Ambient Lightbar', 'rgb-flowing-ambient-lightbar', 'ZenGlow', 'ZMB-LGT-18', 1990, 2600, 23, 11, 4, 4.8, 67, true, false, true, true,
 'Music beat audio synchronizing 32-bit ARM microprocessor lightbar with 16 million colors and fluid lighting effects for gaming and streaming setups.',
 'Sound Reactive • 32 Built-in Color Modes'),

-- 19. USB-C 10-in-1 Aluminum Hub
('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'USB-C 10-in-1 Aluminum Hub', 'usb-c-10-in-1-aluminum-hub', 'PowerTech', 'ZMB-HUB-19', 3150, 3900, 19, 15, 4, 4.8, 44, false, false, false, true,
 'Dual 4K HDMI ports, Gigabit Ethernet RJ45, 100W PD passthrough, SD/TF card reader, and high-speed USB 3.0 ports in heat-resistant space gray casing.',
 'Dual 4K HDMI • 100W Power Delivery'),

-- 20. Smart Wi-Fi Aroma Diffuser
('a0000000-0000-0000-0000-000000000020', 'c0000000-0000-0000-0000-000000000003', 'Smart Wi-Fi Aroma Diffuser', 'smart-wifi-aroma-diffuser', 'ScandiLiving', 'ZMB-DIF-20', 2150, 2700, 20, 23, 5, 4.7, 36, false, false, false, true,
 'Ultrasonic cool mist essential oil humidifier with ambient LED mood rings. Compatible with Alexa, Google Home, and Tuya Smart app timers.',
 'Ultrasonic Quiet Mist • App Scheduled')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    price = EXCLUDED.price,
    compare_price = EXCLUDED.compare_price,
    stock_quantity = EXCLUDED.stock_quantity;

-- Seed Product Images
INSERT INTO public.product_images (product_id, image_url, sort_order)
VALUES
('a0000000-0000-0000-0000-000000000001', 'https://lh3.googleusercontent.com/aida-public/AB6AXuC96IcUllXRJ_etoe45xIxiZuWT2LAOQPlkgFbtmrusMbUlNyEU88E87mC6t6w-YdhvPbhmZgD9AijePARrNoUA-27CbZDAvlAESQZslAjf5zGHsXexUj73oOjRi5iHTb7o1Mp2ckWuNZ4GbMVjggmbonetSdP7vF1zvzfDImqzylNzFpeFxsQm_enTZBixa_uEhwXRSSBWBJYHwrXqnll6nzM-2U5c63i107mQAXYtb1VEqPNKATq6', 1),
('a0000000-0000-0000-0000-000000000002', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQ4lyElh-WbhtPVci4VIGZAo9rWLdkH6T_jNfjSR1Gbp8jDMPR-pqnotCeAF2MrChslV_fNd-2DdoUyaluy1KlcnsKGr9kazSuAON57n9PXQerrSrNZDpr1eVyzqHYg-Sq2tBR34J9TyCpynMbPvR6JqiSqqAbRJxsTlbOyhkMYF53SniDSvHYackVqWJLFFVAvnKkgmdpNq-Ahuu5kcGVl9HXikir85dNd24OuOY7D-dsUSmlR_6n', 1),
('a0000000-0000-0000-0000-000000000003', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyAkSX0IAXdxrslX3eEf-6uhMFH5lRvoPr2HNU5kPNDCU8OG8sQFChHQn8Jf5Zr3AVUvy9iwc7HgMlB2D9_ttLKe-yRW0hVpKTywqZghR9WAvDK7pkoPsLi3D_qFk-mufye1vZgSAngktDCDISOlmHMeQoQ95YBtFgSqlGNDrFZA0gNdfNdINRNRDEljUzCMEuQtmCbo7xoDXcRpoXPOQTZxDM_fDCxXqmUmwdPec74OrtgZEdh6N9', 1),
('a0000000-0000-0000-0000-000000000004', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBRy62XtB8py22IVpEJ4s_QTMAF3rV4QwSsTRG-kFwYFAElAZiMD7nUkudjdhMNDdnyHFAPDu91VO3eWBiKGXJRDORDUYO_WYWt_04m3fD7z6rxR3T2q4MTKeIt4wAvcbEUBev3aKv0xf-PjmsnqHPBpoET2mRYinGccQCFbW_qbnJwZE5W66IwIN4X9HPEnw413CWTtO1VIx4Pna2XflqWDYVoeKZXbGp-dSDfhoIkDUGN62Y5wO6k', 1),
('a0000000-0000-0000-0000-000000000005', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBHyTsQ5YSkboL03djGWw1584J8PRjbiqWXEi2aoffW53mr7TdAEgi9l1cD7ZEhHIwFm99oCi3N0hVPZ2TWGnd7bwttg0avjYSpWZKR3Ooe04oHxcy2gnflVc8qYZr4acI_9-G4cseJQQwSc_rqpb2MAB0L0U69vaJY7igjYRlMEntxqOuVdhsWf7n8TsZKtyvqTGxm2hokHJXV0JTzAo-j-ZjCYVPPqRMp5XZLq6GuLYkcWvUlj3ha', 1),
('a0000000-0000-0000-0000-000000000006', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgSET7H7anXXx72YXTWgdaXPQkWrwg1aIrlO2v2iXLqMwsKiJPvhFG2zgTXUeXqBcbpljPc_FGD0u8obzA-tfqLog7VE2xeAitIpLiFnHJ6NCGaaDdqfDwMSc2YOzqyr0eivEO4ouENq5iIv8eBqzKo4-DwWYiCYx_V6SGIpcf0Xzvau3ISuoSfC2hk3KCIddvW_TZ58HCV5Zs-2UtC261U83ypiYEtYsTyUhx-wOru5aTGm2T_PDc', 1),
('a0000000-0000-0000-0000-000000000007', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDGrR0qHGrce5EfkvUXD9AV1D28eIMI0o1zX4jfhHzu1QWwUv0eFfu3YmX5XRtobB0k9DLUaVwvZyOZardNeMSzgLk-emBRhTIkoA8gjFZ4MmrCi1t374aMnmwr3jzRbhpAQwuutH4LXZ0VrzAIfFrNixGJC8RPFWmDITGE3_h9aSw8lDJZRkbxca5a4-7vfMxSAsJdmXFEVcu94ufzDhGfL6X483m9SslZpkbkwU-ugRcepGnuDvIz', 1),
('a0000000-0000-0000-0000-000000000008', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQ55lnlWPB6gI-17HYtHtnTIvGyUln_heYaUuGhWCsO7pMDVzjyre1Ndgpl5sS6uB72vHIGq5e9lDYLHOaYc-EkJUXlMh4lxFJ2Pj6lxuKJKuSOrzzvWCKkdb7dkTL-Vwg3FwfWkkAdgaruAG9gSDyzixOy19wshQc_4CIUZ1uMq9x4e8D-YWZ5AHKz5F64MKUYgxe98vXEa-pKKKmRrnapwO3Qj3_Aq6ACHHahdtDGR15eJkW6AST', 1),
('a0000000-0000-0000-0000-000000000009', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAgWm0g5LqsfyFBmtp2ZevQlUYvVZPhjo7CIsElwCpN7ehVbLINvltO7MGWV-4tkb5C2dBwwfIX1qircLpdC5mz7rCkSD5CkwMQO4eviBON1k9SE96Wu_3x-1WOnsLrHSNY6S0IOWvAVDGV0hQRkB43Mu5WBjkxk8yaDR4m-nVX-6ca53ZhNo200gASLqbMBoERFmUgLKp6uy0Z2EC-g4Iyvm-sbRoN35pxFA1_90a1Rztk5Z1T80R_', 1),
('a0000000-0000-0000-0000-000000000010', 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80', 1),
('a0000000-0000-0000-0000-000000000011', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=80', 1),
('a0000000-0000-0000-0000-000000000012', 'https://images.unsplash.com/photo-1517668808822-9ebb02ae2a0e?auto=format&fit=crop&w=600&q=80', 1),
('a0000000-0000-0000-0000-000000000013', 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80', 1),
('a0000000-0000-0000-0000-000000000014', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80', 1),
('a0000000-0000-0000-0000-000000000015', 'https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=600&q=80', 1),
('a0000000-0000-0000-0000-000000000016', 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80', 1),
('a0000000-0000-0000-0000-000000000017', 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=600&q=80', 1),
('a0000000-0000-0000-0000-000000000018', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80', 1),
('a0000000-0000-0000-0000-000000000019', 'https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=600&q=80', 1),
('a0000000-0000-0000-0000-000000000020', 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80', 1)
ON CONFLICT (id) DO NOTHING;

-- Seed Coupons
INSERT INTO public.coupons (code, discount_type, discount_value, minimum_order, is_active)
VALUES
('ZENMART10', 'percentage', 10.00, 1000.00, true),
('ZEN10', 'percentage', 10.00, 500.00, true),
('EIDVIBES', 'fixed', 250.00, 2000.00, true),
('FREESHIP', 'fixed', 60.00, 800.00, true)
ON CONFLICT (code) DO NOTHING;

-- Seed Verified Reviews
INSERT INTO public.reviews (product_id, author_name, rating, comment, is_verified_purchase, is_approved)
VALUES
('a0000000-0000-0000-0000-000000000001', 'Tahmid Hossain (Dhanmondi, Dhaka)', 5, 'The magnetic desk lamp is phenomenal! Zero glare on my monitor during late night coding sessions. Pathao delivered in 24 hours.', true, true),
('a0000000-0000-0000-0000-000000000002', 'Farhana Yasmin (Uttara, Dhaka)', 5, 'TWS Earbuds Pro bass is super punchy. Battery easily lasts 3 days for my commutes. Best gadget buy this year.', true, true),
('a0000000-0000-0000-0000-000000000003', 'Zubair Al Mamun (Chittagong)', 5, 'Original packaging with 1-year warranty card included. Delivery person allowed me to check the product before paying.', true, true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 26. NOTIFY PostgREST to reload schema cache immediately
-- ------------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';

-- ------------------------------------------------------------------------------
-- 27. ADMIN ACTIVITY AUDIT LOGS (Immutable Security Logging)
-- Tracks all administrative actions: orders, catalog, stock, categories,
-- coupons, role changes, and auth.
-- Strictly append-only: No UPDATE or DELETE permitted.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id TEXT NOT NULL,
    admin_email TEXT NOT NULL,
    admin_name TEXT,
    is_super_admin BOOLEAN NOT NULL DEFAULT false,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    description TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_email ON public.admin_audit_logs(admin_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_type ON public.admin_audit_logs(target_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_id ON public.admin_audit_logs(target_id);

-- Immutable Trigger: Block any UPDATE or DELETE on audit logs
CREATE OR REPLACE FUNCTION public.prevent_audit_log_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RAISE EXCEPTION 'Security Violation: Audit logs are strictly immutable and cannot be updated or deleted.';
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_audit_log_update ON public.admin_audit_logs;
CREATE TRIGGER trg_prevent_audit_log_update
    BEFORE UPDATE ON public.admin_audit_logs
    FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_modification();

DROP TRIGGER IF EXISTS trg_prevent_audit_log_delete ON public.admin_audit_logs;
CREATE TRIGGER trg_prevent_audit_log_delete
    BEFORE DELETE ON public.admin_audit_logs
    FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_modification();

-- Enable RLS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view audit logs
DROP POLICY IF EXISTS "audit_logs_select_policy" ON public.admin_audit_logs;
CREATE POLICY "audit_logs_select_policy" ON public.admin_audit_logs
    FOR SELECT USING (public.is_admin());

-- System & admins can insert audit logs
DROP POLICY IF EXISTS "audit_logs_insert_policy" ON public.admin_audit_logs;
CREATE POLICY "audit_logs_insert_policy" ON public.admin_audit_logs
    FOR INSERT WITH CHECK (public.is_admin());

NOTIFY pgrst, 'reload schema';
