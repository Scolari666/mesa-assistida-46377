-- ============================================================================
-- Porks Santa Maria - full schema rebuild
-- Replaces the previous multi-tenant "call waiter" digital menu schema with a
-- single-tenant online ordering platform (menu, cart/checkout, admin panel).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Drop previous schema (old "MenuFacil Pro" concept)
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- DROP TRIGGER ... ON <table> still errors when <table> itself doesn't exist
-- (IF EXISTS only covers the trigger name), so on a brand-new project these
-- two must be skipped rather than run unconditionally.
DO $$
BEGIN
  IF to_regclass('public.menu_items') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS update_menu_items_updated_at ON public.menu_items';
  END IF;
  IF to_regclass('public.profiles') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles';
  END IF;
END $$;

DROP FUNCTION IF EXISTS public.update_updated_at_column();

DROP TABLE IF EXISTS public.calls CASCADE;
DROP TABLE IF EXISTS public.menu_items CASCADE;
DROP TABLE IF EXISTS public.tables CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP TYPE IF EXISTS public.restaurant_type;
DROP TYPE IF EXISTS public.subscription_plan;

-- Supabase blocks direct DELETE on storage.objects/buckets (must go through
-- the Storage API/dashboard), so any leftover 'menu-images' bucket from an
-- older deployment of the previous schema has to be removed there manually.
-- Dropping the old policies by name is unaffected by that restriction.
DROP POLICY IF EXISTS "Anyone can view menu images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own menu images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own menu images" ON storage.objects;

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid());
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- SECURITY DEFINER so the emptiness check bypasses the SELECT policy below:
-- a non-admin's own SELECT on admin_users is filtered to zero rows by RLS,
-- which would make a plain "NOT EXISTS(SELECT ... FROM admin_users)" always
-- look empty to them and let anyone self-promote at any time.
CREATE OR REPLACE FUNCTION public.admin_users_is_empty()
RETURNS BOOLEAN AS $$
  SELECT NOT EXISTS (SELECT 1 FROM public.admin_users);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.admin_users_is_empty() TO anon, authenticated;

-- Anyone can read who the admins are (needed to check membership client-side),
-- and the very first admin can bootstrap themselves; after that only an
-- existing admin can add more (for any target user_id, not just their own).
CREATE POLICY "Admins can view admin_users"
  ON public.admin_users FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Bootstrap first admin or existing admin can add"
  ON public.admin_users FOR INSERT
  WITH CHECK (
    (auth.uid() = user_id AND public.admin_users_is_empty())
    OR public.is_admin()
  );

CREATE POLICY "Admins can remove admins"
  ON public.admin_users FOR DELETE
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- Menu: categories / products / variations / suggestions / combos
-- ---------------------------------------------------------------------------
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories"
  ON public.categories FOR SELECT
  USING (active = true OR public.is_admin());

CREATE POLICY "Admins manage categories"
  ON public.categories FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  promo_price NUMERIC(10,2) CHECK (promo_price IS NULL OR promo_price >= 0),
  image_url TEXT,
  is_combo BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products"
  ON public.products FOR SELECT
  USING (active = true OR public.is_admin());

CREATE POLICY "Admins manage products"
  ON public.products FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_products_category ON public.products(category_id);

CREATE TABLE public.product_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active variations"
  ON public.product_variations FOR SELECT
  USING (active = true OR public.is_admin());

CREATE POLICY "Admins manage variations"
  ON public.product_variations FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE INDEX idx_variations_product ON public.product_variations(product_id);

CREATE TABLE public.product_suggestions (
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  suggested_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, suggested_product_id),
  CHECK (product_id <> suggested_product_id)
);

ALTER TABLE public.product_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view suggestions"
  ON public.product_suggestions FOR SELECT
  USING (true);

CREATE POLICY "Admins manage suggestions"
  ON public.product_suggestions FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TABLE public.combo_items (
  combo_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  item_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  PRIMARY KEY (combo_id, item_product_id),
  CHECK (combo_id <> item_product_id)
);

ALTER TABLE public.combo_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view combo items"
  ON public.combo_items FOR SELECT
  USING (true);

CREATE POLICY "Admins manage combo items"
  ON public.combo_items FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Store settings (singleton)
-- ---------------------------------------------------------------------------
CREATE TABLE public.store_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  store_name TEXT NOT NULL DEFAULT 'Porks Santa Maria',
  address_street TEXT NOT NULL DEFAULT 'Rua Serafim Valandro',
  address_number TEXT NOT NULL DEFAULT '605',
  address_neighborhood TEXT,
  address_city TEXT NOT NULL DEFAULT 'Santa Maria',
  address_state TEXT NOT NULL DEFAULT 'RS',
  address_zip TEXT NOT NULL DEFAULT '97010-480',
  store_lat NUMERIC(10,6) NOT NULL DEFAULT -29.6868,
  store_lng NUMERIC(10,6) NOT NULL DEFAULT -53.8149,
  delivery_fee_per_km NUMERIC(10,2) NOT NULL DEFAULT 3.00 CHECK (delivery_fee_per_km >= 0),
  max_delivery_radius_km NUMERIC(10,2) NOT NULL DEFAULT 8 CHECK (max_delivery_radius_km > 0),
  online_discount_percent NUMERIC(5,2) NOT NULL DEFAULT 10 CHECK (online_discount_percent >= 0 AND online_discount_percent <= 100),
  online_discount_min_order NUMERIC(10,2) NOT NULL DEFAULT 30 CHECK (online_discount_min_order >= 0),
  min_delivery_minutes INTEGER NOT NULL DEFAULT 20,
  max_delivery_minutes INTEGER NOT NULL DEFAULT 180,
  whatsapp_phone TEXT,
  instagram_url TEXT,
  facebook_url TEXT,
  business_hours JSONB NOT NULL DEFAULT '{
    "0": {"open": "17:00", "close": "23:30"},
    "1": {"open": "17:30", "close": "00:00"},
    "2": {"open": "17:30", "close": "00:00"},
    "3": {"open": "17:30", "close": "00:00"},
    "4": {"open": "17:30", "close": "00:00"},
    "5": {"open": "17:30", "close": "01:00"},
    "6": {"open": "17:00", "close": "01:00"}
  }'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view store settings"
  ON public.store_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins manage store settings"
  ON public.store_settings FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER update_store_settings_updated_at
  BEFORE UPDATE ON public.store_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.store_settings (id) VALUES (1);

-- ---------------------------------------------------------------------------
-- Customers (identified by phone, no password) + addresses
-- ---------------------------------------------------------------------------
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- No direct public SELECT/INSERT policy: customers are only readable/writable
-- through the SECURITY DEFINER RPCs below, so a phone number can never be used
-- to enumerate or scrape other customers' data via the anon key.
CREATE POLICY "Admins manage customers"
  ON public.customers FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  label TEXT,
  street TEXT NOT NULL,
  number TEXT NOT NULL,
  complement TEXT,
  neighborhood TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT,
  reference TEXT,
  lat NUMERIC(10,6) NOT NULL,
  lng NUMERIC(10,6) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage customer addresses"
  ON public.customer_addresses FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
CREATE TYPE public.order_status AS ENUM (
  'received',
  'preparing',
  'out_for_delivery',
  'ready_for_pickup',
  'delivered',
  'picked_up',
  'cancelled'
);

CREATE TYPE public.fulfillment_type AS ENUM ('delivery', 'pickup');
CREATE TYPE public.payment_method AS ENUM ('pix', 'credit_card', 'cash');

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  fulfillment_type public.fulfillment_type NOT NULL,
  address_id UUID REFERENCES public.customer_addresses(id) ON DELETE SET NULL,
  address_snapshot JSONB,
  distance_km NUMERIC(10,2),
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method public.payment_method NOT NULL,
  card_brand TEXT,
  pay_online BOOLEAN NOT NULL DEFAULT false,
  subtotal NUMERIC(10,2) NOT NULL,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  notes TEXT,
  status public.order_status NOT NULL DEFAULT 'received',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Customers never read orders directly (they get their order back as the
-- return value of create_order()); only admins can list/update orders.
CREATE POLICY "Admins manage orders"
  ON public.orders FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);

-- product_id/variation_id are SET NULL on delete: the name and price are
-- snapshotted on the row, so removing an item from the menu (or editing its
-- variations) must never fail or rewrite order history.
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  variation_id UUID REFERENCES public.product_variations(id) ON DELETE SET NULL,
  variation_name TEXT,
  unit_price NUMERIC(10,2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  line_total NUMERIC(10,2) NOT NULL,
  notes TEXT
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage order items"
  ON public.order_items FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Realtime for the admin dashboard
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- ---------------------------------------------------------------------------
-- RPC: find_customer_by_phone
-- Lets the storefront recognise a returning customer without exposing the
-- customers table to the anon key.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.find_customer_by_phone(p_phone TEXT)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object('id', id, 'full_name', full_name, 'phone', phone)
  INTO v_result
  FROM public.customers
  WHERE phone = p_phone;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.find_customer_by_phone(TEXT) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- RPC: is_store_open_at
-- Shared business-hours check (used by create_order and exposed for the UI).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_store_open_at(p_at TIMESTAMPTZ)
RETURNS BOOLEAN AS $$
DECLARE
  v_hours JSONB;
  v_local TIMESTAMP;
  v_dow INT;
  v_prev_dow INT;
  v_time TIME;
  v_today JSONB;
  v_prev JSONB;
  v_open TIME;
  v_close TIME;
BEGIN
  SELECT business_hours INTO v_hours FROM public.store_settings WHERE id = 1;

  v_local := p_at AT TIME ZONE 'America/Sao_Paulo';
  v_dow := EXTRACT(DOW FROM v_local)::INT;
  v_prev_dow := (v_dow + 6) % 7;
  v_time := v_local::TIME;

  v_today := v_hours -> v_dow::TEXT;
  IF v_today IS NOT NULL THEN
    v_open := (v_today ->> 'open')::TIME;
    v_close := (v_today ->> 'close')::TIME;
    IF v_close = '00:00'::TIME THEN
      v_close := '24:00'::TIME;
    END IF;
    IF v_open <= v_close THEN
      IF v_time >= v_open AND v_time < v_close THEN
        RETURN true;
      END IF;
    ELSE
      IF v_time >= v_open OR v_time < v_close THEN
        RETURN true;
      END IF;
    END IF;
  END IF;

  -- Spillover from the previous day's overnight window (e.g. Friday 17:30-01:00
  -- keeps the store open early Saturday morning until 01:00).
  v_prev := v_hours -> v_prev_dow::TEXT;
  IF v_prev IS NOT NULL THEN
    v_open := (v_prev ->> 'open')::TIME;
    v_close := (v_prev ->> 'close')::TIME;
    IF v_close <> '00:00'::TIME AND v_open > v_close AND v_time < v_close THEN
      RETURN true;
    END IF;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.is_store_open_at(TIMESTAMPTZ) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- RPC: create_order
-- The one and only way an order gets created. Every price, the delivery fee
-- and the online-payment discount are (re)computed here from trusted server
-- state; nothing sent by the client is trusted except product/variation ids,
-- quantities, the chosen fulfillment/payment options and free-text notes.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_order(payload JSONB)
RETURNS JSONB AS $$
DECLARE
  v_settings public.store_settings;
  v_phone TEXT;
  v_name TEXT;
  v_customer_id UUID;
  v_fulfillment public.fulfillment_type;
  v_address JSONB;
  v_address_id UUID;
  v_distance_km NUMERIC(10,2);
  v_delivery_fee NUMERIC(10,2) := 0;
  v_payment_method public.payment_method;
  v_pay_online BOOLEAN;
  v_card_brand TEXT;
  v_items JSONB;
  v_item JSONB;
  v_product public.products;
  v_variation public.product_variations;
  v_unit_price NUMERIC(10,2);
  v_quantity INT;
  v_line_total NUMERIC(10,2);
  v_subtotal NUMERIC(10,2) := 0;
  v_discount NUMERIC(10,2) := 0;
  v_total NUMERIC(10,2);
  v_order_id UUID;
  v_order public.orders;
  v_items_out JSONB := '[]'::jsonb;
BEGIN
  IF NOT public.is_store_open_at(now()) THEN
    RAISE EXCEPTION 'STORE_CLOSED' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_settings FROM public.store_settings WHERE id = 1;

  v_phone := regexp_replace(payload -> 'customer' ->> 'phone', '\D', '', 'g');
  v_name := trim(payload -> 'customer' ->> 'name');

  IF v_phone IS NULL OR length(v_phone) < 10 THEN
    RAISE EXCEPTION 'INVALID_PHONE' USING ERRCODE = 'P0001';
  END IF;
  IF v_name IS NULL OR length(v_name) < 2 THEN
    RAISE EXCEPTION 'INVALID_NAME' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.customers (phone, full_name)
  VALUES (v_phone, v_name)
  ON CONFLICT (phone) DO UPDATE SET full_name = EXCLUDED.full_name
  RETURNING id INTO v_customer_id;

  v_fulfillment := (payload -> 'fulfillment' ->> 'type')::public.fulfillment_type;

  IF v_fulfillment = 'delivery' THEN
    v_address := payload -> 'fulfillment' -> 'address';
    IF v_address IS NULL
      OR v_address ->> 'street' IS NULL
      OR v_address ->> 'lat' IS NULL
      OR v_address ->> 'lng' IS NULL THEN
      RAISE EXCEPTION 'INVALID_ADDRESS' USING ERRCODE = 'P0001';
    END IF;

    INSERT INTO public.customer_addresses
      (customer_id, label, street, number, complement, neighborhood, city, state, zip, reference, lat, lng)
    VALUES (
      v_customer_id,
      v_address ->> 'label',
      v_address ->> 'street',
      v_address ->> 'number',
      v_address ->> 'complement',
      v_address ->> 'neighborhood',
      COALESCE(v_address ->> 'city', v_settings.address_city),
      COALESCE(v_address ->> 'state', v_settings.address_state),
      v_address ->> 'zip',
      v_address ->> 'reference',
      (v_address ->> 'lat')::NUMERIC,
      (v_address ->> 'lng')::NUMERIC
    )
    RETURNING id INTO v_address_id;

    -- Haversine distance (km) between the store and the delivery address.
    v_distance_km := (
      6371 * acos(
        LEAST(1, GREATEST(-1,
          cos(radians(v_settings.store_lat)) * cos(radians((v_address ->> 'lat')::NUMERIC)) *
          cos(radians((v_address ->> 'lng')::NUMERIC) - radians(v_settings.store_lng)) +
          sin(radians(v_settings.store_lat)) * sin(radians((v_address ->> 'lat')::NUMERIC))
        ))
      )
    );

    IF v_distance_km > v_settings.max_delivery_radius_km THEN
      RAISE EXCEPTION 'OUT_OF_DELIVERY_RANGE' USING ERRCODE = 'P0001';
    END IF;

    v_delivery_fee := round(v_distance_km * v_settings.delivery_fee_per_km, 2);
  ELSIF v_fulfillment = 'pickup' THEN
    v_delivery_fee := 0;
    v_distance_km := NULL;
    v_address := NULL;
  ELSE
    RAISE EXCEPTION 'INVALID_FULFILLMENT' USING ERRCODE = 'P0001';
  END IF;

  v_payment_method := (payload -> 'payment' ->> 'method')::public.payment_method;
  v_pay_online := COALESCE((payload -> 'payment' ->> 'pay_online')::BOOLEAN, false);
  v_card_brand := payload -> 'payment' ->> 'card_brand';

  IF v_payment_method = 'cash' AND v_pay_online THEN
    RAISE EXCEPTION 'INVALID_PAYMENT' USING ERRCODE = 'P0001';
  END IF;

  v_items := payload -> 'items';
  IF v_items IS NULL OR jsonb_array_length(v_items) = 0 THEN
    RAISE EXCEPTION 'EMPTY_ORDER' USING ERRCODE = 'P0001';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
  LOOP
    SELECT * INTO v_product FROM public.products
      WHERE id = (v_item ->> 'product_id')::UUID AND active = true;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'INVALID_ITEM' USING ERRCODE = 'P0001';
    END IF;

    v_quantity := COALESCE((v_item ->> 'quantity')::INT, 0);
    IF v_quantity <= 0 THEN
      RAISE EXCEPTION 'INVALID_QUANTITY' USING ERRCODE = 'P0001';
    END IF;

    IF v_item ->> 'variation_id' IS NOT NULL THEN
      SELECT * INTO v_variation FROM public.product_variations
        WHERE id = (v_item ->> 'variation_id')::UUID
          AND product_id = v_product.id
          AND active = true;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'INVALID_VARIATION' USING ERRCODE = 'P0001';
      END IF;
      v_unit_price := v_variation.price;
    ELSE
      v_variation := NULL;
      v_unit_price := COALESCE(v_product.promo_price, v_product.price);
    END IF;

    v_line_total := round(v_unit_price * v_quantity, 2);
    v_subtotal := v_subtotal + v_line_total;

    v_items_out := v_items_out || jsonb_build_object(
      'product_id', v_product.id,
      'product_name', v_product.name,
      'variation_id', v_variation.id,
      'variation_name', v_variation.name,
      'unit_price', v_unit_price,
      'quantity', v_quantity,
      'line_total', v_line_total,
      'notes', v_item ->> 'notes'
    );
  END LOOP;

  IF v_pay_online AND v_subtotal >= v_settings.online_discount_min_order THEN
    v_discount := round(v_subtotal * v_settings.online_discount_percent / 100, 2);
  END IF;

  v_total := v_subtotal + v_delivery_fee - v_discount;

  INSERT INTO public.orders (
    customer_id, customer_name, customer_phone, fulfillment_type, address_id,
    address_snapshot, distance_km, delivery_fee, payment_method, card_brand,
    pay_online, subtotal, discount_amount, total, notes
  ) VALUES (
    v_customer_id, v_name, v_phone, v_fulfillment, v_address_id,
    v_address, v_distance_km, v_delivery_fee, v_payment_method, v_card_brand,
    v_pay_online, v_subtotal, v_discount, v_total, payload ->> 'notes'
  ) RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (order_id, product_id, product_name, variation_id, variation_name, unit_price, quantity, line_total, notes)
  SELECT
    v_order_id,
    (i ->> 'product_id')::UUID,
    i ->> 'product_name',
    (i ->> 'variation_id')::UUID,
    i ->> 'variation_name',
    (i ->> 'unit_price')::NUMERIC,
    (i ->> 'quantity')::INT,
    (i ->> 'line_total')::NUMERIC,
    i ->> 'notes'
  FROM jsonb_array_elements(v_items_out) AS i;

  SELECT * INTO v_order FROM public.orders WHERE id = v_order_id;

  RETURN jsonb_build_object(
    'id', v_order.id,
    'status', v_order.status,
    'fulfillment_type', v_order.fulfillment_type,
    'delivery_fee', v_order.delivery_fee,
    'distance_km', v_order.distance_km,
    'subtotal', v_order.subtotal,
    'discount_amount', v_order.discount_amount,
    'total', v_order.total,
    'payment_method', v_order.payment_method,
    'pay_online', v_order.pay_online,
    'created_at', v_order.created_at,
    'min_delivery_minutes', v_settings.min_delivery_minutes,
    'max_delivery_minutes', v_settings.max_delivery_minutes,
    'items', v_items_out
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.create_order(JSONB) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage bucket for menu/product images
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('porks-images', 'porks-images', true);

CREATE POLICY "Anyone can view porks images"
ON storage.objects FOR SELECT
USING (bucket_id = 'porks-images');

CREATE POLICY "Admins can upload porks images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'porks-images' AND public.is_admin());

CREATE POLICY "Admins can update porks images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'porks-images' AND public.is_admin());

CREATE POLICY "Admins can delete porks images"
ON storage.objects FOR DELETE
USING (bucket_id = 'porks-images' AND public.is_admin());

-- ---------------------------------------------------------------------------
-- Seed data: menu
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  c_pratos UUID := gen_random_uuid();
  c_chopes UUID := gen_random_uuid();
  c_petiscos UUID := gen_random_uuid();
  c_combos UUID := gen_random_uuid();
  c_drinks UUID := gen_random_uuid();
  p_costela UUID := gen_random_uuid();
  p_pururuca UUID := gen_random_uuid();
  p_costelinha UUID := gen_random_uuid();
  p_chope_pilsen UUID := gen_random_uuid();
  p_chope_ipa UUID := gen_random_uuid();
  p_batata UUID := gen_random_uuid();
  p_torresmo UUID := gen_random_uuid();
  p_combo_dupla UUID := gen_random_uuid();
  p_caipiroka UUID := gen_random_uuid();
  p_gin UUID := gen_random_uuid();
BEGIN
  INSERT INTO public.categories (id, name, sort_order) VALUES
    (c_pratos, 'Pratos de Porco', 1),
    (c_chopes, 'Chopes e Cervejas', 2),
    (c_petiscos, 'Petiscos', 3),
    (c_combos, 'Combos', 4),
    (c_drinks, 'Drinks', 5);

  INSERT INTO public.products (id, category_id, name, description, price, promo_price, sort_order) VALUES
    (p_costela, c_pratos, 'Costela de Porco no Bafo', 'Costela suína cozida lentamente, acompanha farofa e vinagrete', 69.90, NULL, 1),
    (p_pururuca, c_pratos, 'Pururuca com Torresmo', 'Pururuca crocante servida com torresmo e mandioca', 54.90, 49.90, 2),
    (p_costelinha, c_pratos, 'Costelinha BBQ', 'Costelinha suína ao molho barbecue da casa', 59.90, NULL, 3),
    (p_chope_pilsen, c_chopes, 'Chope Pilsen 300ml', 'Chope pilsen gelado direto do barril', 10.00, NULL, 1),
    (p_chope_ipa, c_chopes, 'Chope IPA 300ml', 'Chope artesanal estilo IPA, notas cítricas', 14.90, NULL, 2),
    (p_batata, c_petiscos, 'Batata Frita Porks', 'Porção de batata frita crocante com temperos da casa', 34.90, NULL, 1),
    (p_torresmo, c_petiscos, 'Torresmo com Farofa', 'Torresmo estalado com farofa temperada', 39.90, NULL, 2),
    (p_combo_dupla, c_combos, 'Combo Dupla Porks', 'Costela no bafo + 2 chopes pilsen 300ml', 89.90, 79.90, 1),
    (p_caipiroka, c_drinks, 'Caipivodka', 'Vodka, limão e açúcar', 24.90, NULL, 1),
    (p_gin, c_drinks, 'Gin Tônica', 'Gin nacional, água tônica e especiarias', 29.90, NULL, 2);

  INSERT INTO public.combo_items (combo_id, item_product_id, quantity) VALUES
    (p_combo_dupla, p_costela, 1),
    (p_combo_dupla, p_chope_pilsen, 2);

  UPDATE public.products SET is_combo = true WHERE id = p_combo_dupla;

  INSERT INTO public.product_variations (product_id, name, price, sort_order) VALUES
    (p_costela, 'Individual', 69.90, 1),
    (p_costela, 'Para 2 pessoas', 119.90, 2),
    (p_chope_pilsen, 'Copo 300ml', 10.00, 1),
    (p_chope_pilsen, 'Caneca 500ml', 16.00, 2),
    (p_chope_pilsen, 'Torre 1,8L', 49.90, 3);

  INSERT INTO public.product_suggestions (product_id, suggested_product_id, sort_order) VALUES
    (p_costela, p_batata, 1),
    (p_costela, p_chope_pilsen, 2),
    (p_pururuca, p_chope_ipa, 1),
    (p_batata, p_chope_pilsen, 1);
END $$;
