
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, MapPin, TrendingUp } from "lucide-react";
import { useCallback } from "react";

const licenseeBenefits = [{
  icon: TrendingUp,
  title: "High-Growth Industry",
  description: "Capitalize on the rapidly expanding wellness and recovery market that's projected to grow exponentially."
}, {
  icon: CheckCircle,
  title: "Turnkey System",
  description: "Benefit from our comprehensive training, marketing support, and proven business model."
}, {
  icon: MapPin,
  title: "Prime Territories",
  description: "Secure exclusive territories in high-demand markets across the United States."
}];

const licenseeFeatures = [
  "Comprehensive training program and ongoing support",
  "Established brand with proven market demand",
  "Multiple revenue streams (services and product sales)",
  "Marketing and customer acquisition systems",
  "Dedicated license success team",
  "Exclusive supply chain and vendor relationships",
  "All equipment included (cold plunges, hyperbaric chambers, and more)",
];

const LicenseeSection = () => {
  // scrollToContact defined here to use in the button
  const scrollToContact = useCallback(() => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return <section id="licensee" className="py-20 bg-black border-t border-white/5">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 bg-white/5 text-white rounded-full font-medium mb-4">
            Licensee Opportunities
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight">
            Own a REST RECOVERY License
          </h2>
          <p className="text-lg text-white/80">
            Join our growing network of wellness entrepreneurs who are transforming lives 
            through our proven recovery business model.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {licenseeBenefits.map((benefit, index) => <div key={index} className="bg-black/30 border border-white/10 p-8 rounded-2xl backdrop-blur-md hover:border-white/20 transition-all">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-6">
                <benefit.icon size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white tracking-tight">{benefit.title}</h3>
              <p className="text-white/70">{benefit.description}</p>
            </div>)}
        </div>

        <div className="bg-white/5 text-white rounded-2xl p-8 md:p-12 border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <h3 className="text-2xl font-bold mb-6 tracking-tight">Why REST RECOVERY License?</h3>
              <ul className="space-y-4">
                {licenseeFeatures.map((feature, index) => <li key={index} className="flex items-start">
                    <CheckCircle className="mr-3 mt-1 flex-shrink-0" size={20} />
                    <span className="text-white/80">{feature}</span>
                  </li>)}
              </ul>
              
              <div className="mt-8">
                <Button
                  className="bg-white text-black hover:bg-white/90 px-6 py-3 rounded-full flex items-center group"
                  onClick={scrollToContact}
                >
                  Request License Info
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-center">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 w-full border border-white/10">
                <h4 className="text-xl font-semibold mb-4 tracking-tight">Investment Details</h4>
                <div className="space-y-6">
                  <div>
                    <div className="text-3xl font-bold mb-1">$35,000</div>
                    <p className="text-sm text-white/70">Initial down payment</p>
                  </div>
                  <div>
                    <div className="text-3xl font-bold mb-1">$180K - $250K</div>
                    <p className="text-sm text-white/70">Total investment range</p>
                  </div>
                  <div>
                    <div className="text-3xl font-bold mb-1">$400K - $700K</div>
                    <p className="text-sm text-white/70">Average yearly income</p>
                  </div>
                </div>
                
                <h4 className="text-xl font-semibold mb-4 border-t border-white/10 pt-4 mt-6 tracking-tight">Available Territories</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center">
                    <MapPin size={16} className="mr-2" />
                    <span className="text-white/80">West Coast</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin size={16} className="mr-2" />
                    <span className="text-white/80">Midwest</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin size={16} className="mr-2" />
                    <span className="text-white/80">South</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin size={16} className="mr-2" />
                    <span className="text-white/80">East Coast</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
};

export default LicenseeSection;

