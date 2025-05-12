// File: pages/api/submit.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const formData = req.body;

    // Forward data to Zapier webhook
    const zapierRes = await fetch("https://hooks.zapier.com/hooks/catch/22816873/2n1tztb/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (!zapierRes.ok) {
      throw new Error(`Zapier responded with status ${zapierRes.status}`);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
