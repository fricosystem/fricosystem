
import { Button } from "@/components/ui/button";
import { PhoneCall } from "lucide-react";

const BookCallSection = () => {
  const openCalendlyLink = () => {
    window.open('https://calendly.com/ryan-restrecoverywellness/30min', '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="py-16 bg-gradient-to-r from-rest-blue to-rest-darkblue">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Your REST RECOVERY Journey?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl">
            Take the first step towards owning your successful REST RECOVERY location. 
            Schedule a call with our team to learn more about this exciting opportunity.
          </p>
          <Button
            onClick={openCalendlyLink}
            className="bg-white text-rest-darkblue hover:bg-white/90 px-8 py-6 rounded-full text-lg flex items-center gap-3"
          >
            <PhoneCall className="w-5 h-5" />
            Book a Call Now
          </Button>
        </div>
      </div>
    </section>
  );
};

export default BookCallSection;
