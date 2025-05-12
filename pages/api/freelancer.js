export default async function handler(req, res) {
    if (req.method === "POST") {
      try {
        const zapierURL = "https://hooks.zapier.com/hooks/catch/22816873/2nix8b0/";
  
        const response = await fetch(zapierURL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(req.body),
        });
  
        if (!response.ok) throw new Error("Zapier request failed");
  
        return res.status(200).json({ success: true });
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    }
  
    return res.status(405).end();
  }
  