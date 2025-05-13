import jwt from "jsonwebtoken";

const AIRTABLE_API_URL = "https://api.airtable.com/v0/appecuuGb7DHkki1s/All%20Requests";
const AIRTABLE_KEY = process.env.AIRTABLE_INSPECTION_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const token = req.cookies?.autoviseToken;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  let user;
  try {
    user = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }

  const { name, zip, vehicleInfo } = req.body;
  const email = user.email;

  if (!name || !email || !zip) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const airtableRes = await fetch(AIRTABLE_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          Name: name,
          "Buyer Email": email, // <- Set to authenticated user
          ZIP: zip,
          Listing: vehicleInfo || "",
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

    // 🔁 Optionally match ZIP here if needed
    return res.status(200).json({ recordId: data.id });
  } catch (err) {
    console.error("❌ Submit handler error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
