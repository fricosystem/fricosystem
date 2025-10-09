
import Navbar from "@/components/Navbar";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <div className="prose prose-invert max-w-none">
          <p className="mb-6">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">By accessing and using REST RECOVERY's services, you agree to be bound by these Terms of Service.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Services Description</h2>
            <p className="mb-4">REST RECOVERY provides wellness and recovery services, products, and licensee opportunities. We reserve the right to modify or discontinue any service without notice.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Responsibilities</h2>
            <p className="mb-4">You agree to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Provide accurate information</li>
              <li>Maintain the confidentiality of your account</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Use services as intended</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Limitation of Liability</h2>
            <p>REST RECOVERY shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use our services.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
