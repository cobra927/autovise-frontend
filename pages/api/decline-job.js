// pages/api/decline-job.js
const AIRTABLE_API_URL = "https://api.airtable.com/v0/appecuuGb7DHkki1s/All%20Requests";
const AIRTABLE_KEY = process.env.AIRTABLE_INSPECTION_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { recordId } = req.body;

  if (!recordId) {
    return res.status(400).json({ error: "Missing recordId" });
  }

  try {
    const response = await fetch(`${AIRTABLE_API_URL}/${recordId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${AIRTABLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          Status: "Declined",
          "Inspector Assigned": null,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Airtable update failed: ${text}`);
    }

    const updated = await response.json();
    return res.status(200).json({ success: true, updated });
  } catch (err) {
    console.error("❌ Decline-job error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}
