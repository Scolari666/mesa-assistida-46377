-- ============================================================================
-- Stripe integration prep
-- Splits the pricing/validation logic that create_order() used to do inline
-- into a standalone compute_order_pricing() function with no side effects,
-- so a new quote_order() RPC can price a cart (to open a Stripe Checkout
-- Session for the exact amount) before any customer/order/address row is
-- written. Orders are only ever created once payment is confirmed, by the
-- Stripe webhook calling create_order() with the checkout session id
-- attached — idempotently, so a webhook retry can never create a duplicate.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Track a Stripe Checkout Session from creation through to the order it
-- eventually produces. Only ever touched by trusted server code (the Vercel
-- functions use the service role key, which bypasses RLS), so no policies
-- are defined here — anon/authenticated get zero access by default.
-- ---------------------------------------------------------------------------
CREATE TABLE public.stripe_checkout_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_session_id TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL,
  order_id UUID REFERENCES public.orders(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_checkout_intents ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.orders
  ADD COLUMN stripe_checkout_session_id TEXT UNIQUE,
  ADD COLUMN stripe_payment_intent_id TEXT;

-- ---------------------------------------------------------------------------
-- compute_order_pricing: every validation and price/fee/discount calculation
-- create_order() used to do inline, with zero database writes. Used both by
-- quote_order() (a pre-payment preview) and by create_order() itself (which
-- now just persists whatever this returns). Keeping this as the single
-- source of truth means the quoted price and the price an order is actually
-- created at can never drift apart.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.compute_order_pricing(payload JSONB)
RETURNS JSONB AS $$
DECLARE
  v_settings public.store_settings;
  v_phone TEXT;
  v_name TEXT;
  v_fulfillment public.fulfillment_type;
  v_address JSONB;
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

  v_fulfillment := (payload -> 'fulfillment' ->> 'type')::public.fulfillment_type;

  IF v_fulfillment = 'delivery' THEN
    v_address := payload -> 'fulfillment' -> 'address';
    IF v_address IS NULL
      OR v_address ->> 'street' IS NULL
      OR v_address ->> 'lat' IS NULL
      OR v_address ->> 'lng' IS NULL THEN
      RAISE EXCEPTION 'INVALID_ADDRESS' USING ERRCODE = 'P0001';
    END IF;

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

  RETURN jsonb_build_object(
    'phone', v_phone,
    'name', v_name,
    'fulfillment_type', v_fulfillment,
    'address', v_address,
    'distance_km', v_distance_km,
    'delivery_fee', v_delivery_fee,
    'payment_method', v_payment_method,
    'pay_online', v_pay_online,
    'card_brand', v_card_brand,
    'items', v_items_out,
    'subtotal', v_subtotal,
    'discount_amount', v_discount,
    'total', v_total,
    'notes', payload ->> 'notes',
    'min_delivery_minutes', v_settings.min_delivery_minutes,
    'max_delivery_minutes', v_settings.max_delivery_minutes
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------------
-- quote_order: read-only preview of what an order would cost. The Stripe
-- Checkout Session is created for exactly this amount, before any order
-- exists.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.quote_order(payload JSONB)
RETURNS JSONB AS $$
  SELECT public.compute_order_pricing(payload);
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.quote_order(JSONB) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- create_order: now just persists whatever compute_order_pricing() returns.
-- Accepts an optional payload.stripe_checkout_session_id — when present, the
-- call is idempotent: a webhook retry for a session that has already
-- produced an order returns that same order instead of creating another one.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_order(payload JSONB)
RETURNS JSONB AS $$
DECLARE
  v_session_id TEXT;
  v_payment_intent_id TEXT;
  v_existing_order_id UUID;
  v_priced JSONB;
  v_settings public.store_settings;
  v_customer_id UUID;
  v_address_id UUID;
  v_order_id UUID;
  v_order public.orders;
  v_items JSONB;
BEGIN
  v_session_id := payload ->> 'stripe_checkout_session_id';
  v_payment_intent_id := payload ->> 'stripe_payment_intent_id';

  IF v_session_id IS NOT NULL THEN
    SELECT id INTO v_existing_order_id FROM public.orders WHERE stripe_checkout_session_id = v_session_id;

    IF v_existing_order_id IS NOT NULL THEN
      SELECT * INTO v_order FROM public.orders WHERE id = v_existing_order_id;
      SELECT * INTO v_settings FROM public.store_settings WHERE id = 1;

      SELECT jsonb_agg(jsonb_build_object(
        'product_id', product_id, 'product_name', product_name,
        'variation_id', variation_id, 'variation_name', variation_name,
        'unit_price', unit_price, 'quantity', quantity, 'line_total', line_total, 'notes', notes
      )) INTO v_items
      FROM public.order_items WHERE order_id = v_order.id;

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
        'items', COALESCE(v_items, '[]'::jsonb)
      );
    END IF;
  END IF;

  v_priced := public.compute_order_pricing(payload);

  INSERT INTO public.customers (phone, full_name)
  VALUES (v_priced ->> 'phone', v_priced ->> 'name')
  ON CONFLICT (phone) DO UPDATE SET full_name = EXCLUDED.full_name
  RETURNING id INTO v_customer_id;

  IF v_priced ->> 'fulfillment_type' = 'delivery' THEN
    INSERT INTO public.customer_addresses
      (customer_id, label, street, number, complement, neighborhood, city, state, zip, reference, lat, lng)
    SELECT
      v_customer_id,
      a ->> 'label', a ->> 'street', a ->> 'number', a ->> 'complement', a ->> 'neighborhood',
      a ->> 'city', a ->> 'state', a ->> 'zip', a ->> 'reference',
      (a ->> 'lat')::NUMERIC, (a ->> 'lng')::NUMERIC
    FROM (SELECT v_priced -> 'address' AS a) sub
    RETURNING id INTO v_address_id;
  ELSE
    v_address_id := NULL;
  END IF;

  INSERT INTO public.orders (
    customer_id, customer_name, customer_phone, fulfillment_type, address_id,
    address_snapshot, distance_km, delivery_fee, payment_method, card_brand,
    pay_online, subtotal, discount_amount, total, notes,
    stripe_checkout_session_id, stripe_payment_intent_id
  ) VALUES (
    v_customer_id, v_priced ->> 'name', v_priced ->> 'phone',
    (v_priced ->> 'fulfillment_type')::public.fulfillment_type, v_address_id,
    v_priced -> 'address', (v_priced ->> 'distance_km')::NUMERIC, (v_priced ->> 'delivery_fee')::NUMERIC,
    (v_priced ->> 'payment_method')::public.payment_method, v_priced ->> 'card_brand',
    (v_priced ->> 'pay_online')::BOOLEAN, (v_priced ->> 'subtotal')::NUMERIC,
    (v_priced ->> 'discount_amount')::NUMERIC, (v_priced ->> 'total')::NUMERIC,
    v_priced ->> 'notes', v_session_id, v_payment_intent_id
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
  FROM jsonb_array_elements(v_priced -> 'items') AS i;

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
    'min_delivery_minutes', (v_priced ->> 'min_delivery_minutes')::INT,
    'max_delivery_minutes', (v_priced ->> 'max_delivery_minutes')::INT,
    'items', v_priced -> 'items'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.create_order(JSONB) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- get_order_by_stripe_session: lets the post-payment return page look up the
-- order a Checkout Session produced, once the webhook has processed it. The
-- session id itself is the credential (a long opaque Stripe-generated
-- token), the same trust model as the Stripe-hosted checkout/receipt pages.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_order_by_stripe_session(p_session_id TEXT)
RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_order public.orders;
  v_settings public.store_settings;
  v_items JSONB;
BEGIN
  SELECT order_id INTO v_order_id FROM public.stripe_checkout_intents WHERE checkout_session_id = p_session_id;

  IF v_order_id IS NULL THEN
    RETURN jsonb_build_object('status', 'pending');
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = v_order_id;
  SELECT * INTO v_settings FROM public.store_settings WHERE id = 1;

  SELECT jsonb_agg(jsonb_build_object(
    'product_name', product_name, 'variation_name', variation_name,
    'quantity', quantity, 'unit_price', unit_price, 'line_total', line_total
  )) INTO v_items
  FROM public.order_items WHERE order_id = v_order.id;

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
    'items', COALESCE(v_items, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_order_by_stripe_session(TEXT) TO anon, authenticated;
