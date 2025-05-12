import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function SuccessPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const { recordId, tier, inspectorId } = router.query;

    if (!recordId || !tier || !inspectorId || submitted) return;

    console.log("🚀 Success redirect params:", { recordId, tier, inspectorId });

    fetch("/api/mark-paid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recordId,
        tier,
        inspectorId,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ Payment marked in Airtable:", data);
        setSubmitted(true);
        localStorage.removeItem("selectedTier");
        localStorage.removeItem("selectedInspector");
        localStorage.removeItem("selectedInspectorId");
        localStorage.removeItem("recordId");
      })
      .catch((err) => {
        console.error("❌ Error marking payment:", err);
      });
  }, [router.query, submitted]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-8">
      <h1 className="text-3xl font-bold mb-4">Payment Successful 🎉</h1>
      <p className="mb-6">Your request is confirmed. We'll notify the assigned inspector shortly.</p>
      <a
        href="/buyer/dashboard"
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
      >
        Go to Dashboard
      </a>
    </div>
  );
}
