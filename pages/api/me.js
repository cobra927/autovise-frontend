import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const AIRTABLE_BASE_ID = "appecuuGb7DHkki1s"; // Inspection Requests base
const AIRTABLE_KEY = process.env.AIRTABLE_INSPECTION_KEY;

export default async function handler(req, res) {
  const token = req.cookies?.autoviseToken;

  if (!token) {
    return res.status(401).json({ error: "No token found" });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);

    // 🔍 Patch: fetch correct freelancer record ID (for Airtable match)
    if (user.role === "freelancer") {
      const lookup = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Freelancers?filterByFormula=LOWER({Email})='${user.email.toLowerCase()}'`,
        {
          headers: { Authorization: `Bearer ${AIRTABLE_KEY}` },
        }
      );
      const data = await lookup.json();
      const recordId = data.records?.[0]?.id;

      if (recordId) {
        user.id = recordId; // ✅ Patch ID to match Inspector Assigned in Airtable
        console.log("🔁 Patched freelancer.id to:", recordId);
      } else {
        console.warn("⚠️ No matching freelancer record found in Inspection base.");
      }
    }

    return res.status(200).json({ success: true, user });
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
