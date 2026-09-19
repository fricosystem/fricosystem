import { ArrowRight, Snowflake, Thermometer, Bath, Cylinder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const NewArrivalsSection = () => {
  return (
    <section className="py-12 md:py-20 lg:py-24 bg-gradient-to-b from-black to-zinc-900">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-4xl mx-auto mb-20">
          <span className="inline-block px-4 py-2 bg-white/10 text-white rounded-full font-medium mb-6">
            New Arrivals
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8 tracking-tight leading-tight">
            Latest Recovery
            <span className="block bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
              Innovations
            </span>
          </h2>
          <p className="text-xl text-white/70 leading-relaxed">
            Discover our newest professional-grade recovery equipment designed for 
            elite performance and unparalleled wellness experiences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {newArrivals.map((product, index) => (
            <ProductCard key={index} product={product} index={index} />
          ))}
        </div>

        <div className="text-center">
          <Link to="/shop">
            <Button className="bg-white text-black hover:bg-white/90 px-12 py-6 rounded-full text-xl font-semibold flex items-center gap-4 mx-auto">
              Explore All Products
              <ArrowRight className="w-6 h-6" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

const ProductCard = ({ product, index }: { product: any; index: number }) => {
  return (
    <div 
      className="group bg-gradient-to-br from-zinc-900/50 to-black/50 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md transform hover:-translate-y-4 transition-all duration-500 hover:border-white/20 hover:shadow-2xl"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="aspect-[4/3] overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
        <img 
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute top-4 left-4 z-20">
          <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md text-white text-sm font-medium rounded-full border border-white/20">
            New
          </span>
        </div>
      </div>
      
      <div className="p-8">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center mr-3">
            {product.icon}
          </div>
          <h3 className="text-xl font-bold text-white group-hover:text-white/90 transition-colors">
            {product.name}
          </h3>
        </div>
        
        <p className="text-white/70 leading-relaxed mb-6 line-clamp-3">
          {product.description}
        </p>
        
        <Link to="/shop">
          <Button className="bg-white/10 text-white border border-white/20 hover:bg-white hover:text-black w-full py-3 rounded-xl transition-all duration-300">
            Learn More
          </Button>
        </Link>
      </div>
    </div>
  );
};

const newArrivals = [
  {
    name: "K2 Contrast Hot/Cold Plunge",
    description: "Luxury dual-zone hydrotherapy system featuring both hot tub and cold plunge in one elegant unit. Advanced LED lighting, premium materials, and precise temperature control.",
    image: "/lovable-uploads/53a979fd-0494-4fb3-9569-612c85f5d66f.png",
    icon: <Thermometer className="w-5 h-5 text-white" />
  },
  {
    name: "The AirVault (2.0 Hyperbaric Chamber)",
    description: "Wheelchair-accessible hyperbaric chamber room with full 2.0 ATA capabilities. Features built-in mini split, comfortable seating, and spacious design.",
    image: "/lovable-uploads/50cfb7d6-f74f-49fc-abbf-6f9008906631.png",
    icon: <Cylinder className="w-5 h-5 text-white" />
  },
  {
    name: "HydroChill",
    description: "Revolutionary dry float technology that delivers the benefits of float therapy or cold plunge without getting wet. Innovative recovery and rejuvenation system.",
    image: "/lovable-uploads/2316cae8-0672-4529-962b-5d4ba13e7e29.png", 
    icon: <Bath className="w-5 h-5 text-white" />
  }
];

export default NewArrivalsSection;