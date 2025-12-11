import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import Button from "./Button";

interface ArticleCardProps {
  title: string;
  excerpt: string;
  date: string;
  image: string;
  slug: string;
  colorClass?: string;
}

const ArticleCard = ({
  title,
  excerpt,
  date,
  image,
  slug,
  colorClass = "bg-vibrant-purple",
}: ArticleCardProps) => {
  return (
    <Link to={`/article/${slug}`} className="block">
      <article
        className={cn(
          "card-hover rounded-3xl overflow-hidden flex flex-col h-full",
          colorClass
        )}
      >
        {/* Image */}
        <div className="aspect-square overflow-hidden p-4 md:p-5">
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

        {/* Content */}
        <div className="p-5 md:p-6 flex flex-col flex-1">
          <time className="text-sm font-medium text-foreground/70 mb-3 block font-sans">
            {date}
          </time>
          <h2 className="text-5xl md:text-6xl leading-[0.8] mb-3 font-sans font-extrabold tracking-tighter">
            {title}
          </h2>
          <p className="text-sm md:text-base leading-relaxed text-foreground/80 mb-4 flex-1 line-clamp-3 font-serif">
            {excerpt}
          </p>
          <Button variant="filled" className="text-xs py-2 px-5 self-start">
            READ MORE
          </Button>
        </div>
      </article>
    </Link>
  );
};

export default ArticleCard;
