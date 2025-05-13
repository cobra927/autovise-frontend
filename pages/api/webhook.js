import Stripe from "stripe";
import { buffer } from "micro";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const AIRTABLE_API_URL = "https://api.airtable.com/v0/appecuuGb7DHkki1s/All%20Requests";
const AIRTABLE_KEY = process.env.AIRTABLE_INSPECTION_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  const sig = req.headers["stripe-signature"];
  const buf = await buffer(req);

  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("❌ Webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle completed payment events
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const sessionId = session.id;

    try {
      // Look up record with matching Checkout Session ID
      const search = await fetch(`${AIRTABLE_API_URL}?filterByFormula={Checkout Session ID}='${sessionId}'`, {
        headers: { Authorization: `Bearer ${AIRTABLE_KEY}` },
      });

      const data = await search.json();
      const record = data.records?.[0];
      if (!record) throw new Error("No matching Airtable record found");

      const updateRes = await fetch(`${AIRTABLE_API_URL}/${record.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${AIRTABLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            Status: "Paid",
            "Payment Status": "Confirmed via Webhook",
          },
        }),
      });

      if (!updateRes.ok) {
        const errText = await updateRes.text();
        throw new Error(`Airtable update failed: ${errText}`);
      }

      console.log(`✅ Webhook confirmed payment for: ${record.id}`);
    } catch (err) {
      console.error("❌ Webhook post-payment handling error:", err);
    }
  }

  res.json({ received: true });
}
