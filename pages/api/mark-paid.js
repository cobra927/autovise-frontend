const AIRTABLE_BASE_ID = "appecuuGb7DHkki1s";
const AIRTABLE_KEY = process.env.AIRTABLE_INSPECTION_KEY;
const AIRTABLE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/All Requests`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { recordId, tier, inspectorId } = req.body;

  if (!recordId || !tier || !inspectorId) {
    return res.status(400).json({ error: "Missing required data" });
  }

  try {
    const updateUrl = `${AIRTABLE_URL}/${recordId}`;

    const patchPayload = {
      fields: {
        Status: "Paid",
        // ✅ Treat as plain text — works whether the field is text or select
        "Payment Status": "Paid",
        "Tier Selected": tier,
        "Inspector Assigned": [inspectorId],
      },
    };

    console.log("💳 Marking paid PATCH:", JSON.stringify(patchPayload, null, 2));

    const response = await fetch(updateUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${AIRTABLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patchPayload),
    });

    const resultText = await response.text();
    console.log("📥 Airtable response:", resultText);

    if (!response.ok) {
      return res.status(500).json({
        error: "Airtable update failed",
        detail: resultText,
      });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Airtable error:", err.message);
    return res.status(500).json({ error: "Failed to mark as paid" });
  }
}
