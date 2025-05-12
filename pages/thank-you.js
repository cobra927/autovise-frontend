export default function ThankYou() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Account Created</h1>
        <p className="text-gray-600 mb-6">Thanks for signing up! You’re all set.</p>

        <div className="space-y-3">
          <a
            href="/"
            className="block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Home
          </a>
          <a
            href="/login"
            className="block px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
          >
            Log in
          </a>
        </div>
      </div>
    </div>
  );
}
