import { MapPin } from "lucide-react";

// New: Array of web-only locations
const webLocations = [{
  city: "Jackson",
  state: "MS",
  website: "https://www.RestRecoveryJackson.com"
}, {
  city: "Bountiful",
  state: "UT",
  website: "https://www.RestRecoveryBountiful.com"
}, {
  city: "Oceanside",
  state: "CA",
  website: "https://www.RestRecoverySandiego.com"
}, {
  city: "Chandler",
  state: "AZ",
  website: "https://www.RestRecoveryChandler.com"
}, {
  city: "Gilbert",
  state: "AZ",
  website: "https://www.RestRecoveryGilbert.com"
}, {
  city: "North Phoenix",
  state: "AZ",
  website: "https://www.RestRecoveryNorthPhoenix.com"
}, {
  city: "Groton",
  state: "MA",
  website: "https://www.RestRecoveryGroton.com"
}, {
  city: "Meridian",
  state: "ID",
  website: "https://www.RestRecoveryMeridian.com"
}, {
  city: "Naperville",
  state: "IL",
  website: "https://www.RestRecoveryNaperville.com"
}, {
  city: "Roseville",
  state: "CA",
  website: "https://www.RestRecoveryRoseville.com"
}, {
  city: "Ephraim",
  state: "UT",
  website: "https://www.RestRecoveryEphraim.com"
}, {
  city: "Logan",
  state: "UT",
  website: "https://www.RestRecoveryLogan.com"
}, {
  city: "San Antonio",
  state: "TX",
  website: "https://www.RestRecoverySanAntonio.com"
}, {
  city: "Fort Walton",
  state: "FL",
  website: "https://www.RestRecoveryFortWalton.com"
}, {
  city: "Denver",
  state: "CO",
  website: "https://www.RestRecoveryDenver.com"
}, {
  city: "Portland",
  state: "OR",
  website: "https://www.restrecoveryportland.com"
}, {
  city: "Gluckstadt",
  state: "MS",
  website: "https://www.RestRecoveryGluckstadt.com"
}, {
  city: "Buckeye",
  state: "AZ",
  website: "https://www.RestRecoveryBuckeye.com"
}, {
  city: "Wayne",
  state: "NJ",
  website: "https://www.WayneRestRecovery.com"
}, {
  city: "Ashburn",
  state: "VA",
  website: "https://www.restrecoveryvirginia.com"
}, {
  city: "Franklin",
  state: "TN",
  website: "https://www.RestRecoveryFranklin.com"
}, {
  city: "Alexandria",
  state: "LA",
  website: "https://www.RestRecoveryAlexandria.com"
}, {
  city: "Fort Hill",
  state: "SC",
  website: "https://www.RestRecoveryFortHill.com"
}];

// New: Licenses purchased but locations/building in progress
const comingSoonLocations = [
  { city: "North Carolina", state: "" },
  { city: "New York", state: "" },
  { city: "Maryland", state: "" }
];

// Special locations with custom status
const specialLocations: { city: string; state: string; status: string }[] = [];

const LocationsSection = () => {
  return (
    <section id="locations" className="py-20 bg-black border-t border-white/5">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 bg-white/5 text-white rounded-full font-medium mb-4">
            Our Locations
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight">
            Find a REST RECOVERY Near You
          </h2>
          <p className="text-lg text-white/80">
            Experience our state-of-the-art recovery centers with 20+ locations across 15+ states nationwide.
            New locations are opening every month.
          </p>
        </div>

        {/* Main grid: core locations */}
        {/* Divider for web-only locations */}
        <div className="my-12 border-t border-white/10" />

        {/* Locations with their own websites */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {webLocations.map((location, idx) => (
              <div key={idx} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-yellow-500/30 hover:border-yellow-400 transition-colors">
                <div className="flex items-start mb-4">
                  <MapPin size={20} className="mr-2 mt-1 text-yellow-400 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-lg text-white tracking-tight">
                      {location.city}, {location.state}
                    </h4>
                    <a
                      href={location.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-yellow-400 underline break-all"
                    >
                      {location.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <p className="text-sm text-white/70">
                    <strong className="text-white">Hours:</strong> Check website for hours
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coming Soon Locations */}
        <div className="mt-20">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Coming Soon</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {comingSoonLocations.map((loc, idx) => (
              <div
                key={idx}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-yellow-500/30"
              >
                <div className="flex items-start mb-4">
                  <MapPin size={20} className="mr-2 mt-1 text-yellow-400 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-lg text-white tracking-tight">
                      {loc.city}
                      {loc.state ? `, ${loc.state}` : ""}
                    </h4>
                  </div>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <p className="text-sm text-white/70">
                    <strong className="text-white">2026 Openings</strong>
                  </p>
                </div>
              </div>
            ))}
            {specialLocations.map((loc, idx) => (
              <div
                key={idx}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-yellow-500/30"
              >
                <div className="flex items-start mb-4">
                  <MapPin size={20} className="mr-2 mt-1 text-yellow-400 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-lg text-white tracking-tight">
                      {loc.city}
                      {loc.state ? `, ${loc.state}` : ""}
                    </h4>
                  </div>
                </div>
                <div className="border-t border-white/10 pt-4">
                  <p className="text-sm text-white/70">
                    <strong className="text-white">{loc.status}</strong>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-lg font-medium mb-4 text-white">
            Don't see a location near you?
          </p>
          <p className="text-white/70 max-w-xl mx-auto">
            We're expanding rapidly! Join our mailing list to be notified when a REST RECOVERY 
            opens in your area, or consider becoming a licensee owner.
          </p>
        </div>
      </div>
    </section>
  );
};

// OLD locations array (not displayed)
const locations = [{
  city: "Los Angeles",
  state: "CA",
  address: "123 Recovery Way, Los Angeles, CA 90001",
  hours: "Mon-Fri: 6am-9pm, Sat-Sun: 8am-6pm",
  phone: "(310) 555-1234"
}, {
  city: "San Francisco",
  state: "CA",
  address: "456 Wellness Blvd, San Francisco, CA 94107",
  hours: "Mon-Fri: 6am-9pm, Sat-Sun: 8am-6pm",
  phone: "(415) 555-2345"
}, {
  city: "New York",
  state: "NY",
  address: "789 Restoration Ave, New York, NY 10001",
  hours: "Mon-Fri: 5am-10pm, Sat-Sun: 7am-8pm",
  phone: "(212) 555-3456"
}, {
  city: "Miami",
  state: "FL",
  address: "321 Rejuvenate Dr, Miami, FL 33101",
  hours: "Mon-Fri: 6am-9pm, Sat-Sun: 8am-7pm",
  phone: "(305) 555-4567"
}, {
  city: "Chicago",
  state: "IL",
  address: "654 Wellness Way, Chicago, IL 60601",
  hours: "Mon-Fri: 6am-9pm, Sat-Sun: 8am-6pm",
  phone: "(312) 555-5678"
}, {
  city: "Dallas",
  state: "TX",
  address: "987 Recovery Rd, Dallas, TX 75201",
  hours: "Mon-Fri: 5:30am-9pm, Sat-Sun: 7am-7pm",
  phone: "(214) 555-6789"
}, {
  city: "Seattle",
  state: "WA",
  address: "246 Revitalize St, Seattle, WA 98101",
  hours: "Mon-Fri: 6am-9pm, Sat-Sun: 8am-6pm",
  phone: "(206) 555-7890"
}, {
  city: "Denver",
  state: "CO",
  address: "135 Restore Ave, Denver, CO 80202",
  hours: "Mon-Fri: 5:30am-9pm, Sat-Sun: 7am-7pm",
  phone: "(303) 555-8901"
}];
export default LocationsSection;
