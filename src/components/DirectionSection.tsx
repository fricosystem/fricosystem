import { ArrowRight, ShoppingBag, MapPin, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const DirectionSection = () => {
  return (
    <section className="py-12 md:py-20 lg:py-24 bg-gradient-to-b from-zinc-900 to-black relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/3 rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-4xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8 tracking-tight leading-tight">
            Choose Your
            <span className="block bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
              Wellness Journey
            </span>
          </h2>
          <p className="text-xl text-white/70 leading-relaxed">
            Whether you're looking to enhance your personal wellness or build a thriving business, 
            we have the perfect solution for you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Shop Section */}
          <div className="group bg-gradient-to-br from-zinc-900/80 to-black/80 border border-white/10 rounded-3xl p-10 backdrop-blur-md hover:border-white/20 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
            <div className="flex items-center mb-8">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mr-6">
                <ShoppingBag className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-white mb-2">Shop Products</h3>
                <p className="text-white/60">For Personal & Professional Use</p>
              </div>
            </div>

            <div className="space-y-6 mb-10">
              <p className="text-lg text-white/80 leading-relaxed">
                Bring professional-grade recovery technology to your home or business. 
                Our equipment is trusted by elite athletes, wellness centers, and health professionals worldwide.
              </p>
              
              <div className="space-y-4">
                {shopFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-2 h-2 bg-white rounded-full mr-4" />
                    <span className="text-white/70">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link to="/shop">
              <Button className="bg-white text-black hover:bg-white/90 w-full py-4 rounded-xl text-lg font-semibold flex items-center justify-center gap-3 group-hover:shadow-lg transition-all duration-300">
                Browse Equipment
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {/* Licensee Section */}
          <div className="group bg-gradient-to-br from-zinc-900/80 to-black/80 border border-white/10 rounded-3xl p-10 backdrop-blur-md hover:border-white/20 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
            <div className="flex items-center mb-8">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mr-6">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-3xl font-bold text-white mb-2">Open a Location</h3>
                <p className="text-white/60">Licensee Opportunity</p>
              </div>
            </div>

            <div className="space-y-6 mb-10">
              <p className="text-lg text-white/80 leading-relaxed">
                Join our growing network of successful wellness entrepreneurs. 
                Build a thriving business in the booming recovery wellness industry with our proven licensee model.
              </p>
              
              <div className="space-y-4">
                {licenseeFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-2 h-2 bg-white rounded-full mr-4" />
                    <span className="text-white/70">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link to="/licensee">
              <Button className="bg-white text-black hover:bg-white/90 w-full py-4 rounded-xl text-lg font-semibold flex items-center justify-center gap-3 group-hover:shadow-lg transition-all duration-300">
                Explore Opportunities
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <div key={index} className="text-center group">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white/10 transition-colors">
                <stat.icon className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.number}</div>
              <div className="text-white/60 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const shopFeatures = [
  "Professional-grade equipment",
  "Complete warranty coverage",
  "Free shipping included",
  "Expert installation support",
  "Ongoing technical assistance"
];

const licenseeFeatures = [
  "Proven business model",
  "Comprehensive training program",
  "Marketing & operational support",
  "Protected territory rights",
  "Growing industry demand"
];

const stats = [
  {
    icon: MapPin,
    number: "20+",
    label: "Active Locations"
  },
  {
    icon: Users,
    number: "500+",
    label: "Equipment Sold"
  },
  {
    icon: TrendingUp,
    number: "98%",
    label: "Client Satisfaction"
  },
  {
    icon: ShoppingBag,
    number: "24/7",
    label: "Support Available"
  }
];

export default DirectionSection;