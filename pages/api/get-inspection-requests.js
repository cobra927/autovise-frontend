const BASE_ID = "appecuuGb7DHkki1s";
const API_KEY = process.env.AIRTABLE_INSPECTION_KEY;

export default async function handler(req, res) {
  const { email, role } = req.query;
  if (!email || !role) return res.status(400).json({ error: "Missing email or role" });

  try {
    if (role === "buyer") {
      const result = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/All%20Requests?filterByFormula=LOWER({Email})='${email.toLowerCase()}'`,
        {
          headers: { Authorization: `Bearer ${API_KEY}` },
        }
      );
      const data = await result.json();

      // Expand linked inspector details
      const records = await hydrateInspectors(data.records);
      return res.status(200).json(records);
    }

    if (role === "freelancer") {
      const freelancerRes = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/Freelancers?filterByFormula=LOWER({Email})='${email.toLowerCase()}'`,
        {
          headers: { Authorization: `Bearer ${API_KEY}` },
        }
      );
      const freelancerData = await freelancerRes.json();
      const freelancer = freelancerData.records?.[0];

      if (!freelancer) {
        return res.status(404).json({ error: "Freelancer not found" });
      }

      const freelancerId = freelancer.id;

      const requestsRes = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/All%20Requests?filterByFormula=ARRAYJOIN({Inspector Assigned}, ",")`,
        {
          headers: { Authorization: `Bearer ${API_KEY}` },
        }
      );
      const allRequests = await requestsRes.json();

      const filtered = allRequests.records.filter(
        (r) => (r.fields["Inspector Assigned"] || []).includes(freelancerId)
      );

      const enriched = await hydrateInspectors(filtered);
      return res.status(200).json(enriched);
    }

    return res.status(400).json({ error: "Invalid role value" });
  } catch (err) {
    console.error("❌ get-inspection-requests error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function hydrateInspectors(records) {
  const inspectorIds = records
    .map((r) => r.fields["Inspector Assigned"]?.[0])
    .filter(Boolean);

  const uniqueIds = [...new Set(inspectorIds)];

  const inspectorMap = {};

  for (const id of uniqueIds) {
    const res = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/Freelancers/${id}`,
      {
        headers: { Authorization: `Bearer ${API_KEY}` },
      }
    );
    const data = await res.json();
    if (data?.fields) {
      inspectorMap[id] = data.fields;
    }
  }

  return records.map((r) => {
    const inspectorId = r.fields["Inspector Assigned"]?.[0];
    return {
      ...r,
      inspector: inspectorId ? inspectorMap[inspectorId] || null : null,
    };
  });
}
