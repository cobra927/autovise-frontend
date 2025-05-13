const BASE_ID = "appecuuGb7DHkki1s";
const API_KEY = process.env.AIRTABLE_INSPECTION_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { recordId } = req.body;
  if (!recordId) {
    return res.status(400).json({ error: "Missing recordId" });
  }

  try {
    // Step 1: Get current request to find its current freelancer
    const requestRes = await fetch(`https://api.airtable.com/v0/${BASE_ID}/All%20Requests/${recordId}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    const requestData = await requestRes.json();
    const freelancerId = requestData.fields["Inspector Assigned"]?.[0];

    // Step 2: Clear inspector on the request
    await fetch(`https://api.airtable.com/v0/${BASE_ID}/All%20Requests/${recordId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          Status: "Declined",
          "Inspector Assigned": null,
        },
      }),
    });

    // Step 3: Remove the request link from the freelancer record
    if (freelancerId) {
      const freelancerRes = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/Freelancers/${freelancerId}`,
        {
          headers: { Authorization: `Bearer ${API_KEY}` },
        }
      );
      const freelancerData = await freelancerRes.json();
      const currentLinks = freelancerData.fields["All Requests"] || [];

      const updatedLinks = currentLinks.filter((id) => id !== recordId);
      await fetch(`https://api.airtable.com/v0/${BASE_ID}/Freelancers/${freelancerId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fields: { "All Requests": updatedLinks } }),
      });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ decline-job error:", err);
    return res.status(500).json({ error: err.message });
  }
}
