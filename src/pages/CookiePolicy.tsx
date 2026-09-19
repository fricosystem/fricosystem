
import Navbar from "@/components/Navbar";

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>
        <div className="prose prose-invert max-w-none">
          <p className="mb-6">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. What Are Cookies</h2>
            <p className="mb-4">Cookies are small text files that are stored on your computer or mobile device when you visit our website. They help us provide you with a better experience and allow certain features to work.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Cookies</h2>
            <p className="mb-4">We use cookies for:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Essential website functionality</li>
              <li>Analytics and performance</li>
              <li>User preferences</li>
              <li>Marketing and advertising</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Managing Cookies</h2>
            <p className="mb-4">You can control cookies through your browser settings. However, disabling certain cookies may limit your ability to use some features of our website.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Types of Cookies We Use</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>Essential cookies</li>
              <li>Analytics cookies</li>
              <li>Functionality cookies</li>
              <li>Targeting cookies</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;
