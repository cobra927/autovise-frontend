import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("role");
    setIsLoggedIn(!!role);
  }, []);

  return (
    <div className="min-h-screen bg-blue-900 text-white">
      <main className="flex flex-col items-center justify-center py-32 px-6 text-center">
        <h1 className="text-5xl font-bold mb-6">Buy cars confidently, even out of state.</h1>
        <p className="text-lg text-blue-100 max-w-xl mb-10">
          Autovise connects used car buyers with independent vehicle inspectors to ensure you get what you pay for—no surprises.
        </p>

        <div className="flex space-x-4">
          <Link
            href="/inspect"
            className="px-6 py-3 bg-white text-blue-900 font-semibold rounded hover:bg-gray-100"
          >
            Request an Inspection
          </Link>
          <Link
            href="/signup?role=freelancer"
            className="px-6 py-3 border border-white font-semibold rounded hover:bg-blue-800"
          >
            Become an Inspector
          </Link>
        </div>
      </main>
    </div>
  );
}
