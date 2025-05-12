import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Ensure STRIPE_SECRET_KEY is present
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: "Missing Stripe secret key" });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { tier, inspector, recordId } = req.body;

  // Price mapping for tiers
  const tierPrices = {
    "Remote Listing Review": 2500,
    "In-Person Inspection": 9500,
    "In-Person + Negotiation": 14500,
  };

  // Validate required fields
  if (!tier || !inspector?.email || !recordId || !inspector?.id) {
    return res.status(400).json({ error: "Missing required Stripe data" });
  }

  // Validate tier
  if (!tierPrices[tier]) {
    return res.status(400).json({ error: "Invalid tier selected" });
  }

  const amount = tierPrices[tier];

  try {
    const successQuery = new URLSearchParams({
      recordId,
      tier,
      inspectorId: inspector.id,
    }).toString();

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: tier,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.origin}/inspect/success?${successQuery}`,
      cancel_url: `${req.headers.origin}/inspect/matches`,
    });

    // Log the session ID in production only with proper logging system
    console.log("💳 Stripe session created:", session.id);

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("❌ Stripe session error:", err);
    return res.status(500).json({ error: "Stripe session creation failed" });
  }
}
