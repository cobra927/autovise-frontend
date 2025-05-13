const BASE_ID = "appecuuGb7DHkki1s";
const API_KEY = process.env.AIRTABLE_INSPECTION_KEY;

export default async function handler(req, res) {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Missing email" });

  try {
    // Fetch all inspection requests with linked fields
    const result = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/All%20Requests?view=Grid%20view`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
      }
    );

    const data = await result.json();

    if (!data.records) {
      return res.status(200).json([]);
    }

    // Pull out inspector IDs
    const inspectorIds = data.records
      .map((r) => r.fields["Inspector Assigned"]?.[0])
      .filter(Boolean);

    const uniqueInspectorIds = [...new Set(inspectorIds)];

    // Batch fetch all linked inspectors
    const inspectorMap = {};
    for (const id of uniqueInspectorIds) {
      const inspectorRes = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/Freelancers/${id}`,
        {
          headers: { Authorization: `Bearer ${API_KEY}` },
        }
      );
      const inspectorData = await inspectorRes.json();
      if (inspectorData?.fields?.Email) {
        inspectorMap[id] = inspectorData.fields.Email;
      }
    }

    // Attach resolved emails
    const enriched = data.records.map((r) => {
      const inspectorId = r.fields["Inspector Assigned"]?.[0];
      return {
        ...r,
        inspectorEmail: inspectorMap[inspectorId] || null,
      };
    });

    return res.status(200).json(enriched);
  } catch (err) {
    console.error("❌ get-buyer-requests error:", err);
    res.status(500).json({ error: "Server error" });
  }
}
