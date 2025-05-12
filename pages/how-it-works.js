export default function HowItWorks() {
    return (
      <div className="min-h-screen px-6 py-16 bg-[#F7F9FC] text-[#0A1F44] font-sans">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">How It Works</h1>
  
          <ol className="space-y-6 text-lg leading-relaxed list-decimal list-inside text-[#1A1A1A]">
            <li>
              <strong>Find a Car:</strong> Browse listings anywhere in the U.S. — local or out-of-state.
            </li>
            <li>
              <strong>Submit an Inspection Request:</strong> Use our form to share the listing, ZIP, and basic details.
            </li>
            <li>
              <strong>We Match You:</strong> Our system connects you with verified car enthusiasts near the seller’s ZIP code.
            </li>
            <li>
              <strong>Inspector Visits & Reviews:</strong> The freelancer inspects the car, takes photos, and reports back.
            </li>
            <li>
              <strong>You Decide:</strong> Use the detailed feedback to make a confident purchase decision.
            </li>
          </ol>
  
          <div className="mt-10">
            <a href="/inspect">
              <button className="px-6 py-3 bg-[#007BFF] text-white rounded hover:bg-blue-600">
                Request an Inspection
              </button>
            </a>
          </div>
        </div>
      </div>
    );
  }
  