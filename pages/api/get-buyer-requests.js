const BASE_ID = "appecuuGb7DHkki1s";
const API_KEY = process.env.AIRTABLE_INSPECTION_KEY;

export default async function handler(req, res) {
  const { recordId } = req.query;
  if (!recordId) return res.status(400).json({ error: "Missing recordId" });

  try {
    // Fetch the inspection request by ID
    const reqRes = await fetch(`https://api.airtable.com/v0/${BASE_ID}/All%20Requests/${recordId}`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    const requestData = await reqRes.json();

    const inspectorRef = requestData.fields["Inspector Assigned"]?.[0];
    if (!inspectorRef) {
      return res.status(200).json({ inspector: null });
    }

    // Fetch the inspector's full record from "All users"
    const inspectorRes = await fetch(`https://api.airtable.com/v0/${BASE_ID}/All%20users/${inspectorRef}`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    const inspectorData = await inspectorRes.json();

    res.status(200).json({
      inspector: inspectorData.fields,
      id: inspectorData.id,
    });
  } catch (err) {
    console.error("❌ get-request error:", err);
    res.status(500).json({ error: "Failed to fetch inspection or inspector" });
  }
}
