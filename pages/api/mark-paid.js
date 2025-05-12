const AIRTABLE_BASE_ID = "appecuuGb7DHkki1s";
const AIRTABLE_KEY = process.env.AIRTABLE_INSPECTION_KEY;
const AIRTABLE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/All%20Requests`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { recordId, tier, inspectorId } = req.body;

  // Validate required fields
  if (!recordId || !inspectorId) {
    return res.status(400).json({ error: "Missing required data: recordId or inspectorId" });
  }

  const tierValue = tier || "Remote Listing Review"; // fallback if undefined

  try {
    const updateUrl = `${AIRTABLE_URL}/${recordId}`;

    const patchPayload = {
      fields: {
        Status: "Paid",
        "Payment Status": "Paid",
        "Tier Selected": tierValue,
        "Inspector Assigned": [inspectorId],
      },
    };

    // Log the payload (for development, remove in production)
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
    let parsedResult;
    try {
      parsedResult = JSON.parse(resultText);
    } catch {
      parsedResult = resultText;
    }

    // Log the Airtable response (remove in production)
    console.log("📥 Airtable response:", parsedResult);

    if (!response.ok) {
      return res.status(500).json({
        error: "Airtable update failed",
        detail: parsedResult,
      });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    // Improved error logging
    console.error("❌ Airtable error:", err);
    return res.status(500).json({ error: "Failed to mark as paid", detail: err.message });
  }
}
