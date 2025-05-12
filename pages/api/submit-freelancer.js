export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).end();
  
    try {
      const zapierUrl = "https://hooks.zapier.com/hooks/catch/22816873/2nix8b0/";
  
      const zapRes = await fetch(zapierUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });
  
      if (!zapRes.ok) {
        const text = await zapRes.text();
        throw new Error(`Zapier responded with ${zapRes.status}: ${text}`);
      }
  
      res.status(200).json({ success: true });
    } catch (err) {
      console.error("❌ Failed to send to Zapier:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
  