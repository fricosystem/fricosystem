import { Link } from 'react-router-dom';

interface BlogCardProps {
  title: string;
  category: string;
  date: string;
  excerpt?: string;
  image: string;
  href?: string;
  isSmall?: boolean;
}

const BlogCard = ({
  title,
  category,
  date,
  excerpt,
  image,
  href = '#',
  isSmall = false
}: BlogCardProps) => {
  const articleUrl = href === '#' ? `/blog/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}` : href;
  
  return (
    <article className="blog-card group cursor-pointer transition-all duration-300 hover:shadow-lg border border-transparent hover:border-black">
      <Link to={articleUrl} className="block focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2" aria-label={`Read article: ${title}`}>
        {/* Image */}
        <div className={`relative overflow-hidden ${isSmall ? 'aspect-[3/2]' : 'aspect-[4/3]'}`}>
          <img
            src={image}
            alt={`Article image for: ${title} - A professional photo related to ${category.toLowerCase()}`}
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            decoding="async"
            width={isSmall ? "300" : "387"}
            height={isSmall ? "200" : "291"}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 387px"
          />
        </div>

        {/* Content */}
        <div className={`p-6 space-y-3 ${isSmall ? 'p-4 space-y-2' : ''}`}>
          <div className="flex items-center space-x-2">
            <span className="blog-meta">{category}</span>
            <span className="text-muted-foreground text-xs" aria-hidden="true">—</span>
            <time className="blog-meta" dateTime="2023-09-10">{date}</time>
          </div>
          
          <h3 className={`font-bold text-foreground leading-tight group-hover:text-black transition-colors ${
            isSmall ? 'text-base' : 'text-lg'
          }`}>
            {title}
          </h3>
          
          {excerpt && !isSmall && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {excerpt}
            </p>
          )}
        </div>
      </Link>
    </article>
  );
};

export default BlogCard;