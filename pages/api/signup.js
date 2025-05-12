// pages/api/signup.js

const AIRTABLE_BASE_ID = "appxHCXtQtKJOUvnR";
const AIRTABLE_TABLE = "All users";
const AIRTABLE_KEY = process.env.AIRTABLE_FREELANCER_KEY;
const AIRTABLE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Step 1: Check for existing email in Airtable
    const checkRes = await fetch(
      `${AIRTABLE_URL}?filterByFormula=LOWER({Email})='${email.toLowerCase()}'`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_KEY}`,
        },
      }
    );

    const checkData = await checkRes.json();
    if (checkData.records && checkData.records.length > 0) {
      return res.status(409).json({ error: "Account already exists" });
    }

    // Step 2: Create new user in Airtable
    const createRes = await fetch(AIRTABLE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          Name: name,
          Email: email,
          Password: password,
          Role: role,
        },
      }),
    });

    const responseText = await createRes.text();
    if (!createRes.ok) {
      console.error("Airtable create error:", responseText);
      return res.status(500).json({ error: "Airtable create failed", detail: responseText });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Signup API error:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
}
