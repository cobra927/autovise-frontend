import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Header() {
  const router = useRouter();
  const [role, setRole] = useState(null);
  const [showLogoutMessage, setShowLogoutMessage] = useState(false);

  // Update role state from localStorage and listen for changes
  useEffect(() => {
    const updateRole = () => {
      if (typeof window !== "undefined") {
        setRole(localStorage.getItem("role"));
      }
    };

    updateRole();

    router.events?.on("routeChangeComplete", updateRole);
    window.addEventListener("storage", updateRole);

    // Handle logout banner
    if (typeof window !== "undefined" && sessionStorage.getItem("loggedOut") === "true") {
      setShowLogoutMessage(true);
      sessionStorage.removeItem("loggedOut");

      setTimeout(() => setShowLogoutMessage(false), 3000);
    }

    return () => {
      router.events?.off("routeChangeComplete", updateRole);
      window.removeEventListener("storage", updateRole);
    };
  }, [router]);

  const dashboardPath =
    role === "freelancer" ? "/freelancer/dashboard" : "/buyer/dashboard";

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.setItem("loggedOut", "true");
    router.push("/");
  };

  return (
    <>
      <header className="w-full px-6 py-4 bg-[#0A1F44] shadow flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-white hover:text-blue-200">
          Autovise
        </Link>

        <nav className="flex space-x-6 text-sm text-white items-center">
          <Link href="/how-it-works" className="hover:text-blue-200">
            How it Works
          </Link>
          <Link href="/pricing" className="hover:text-blue-200">
            Pricing
          </Link>

          {role ? (
            <>
              <Link href={dashboardPath} className="hover:text-blue-200">
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                aria-label="Log Out"
              >
                Log Out
              </button>
            </>
          ) : (
            <Link href="/login" className="hover:text-blue-200">
              Log In / Sign Up
            </Link>
          )}
        </nav>
      </header>

      {showLogoutMessage && (
        <div className="bg-green-100 text-green-800 text-sm text-center py-2">
          You’ve been logged out successfully.
        </div>
      )}
    </>
  );
}
