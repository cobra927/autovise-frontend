// pages/_app.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Header from "@/components/Header";
import "@/styles/globals.css";

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifySession() {
      try {
        const res = await fetch("/api/me");
        const data = await res.json();

        if (!data.success) throw new Error();

        const { role } = data.user;
        const path = router.pathname;

        // Role-based route protection
        if (path.startsWith("/buyer") && role !== "buyer") {
          router.replace("/wrong-role");
        } else if (path.startsWith("/freelancer") && role !== "freelancer") {
          router.replace("/wrong-role");
        }
      } catch {
        // Fallback for unauthenticated access
        if (!["/login", "/signup", "/how-it-works"].includes(router.pathname)) {
          router.replace("/login");
        }
      } finally {
        setLoading(false);
      }
    }

    verifySession();
  }, [router.pathname]);

  if (loading) return null;

  return (
    <>
      <Header />
      <Component {...pageProps} />
    </>
  );
}
