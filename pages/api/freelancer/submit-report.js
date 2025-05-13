import jwt from "jsonwebtoken";

const AIRTABLE_BASE_ID = "appecuuGb7DHkki1s";
const AIRTABLE_KEY = process.env.AIRTABLE_INSPECTION_KEY;
const JWT_SECRET = process.env.JWT_SECRET;
const AIRTABLE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/All%20Requests`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const token = req.cookies?.autoviseToken;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  let user;
  try {
    user = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }

  if (user.role !== "freelancer") {
    return res.status(403).json({ error: "Only freelancers can submit reports" });
  }

  const { recordId, notes, photos = [], status = "Submitted" } = req.body;

  if (!recordId || !notes) {
    return res.status(400).json({ error: "Missing required fields: recordId or notes" });
  }

  try {
    // 🔍 Validate the freelancer is assigned to this request
    const resCheck = await fetch(`${AIRTABLE_URL}/${recordId}`, {
      headers: { Authorization: `Bearer ${AIRTABLE_KEY}` },
    });
    const record = await resCheck.json();

    const assignedId = record.fields?.["Inspector Assigned"]?.[0];
    if (assignedId !== user.id) {
      return res.status(403).json({ error: "You are not assigned to this inspection" });
    }

    // ✅ Patch Airtable with the report
    const patchRes = await fetch(`${AIRTABLE_URL}/${recordId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${AIRTABLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          "Inspection Report": notes,
          "Inspection Photos": photos,
          Status: status,
        },
      }),
    });

    if (!patchRes.ok) {
      const errorText = await patchRes.text();
      return res.status(500).json({ error: "Failed to save report", detail: errorText });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ submit-report error:", err);
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
}
