import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
  const token = req.cookies?.autoviseToken;

  if (!token) {
    return res.status(401).json({ error: "No token found" });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    return res.status(200).json({ success: true, user });
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
