// pages/api/submit-freelancer.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { name, email, experience, tools, travel, zip } = req.body;

  if (!name || !email || !experience || !zip) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const airtableRes = await fetch("https://api.airtable.com/v0/appxHCXtQtKJOUvnR/freelance_logic", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_FREELANCER_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          Name: name,
          Email: email,
          Experience: experience,
          Tools: tools,
          "Travel Radius (miles)": travel,
          ZIP: zip,
        },
      }),
    });

    if (!airtableRes.ok) {
      const errorDetails = await airtableRes.text();
      console.error("❌ Airtable error:", errorDetails);
      return res.status(500).json({ error: "Failed to save freelancer", detail: errorDetails });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ API error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
