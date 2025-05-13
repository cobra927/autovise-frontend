import { serialize } from "cookie";

export default function handler(req, res) {
  const expiredCookie = serialize("autoviseToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  res.setHeader("Set-Cookie", expiredCookie);
  res.status(200).json({ success: true });
}
