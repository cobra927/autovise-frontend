// pages/api/submit.js

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { name, email, zip, vehicleInfo } = req.body;

  if (!name || !email || !zip) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const airtableRes = await fetch("https://api.airtable.com/v0/appecuuGb7DHkki1s/All%20Requests", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_INSPECTION_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          Name: name,
          Email: email,
          ZIP: zip,
          "Listing": vehicleInfo || "",
          Status: "Submitted",
        },
      }),
    });

    const data = await airtableRes.json();

    if (!data.id) {
      console.error("❌ Failed to create Airtable record:", data);
      return res.status(500).json({ error: "Airtable create failed" });
    }

    console.log("✅ Created Airtable record:", data.id);

    // 🔁 Call local /api/match-zip directly instead of Zapier
    const matchRes = await fetch(`${req.headers.origin}/api/match-zip`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        buyerZip: zip,
        recordId: data.id,
      }),
    });

    const matchData = await matchRes.json();
    if (!matchRes.ok) {
      console.error("❌ match-zip error:", matchData);
      return res.status(500).json({ error: "Inspector matching failed", detail: matchData });
    }

    return res.status(200).json({ recordId: data.id });
  } catch (err) {
    console.error("❌ Submit handler error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
