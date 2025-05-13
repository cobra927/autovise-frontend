import { useEffect } from "react";
import { useRouter } from "next/router";

export default function PaymentPage() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;

    const { recordId, inspectorId, tier } = router.query;

    if (!tier || !inspectorId || !recordId) {
      alert("Missing required info. Returning to matches page.");
      router.replace("/inspect/matches");
      return;
    }

    console.log("💳 Submitting to Stripe:", { tier, inspectorId, recordId });

    fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier, inspectorId, recordId }),
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
  }, [router.isReady, router.query]);

  return <p className="p-8">Redirecting to Stripe Checkout...</p>;
}
