import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { supabaseAdmin } from "./_supabaseAdmin";

interface QuoteItem {
  product_name: string;
  variation_name: string | null;
  unit_price: number;
  quantity: number;
}

interface Quote {
  phone: string;
  name: string;
  items: QuoteItem[];
  subtotal: number;
  delivery_fee: number;
  discount_amount: number;
  total: number;
  payment_method: "pix" | "credit_card" | "cash";
}

/**
 * Creates a Stripe Checkout Session for the exact amount our own backend
 * computes (never the amount the client sends) and remembers the order
 * payload keyed by the resulting session id, so the webhook can turn it into
 * a real order once Stripe confirms the payment.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
    return;
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    res.status(500).json({ error: "STRIPE_NOT_CONFIGURED" });
    return;
  }

  const { payload } = req.body ?? {};
  if (!payload) {
    res.status(400).json({ error: "MISSING_PAYLOAD" });
    return;
  }

  const supabase = supabaseAdmin();
  const { data: quote, error: quoteError } = await supabase.rpc("quote_order", { payload });

  if (quoteError || !quote) {
    res.status(400).json({ error: quoteError?.message ?? "QUOTE_FAILED" });
    return;
  }

  const priced = quote as Quote;
  const stripe = new Stripe(stripeSecretKey);

  try {
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = priced.items.map((item) => ({
      price_data: {
        currency: "brl",
        product_data: {
          name: item.variation_name ? `${item.product_name} (${item.variation_name})` : item.product_name,
        },
        unit_amount: Math.round(item.unit_price * 100),
      },
      quantity: item.quantity,
    }));

    if (priced.delivery_fee > 0) {
      lineItems.push({
        price_data: {
          currency: "brl",
          product_data: { name: "Taxa de entrega" },
          unit_amount: Math.round(priced.delivery_fee * 100),
        },
        quantity: 1,
      });
    }

    const discounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];
    if (priced.discount_amount > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: Math.round(priced.discount_amount * 100),
        currency: "brl",
        duration: "once",
        name: "Desconto pagamento online",
      });
      discounts.push({ coupon: coupon.id });
    }

    const origin = (req.headers.origin as string) || `https://${req.headers.host}`;
    const paymentMethodTypes: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] =
      priced.payment_method === "pix" ? ["pix"] : ["card"];

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: paymentMethodTypes,
      line_items: lineItems,
      discounts: discounts.length ? discounts : undefined,
      success_url: `${origin}/pedido/stripe?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/finalizar`,
    });

    const { error: intentError } = await supabase
      .from("stripe_checkout_intents")
      .insert({ checkout_session_id: session.id, payload });

    if (intentError) {
      console.error("Failed to store stripe_checkout_intents row", intentError);
      res.status(500).json({ error: "COULD_NOT_TRACK_SESSION" });
      return;
    }

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout session creation failed", err);
    res.status(502).json({ error: "STRIPE_REQUEST_FAILED" });
  }
}
