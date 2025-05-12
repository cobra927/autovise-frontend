// pages/_app.js
import { useEffect } from "react";
import { useRouter } from "next/router";
import Header from "@/components/Header";
import "@/styles/globals.css";

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const role = localStorage.getItem("role");
    const path = router.pathname;

    // Route protection: redirect if user is not the correct role
    if (path.startsWith("/buyer") && role !== "buyer") {
      router.replace("/login");
    } else if (path.startsWith("/freelancer") && role !== "freelancer") {
      router.replace("/login");
    }
  }, [router]);

  return (
    <>
      <Header />
      <Component {...pageProps} />
    </>
  );
}
