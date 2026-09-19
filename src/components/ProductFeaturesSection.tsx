import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const ProductFeaturesSection = () => {
  const scrollToContact = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="py-20 bg-gradient-to-b from-black to-black/90 border-t border-white/5">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 bg-white/5 text-white rounded-full font-medium mb-4">
            Featured Products
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight">
            Leading-Edge Recovery Technology
          </h2>
          <p className="text-lg text-white/80">
            Experience our revolutionary recovery solutions designed to transform your wellness journey.
          </p>
        </div>

        <div className="relative px-12">
          <Carousel className="w-full max-w-5xl mx-auto">
            <CarouselContent>
              {featuredProducts.map((product, index) => (
                <CarouselItem key={index} className="md:basis-1/1">
                  <div className="p-2">
                    <ProductFeatureCard product={product} onInquire={scrollToContact} />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0 border-white/20 text-white hover:bg-white hover:text-black" />
            <CarouselNext className="right-0 border-white/20 text-white hover:bg-white hover:text-black" />
          </Carousel>
        </div>

        <div className="mt-12 text-center">
          <Button
            onClick={scrollToContact}
            className="bg-white text-black hover:bg-white/90 px-8 py-6 rounded-full text-lg"
          >
            Request Personalized Quote <ArrowRight className="ml-2" size={20} />
          </Button>
        </div>
      </div>
    </section>
  );
};

const ProductFeatureCard = ({ product, onInquire }: { product: FeaturedProduct, onInquire: () => void }) => {
  return (
    <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div className="aspect-square overflow-hidden">
          <img 
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-8 flex flex-col justify-center">
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">{product.name}</h3>
          <p className="text-white/80 mb-6">{product.description}</p>
          
          <div className="mb-8">
            {product.features.map((feature, idx) => (
              <div key={idx} className="flex items-start mb-3">
                <div className="bg-white/10 p-2 rounded-full mr-3">
                  {feature.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-white">{feature.title}</h4>
                  <p className="text-white/70 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <Button onClick={onInquire} className="bg-white text-black hover:bg-white/90 w-full">
            Request Pricing & Details
          </Button>
        </div>
      </div>
    </div>
  );
};

interface FeatureDetail {
  title: string;
  description: string;
  icon: JSX.Element;
}

interface FeaturedProduct {
  name: string;
  description: string;
  image: string;
  features: FeatureDetail[];
}

import { Cylinder, Bath, Star, Thermometer, Activity, Waves, Droplet } from "lucide-react";

const featuredProducts: FeaturedProduct[] = [
  {
    name: "K2 Contrast Hot/Cold Plunge",
    description: "The ultimate luxury hydrotherapy system combining the benefits of hot tub relaxation and cold plunge recovery in one beautifully designed unit.",
    image: "/lovable-uploads/53a979fd-0494-4fb3-9569-612c85f5d66f.png",
    features: [
      {
        title: "Dual-Zone Temperature Control",
        description: "Separate hot and cold zones with precise temperature management for optimal contrast therapy.",
        icon: <Thermometer className="w-4 h-4 text-white" />
      },
      {
        title: "Premium LED Lighting",
        description: "Integrated lighting system creates an ambient atmosphere for enhanced relaxation and therapy.",
        icon: <Star className="w-4 h-4 text-white" />
      },
      {
        title: "Commercial-Grade Construction",
        description: "Built with high-quality materials for durability and long-lasting performance in any environment.",
        icon: <Activity className="w-4 h-4 text-white" />
      }
    ]
  },
  {
    name: "HydroChill",
    description: "Revolutionary dry float technology that delivers the benefits of float therapy or cold plunge without getting wet.",
    image: "/lovable-uploads/2316cae8-0672-4529-962b-5d4ba13e7e29.png",
    features: [
      {
        title: "Fully Dry Experience",
        description: "Enjoy all the benefits of floating or cold plunge while staying completely dry and clothed.",
        icon: <Bath className="w-4 h-4 text-white" />
      },
      {
        title: "Dual Functionality",
        description: "Switch between weightless float therapy and cold plunge benefits in one system.",
        icon: <Activity className="w-4 h-4 text-white" />
      },
      {
        title: "Premium Client Experience",
        description: "Create a unique offering that sets your wellness center apart from competitors.",
        icon: <Star className="w-4 h-4 text-white" />
      }
    ]
  },
  {
    name: "NüFloat",
    description: "Premium dry float therapy system that provides deep relaxation and stress relief without water immersion.",
    image: "/lovable-uploads/4792cf90-1aa2-40af-ab43-abdfe5d229c6.png",
    features: [
      {
        title: "Zero-Gravity Sensation",
        description: "Experience the feeling of weightlessness that reduces pressure on joints and spine.",
        icon: <Waves className="w-4 h-4 text-white" />
      },
      {
        title: "Luxury Design",
        description: "Elegant wooden finish and premium materials for an upscale wellness experience.",
        icon: <Star className="w-4 h-4 text-white" />
      },
      {
        title: "Digital Controls",
        description: "Advanced control system with programmable sessions and temperature settings.",
        icon: <Activity className="w-4 h-4 text-white" />
      }
    ]
  }
];

export default ProductFeaturesSection;
