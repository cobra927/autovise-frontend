const airtableBaseId = "appecuuGb7DHkki1s"; // Inspection base
const requestTable = "All Requests";
const inspectionUsersTable = "All users"; // In inspection base
const freelanceLogicTable = "freelance_logic";

const AIRTABLE_INSPECTION_KEY = process.env.AIRTABLE_INSPECTION_KEY;
const AIRTABLE_FREELANCER_KEY = process.env.AIRTABLE_FREELANCER_KEY;
const geoApiKey = process.env.GEOAPIFY_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { buyerZip, recordId } = req.body;

  if (!buyerZip || !recordId) {
    return res.status(400).json({ error: "Missing buyerZip or recordId" });
  }

  try {
    // Step 1: Get buyer coordinates
    const buyerRes = await fetch(
      `https://api.geoapify.com/v1/geocode/search?text=${buyerZip}&format=json&apiKey=${geoApiKey}`
    );
    const buyerData = await buyerRes.json();
    const buyerCoord = buyerData.results[0];
    if (!buyerCoord) return res.status(400).json({ error: "Invalid buyer ZIP" });

    const buyerLat = buyerCoord.lat;
    const buyerLon = buyerCoord.lon;
    console.log("📍 Buyer location:", buyerLat, buyerLon);

    // Step 2: Fetch freelancers from freelance_logic table (Signup base)
    const freelancersRes = await fetch(
      `https://api.airtable.com/v0/appxHCXtQtKJOUvnR/${freelanceLogicTable}`,
      {
        headers: { Authorization: `Bearer ${AIRTABLE_FREELANCER_KEY}` },
      }
    );
    const freelancerData = await freelancersRes.json();

    const matches = [];

    for (const record of freelancerData.records) {
      const zip = String(record.fields.ZIP);
      const radius = parseFloat(record.fields["Travel Radius (miles)"]) || 0;
      const email = record.fields.Email;
      const name = record.fields.Name;

      if (!zip || !radius || !email) continue;

      const locRes = await fetch(
        `https://api.geoapify.com/v1/geocode/search?text=${zip}&format=json&apiKey=${geoApiKey}`
      );
      const locData = await locRes.json();
      const coord = locData.results[0];
      if (!coord) continue;

      const distance = haversineDistance(buyerLat, buyerLon, coord.lat, coord.lon);
      console.log(`📦 Inspector ${name}: ZIP=${zip}, Distance=${distance.toFixed(2)}mi, Radius=${radius}mi`);

      if (distance <= radius) {
        matches.push({ name, email, zip, distance: distance.toFixed(1) });
      }
    }

    if (!matches.length) {
      return res.status(200).json({ recordId, matches: [] });
    }

    // Step 3: Find closest
    const closest = matches.sort((a, b) => a.distance - b.distance)[0];
    console.log("✅ Closest inspector:", closest);

    // Step 4: Look up inspector record ID from "All users" in the INSPECTION base
    const userLookupRes = await fetch(
      `https://api.airtable.com/v0/${airtableBaseId}/${encodeURIComponent(
        inspectionUsersTable
      )}?filterByFormula=LOWER({Email})='${closest.email.toLowerCase()}'`,
      {
        headers: { Authorization: `Bearer ${AIRTABLE_INSPECTION_KEY}` },
      }
    );
    const userLookupData = await userLookupRes.json();

    const matchedInspectorRecordId = userLookupData.records?.[0]?.id;

    if (!matchedInspectorRecordId) {
      console.error("❌ No matching Airtable record in Inspection base 'All users' for:", closest.email);
      return res.status(500).json({ error: "Inspector record not found in Inspection base" });
    }

    // Step 5: Assign inspector + update distance and ZIP
    const updateRes = await fetch(
      `https://api.airtable.com/v0/${airtableBaseId}/${requestTable}/${recordId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${AIRTABLE_INSPECTION_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            "Inspector Assigned": [matchedInspectorRecordId],
            Status: "Matched",
            "Matched ZIPs": closest.zip,
            "Match Distances": parseFloat(closest.distance),
          },
        }),
      }
    );

    const updateData = await updateRes.json();

    if (!updateRes.ok) {
      console.error("❌ Airtable update failed:", updateData);
      return res.status(500).json({ error: "Failed to update request" });
    }

    return res.status(200).json({ recordId, matches: [closest] });
  } catch (err) {
    console.error("❌ match-zip error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
