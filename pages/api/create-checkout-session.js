import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const AIRTABLE_API_URL = "https://api.airtable.com/v0/appecuuGb7DHkki1s/All%20Requests";
const AIRTABLE_KEY = process.env.AIRTABLE_INSPECTION_KEY;

export default async function handler(req, res) {
  if (!process.env.STRIPE_SECRET_KEY || !AIRTABLE_KEY) {
    return res.status(500).json({ error: "Missing API keys" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { tier, inspector, recordId } = req.body;

  const tierPrices = {
    "Remote Listing Review": 2500,
    "In-Person Inspection": 9500,
    "In-Person + Negotiation": 14500,
  };

  if (!tier || !inspector?.email || !recordId || !inspector?.id) {
    return res.status(400).json({ error: "Missing required Stripe data" });
  }

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

    console.log("💳 Stripe session created:", session.id);

    // 🧾 Patch Airtable to save Checkout Session ID
    const airtableRes = await fetch(`${AIRTABLE_API_URL}/${recordId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${AIRTABLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          "Checkout Session ID": session.id,
        },
      }),
    });

    if (!airtableRes.ok) {
      const errorDetails = await airtableRes.text();
      console.warn("⚠️ Airtable update failed:", errorDetails);
      // Continue anyway
    }

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("❌ Stripe session error:", err);
    return res.status(500).json({ error: "Stripe session creation failed" });
  }
}
