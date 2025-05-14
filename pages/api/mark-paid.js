import jwt from "jsonwebtoken";

const AIRTABLE_BASE_ID = "appecuuGb7DHkki1s";
const AIRTABLE_KEY = process.env.AIRTABLE_INSPECTION_KEY;
const JWT_SECRET = process.env.JWT_SECRET;
const AIRTABLE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/All%20Requests`;

export default async function handler(req, res) {
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
    return res.status(403).json({ error: "Only buyers can mark payment" });
  }

  const { recordId, tier, inspectorId } = req.body;
  const tierValue = tier || "Remote Listing Review";

  if (!recordId || !inspectorId) {
    return res.status(400).json({ error: "Missing required data: recordId or inspectorId" });
  }

  try {
    const checkRes = await fetch(`${AIRTABLE_URL}?filterByFormula=AND(RECORD_ID()='${recordId}', LOWER({Buyer Email})='${user.email.toLowerCase()}')`, {
      headers: { Authorization: `Bearer ${AIRTABLE_KEY}` },
    });
    const checkData = await checkRes.json();
    if (!checkData.records?.length) {
      return res.status(403).json({ error: "Unauthorized to update this record" });
    }

    const updateFields = {
      "Payment Status": "Paid",
      "Tier Selected": tierValue,
    };

    if (inspectorId) {
      updateFields["Inspector Assigned"] = [inspectorId];
    }

    console.log("📦 PATCH fields:", updateFields);

    const updateRes = await fetch(`${AIRTABLE_URL}/${recordId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${AIRTABLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields: updateFields }),
    });

    const resultText = await updateRes.text();
    console.log("🔁 Airtable response:", resultText);

    if (!updateRes.ok) {
      return res.status(500).json({
        error: "Airtable update failed",
        detail: resultText,
      });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ mark-paid error:", err);
    return res.status(500).json({ error: "Failed to mark as paid", detail: err.message });
  }
}
