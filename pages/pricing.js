export default function Pricing() {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-800 px-6 py-16">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-6">Our Pricing Plans</h1>
          <p className="text-gray-600 mb-12">
            Choose the level of support that fits your needs. Whether you're buying a car sight unseen or negotiating a deal in person,
            Autovise has your back.
          </p>
  
          <div className="grid gap-8 md:grid-cols-3">
            {/* Tier 1 */}
            <div className="bg-white rounded shadow p-6 border border-gray-200">
              <h2 className="text-2xl font-semibold mb-2">Remote Listing Review</h2>
              <p className="text-gray-500 mb-4">Starts at $25</p>
              <p className="text-sm text-gray-700 mb-6">
                Get a virtual consultation with a specialist to assess the vehicle based on the online listing, photos, and seller details.
                Ideal for early-stage buyers who want an informed second opinion.
              </p>
              <ul className="text-sm text-left list-disc list-inside mb-6 text-gray-700">
                <li>Expert review of listing photos & details</li>
                <li>Live video or phone consultation</li>
                <li>Buy-or-pass recommendation</li>
              </ul>
            </div>
  
            {/* Tier 2 */}
            <div className="bg-white rounded shadow p-6 border-2 border-blue-600">
              <h2 className="text-2xl font-semibold mb-2">In-Person Inspection</h2>
              <p className="text-gray-500 mb-4">Starts at $95</p>
              <p className="text-sm text-gray-700 mb-6">
                Book a certified inspector to meet with the seller, inspect the vehicle thoroughly, and provide a full report with photos and
                recommendations.
              </p>
              <ul className="text-sm text-left list-disc list-inside mb-6 text-gray-700">
                <li>Full on-site visual and mechanical inspection</li>
                <li>Interior, exterior, and engine bay review</li>
                <li>Photo report + final recommendation</li>
              </ul>
            </div>
  
            {/* Tier 3 */}
            <div className="bg-white rounded shadow p-6 border border-gray-200">
              <h2 className="text-2xl font-semibold mb-2">Inspection + Price Negotiation</h2>
              <p className="text-gray-500 mb-4">Starts at $145</p>
              <p className="text-sm text-gray-700 mb-6">
                In addition to the in-person inspection, a specialist will assist you in negotiating a fair purchase price based on market
                trends and vehicle condition.
              </p>
              <ul className="text-sm text-left list-disc list-inside mb-6 text-gray-700">
                <li>All benefits from in-person inspection</li>
                <li>Market comparison + negotiation tips</li>
                <li>Optional real-time negotiation assistance</li>
              </ul>
              <p className="text-xs text-gray-500">
                *While price reductions are not guaranteed, our experts aim to help buyers make financially sound decisions.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  