const signupBaseId = "appxHCXtQtKJOUvnR"; // Base: Signup
const inspectionBaseId = "appecuuGb7DHkki1s"; // Base: Inspection Requests

const freelancerSourceTable = "freelance_logic";
const freelancerTargetTable = "Freelancers";

const AIRTABLE_FREELANCER_KEY = process.env.AIRTABLE_FREELANCER_KEY;
const AIRTABLE_INSPECTION_KEY = process.env.AIRTABLE_INSPECTION_KEY;
const geoApiKey = process.env.GEOAPIFY_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { buyerZip, recordId } = req.body;
  if (!buyerZip || !recordId) return res.status(400).json({ error: "Missing buyerZip or recordId" });

  try {
    const buyerRes = await fetch(
      `https://api.geoapify.com/v1/geocode/search?text=${buyerZip}&format=json&apiKey=${geoApiKey}`
    );
    const buyerData = await buyerRes.json();
    const buyerCoord = buyerData.results?.[0];
    if (!buyerCoord) return res.status(400).json({ error: "Invalid buyer ZIP" });

    const buyerLat = buyerCoord.lat;
    const buyerLon = buyerCoord.lon;

    const freelancerRes = await fetch(
      `https://api.airtable.com/v0/${signupBaseId}/${freelancerSourceTable}`,
      {
        headers: { Authorization: `Bearer ${AIRTABLE_FREELANCER_KEY}` },
      }
    );
    const freelancerData = await freelancerRes.json();

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
      const coord = locData.results?.[0];
      if (!coord) continue;

      const distance = haversineDistance(buyerLat, buyerLon, coord.lat, coord.lon);
      if (distance <= radius) {
        matches.push({ name, email, zip, distance: parseFloat(distance.toFixed(1)) });
      }
    }

    if (!matches.length) return res.status(200).json({ recordId, matches: [] });

    matches.sort((a, b) => a.distance - b.distance);

    const syncedMatches = [];
    for (const match of matches) {
      const lookupRes = await fetch(
        `https://api.airtable.com/v0/${inspectionBaseId}/${freelancerTargetTable}?filterByFormula=LOWER({Email})='${match.email.toLowerCase()}'`,
        {
          headers: { Authorization: `Bearer ${AIRTABLE_INSPECTION_KEY}` },
        }
      );
      const lookupData = await lookupRes.json();

      if (lookupData.records?.length) {
        match.id = lookupData.records[0].id;
        syncedMatches.push(match);
      } else {
        const createRes = await fetch(
          `https://api.airtable.com/v0/${inspectionBaseId}/${freelancerTargetTable}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${AIRTABLE_INSPECTION_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fields: {
                Name: match.name,
                Email: match.email,
                ZIP: match.zip,
              },
            }),
          }
        );
        const created = await createRes.json();
        if (createRes.ok && created.id) {
          match.id = created.id;
          syncedMatches.push(match);
        }
      }
    }

    return res.status(200).json({ recordId, matches: syncedMatches });
  } catch (err) {
    console.error("❌ match-zip error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
