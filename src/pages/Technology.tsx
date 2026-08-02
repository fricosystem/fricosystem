import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BlogCard from '@/components/BlogCard';
import PageFilter, { Post } from '@/components/PageFilter';
import { useState } from 'react';
import techPost from '@/assets/tech-post.jpg';
import fashionLifestyle from '@/assets/fashion-lifestyle.jpg';

const Technology = () => {
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);

  const techPosts: Post[] = [
    {
      title: "The Rise of Artificial Intelligence in Everyday Life",
      category: "TECHNOLOGY",
      subcategory: "Artificial Intelligence",
      date: "September 18, 2025",
      excerpt: "Exploring how AI is transforming industries and reshaping our daily experiences.",
      image: techPost,
      slug: "ai-everyday-life",
      tags: ["AI", "Machine Learning", "Daily Tech"]
    },
    {
      title: "Blockchain Beyond Cryptocurrency: Real-World Applications",
      category: "TECHNOLOGY",
      subcategory: "Blockchain",
      date: "September 12, 2025",
      excerpt: "Discovering innovative uses of blockchain technology across various sectors.",
      image: fashionLifestyle,
      slug: "blockchain-real-world-applications",
      tags: ["Blockchain", "Innovation", "Real-world Applications"]
    },
    {
      title: "The Future of Web Development: Trends to Watch in 2024",
      category: "TECHNOLOGY",
      subcategory: "Web Development",
      date: "September 8, 2025",
      excerpt: "Key technologies and frameworks shaping the next generation of web applications.",
      image: techPost,
      slug: "web-development-trends-2024",
      tags: ["Web Development", "Frontend", "Future Trends"]
    },
    {
      title: "Cybersecurity Best Practices for Small Businesses",
      category: "TECHNOLOGY",
      subcategory: "Cybersecurity",
      date: "September 5, 2025",
      excerpt: "Essential security measures every small business should implement to protect their data.",
      image: fashionLifestyle,
      slug: "cybersecurity-small-business",
      tags: ["Cybersecurity", "Small Business", "Data Protection"]
    },
    {
      title: "The Evolution of Mobile App Development",
      category: "TECHNOLOGY",
      subcategory: "Mobile Development",
      date: "August 30, 2025",
      excerpt: "From native to cross-platform: how mobile development approaches have transformed.",
      image: techPost,
      slug: "mobile-app-development-evolution",
      tags: ["Mobile Development", "Cross-platform", "App Development"]
    },
    {
      title: "Cloud Computing: Choosing the Right Solution for Your Business",
      category: "TECHNOLOGY",
      subcategory: "Cloud Computing",
      date: "August 26, 2025",
      excerpt: "A comprehensive guide to selecting the perfect cloud infrastructure for your needs.",
      image: fashionLifestyle,
      slug: "cloud-computing-business-guide",
      tags: ["Cloud Computing", "Infrastructure", "Business Solutions"]
    }
  ];

  const postsToShow = filteredPosts.length > 0 ? filteredPosts : techPosts;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main id="main-content" className="container-blog py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Technology
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Stay ahead of the curve with the latest in technology trends, innovations, and digital transformation.
          </p>
        </div>

        <PageFilter
          posts={techPosts}
          onFilteredPostsChange={setFilteredPosts}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {postsToShow.map((post) => (
            <BlogCard
              key={post.slug}
              title={post.title}
              category={post.category}
              date={post.date}
              excerpt={post.excerpt}
              image={post.image}
              href={`/blog/${post.slug}`}
              isSmall={false}
            />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Technology;