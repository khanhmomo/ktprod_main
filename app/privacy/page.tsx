import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - The Wild Studio',
  description: 'Privacy policy for The Wild Studio photography services',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <div className="prose max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Last Updated: {new Date().toLocaleDateString()}</h2>
              <p className="text-gray-700 mb-4">
                The Wild Studio ("we," "us," or "our") is committed to protecting the privacy and security of our clients and website visitors. 
                This Privacy Policy explains how we collect, use, share, and protect your information when you use our photography services, 
                visit our website, or interact with our business.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
              
              <h3 className="text-lg font-medium text-gray-900 mb-3">Client Information</h3>
              <p className="text-gray-700 mb-4">When you book our photography services, we collect:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
                <li><strong>Contact Information:</strong> Full name, email address, phone number, mailing address</li>
                <li><strong>Event Details:</strong> Event type, date, location, schedule, photography preferences</li>
                <li><strong>Payment Information:</strong> Billing address, payment method, transaction history</li>
                <li><strong>Communication Records:</strong> Emails, messages, and call notes related to your photography services</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mb-3">Photography Content</h3>
              <p className="text-gray-700 mb-4">We create and store:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
                <li><strong>Digital Images:</strong> Raw and edited photographs from your session or event</li>
                <li><strong>Video Content:</strong> Video recordings and edited video productions</li>
                <li><strong>Work Samples:</strong> Selected images for our portfolio (with your consent)</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mb-3">Website and Authentication Data</h3>
              <p className="text-gray-700 mb-4">When you use our website or client portal:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Google Authentication:</strong> Google user ID, name, and email address for secure login</li>
                <li><strong>Usage Data:</strong> IP address, browser type, device information, pages visited</li>
                <li><strong>Cookies:</strong> To enhance your experience and remember your preferences</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">We use your information to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Provide Photography Services:</strong> Schedule sessions, coordinate events, deliver final images</li>
                <li><strong>Process Payments:</strong> Handle billing, send invoices, process refunds</li>
                <li><strong>Client Communication:</strong> Send booking confirmations, updates, and deliverables</li>
                <li><strong>Portfolio and Marketing:</strong> Display selected work (with explicit consent), create promotional materials</li>
                <li><strong>Improve Services:</strong> Analyze feedback, enhance customer experience, develop new offerings</li>
                <li><strong>Legal Compliance:</strong> Maintain records, fulfill contractual obligations, protect legal rights</li>
                <li><strong>Website Security:</strong> Authenticate users, prevent fraud, maintain system integrity</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Sharing and Disclosure</h2>
              <p className="text-gray-700 mb-4">
                We respect your privacy and do not sell your personal information. We may share your information only in these limited circumstances:
              </p>
              
              <h3 className="text-lg font-medium text-gray-900 mb-3">Google OAuth Integration</h3>
              <p className="text-gray-700 mb-4">
                When you authenticate with Google, we receive your Google user ID, name, and email address. This information is:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
                <li>Used solely for authentication and account access</li>
                <li>Stored securely in our encrypted database</li>
                <li>Never shared with third parties for advertising purposes</li>
                <li>Never sold to data brokers or marketing companies</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mb-3">Service Providers</h3>
              <p className="text-gray-700 mb-4">We work with trusted third-party providers who help us deliver our services:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
                <li><strong>Payment Processors:</strong> Stripe, PayPal for secure payment processing</li>
                <li><strong>Cloud Storage:</strong> AWS, Google Cloud for secure image backup and delivery</li>
                <li><strong>Email Services:</strong> Mailchimp, SendGrid for client communications</li>
                <li><strong>Website Hosting:</strong> Vercel, AWS for website and application hosting</li>
              </ul>
              <p className="text-gray-700 mb-6">
                These providers have access only to information necessary for their services and are contractually obligated to protect your data.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mb-3">Legal and Business Requirements</h3>
              <p className="text-gray-700 mb-4">We may disclose information when:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Required by law, court order, or government request</li>
                <li>Necessary to protect our rights, property, or safety</li>
                <li>In connection with a business merger, acquisition, or sale</li>
                <li>To prevent fraud or comply with legal investigations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Photography Rights and Usage</h2>
              
              <h3 className="text-lg font-medium text-gray-900 mb-3">Client Rights</h3>
              <p className="text-gray-700 mb-4">As our client, you have:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
                <li><strong>Personal Use Rights:</strong> Full rights to use your photographs for personal, non-commercial purposes</li>
                <li><strong>Print Rights:</strong> Permission to print photos for personal display and sharing</li>
                <li><strong>Social Media:</strong> Rights to share images on personal social media accounts with proper credit</li>
                <li><strong>Original Files:</strong> Access to high-resolution digital files as specified in your contract</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mb-3">Studio Rights</h3>
              <p className="text-gray-700 mb-4">We retain certain rights to the photographs we create:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
                <li><strong>Portfolio Use:</strong> Right to display selected images in our portfolio and marketing materials (with client consent)</li>
                <li><strong>Artistic Rights:</strong> Right to use images for artistic and competitive purposes</li>
                <li><strong>Copyright:</strong> We retain copyright ownership of the images we create</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mb-3">Image Storage and Security</h3>
              <p className="text-gray-700 mb-4">
                Your photographs are valuable assets. We implement multiple layers of protection:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Encrypted Storage:</strong> All images stored on encrypted cloud servers</li>
                <li><strong>Backup Systems:</strong> Automated daily backups to multiple geographic locations</li>
                <li><strong>Access Controls:</strong> Strict authentication and authorization protocols</li>
                <li><strong>Retention Policy:</strong> Images retained according to your contract terms</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Security</h2>
              <p className="text-gray-700 mb-4">
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Encryption:</strong> Data encrypted at rest and in transit using SSL/TLS</li>
                <li><strong>Access Controls:</strong> Limited access to authorized personnel only</li>
                <li><strong>Regular Audits:</strong> Periodic security assessments and vulnerability testing</li>
                <li><strong>Employee Training:</strong> Staff trained on privacy and security best practices</li>
                <li><strong>Secure Facilities:</strong> Physical security for our office and equipment</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights and Choices</h2>
              <p className="text-gray-700 mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal information</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your information (subject to legal and contractual obligations)</li>
                <li><strong>Portability:</strong> Request transfer of your data to another service</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Consent Withdrawal:</strong> Withdraw consent for specific data uses</li>
              </ul>
              <p className="text-gray-700 mt-4">
                To exercise these rights, contact us using the information below.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookies and Tracking</h2>
              <p className="text-gray-700 mb-4">
                We use cookies and similar technologies to enhance your website experience:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Essential Cookies:</strong> Required for website functionality and authentication</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our website</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
              </ul>
              <p className="text-gray-700 mt-4">
                You can control cookie settings through your browser preferences.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Children's Privacy</h2>
              <p className="text-gray-700">
                Our services are not directed to children under 13. We do not knowingly collect personal information 
                from children under 13. If we become aware that we have collected such information, we will take steps 
                to delete it immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">International Data Transfers</h2>
              <p className="text-gray-700">
                Your information may be transferred to and processed in countries other than your own. We ensure 
                appropriate safeguards are in place to protect your data in accordance with applicable data protection laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to This Policy</h2>
              <p className="text-gray-700">
                We may update this Privacy Policy from time to time. We will notify you of any changes by:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Posting the updated policy on our website</li>
                <li>Sending email notifications to active clients</li>
                <li>Updating the "Last Updated" date at the top of this policy</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have questions about this Privacy Policy or want to exercise your rights, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <p className="text-gray-700">
                  <strong>The Wild Studio</strong><br />
                  Email: khanhtranproduction@gmail.com<br />
                  Email: thewildstudio.nt@gmail.com<br />
                  Phone: (832) 992-7879<br />
                  Website: www.thewildstudio.com
                </p>
              </div>
            </section>

            <section className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                This Privacy Policy is a legal agreement between you and The Wild Studio. By using our services 
                or website, you agree to the collection and use of information as described in this policy.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
