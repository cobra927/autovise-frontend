const BASE_ID = "appecuuGb7DHkki1s";
const API_KEY = process.env.AIRTABLE_INSPECTION_KEY;

export default async function handler(req, res) {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Missing email" });

  try {
    // Step 1: Lookup freelancer by email in "Freelancers" table
    const freelancerRes = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/Freelancers?filterByFormula=LOWER({Email})='${email.toLowerCase()}'`,
      {
        headers: { Authorization: `Bearer ${API_KEY}` },
      }
    );

    const freelancerData = await freelancerRes.json();
    const freelancerRecord = freelancerData.records?.[0];

    if (!freelancerRecord) {
      return res.status(404).json({ error: "Freelancer not found" });
    }

    const requestIds = freelancerRecord.fields["All Requests"];
    if (!requestIds || !Array.isArray(requestIds)) {
      return res.status(200).json([]);
    }

    // Step 2: Hydrate linked All Requests
    const fullRequests = [];
    for (const id of requestIds) {
      const reqRes = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/All%20Requests/${id}`,
        {
          headers: { Authorization: `Bearer ${API_KEY}` },
        }
      );

      const data = await reqRes.json();
      if (data?.fields) {
        fullRequests.push({ id: data.id, fields: data.fields });
      }
    }

    return res.status(200).json(fullRequests);
  } catch (err) {
    console.error("❌ get-freelancer-dashboard error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
