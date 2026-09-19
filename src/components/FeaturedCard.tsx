import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import Button from "./Button";

interface FeaturedCardProps {
  title: string;
  excerpt: string;
  date: string;
  image: string;
  slug: string;
  colorClass?: string;
}

const FeaturedCard = ({
  title,
  excerpt,
  date,
  image,
  slug,
  colorClass = "bg-vibrant-purple",
}: FeaturedCardProps) => {
  return (
    <Link to={`/article/${slug}`} className="block">
      <article
        className={cn("card-hover rounded-3xl overflow-hidden", colorClass)}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Text Content - Left */}
          <div className="p-8 md:p-12 flex flex-col justify-center order-2 md:order-1">
            <time className="text-sm md:text-base font-medium text-foreground/70 mb-4 block font-sans">
              {date}
            </time>
            <h2 className="text-5xl leading-[0.8] md:text-7xl mb-4 font-sans font-extrabold tracking-tighter">
              {title}
            </h2>
            <p className="text-base md:text-lg leading-relaxed text-foreground/80 mb-6 font-serif">
              {excerpt}
            </p>
            <Button variant="filled" className="text-sm py-3 px-6 self-start">
              READ MORE
            </Button>
          </div>

          {/* Image - Right */}
          <div className="aspect-[4/3] md:aspect-auto overflow-hidden p-4 md:p-6 order-1 md:order-2">
            <div className="relative w-full h-full rounded-2xl overflow-hidden">
              <img
                src={image}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-500 grayscale"
              />
              <div
                className={cn(
                  "absolute inset-0 mix-blend-multiply opacity-60",
                  colorClass
                )}
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default FeaturedCard;
