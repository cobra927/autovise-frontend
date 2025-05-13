import Link from "next/link";

export default function WrongRolePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-yellow-50 text-gray-800 px-4">
      <div className="bg-white p-8 rounded shadow-md text-center max-w-md w-full">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Restricted</h1>
        <p className="mb-4">
          You’re currently signed in with a <strong>freelancer</strong> account.
          Only buyers can request vehicle inspections.
        </p>
        <p className="mb-6">
          To proceed, please create a buyer account instead.
        </p>

        <Link href="/signup">
          <a className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            Sign Up as a Buyer
          </a>
        </Link>
      </div>
    </div>
  );
}
