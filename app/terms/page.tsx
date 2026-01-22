import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - The Wild Studio',
  description: 'Terms of service for The Wild Studio photography services',
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <div className="prose max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Services</h2>
              <p className="text-gray-700">
                The Wild Studio provides professional photography services including but not limited to:
                portrait photography, event photography, commercial photography, and photo editing services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Booking and Payment</h2>
              <p className="text-gray-700 mb-4">
                All bookings require a deposit to secure the date and time. Final payment is due upon delivery of photos.
              </p>
              <p className="text-gray-700">
                Cancellations made within 48 hours of the scheduled session may result in forfeiture of the deposit.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Client Responsibilities</h2>
              <p className="text-gray-700">Clients are responsible for:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Arriving on time for scheduled sessions</li>
                <li>Providing accurate contact information</li>
                <li>Informing us of any special requirements or restrictions</li>
                <li>Obtaining necessary permissions for photo locations</li>
                <li>Payment for services rendered</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Copyright and Usage</h2>
              <p className="text-gray-700 mb-4">
                The Wild Studio retains copyright to all photographs. Clients receive usage rights for personal use.
              </p>
              <p className="text-gray-700">
                Commercial use of photographs requires additional licensing and fees. The Wild Studio reserves the right 
                to use photographs for portfolio and marketing purposes unless otherwise agreed in writing.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Delivery Timeline</h2>
              <p className="text-gray-700">
                Standard delivery time for edited photos is 2-3 weeks from the session date. 
                Rush delivery may be available for additional fees.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Limitation of Liability</h2>
              <p className="text-gray-700">
                The Wild Studio is not liable for circumstances beyond our control including weather, 
                equipment failure, or client no-shows. In such cases, we will reschedule at the earliest convenience.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Refunds</h2>
              <p className="text-gray-700">
                Refunds are considered on a case-by-case basis. If you are not satisfied with the service, 
                please contact us within 7 days of photo delivery to discuss resolution options.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Privacy</h2>
              <p className="text-gray-700">
                Your privacy is important to us. Please review our Privacy Policy at 
                <a href="/privacy" className="text-blue-600 hover:underline"> /privacy</a> for details on how we handle your information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to Terms</h2>
              <p className="text-gray-700">
                We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              <p className="text-gray-700">
                For questions about these Terms of Service, please contact:
              </p>
              <p className="text-gray-700 mt-2">
                The Wild Studio<br />
                Email: khanhtranproduction@gmail.com<br />
                Email: thewildstudio.nt@gmail.com<br />
                Phone: (832) 992-7879
              </p>
            </section>

            <section className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                By using our services, you agree to these Terms of Service. 
                Last updated: {new Date().toLocaleDateString()}.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
