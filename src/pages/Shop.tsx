import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Thermometer, 
  Snowflake, 
  Droplet, 
  Lightbulb, 
  Zap, 
  Heart,
  ArrowLeft,
  ShoppingCart,
  Star,
  Sun,
  Waves,
  Activity,
  Cloud,
  Cylinder,
  Layers,
  Bath,
  ChevronDown
} from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactSection from "@/components/ContactSection";
import { useIsMobile } from "@/hooks/use-mobile";

const Shop = () => {
  const isMobile = useIsMobile();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleInquire = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const ProductCard = ({ product }: { product: any }) => (
    <Card className="bg-black/40 border-yellow-500/30 hover:border-yellow-400 transition-all duration-300 group">
      <div className="relative overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-white text-lg group-hover:text-yellow-400 transition-colors">
            {product.name}
          </CardTitle>
          <div className="flex items-center">
            {product.icon}
          </div>
        </div>
        <div className="flex items-center gap-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          ))}
          <span className="text-white/60 text-sm ml-2">(4.9)</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="text-white/80 mb-4 h-20 overflow-hidden">
          {product.description}
        </CardDescription>
        <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
          <p className="text-white/70 text-sm italic">
            "Amazing quality and results. This equipment has transformed our recovery program!"
          </p>
          <p className="text-yellow-400 text-xs mt-2 font-semibold">- Verified Customer</p>
        </div>
        <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold" onClick={handleInquire}>
          <ShoppingCart className="w-4 h-4 mr-2" />
          Get Quote
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-black via-gray-900 to-black py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Link to="/" className="inline-flex items-center text-yellow-400 hover:text-yellow-300 mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Recovery Equipment
              <span className="block text-yellow-400">Shop</span>
            </h1>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Discover our premium collection of recovery equipment designed for peak performance and optimal wellness.
            </p>
            <p className="text-center text-yellow-400 font-semibold italic text-lg">
              ALL SHIPPING AND WARRANTY INCLUDED
            </p>
          </div>
        </div>
      </section>

      {/* Navigation Buttons */}
      <section className="py-6 bg-black/50 sticky top-20 z-40 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4">
          {/* Mobile Dropdown Menu */}
          <div className="md:hidden">
            <div className="relative">
              <select 
                className="w-full bg-black/80 border border-yellow-500/50 text-white rounded-xl px-4 py-3 text-lg font-medium appearance-none cursor-pointer focus:outline-none focus:border-yellow-500"
                onChange={(e) => {
                  if (e.target.value === 'home') {
                    window.location.href = '/';
                  } else if (e.target.value) {
                    scrollToSection(e.target.value);
                  }
                }}
                defaultValue=""
              >
                <option value="" disabled>Navigate to Section</option>
                <option value="home">🏠 Home</option>
                <option value="new-arrivals">⭐ New Arrivals</option>
                <option value="cold-plunge">❄️ Cold Plunge</option>
                <option value="sauna">🔥 Sauna</option>
                <option value="hyperbaric">💨 Hyperbaric</option>
                <option value="pemf">⚡ PEMF</option>
                <option value="halo">☁️ Halo</option>
                <option value="redlight">☀️ Red Light</option>
                <option value="float">🛁 Float Spa</option>
                <option value="compression">🔄 Compression</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <ChevronDown className="h-4 w-4 text-yellow-400" />
              </div>
            </div>
          </div>

          {/* Desktop Horizontal Layout */}
          <div className="hidden md:block">
            <div className="flex justify-center flex-wrap gap-2">
              <Link to="/">
                <Button className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-xl border-2 border-yellow-500">
                  Home
                </Button>
              </Link>
              <Button 
                onClick={() => scrollToSection('new-arrivals')}
                className="px-6 py-3 bg-white/20 hover:bg-yellow-500 text-white hover:text-black font-medium rounded-xl border-2 border-yellow-500/50 hover:border-yellow-500"
              >
                New Arrivals
              </Button>
              <Button 
                onClick={() => scrollToSection('cold-plunge')}
                className="px-6 py-3 bg-white/20 hover:bg-yellow-500 text-white hover:text-black font-medium rounded-xl border-2 border-yellow-500/50 hover:border-yellow-500"
              >
                Cold Plunge
              </Button>
              <Button 
                onClick={() => scrollToSection('sauna')}
                className="px-6 py-3 bg-white/20 hover:bg-yellow-500 text-white hover:text-black font-medium rounded-xl border-2 border-yellow-500/50 hover:border-yellow-500"
              >
                Sauna
              </Button>
              <Button 
                onClick={() => scrollToSection('hyperbaric')}
                className="px-6 py-3 bg-white/20 hover:bg-yellow-500 text-white hover:text-black font-medium rounded-xl border-2 border-yellow-500/50 hover:border-yellow-500"
              >
                Hyperbaric
              </Button>
              <Button 
                onClick={() => scrollToSection('pemf')}
                className="px-6 py-3 bg-white/20 hover:bg-yellow-500 text-white hover:text-black font-medium rounded-xl border-2 border-yellow-500/50 hover:border-yellow-500"
              >
                PEMF
              </Button>
              <Button 
                onClick={() => scrollToSection('halo')}
                className="px-6 py-3 bg-white/20 hover:bg-yellow-500 text-white hover:text-black font-medium rounded-xl border-2 border-yellow-500/50 hover:border-yellow-500"
              >
                Halo
              </Button>
              <Button 
                onClick={() => scrollToSection('redlight')}
                className="px-6 py-3 bg-white/20 hover:bg-yellow-500 text-white hover:text-black font-medium rounded-xl border-2 border-yellow-500/50 hover:border-yellow-500"
              >
                Red Light
              </Button>
              <Button 
                onClick={() => scrollToSection('float')}
                className="px-6 py-3 bg-white/20 hover:bg-yellow-500 text-white hover:text-black font-medium rounded-xl border-2 border-yellow-500/50 hover:border-yellow-500"
              >
                Float Spa
              </Button>
              <Button 
                onClick={() => scrollToSection('compression')}
                className="px-6 py-3 bg-white/20 hover:bg-yellow-500 text-white hover:text-black font-medium rounded-xl border-2 border-yellow-500/50 hover:border-yellow-500"
              >
                Compression
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* All Products Sections */}
      <div className="container mx-auto px-4">
        
        {/* New Arrivals Section */}
        <section id="new-arrivals" className="py-20 border-b border-yellow-500/20">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="h-px bg-yellow-500/50 flex-1 max-w-xs"></div>
              <div className="mx-4 px-6 py-2 bg-yellow-500/10 rounded-full border border-yellow-500/30">
                <span className="text-yellow-400 font-semibold text-sm uppercase tracking-wider">Featured</span>
              </div>
              <div className="h-px bg-yellow-500/50 flex-1 max-w-xs"></div>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">New Arrivals</h2>
            <p className="text-white/70 max-w-2xl mx-auto text-lg">
              Our latest innovations in recovery technology, featuring cutting-edge designs and advanced functionality.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {newArrivalsProducts.map((product, idx) => (
              <ProductCard key={idx} product={product} />
            ))}
          </div>
        </section>

        {/* Cold Plunge Section */}
        <section id="cold-plunge" className="py-20 border-b border-yellow-500/20">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="h-px bg-yellow-500/50 flex-1 max-w-xs"></div>
              <div className="mx-4 px-6 py-2 bg-blue-500/10 rounded-full border border-blue-500/30">
                <Snowflake className="w-4 h-4 text-blue-400 inline mr-2" />
                <span className="text-blue-400 font-semibold text-sm uppercase tracking-wider">Cold Therapy</span>
              </div>
              <div className="h-px bg-yellow-500/50 flex-1 max-w-xs"></div>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">Cold Plunge Collection</h2>
            <p className="text-white/70 max-w-2xl mx-auto text-lg">
              Professional-grade cold therapy equipment for enhanced recovery and performance.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coldPlungeProducts.map((product, idx) => (
              <ProductCard key={idx} product={product} />
            ))}
          </div>
        </section>

        {/* Sauna Section */}
        <section id="sauna" className="py-20 border-b border-yellow-500/20">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="h-px bg-yellow-500/50 flex-1 max-w-xs"></div>
              <div className="mx-4 px-6 py-2 bg-red-500/10 rounded-full border border-red-500/30">
                <Thermometer className="w-4 h-4 text-red-400 inline mr-2" />
                <span className="text-red-400 font-semibold text-sm uppercase tracking-wider">Heat Therapy</span>
              </div>
              <div className="h-px bg-yellow-500/50 flex-1 max-w-xs"></div>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">Sauna Collection</h2>
            <p className="text-white/70 max-w-2xl mx-auto text-lg">
              Luxury infrared saunas and heat therapy solutions for ultimate relaxation.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {saunaProducts.map((product, idx) => (
              <ProductCard key={idx} product={product} />
            ))}
          </div>
        </section>

        {/* Hyperbaric Section */}
        <section id="hyperbaric" className="py-20 border-b border-yellow-500/20">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="h-px bg-yellow-500/50 flex-1 max-w-xs"></div>
              <div className="mx-4 px-6 py-2 bg-purple-500/10 rounded-full border border-purple-500/30">
                <Cylinder className="w-4 h-4 text-purple-400 inline mr-2" />
                <span className="text-purple-400 font-semibold text-sm uppercase tracking-wider">Oxygen Therapy</span>
              </div>
              <div className="h-px bg-yellow-500/50 flex-1 max-w-xs"></div>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">Hyperbaric Chambers</h2>
            <p className="text-white/70 max-w-2xl mx-auto text-lg">
              Professional hyperbaric oxygen therapy chambers for enhanced healing and recovery.
            </p>
          </div>
          
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-white text-center mb-8">Hard Shell Chambers</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {hyperbaricHardShellProducts.map((product, idx) => (
                <ProductCard key={idx} product={product} />
              ))}
            </div>
          </div>
          
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-white text-center mb-8">Soft Shell Chambers</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {hyperbaricSoftShellProducts.map((product, idx) => (
                <ProductCard key={idx} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* PEMF Section */}
        <section id="pemf" className="py-20 border-b border-yellow-500/20">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="h-px bg-yellow-500/50 flex-1 max-w-xs"></div>
              <div className="mx-4 px-6 py-2 bg-green-500/10 rounded-full border border-green-500/30">
                <Zap className="w-4 h-4 text-green-400 inline mr-2" />
                <span className="text-green-400 font-semibold text-sm uppercase tracking-wider">Electromagnetic</span>
              </div>
              <div className="h-px bg-yellow-500/50 flex-1 max-w-xs"></div>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">PEMF Therapy</h2>
            <p className="text-white/70 max-w-2xl mx-auto text-lg">
              Pulsed electromagnetic field therapy devices for enhanced cellular healing and recovery.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pemfProducts.map((product, idx) => (
              <ProductCard key={idx} product={product} />
            ))}
          </div>
        </section>

        {/* Halo Section */}
        <section id="halo" className="py-20 border-b border-yellow-500/20">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="h-px bg-yellow-500/50 flex-1 max-w-xs"></div>
              <div className="mx-4 px-6 py-2 bg-cyan-500/10 rounded-full border border-cyan-500/30">
                <Cloud className="w-4 h-4 text-cyan-400 inline mr-2" />
                <span className="text-cyan-400 font-semibold text-sm uppercase tracking-wider">Salt Therapy</span>
              </div>
              <div className="h-px bg-yellow-500/50 flex-1 max-w-xs"></div>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">Halo Salt Therapy</h2>
            <p className="text-white/70 max-w-2xl mx-auto text-lg">
              Professional halotherapy equipment for respiratory health and wellness.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {haloProducts.map((product, idx) => (
              <ProductCard key={idx} product={product} />
            ))}
          </div>
        </section>

        {/* Red Light Section */}
        <section id="redlight" className="py-20 border-b border-yellow-500/20">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="h-px bg-yellow-500/50 flex-1 max-w-xs"></div>
              <div className="mx-4 px-6 py-2 bg-red-500/10 rounded-full border border-red-500/30">
                <Sun className="w-4 h-4 text-red-400 inline mr-2" />
                <span className="text-red-400 font-semibold text-sm uppercase tracking-wider">Light Therapy</span>
              </div>
              <div className="h-px bg-yellow-500/50 flex-1 max-w-xs"></div>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">Red Light Therapy</h2>
            <p className="text-white/70 max-w-2xl mx-auto text-lg">
              Advanced photobiomodulation therapy equipment for cellular healing and rejuvenation.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {redlightProducts.map((product, idx) => (
              <ProductCard key={idx} product={product} />
            ))}
          </div>
        </section>

        {/* Float Section */}
        <section id="float" className="py-20 border-b border-yellow-500/20">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="h-px bg-yellow-500/50 flex-1 max-w-xs"></div>
              <div className="mx-4 px-6 py-2 bg-blue-500/10 rounded-full border border-blue-500/30">
                <Waves className="w-4 h-4 text-blue-400 inline mr-2" />
                <span className="text-blue-400 font-semibold text-sm uppercase tracking-wider">Float Therapy</span>
              </div>
              <div className="h-px bg-yellow-500/50 flex-1 max-w-xs"></div>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">Float Therapy</h2>
            <p className="text-white/70 max-w-2xl mx-auto text-lg">
              Innovative float therapy solutions for deep relaxation and sensory deprivation.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {floatProducts.map((product, idx) => (
              <ProductCard key={idx} product={product} />
            ))}
          </div>
        </section>

        {/* Compression Section */}
        <section id="compression" className="py-20">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="h-px bg-yellow-500/50 flex-1 max-w-xs"></div>
              <div className="mx-4 px-6 py-2 bg-orange-500/10 rounded-full border border-orange-500/30">
                <Activity className="w-4 h-4 text-orange-400 inline mr-2" />
                <span className="text-orange-400 font-semibold text-sm uppercase tracking-wider">Compression</span>
              </div>
              <div className="h-px bg-yellow-500/50 flex-1 max-w-xs"></div>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">Compression Therapy</h2>
            <p className="text-white/70 max-w-2xl mx-auto text-lg">
              Professional pneumatic compression devices for enhanced circulation and recovery.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {compressionProducts.map((product, idx) => (
              <ProductCard key={idx} product={product} />
            ))}
          </div>
        </section>
      </div>

      <ContactSection />
      <Footer />
    </div>
  );
};

// All the product data from the original ProductsSection
const newArrivalsProducts = [
  {
    name: "K2 Contrast Hot/Cold Plunge",
    description: "Luxury dual-zone hydrotherapy system featuring both hot tub and cold plunge in one elegant unit. Advanced LED lighting, premium materials, and precise temperature control for the ultimate recovery experience.",
    image: "/lovable-uploads/53a979fd-0494-4fb3-9569-612c85f5d66f.png",
    icon: <Thermometer className="w-5 h-5 text-white" />
  },
  {
    name: "The AirVault (2.0 Hyperbaric Chamber)",
    description: "Our all-new wheelchair-accessible hyperbaric chamber room with full 2.0 ATA capabilities. Features built-in mini split, comfortable seating, and spacious design for 1-2 person use. No more lying down required!",
    image: "/lovable-uploads/50cfb7d6-f74f-49fc-abbf-6f9008906631.png",
    icon: <Cylinder className="w-5 h-5 text-white" />
  },
  {
    name: "HydroChill",
    description: "Revolutionary dry float technology that delivers the benefits of float therapy or cold plunge without getting wet. This innovative system delivers powerful recovery, stress relief, and rejuvenation without water contact.",
    image: "/lovable-uploads/2316cae8-0672-4529-962b-5d4ba13e7e29.png", 
    icon: <Bath className="w-5 h-5 text-white" />
  },
  {
    name: "Black Ice Plunge",
    description: "Coming soon: Our premium cold plunge featuring sleek black and stainless steel design. Advanced sanitization with UV and Ozone technology, powered by a robust 1.5HP chiller for optimal temperature control.",
    image: "/lovable-uploads/daf55219-49a8-4320-b812-180634bae42c.png",
    icon: <Snowflake className="w-5 h-5 text-white" />
  },
  {
    name: "NüFloat",
    description: "Premium dry float therapy system that provides deep relaxation and stress relief without water immersion. Features elegant wooden finish and advanced digital controls.",
    image: "/lovable-uploads/4792cf90-1aa2-40af-ab43-abdfe5d229c6.png",
    icon: <Waves className="w-5 h-5 text-white" />
  }
];

const coldPlungeProducts = [
  {
    name: "K2 Contrast Hot/Cold Plunge",
    price: 24999,
    originalPrice: null,
    description: "Luxury dual-zone hydrotherapy system featuring both hot tub and cold plunge in one elegant unit. Advanced LED lighting, premium materials, and precise temperature control for the ultimate recovery experience.",
    image: "/lovable-uploads/53a979fd-0494-4fb3-9569-612c85f5d66f.png",
    icon: <Thermometer className="w-5 h-5 text-white" />
  },
  {
    name: "HydroChill",
    price: 7999,
    originalPrice: null,
    description: "Revolutionary dry float technology that delivers the benefits of float therapy or cold plunge without getting wet. This innovative system delivers powerful recovery, stress relief, and rejuvenation without water contact.",
    image: "/lovable-uploads/2316cae8-0672-4529-962b-5d4ba13e7e29.png",
    icon: <Bath className="w-5 h-5 text-white" />
  },
  {
    name: "Black Ice Plunge",
    price: 7500,
    originalPrice: null,
    description: "Our premium cold plunge featuring sleek black and stainless steel design. Advanced sanitization with UV and Ozone technology, powered by a robust 1.5HP chiller for optimal temperature control.",
    image: "/lovable-uploads/daf55219-49a8-4320-b812-180634bae42c.png",
    icon: <Snowflake className="w-5 h-5 text-white" />
  },
  {
    name: "Premium Cold Plunge",
    price: 6500,
    originalPrice: null,
    description: "Our flagship cold plunge system with precise temperature control, advanced filtration, and energy-efficient cooling. Perfect for commercial or home use with customizable settings. Includes shipping.",
    image: "/lovable-uploads/b4bf75f2-b13f-4e86-976f-29094cf47682.png",
    icon: <Snowflake className="w-5 h-5 text-white" />
  },
  {
    name: "Commercial Plunge",
    price: 8500,
    originalPrice: null,
    description: "Space-saving design with all the essential features. Ideal for commercial wellness spaces. Includes cooling system and advanced filtration. Includes shipping.",
    image: "/lovable-uploads/067c3a99-fb45-45b7-9760-35bc93dbca21.png",
    icon: <Droplet className="w-5 h-5 text-white" />
  }
];

const saunaProducts = [
  {
    name: "SunDown Infrared Sauna (2 Person)",
    price: 7499,
    originalPrice: 6299,
    description: "Full-spectrum infrared sauna with carbon and ceramic heaters. Features advanced control panel, Bluetooth audio, and chromotherapy lighting. Fits 2-3 people.",
    image: "/lovable-uploads/eff3e63b-80ff-45a1-8a5f-62946b8ca99f.png",
    icon: <Thermometer className="w-5 h-5 text-white" />
  },
  {
    name: "The Heat Room",
    price: 11500,
    originalPrice: 7999,
    description: "Classic Finnish-style sauna with premium cedar wood construction. Includes electric heater, stones, and digital controls. Easy installation for indoor or outdoor use.",
    image: "/lovable-uploads/5e8b6cff-1878-4236-9648-1cc966f9fcce.png",
    icon: <Thermometer className="w-5 h-5 text-white" />
  },
  {
    name: "SunDown Infrared Sauna (4 Person)",
    price: 9999,
    originalPrice: null,
    description: "Spacious 4-person infrared sauna with advanced heating technology. Features wide interior, multiple heat zones, and integrated sound system. Perfect for group wellness sessions.",
    image: "/lovable-uploads/0abc4ff9-5b18-464e-ba6d-9e0c91fbb14c.png",
    icon: <Thermometer className="w-5 h-5 text-white" />
  }
];

const hyperbaricHardShellProducts = [
  {
    name: "The AirVault (2.0 Hyperbaric Chamber)",
    price: 75000,
    originalPrice: null,
    description: "Our all-new wheelchair-accessible hyperbaric chamber room with full 2.0 ATA capabilities. Features built-in mini split, comfortable seating, and spacious design for 1-2 person use. No more lying down required!",
    image: "/lovable-uploads/50cfb7d6-f74f-49fc-abbf-6f9008906631.png",
    icon: <Cylinder className="w-5 h-5 text-white" />
  },
  {
    name: "Pro Hyperbaric Chamber",
    price: 65000,
    originalPrice: null,
    description: "Medical-grade hard shell hyperbaric chamber with pressure up to 3.0 ATA. Features automatic pressure control, emergency safety systems, and spacious interior.",
    image: "/lovable-uploads/d674e81c-762f-4682-acbb-7342663c3c7f.png",
    icon: <Cylinder className="w-5 h-5 text-white" />
  }
];

const hyperbaricSoftShellProducts = [
  {
    name: "2.0 Softshell Hyperbaric Chamber",
    price: 15500,
    originalPrice: null,
    description: "Lightweight and foldable soft shell hyperbaric chamber. Easy setup, compact storage, and reliable pressure regulation. Perfect for home wellness programs.",
    image: "/lovable-uploads/a2ebf6d0-3eb9-4a2d-9308-4d20324dd698.png",
    icon: <Cylinder className="w-5 h-5 text-white" />
  },
  {
    name: "1.3-1.5 Seated Chamber",
    price: 12500,
    originalPrice: null,
    description: "Compact seated hyperbaric chamber with pressure range of 1.3-1.5 ATA. Features digital control panel, comfortable seating, and efficient pressurization system. Perfect for personal recovery and wellness.",
    image: "/lovable-uploads/65662061-08b1-4586-b67e-c421063d351b.png",
    icon: <Cylinder className="w-5 h-5 text-white" />
  }
];

const pemfProducts = [
  {
    name: "PEMF Targeted Therapy",
    price: 33999,
    originalPrice: 2299,
    description: "Portable PEMF device for targeted therapy. Multiple applicators for joints and specific body areas. Rechargeable battery and programmable treatment protocols.",
    image: "/lovable-uploads/d3cce626-a17d-47cc-a505-0425d50285bc.png",
    icon: <Activity className="w-5 h-5 text-white" />
  }
];

const haloProducts = [
  {
    name: "Commercial Halo Generator",
    price: 28000,
    originalPrice: null,
    description: "Professional salt therapy halo generator for spas and wellness centers. Comes with 500 salt bricks, customizable settings, and ideal for commercial use. Includes advanced filtration and quiet operation.",
    image: "/lovable-uploads/70978ae6-f448-446a-ad43-4474707e9838.png",
    icon: <Cloud className="w-5 h-5 text-white" />
  }
];

const redlightProducts = [
  {
    name: "Pro Redlight Bed",
    price: 34000,
    originalPrice: 17999,
    description: "Full-body red light therapy bed with combined wavelengths for optimal benefits. Programmable sessions, cooling system, and ergonomic design for client comfort.",
    image: "/lovable-uploads/df1c1dad-7aa3-4f91-b530-f41bc567e5d5.png",
    icon: <Sun className="w-5 h-5 text-white" />
  },
  {
    name: "RedLight Panel Pro 1500",
    price: 2499,
    originalPrice: null,
    description: "Professional LED red light therapy panel with 660nm and 850nm wavelengths. Perfect for targeted therapy and full-body treatments. Includes mounting hardware and timer controls.",
    image: "/lovable-uploads/65871aa6-88a1-4075-a551-94d76a82af68.png",
    icon: <Sun className="w-5 h-5 text-white" />
  },
  {
    name: "RedLight Tower System",
    price: 8999,
    originalPrice: null,
    description: "Standing red light therapy tower with multiple panel arrays. 360-degree coverage for comprehensive photobiomodulation therapy. Commercial-grade construction with app control.",
    image: "/lovable-uploads/e876001e-ac28-46c6-9b40-6fd78f420a33.png",
    icon: <Sun className="w-5 h-5 text-white" />
  },
  {
    name: "Portable RedLight Device",
    price: 799,
    originalPrice: null,
    description: "Handheld red light therapy device for targeted treatment. Dual wavelengths, rechargeable battery, and ergonomic design. Perfect for personal use and travel.",
    image: "/lovable-uploads/81b56d08-61aa-4eae-b88b-709559c5560f.jpg",
    icon: <Sun className="w-5 h-5 text-white" />
  }
];

const floatProducts = [
  {
    name: "NüFloat",
    price: 8999,
    originalPrice: null,
    description: "Premium dry float therapy system that provides deep relaxation and stress relief without water immersion. Features elegant wooden finish and advanced digital controls.",
    image: "/lovable-uploads/4792cf90-1aa2-40af-ab43-abdfe5d229c6.png",
    icon: <Waves className="w-5 h-5 text-white" />
  },
  {
    name: "Float Pod Pro",
    price: 24999,
    originalPrice: null,
    description: "Professional-grade float tank with Epsom salt solution. Features noise isolation, temperature control, and filtration systems. Perfect for commercial float centers.",
    image: "/lovable-uploads/8f346b12-e953-49f0-ada9-6ca5f4a96bf7.png",
    icon: <Waves className="w-5 h-5 text-white" />
  }
];

const compressionProducts = [
  {
    name: "NormaTec Elite System",
    price: 4999,
    originalPrice: null,
    description: "Professional pneumatic compression therapy system. Includes full-body suit with arms, legs, and hip attachments. Advanced pressure patterns for optimal recovery.",
    image: "/lovable-uploads/403ad55d-9786-4efa-8737-1d19449d8300.png",
    icon: <Layers className="w-5 h-5 text-white" />
  },
  {
    name: "Compression Leg Sleeves",
    price: 1299,
    originalPrice: null,
    description: "Professional-grade leg compression system with sequential pressure patterns. Wireless operation, multiple intensity levels, and ergonomic design for maximum comfort.",
    image: "/lovable-uploads/c67bb8af-9d1e-40b6-88fc-147cf82f603d.png",
    icon: <Layers className="w-5 h-5 text-white" />
  },
  {
    name: "Full Body Compression Suite",
    price: 7999,
    originalPrice: null,
    description: "Complete compression therapy system with arms, legs, and torso coverage. Advanced pressure algorithms, wireless control, and professional-grade construction.",
    image: "/lovable-uploads/17339ef4-e560-483d-b7a0-eec17ea60495.png",
    icon: <Layers className="w-5 h-5 text-white" />
  },
  {
    name: "Compression Recovery Boots",
    price: 899,
    originalPrice: null,
    description: "Portable compression boots for lower leg recovery. Multiple pressure zones, rechargeable battery, and intuitive controls. Perfect for athletes and personal use.",
    image: "/lovable-uploads/f5e81e1f-8f43-4dbf-b65b-e864a9e28831.png",
    icon: <Layers className="w-5 h-5 text-white" />
  }
];

export default Shop;