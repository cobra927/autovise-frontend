import Stripe from "stripe";
import jwt from "jsonwebtoken";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const AIRTABLE_API_URL = "https://api.airtable.com/v0/appecuuGb7DHkki1s/All%20Requests";
const AIRTABLE_KEY = process.env.AIRTABLE_INSPECTION_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
  if (!process.env.STRIPE_SECRET_KEY || !AIRTABLE_KEY || !JWT_SECRET) {
    return res.status(500).json({ error: "Missing API keys" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const token = req.cookies?.autoviseToken;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  let user;
  try {
    user = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }

  if (user.role !== "buyer") {
    return res.status(403).json({ error: "Only buyers can initiate checkout" });
  }

  const { tier, inspectorId, recordId } = req.body;

  const tierPrices = {
    "Remote Listing Review": 2500,
    "In-Person Inspection": 9500,
    "In-Person + Negotiation": 14500,
  };

  if (!tier || !inspectorId || !recordId || !tierPrices[tier]) {
    return res.status(400).json({ error: "Missing or invalid data" });
  }

  const amount = tierPrices[tier];

  try {
    // ✅ Verify buyer owns the record
    const recordCheck = await fetch(`${AIRTABLE_API_URL}?filterByFormula=AND(RECORD_ID()='${recordId}', LOWER({Buyer Email})='${user.email.toLowerCase()}')`, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_KEY}`,
      },
    });

    const recordData = await recordCheck.json();
    if (!recordData.records?.length) {
      return res.status(403).json({ error: "Unauthorized record access" });
    }

    const successQuery = new URLSearchParams({
      recordId,
      tier,
      inspectorId,
    }).toString();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: tier },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.origin}/inspect/success?${successQuery}`,
      cancel_url: `${req.headers.origin}/inspect/matches`,
    });

    // ⬇️ Save Checkout Session ID to Airtable
    await fetch(`${AIRTABLE_API_URL}/${recordId}`, {
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

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("❌ Stripe session error:", err.message);
    return res.status(500).json({ error: "Stripe session creation failed" });
  }
}
