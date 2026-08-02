import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Snowflake, Thermometer, Droplet, Sun, Waves, Activity, Cloud, Cylinder, Layers, Star, Bath } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const COMING_SOON_IMAGE = "/lovable-uploads/487d5543-6459-44e0-b756-380783bb7919.png";

const ProductsSection = () => {
  const [selectedCategory, setSelectedCategory] = useState("new-arrivals");
  const isMobile = useIsMobile();

  return (
    <section id="shop" className="py-20 bg-black">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 bg-white/10 text-white rounded-full font-medium mb-4">
            Premium Recovery Products
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
            Professional-Grade Recovery Equipment
          </h2>
          <p className="text-lg text-white/80 mb-6">
            Experience the same recovery technology used by elite athletes and healthcare professionals.
            Our products are designed for both commercial and home use.
          </p>
          <p className="text-center text-yellow-400 font-semibold italic mb-8">
            ALL SHIPPING AND WARRANTY INCLUDED
          </p>
        </div>

        <Tabs defaultValue="new-arrivals" className="w-full" onValueChange={setSelectedCategory}>
          <div className="relative">
            <div className="md:hidden absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-black to-transparent z-20 pointer-events-none rounded-r-lg" />
            <div className="md:hidden absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-black to-transparent z-20 pointer-events-none rounded-l-lg" />
            
            <div className="flex justify-start md:justify-center mb-10 overflow-x-auto scrollbar-hide pb-4 relative scroll-pl-4 scroll-pr-4">
              <TabsList className="bg-white/10 p-1 border border-white/20 flex-nowrap md:flex-wrap min-w-max">
                <TabsTrigger 
                  value="new-arrivals" 
                  className="px-6 py-3 min-w-[120px] md:min-w-0 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-black"
                >
                  New Arrivals
                </TabsTrigger>
                <TabsTrigger 
                  value="cold-plunge" 
                  className="px-6 py-3 min-w-[120px] md:min-w-0 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-black"
                >
                  {isMobile ? "Cold Plunge" : "Cold Plunge"}
                </TabsTrigger>
                <TabsTrigger 
                  value="sauna" 
                  className="px-6 py-3 min-w-[120px] md:min-w-0 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-black"
                >
                  Sauna
                </TabsTrigger>
                <TabsTrigger 
                  value="hyperbaric" 
                  className="px-6 py-3 min-w-[120px] md:min-w-0 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-black"
                >
                  Hyperbaric
                </TabsTrigger>
                <TabsTrigger 
                  value="pemf" 
                  className="px-6 py-3 min-w-[120px] md:min-w-0 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-black"
                >
                  PEMF
                </TabsTrigger>
                <TabsTrigger 
                  value="halo" 
                  className="px-6 py-3 min-w-[120px] md:min-w-0 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-black"
                >
                  Halo
                </TabsTrigger>
                <TabsTrigger 
                  value="redlight" 
                  className="px-6 py-3 min-w-[120px] md:min-w-0 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-black"
                >
                  Red Light
                </TabsTrigger>
                <TabsTrigger 
                  value="float" 
                  className="px-6 py-3 min-w-[120px] md:min-w-0 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-black"
                >
                  Float Spa
                </TabsTrigger>
                <TabsTrigger 
                  value="compression" 
                  className="px-6 py-3 min-w-[120px] md:min-w-0 whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-black"
                >
                  Compression
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
          
          <TabsContent value="new-arrivals">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {newArrivalsProducts.map((product, index) => (
                <ProductCard key={index} product={product} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="cold-plunge">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {coldPlungeProducts.map((product, index) => (
                <ProductCard key={index} product={product} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="sauna">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {saunaProducts.map((product, index) => (
                <ProductCard key={index} product={product} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="hyperbaric">
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-white text-center mb-8">Hard Shell Chambers</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {hyperbaricHardShellProducts.map((product, index) => (
                  <ProductCard key={index} product={product} />
                ))}
              </div>
            </div>
            
            <div className="mt-16">
              <h3 className="text-2xl font-bold text-white text-center mb-8">Soft Shell Chambers</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {hyperbaricSoftShellProducts.map((product, index) => (
                  <ProductCard key={index} product={product} />
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="pemf">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pemfProducts.map((product, index) => (
                <ProductCard key={index} product={product} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="halo">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {haloProducts.map((product, index) => (
                <ProductCard key={index} product={product} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="redlight">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {redlightProducts.map((product, index) => (
                <ProductCard key={index} product={product} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="float">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {floatProducts.map((product, index) => (
                <ProductCard key={index} product={product} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="compression">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {compressionProducts.map((product, index) => (
                <ProductCard key={index} product={product} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

function ProductCard({ product }: { product: any }) {
  const handleInquire = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-black/30 border border-white/10 rounded-2xl overflow-hidden transform hover:translate-y-[-8px] transition-all duration-300 group relative">
      <div className="aspect-[4/3] overflow-hidden relative">
        <img 
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-6">
        <div className="flex items-center mb-2">
          {product.icon}
          <h3 className="text-xl font-bold text-white ml-2">{product.name}</h3>
        </div>
        <p className="text-white/80 mb-6 text-sm h-20 overflow-hidden">
          {product.description}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button className="bg-white text-black hover:bg-white/90 w-full" onClick={handleInquire}>
            Get a Quote Today
          </Button>
        </div>
      </div>
    </div>
  )
}

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
    name: "Ultimate Red",
    price: 84000,
    originalPrice: 21999,
    description: "Premium 360-degree red light therapy bed with advanced wavelength technology. Features sleek design, digital controls, and maximum coverage for whole-body treatment.",
    image: "/lovable-uploads/2be95704-8790-47c5-b784-99d1a8ab7773.png",
    icon: <Sun className="w-5 h-5 text-white" />
  },
  {
    name: "Redlight Panel System",
    price: 3999,
    originalPrice: 3499,
    description: "Modular red light therapy panels with adjustable wavelengths. Can be configured for targeted or full body treatment. Energy efficient with minimal EMF emission.",
    image: "/lovable-uploads/5d51f2d9-5988-43ae-bdfb-0e4b52f54e08.png",
    icon: <Sun className="w-5 h-5 text-white" />
  },
  {
    name: "Personal Redlight Device",
    price: 599,
    originalPrice: 699,
    description: "Compact personal red light therapy device perfect for home use. Features high-powered LED array, timer settings, and adjustable stand for targeted treatment areas.",
    image: "/lovable-uploads/f5e81e1f-8f43-4dbf-b65b-e864a9e28831.png",
    icon: <Sun className="w-5 h-5 text-white" />
  }
];

const floatProducts = [
  {
    name: "NüFloat",
    price: 18999,
    originalPrice: null,
    description: "Premium dry float therapy system that provides deep relaxation and stress relief without water immersion. Features elegant wooden finish and advanced digital controls.",
    image: "/lovable-uploads/4792cf90-1aa2-40af-ab43-abdfe5d229c6.png",
    icon: <Waves className="w-5 h-5 text-white" />
  },
  {
    name: "Commercial Float Pod",
    price: 24999,
    originalPrice: 26999,
    description: "Professional float therapy pod with advanced filtration and control systems. Customizable lighting, sound, and temperature controls. Ideal for float centers.",
    image: "/lovable-uploads/8f346b12-e953-49f0-ada9-6ca5f4a96bf7.png",
    icon: <Waves className="w-5 h-5 text-white" />
  },
  {
    name: "Home Float Tank",
    price: 16999,
    originalPrice: 18999,
    description: "Compact float tank designed for home use. Easy maintenance filtration system, energy-efficient heating, and simplified controls for personal float therapy.",
    image: "/lovable-uploads/906a762b-b63c-43d9-877c-e01a42f5a54b.png",
    icon: <Waves className="w-5 h-5 text-white" />
  }
];

const compressionProducts = [
  {
    name: "Massage Gun",
    price: 279,
    originalPrice: 2799,
    description: "Professional-grade percussion massage device with multiple speed settings and attachments. Includes carrying case and rechargeable battery for portable recovery anywhere.",
    image: "/lovable-uploads/ed93c804-96b3-44de-ac82-b7bdce64402d.png",
    icon: <Layers className="w-5 h-5 text-white" />
  },
  {
    name: "Compression Boots",
    price: 699,
    originalPrice: 1099,
    description: "Recovery compression boots for lower body. Sequential compression patterns, multiple intensity levels, and portable control unit. Perfect for athletes and recovery.",
    image: "/lovable-uploads/c67bb8af-9d1e-40b6-88fc-147cf82f603d.png",
    icon: <Layers className="w-5 h-5 text-white" />
  }
];

export default ProductsSection;
