// Redirects buyer to Stripe Checkout
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function PaymentPage() {
  const router = useRouter();

  useEffect(() => {
    const tier = localStorage.getItem("selectedTier");
    const inspector = JSON.parse(localStorage.getItem("selectedInspector") || "{}");
    const recordId = localStorage.getItem("recordId");

    if (!tier || !recordId) {
      alert("Missing required info. Returning to matches page.");
      router.push("/inspect/matches");
      return;
    }

    // Ensure inspector.id exists
    inspector.id = inspector.id || localStorage.getItem("selectedInspectorId");

    if (!inspector.id) {
      alert("Missing inspector ID. Please re-select match.");
      router.push("/inspect/matches");
      return;
    }

    console.log("💳 Submitting to Stripe:", { tier, inspector, recordId });

    fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier, inspector, recordId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.url) {
          window.location.href = data.url;
        } else {
          console.error("❌ Stripe error response:", data);
          alert("Payment redirect failed.");
        }
      })
      .catch((err) => {
        console.error("❌ Fetch error:", err);
        alert("Failed to create checkout session.");
      });
  }, [router]);

  return <p className="p-8">Redirecting to Stripe Checkout...</p>;
}
