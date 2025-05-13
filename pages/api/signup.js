import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

const AIRTABLE_BASE_ID = "appxHCXtQtKJOUvnR";
const AIRTABLE_TABLE = "All users";
const AIRTABLE_KEY = process.env.AIRTABLE_FREELANCER_KEY;
const AIRTABLE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE)}`;
const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const formula = `LOWER({Email})='${email.toLowerCase()}'`;
    const checkRes = await fetch(
      `${AIRTABLE_URL}?filterByFormula=${encodeURIComponent(formula)}`,
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

    const hashedPassword = await bcrypt.hash(password, 10);
    const createRes = await fetch(AIRTABLE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          Name: name,
          Email: email.toLowerCase(),
          Password: hashedPassword,
          Role: role,
        },
      }),
    });

    const created = await createRes.json();
    if (!created.id) {
      return res.status(500).json({ error: "Airtable create failed", detail: created });
    }

    // Create JWT
    const token = jwt.sign(
      { email: email.toLowerCase(), role, id: created.id },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const cookie = serialize("autoviseToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    res.setHeader("Set-Cookie", cookie);
    return res.status(200).json({ success: true, role });
  } catch (err) {
    console.error("Signup API error:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
}
