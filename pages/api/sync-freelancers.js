export default async function handler(req, res) {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }
  
    const signupBaseId = "appxHCXtQtKJOUvnR"; // SIGNUP base
    const inspectionBaseId = "appecuuGb7DHkki1s"; // INSPECTION base
    const signupTable = "freelance_logic";
    const inspectionTable = "All users";
  
    const signupKey = process.env.AIRTABLE_FREELANCER_KEY;
    const inspectionKey = process.env.AIRTABLE_INSPECTION_KEY;
  
    try {
      const resFreelancers = await fetch(
        `https://api.airtable.com/v0/${signupBaseId}/${signupTable}`,
        {
          headers: {
            Authorization: `Bearer ${signupKey}`,
          },
        }
      );
  
      const { records } = await resFreelancers.json();
      if (!records?.length) throw new Error("No freelancers found");
  
      const insertResults = [];
  
      for (const record of records) {
        const { Email, Name, ZIP } = record.fields;
        if (!Email || !Name) continue;
  
        const checkRes = await fetch(
          `https://api.airtable.com/v0/${inspectionBaseId}/${encodeURIComponent(
            inspectionTable
          )}?filterByFormula=LOWER({Email})='${Email.toLowerCase()}'`,
          {
            headers: {
              Authorization: `Bearer ${inspectionKey}`,
            },
          }
        );
  
        const checkData = await checkRes.json();
        if (checkData.records.length > 0) {
          console.log(`🔁 Skipped duplicate: ${Email}`);
          continue;
        }
  
        const insertRes = await fetch(
          `https://api.airtable.com/v0/${inspectionBaseId}/${encodeURIComponent(inspectionTable)}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${inspectionKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fields: {
                Email,
                Name,
                ZIP: ZIP || "", // ✅ Sync ZIP if present
              },
            }),
          }
        );
  
        if (insertRes.ok) {
          insertResults.push(Email);
          console.log(`✅ Synced: ${Email}`);
        } else {
          const errorText = await insertRes.text();
          console.warn(`⚠️ Failed to sync ${Email}:`, errorText);
        }
      }
  
      return res.status(200).json({
        success: true,
        inserted: insertResults.length,
        emails: insertResults,
      });
    } catch (err) {
      console.error("❌ Sync failed:", err);
      return res.status(500).json({ error: err.message || "Sync failed" });
    }
  }
  