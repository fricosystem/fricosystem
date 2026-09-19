import { Clock, Heart, Medal, Users } from "lucide-react";

const AboutSection = () => {
  return (
    <section id="about" className="py-32 bg-gradient-to-b from-black to-zinc-900">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight animate-fade-in">
            Pioneering the Future of Recovery Wellness
          </h2>
          <p className="text-xl text-white/80 leading-relaxed animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Since our founding, REST RECOVERY has been at the forefront of recovery science, 
            helping thousands achieve optimal wellness through cutting-edge therapies and products.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-32 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-gradient-to-br from-zinc-900/50 to-black/50 border border-white/10 p-8 rounded-2xl backdrop-blur-md text-center transform hover:-translate-y-2 transition-all duration-300 hover:border-white/20"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-white/10 to-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <feature.icon size={28} className="text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-white tracking-tight">{feature.title}</h3>
              <p className="text-white/70 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <div className="space-y-6">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">
              Our Story
            </h3>
            <div className="space-y-6 text-lg text-white/80 leading-relaxed">
              <p>
                At Rest Recovery, we believe that true wellness begins with intentional restoration. 
                Our boutique wellness facilities are designed to help you recover, heal, and optimize 
                your body and mind using science-backed, high-performance therapies.
              </p>
              <p>
                We combine the latest in recovery technology—like cold plunges, infrared saunas, 
                hyperbaric chambers, float therapy, red light therapy, compression, PEMF, and salt 
                rooms—into a seamless, rejuvenating experience.
              </p>
              <p>
                Founded on the idea that recovery should be accessible, effective, and luxurious, 
                each of our locations is built with care, outfitted with industry-leading equipment, 
                and supported by knowledgeable staff who guide you through your wellness journey.
              </p>
              <p className="font-medium text-white italic">
                Welcome to the future of feeling good.
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-white/10 to-transparent rounded-2xl blur-lg"></div>
            <div className="relative rounded-2xl overflow-hidden border border-white/10">
              <img 
                alt="REST RECOVERY Logo" 
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

const features = [{
  icon: Medal,
  title: "Premium Quality",
  description: "Industry-leading recovery equipment and protocols backed by science."
}, {
  icon: Users,
  title: "Expert Support",
  description: "Dedicated team of wellness professionals to guide your journey."
}, {
  icon: Heart,
  title: "Holistic Approach",
  description: "Comprehensive recovery solutions addressing mind and body."
}, {
  icon: Clock,
  title: "Efficient Results",
  description: "Accelerate recovery and optimize performance in less time."
}];

export default AboutSection;
