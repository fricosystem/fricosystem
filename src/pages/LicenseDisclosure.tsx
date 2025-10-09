import Navbar from "@/components/Navbar";

const LicenseDisclosure = () => {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8">License Disclosure</h1>
        <div className="prose prose-invert max-w-none">
          <p className="mb-6">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. License Overview</h2>
            <p className="mb-4">This disclosure provides important information about the REST RECOVERY license program and the responsibilities of licensees.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Financial Requirements</h2>
            <p className="mb-4">Licensees must maintain:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Initial investment requirements</li>
              <li>Ongoing royalty payments</li>
              <li>Marketing fund contributions</li>
              <li>Working capital reserves</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Operational Standards</h2>
            <p className="mb-4">Licensees must adhere to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>REST RECOVERY operational procedures</li>
              <li>Quality control standards</li>
              <li>Training requirements</li>
              <li>Brand guidelines</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Territory Rights</h2>
            <p>Details about protected territories and expansion opportunities will be provided in the license agreement.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default LicenseDisclosure;
