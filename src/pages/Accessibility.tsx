
import Navbar from "@/components/Navbar";

const Accessibility = () => {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8">Accessibility Statement</h1>
        <div className="prose prose-invert max-w-none">
          <p className="mb-6">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Our Commitment</h2>
            <p className="mb-4">REST RECOVERY is committed to ensuring digital accessibility for people with disabilities. We continually improve the user experience for everyone and apply the relevant accessibility standards.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Accessibility Features</h2>
            <p className="mb-4">Our website strives to include:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Screen reader compatibility</li>
              <li>Keyboard navigation</li>
              <li>Clear content structure</li>
              <li>Alternative text for images</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Feedback</h2>
            <p className="mb-4">We welcome your feedback on the accessibility of our website. Please contact us if you encounter accessibility barriers.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Continuous Improvement</h2>
            <p>We are committed to maintaining and improving the accessibility of our website as technologies and standards evolve.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Accessibility;
