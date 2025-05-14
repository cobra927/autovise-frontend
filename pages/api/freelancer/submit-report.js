import jwt from "jsonwebtoken";

const AIRTABLE_BASE_ID = "appecuuGb7DHkki1s";
const AIRTABLE_KEY = process.env.AIRTABLE_INSPECTION_KEY;
const JWT_SECRET = process.env.JWT_SECRET;
const AIRTABLE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/All%20Requests`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const token = req.cookies?.autoviseToken;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  let user;
  try {
    user = jwt.verify(token, JWT_SECRET);

    if (user.role !== "freelancer") return res.status(403).json({ error: "Only freelancers can submit reports" });

    const lookup = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Freelancers?filterByFormula=LOWER({Email})='${user.email.toLowerCase()}'`,
      {
        headers: { Authorization: `Bearer ${AIRTABLE_KEY}` },
      }
    );

    const data = await lookup.json();
    const recordIdFromFreelancerBase = data.records?.[0]?.id;
    if (recordIdFromFreelancerBase) user.id = recordIdFromFreelancerBase;
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }

  const { recordId, notes, photos = [], checklist = {} } = req.body;
  if (!recordId || !notes) return res.status(400).json({ error: "Missing required fields: recordId or notes" });

  try {
    const resCheck = await fetch(`${AIRTABLE_URL}/${recordId}`, {
      headers: { Authorization: `Bearer ${AIRTABLE_KEY}` },
    });
    const record = await resCheck.json();

    const assignedId = record.fields?.["Inspector Assigned"]?.[0];
    if (assignedId !== user.id) return res.status(403).json({ error: "You are not assigned to this inspection" });

    const tier = record.fields?.["Tier Selected"] || "";
    const tierRequirements = {
      "Remote Listing Review": ["marketAnalysis", "photoReview", "recommendation"],
      "In-Person Inspection": ["exterior", "interior", "engine", "testDrive", "photos"],
      "In-Person + Negotiation": ["exterior", "interior", "engine", "testDrive", "photos", "negotiation"],
    };

    const required = tierRequirements[tier] || [];
    const missing = required.filter((key) => !checklist?.[key]);

    if (missing.length) {
      return res.status(400).json({ error: "Missing required checklist items", missing });
    }

    const patch = await fetch(`${AIRTABLE_URL}/${recordId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${AIRTABLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          Status: "Completed",
          "Inspection Report": notes,
          "Inspection Photos": photos,
          "Checklist JSON": JSON.stringify(checklist),
          "Report Submitted At": new Date().toISOString(),
        },
      }),
    });

    if (!patch.ok) {
      const text = await patch.text();
      return res.status(500).json({ error: "Failed to save report", detail: text });
    }

    // 📨 Send email notification to buyer
    const full = await fetch(`${AIRTABLE_URL}/${recordId}`, {
      headers: { Authorization: `Bearer ${AIRTABLE_KEY}` },
    });
    const finalRecord = await full.json();
    const buyerEmail = finalRecord.fields?.["Buyer Email"];
    const buyerName = finalRecord.fields?.["Name"] || "there";

    if (buyerEmail) {
      await fetch(`${process.env.BASE_URL}/api/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: buyerEmail,
          subject: "Your Autovise Inspection is Complete",
          html: `<p>Hi ${buyerName},<br/>Your inspection report is now ready.<br/><a href="https://autovise.vercel.app/login">Log in to view your report</a>.</p>`,
        }),
      });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ submit-report error:", err);
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
}
