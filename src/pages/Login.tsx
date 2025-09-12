import { Header } from "@/components/Login/Header";
import { Hero } from "@/components/Login/Hero";
import { Features } from "@/components/Login/Features";
import { Solutions } from "@/components/Login/Solutions";
import { Testimonials } from "@/components/Login/Testimonials";
import { Contact } from "@/components/Login/Contact";
import { Footer } from "@/components/Login/Footer";

const Login = () => {
  return (
    <div className="min-h-screen w-screen max-w-full overflow-x-hidden bg-green-100 dark:bg-gray-900/90 text-white flex flex-col">
      <Header />
      <main className="flex-grow w-full">
        <Hero />
        <Features />
        <Solutions />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </div>
  );
};

export default Login;