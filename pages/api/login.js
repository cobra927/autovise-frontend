import Airtable from "airtable";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

const base = new Airtable({ apiKey: process.env.AIRTABLE_FREELANCER_KEY }).base("appxHCXtQtKJOUvnR");

const JWT_SECRET = process.env.JWT_SECRET; // Add to your .env.local

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
        filterByFormula: `LOWER({Email}) = '${email.toLowerCase()}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (!records.length) {
      return res.status(401).json({ error: "Account not found" });
    }

    const user = records[0].fields;
    const passwordMatch = await bcrypt.compare(password, user.Password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    const token = jwt.sign(
      {
        email: user.Email,
        role: user.Role,
        id: records[0].id,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const cookie = serialize("autoviseToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    res.setHeader("Set-Cookie", cookie);
    return res.status(200).json({ success: true, role: user.Role });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
