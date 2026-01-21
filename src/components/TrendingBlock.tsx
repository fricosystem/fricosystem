import BlogCard from './BlogCard';
import businessPost from '@/assets/business-post.jpg';
import techPost from '@/assets/tech-post.jpg';
import fashionPost from '@/assets/fashion-post.jpg';
import lifestylePost from '@/assets/lifestyle-post.jpg';
import workLifestyle from '@/assets/work-lifestyle.jpg';
import fashionLifestyle from '@/assets/fashion-lifestyle.jpg';

const trendingPosts = [
  {
    title: "Trending Title — Popular Content Description",
    category: "CATEGORY",
    date: "DATE",
    excerpt: "Trending excerpt — Description of what makes this content popular.",
    image: businessPost
  },
  {
    title: "Hot Topic — Trending Article Summary",
    category: "CATEGORY", 
    date: "DATE",
    excerpt: "Hot topic excerpt — Brief summary of this trending article.",
    image: techPost
  },
  {
    title: "Popular Post — Trending Content Preview",
    category: "CATEGORY",
    date: "DATE",
    excerpt: "Popular excerpt — Preview of why this content is trending.",
    image: fashionLifestyle
  },
  {
    title: "Trending Article — Content Highlight",
    category: "CATEGORY",
    date: "DATE",
    excerpt: "Article excerpt — Highlight of the trending topic discussion.",
    image: workLifestyle
  },
  {
    title: "Popular Content — Trending Description",
    category: "CATEGORY",
    date: "DATE",
    excerpt: "Content excerpt — Description of this popular trending topic.",
    image: lifestylePost
  },
  {
    title: "Hot Content — Trending Summary",
    category: "CATEGORY",
    date: "DATE",
    excerpt: "Summary excerpt — Brief overview of this hot trending content.",
    image: fashionPost
  }
];

const TrendingBlock = () => {
  return (
    <section className="container-blog py-16 bg-muted/30">
      <h2 id="trending-heading" className="section-title mb-8">Trending</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {trendingPosts.map((post, index) => (
          <BlogCard
            key={index}
            title={post.title}
            category={post.category}
            date={post.date}
            excerpt={index < 3 ? post.excerpt : undefined}
            image={post.image}
            isSmall={index >= 3}
          />
        ))}
      </div>
    </section>
  );
};

export default TrendingBlock;