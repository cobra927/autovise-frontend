import jwt from "jsonwebtoken";

const BASE_ID = "appecuuGb7DHkki1s";
const API_KEY = process.env.AIRTABLE_INSPECTION_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
  const token = req.cookies?.autoviseToken;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  let user;
  try {
    user = jwt.verify(token, JWT_SECRET);

    if (user.role !== "freelancer") {
      return res.status(403).json({ error: "Only freelancers can access this route" });
    }

    // ✅ Patch: get freelancer's record ID from Airtable
    const lookup = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/Freelancers?filterByFormula=LOWER({Email})='${user.email.toLowerCase()}'`,
      {
        headers: { Authorization: `Bearer ${API_KEY}` },
      }
    );
    const data = await lookup.json();
    const recordId = data.records?.[0]?.id;

    if (recordId) {
      user.id = recordId;
      console.log("🔁 Patched user.id to match Airtable inspector:", user.id);
    }
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "Missing record ID" });

  try {
    const resAirtable = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/All%20Requests/${id}`,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}` },
      }
    );
    const data = await resAirtable.json();
    const assignedId = data.fields?.["Inspector Assigned"]?.[0];

    console.log("👤 JWT user.id:", user.id);
    console.log("📌 Assigned inspector ID:", assignedId);

    if (!assignedId) {
      return res.status(404).json({ error: "Request not assigned yet" });
    }

    if (assignedId !== user.id) {
      return res.status(403).json({ error: "You are not assigned to this request" });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("❌ inspect-request error:", err);
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
}
