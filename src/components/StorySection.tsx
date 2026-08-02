import { ArrowRight, Award, Users, Globe, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const StorySection = () => {
  return (
    <section className="py-12 md:py-20 lg:py-24 bg-gradient-to-b from-black via-zinc-900 to-black relative overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/50 to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Story Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <span className="inline-block px-4 py-2 bg-white/10 text-white rounded-full font-medium">
                Our Story
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
                Pioneering the Future of
                <span className="block bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                  Recovery Wellness
                </span>
              </h2>
              <p className="text-xl text-white/80 leading-relaxed">
                At Rest Recovery, we believe that true wellness begins with intentional restoration. 
                Our boutique wellness facilities are designed to help you recover, heal, and optimize 
                your body and mind using science-backed, high-performance therapies.
              </p>
            </div>

            <div className="space-y-6">
              <p className="text-lg text-white/70 leading-relaxed">
                We combine the latest in recovery technology—like cold plunges, infrared saunas, 
                hyperbaric chambers, float therapy, red light therapy, compression, PEMF, and salt 
                rooms—into a seamless, rejuvenating experience.
              </p>
              <p className="text-lg text-white/70 leading-relaxed">
                Founded on the idea that recovery should be accessible, effective, and luxurious, 
                each of our locations is built with care, outfitted with industry-leading equipment, 
                and supported by knowledgeable staff who guide you through your wellness journey.
              </p>
              <blockquote className="text-xl font-medium text-white italic border-l-4 border-white/20 pl-6">
                "Welcome to the future of feeling good."
              </blockquote>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{stat.number}</div>
                  <div className="text-sm text-white/60">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/licensee">
                <Button className="bg-white text-black hover:bg-white/90 px-8 py-4 rounded-full text-lg flex items-center gap-3 w-full sm:w-auto">
                  Explore Licensee Opportunities
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="absolute -inset-8 bg-gradient-to-r from-white/5 to-white/10 rounded-3xl blur-2xl" />
            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              <img 
                alt="REST RECOVERY Wellness Center" 
                className="w-full h-auto transform hover:scale-105 transition-transform duration-700" 
                src="/lovable-uploads/b75b628b-2cba-4748-8f80-792a5ae8ee1d.png" 
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const stats = [
  {
    icon: Globe,
    number: "20+",
    label: "Locations"
  },
  {
    icon: Users,
    number: "10K+",
    label: "Members"
  },
  {
    icon: Award,
    number: "98%",
    label: "Satisfaction"
  },
  {
    icon: Star,
    number: "5.0",
    label: "Rating"
  }
];

export default StorySection;