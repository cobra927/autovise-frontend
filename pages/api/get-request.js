const BASE_ID = "appecuuGb7DHkki1s"; // Inspection base
const API_KEY = process.env.AIRTABLE_INSPECTION_KEY;

export default async function handler(req, res) {
  const { recordId } = req.query;
  if (!recordId) return res.status(400).json({ error: "Missing recordId" });

  try {
    // Get inspection request
    const reqRes = await fetch(`https://api.airtable.com/v0/${BASE_ID}/All%20Requests/${recordId}`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    const requestData = await reqRes.json();
    const inspectorRef = requestData.fields?.["Inspector Assigned"]?.[0];

    if (!inspectorRef) {
      return res.status(200).json({ inspector: null });
    }

    // Get inspector details from All users
    const inspectorRes = await fetch(`https://api.airtable.com/v0/${BASE_ID}/All%20users/${inspectorRef}`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    const inspectorData = await inspectorRes.json();

    if (!inspectorData.fields) {
      return res.status(500).json({ error: "Inspector not found" });
    }

    res.status(200).json({
      inspector: inspectorData.fields,
      id: inspectorData.id,
    });
  } catch (err) {
    console.error("❌ get-request.js error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
