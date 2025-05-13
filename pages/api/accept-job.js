const BASE_ID = "appecuuGb7DHkki1s";
const API_KEY = process.env.AIRTABLE_INSPECTION_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { recordId, inspectorEmail } = req.body;
  if (!recordId || !inspectorEmail) {
    return res.status(400).json({ error: "Missing recordId or inspectorEmail" });
  }

  try {
    // Step 1: Accept the job
    const patchRes = await fetch(`https://api.airtable.com/v0/${BASE_ID}/All%20Requests/${recordId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields: { Status: "Accepted" } }),
    });

    if (!patchRes.ok) throw new Error("Failed to update request status");

    // Step 2: Ensure freelancer's All Requests field is updated
    const freelancerLookup = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/Freelancers?filterByFormula=LOWER({Email})='${inspectorEmail.toLowerCase()}'`,
      {
        headers: { Authorization: `Bearer ${API_KEY}` },
      }
    );
    const freelancerData = await freelancerLookup.json();
    const freelancer = freelancerData.records?.[0];

    if (!freelancer) throw new Error("Freelancer not found");

    const existing = freelancer.fields["All Requests"] || [];
    const alreadyLinked = existing.includes(recordId);
    if (!alreadyLinked) {
      await fetch(`https://api.airtable.com/v0/${BASE_ID}/Freelancers/${freelancer.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            "All Requests": [...existing, recordId],
          },
        }),
      });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ accept-job error:", err);
    return res.status(500).json({ error: err.message });
  }
}
