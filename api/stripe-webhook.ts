import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { supabaseAdmin } from "./_supabaseAdmin";

// Signature verification needs the exact raw request bytes, not Vercel's
// re-serialized JSON — so the default body parser must stay off for this route.
export const config = {
  api: { bodyParser: false },
};

function readRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers["stripe-signature"];

  if (!stripeSecretKey || !webhookSecret || typeof signature !== "string") {
    res.status(500).json({ error: "STRIPE_NOT_CONFIGURED" });
    return;
  }

  const stripe = new Stripe(stripeSecretKey);
  const rawBody = await readRawBody(req);

  let event: Stripe.Event;
  try {
    // This is the only thing standing between "someone paid" and "someone
    // POSTed a fake success" — never trust a checkout.session.completed
    // payload that doesn't pass this check.
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    res.status(400).json({ error: `Invalid signature: ${(err as Error).message}` });
    return;
  }

  if (event.type !== "checkout.session.completed") {
    res.status(200).json({ received: true });
    return;
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const supabase = supabaseAdmin();

  const { data: intent, error: intentError } = await supabase
    .from("stripe_checkout_intents")
    .select("*")
    .eq("checkout_session_id", session.id)
    .maybeSingle();

  if (intentError || !intent) {
    // Nothing we recognize created this session; ack anyway so Stripe stops
    // retrying (retrying won't make a record we never created appear).
    res.status(200).json({ received: true, warning: "unknown session" });
    return;
  }

  if (intent.order_id) {
    res.status(200).json({ received: true, order_id: intent.order_id });
    return;
  }

  const payload = {
    ...intent.payload,
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id:
      typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null,
  };

  const { data: order, error: orderError } = await supabase.rpc("create_order", { payload });

  if (orderError || !order) {
    // create_order() re-validates everything (store hours, item prices,
    // delivery radius...) against current data. If that now fails — the
    // store closed, an item vanished — the customer already paid via
    // Stripe; log this loudly instead of silently dropping it, so it can be
    // resolved manually (refund or a manually created order).
    console.error("create_order failed for paid Stripe session", session.id, orderError);
    res.status(500).json({ error: "ORDER_CREATION_FAILED" });
    return;
  }

  await supabase
    .from("stripe_checkout_intents")
    .update({ order_id: (order as { id: string }).id })
    .eq("checkout_session_id", session.id);

  res.status(200).json({ received: true, order_id: (order as { id: string }).id });
}
