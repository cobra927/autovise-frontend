import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_FREELANCER_KEY }).base("appxHCXtQtKJOUvnR");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Missing email or password" });
  }

  try {
    const records = await base("All users")
      .select({
        filterByFormula: `{Email} = '${email}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (!records.length) {
      return res.status(401).json({ error: "Account not found" });
    }

    const user = records[0].fields;

    if (user.Password !== password) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    return res.status(200).json({ success: true, role: user.Role });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
