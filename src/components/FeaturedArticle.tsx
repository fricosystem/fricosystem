import heroImage from '@/assets/hero-image.jpg';
import { Button } from '@/components/ui/button';

interface FeaturedArticleProps {
  title: string;
  author: string;
  category: string;
  date: string;
  excerpt: string;
  image: string;
}

const FeaturedArticle = ({
  title,
  author,
  category,
  date,
  excerpt,
  image
}: FeaturedArticleProps) => {
  return (
    <article className="container-blog py-16">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
          <img
            src={image}
            alt={`Featured article: ${title} - A professional image related to ${category.toLowerCase()}`}
            className="object-cover w-full h-full transition-transform duration-700 hover:scale-105"
            loading="eager"
            decoding="async"
            fetchPriority="high"
            width="592"
            height="444"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 592px"
          />
        </div>

        {/* Content */}
        <div className="space-y-6">
          <h1 className="featured-title">
            {title}
          </h1>
          
          <div className="flex items-center space-x-4 text-sm">
            <span className="blog-meta">{author} / WRITER</span>
            <span className="text-muted-foreground" aria-hidden="true">—</span>
            <span className="blog-meta">{category}</span>
            <span className="text-muted-foreground" aria-hidden="true">—</span>
            <time className="blog-meta" dateTime="2023-09-02">{date}</time>
          </div>
          
          <p className="text-lg text-muted-foreground leading-relaxed">
            {excerpt}
          </p>
          
          <div className="pt-4">
            <Button 
              variant="outline" 
              size="sm"
              asChild
            >
              <a
                href="/blog/rise-of-fashion-blogging"
                aria-label={`Read more about: ${title}`}
              >
                READ MORE
                <span className="ml-2" aria-hidden="true">→</span>
              </a>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
};

// Default Featured Article
export const DefaultFeaturedArticle = () => (
  <FeaturedArticle
    title="Featured Article Title — Hero Content Showcase"
    author="AUTHOR NAME"
    category="CATEGORY"
    date="Date Format"
    excerpt="Featured article description — This is where your main content excerpt would appear to give readers a preview of the full article."
    image={heroImage}
  />
);

export default FeaturedArticle;