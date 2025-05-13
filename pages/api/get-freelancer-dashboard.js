import jwt from "jsonwebtoken";

const BASE_ID = "appecuuGb7DHkki1s";
const API_KEY = process.env.AIRTABLE_INSPECTION_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
  const token = req.cookies?.autoviseToken;

  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const user = jwt.verify(token, JWT_SECRET);

    if (user.role !== "freelancer") {
      return res.status(403).json({ error: "Access denied" });
    }

    const email = user.email.toLowerCase();

    // Step 1: Lookup freelancer by email
    const freelancerRes = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/Freelancers?filterByFormula=LOWER({Email})='${email}'`,
      {
        headers: { Authorization: `Bearer ${API_KEY}` },
      }
    );

    const freelancerData = await freelancerRes.json();
    const freelancerRecord = freelancerData.records?.[0];

    if (!freelancerRecord) {
      return res.status(404).json({ error: "Freelancer not found" });
    }

    const requestIds = freelancerRecord.fields["All Requests"];
    if (!requestIds || !Array.isArray(requestIds)) {
      return res.status(200).json([]);
    }

    // Step 2: Hydrate All Requests
    const fullRequests = [];
    for (const id of requestIds) {
      const reqRes = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/All%20Requests/${id}`,
        {
          headers: { Authorization: `Bearer ${API_KEY}` },
        }
      );

      const data = await reqRes.json();
      if (data?.fields) {
        fullRequests.push({ id: data.id, fields: data.fields });
      }
    }

    return res.status(200).json(fullRequests);
  } catch (err) {
    console.error("❌ get-freelancer-dashboard error:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
