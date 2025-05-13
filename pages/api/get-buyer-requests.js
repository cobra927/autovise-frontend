import jwt from "jsonwebtoken";

const BASE_ID = "appecuuGb7DHkki1s";
const API_KEY = process.env.AIRTABLE_INSPECTION_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
  const token = req.cookies?.autoviseToken;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const user = jwt.verify(token, JWT_SECRET);

    if (user.role !== "buyer") {
      return res.status(403).json({ error: "Access denied" });
    }

    const email = user.email.toLowerCase();

    // Fetch all requests for this buyer
    const result = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/All%20Requests?filterByFormula=LOWER({Buyer Email})='${email}'`,
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

    // Resolve inspector emails (optional enrichment)
    const inspectorIds = data.records
      .map((r) => r.fields["Inspector Assigned"]?.[0])
      .filter(Boolean);
    const uniqueInspectorIds = [...new Set(inspectorIds)];

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

    const enriched = data.records.map((r) => {
      const inspectorId = r.fields["Inspector Assigned"]?.[0];
      return {
        ...r,
        inspectorEmail: inspectorMap[inspectorId] || null,
      };
    });

    return res.status(200).json(enriched);
  } catch (err) {
    console.error("❌ get-buyer-requests error:", err.message);
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
