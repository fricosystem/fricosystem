import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BlogCard from '@/components/BlogCard';
import PageFilter, { Post } from '@/components/PageFilter';
import { useState } from 'react';
import businessPost from '@/assets/business-post.jpg';
import fashionPost from '@/assets/fashion-post.jpg';
import techPost from '@/assets/tech-post.jpg';
import lifestylePost from '@/assets/lifestyle-post.jpg';
import fashionLifestyle from '@/assets/fashion-lifestyle.jpg';
import workLifestyle from '@/assets/work-lifestyle.jpg';

const AllPosts = () => {
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);

  const blogPosts: Post[] = [
    {
      title: "The Rise of Fashion Blogging: The Role of Influencers in the Industry",
      category: "FASHION",
      subcategory: "Digital Fashion", 
      date: "September 20, 2025",
      excerpt: "Explore how fashion bloggers and influencers have transformed the industry landscape.",
      image: fashionPost,
      slug: "rise-of-fashion-blogging",
      tags: ["Influencers", "Social Media", "Fashion Industry"]
    },
    {
      title: "AI and Machine Learning: Transforming Business Operations",
      category: "TECHNOLOGY", 
      subcategory: "Artificial Intelligence",
      date: "September 18, 2025",
      excerpt: "Discover how artificial intelligence is revolutionizing the way businesses operate.",
      image: techPost,
      slug: "ai-machine-learning-business",
      tags: ["AI", "Machine Learning", "Business Automation"]
    },
    {
      title: "Sustainable Business Practices for Modern Entrepreneurs",
      category: "BUSINESS",
      subcategory: "Sustainability",
      date: "September 15, 2025", 
      excerpt: "Learn how to build a sustainable business that benefits both profit and planet.",
      image: businessPost,
      slug: "sustainable-business-practices",
      tags: ["Sustainability", "Green Business", "Entrepreneurship"]
    },
    {
      title: "Mindful Living: Creating Balance in a Busy World",
      category: "LIFESTYLE",
      subcategory: "Wellness",
      date: "September 12, 2025",
      excerpt: "Practical tips for incorporating mindfulness into your daily routine.",
      image: lifestylePost,
      slug: "mindful-living-balance",
      tags: ["Mindfulness", "Wellness", "Work-Life Balance"]
    },
    {
      title: "The Future of Remote Work: Trends and Predictions",
      category: "BUSINESS",
      subcategory: "Future of Work",
      date: "September 10, 2025",
      excerpt: "Analyzing the evolution of remote work and what lies ahead.",
      image: workLifestyle,
      slug: "future-remote-work",
      tags: ["Remote Work", "Future Trends", "Digital Workplace"]
    },
    {
      title: "Fashion Week Highlights: Trends That Define the Season",
      category: "FASHION",
      subcategory: "Fashion Events",
      date: "September 8, 2025",
      excerpt: "A comprehensive look at the standout moments from this season's fashion weeks.",
      image: fashionLifestyle,
      slug: "fashion-week-highlights",
      tags: ["Fashion Week", "Trends", "Runway"]
    },
    {
      title: "Blockchain Technology: Beyond Cryptocurrency",
      category: "TECHNOLOGY",
      subcategory: "Blockchain",
      date: "September 5, 2025",
      excerpt: "Exploring innovative applications of blockchain in various industries.",
      image: techPost,
      slug: "blockchain-beyond-crypto",
      tags: ["Blockchain", "Cryptocurrency", "Innovation"]
    },
    {
      title: "Building a Personal Brand in the Digital Age",
      category: "BUSINESS",
      subcategory: "Personal Branding",
      date: "September 3, 2025",
      excerpt: "Essential strategies for creating and maintaining your online presence.",
      image: businessPost,
      slug: "personal-brand-digital-age",
      tags: ["Personal Branding", "Digital Marketing", "Online Presence"]
    },
    {
      title: "Wellness Trends: What's Actually Worth Your Time",
      category: "LIFESTYLE",
      subcategory: "Health Trends",
      date: "September 1, 2025",
      excerpt: "Separating wellness fads from genuinely beneficial practices.",
      image: lifestylePost,
      slug: "wellness-trends-worth-time",
      tags: ["Health", "Wellness Trends", "Self-Care"]
    }
  ];

  const postsToShow = filteredPosts.length > 0 ? filteredPosts : blogPosts;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main id="main-content" className="container-blog py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            All Posts
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover our complete collection of articles covering fashion, technology, business, and lifestyle topics.
          </p>
        </div>

        <PageFilter
          posts={blogPosts}
          onFilteredPostsChange={setFilteredPosts}
          availableCategories={["FASHION", "TECHNOLOGY", "BUSINESS", "LIFESTYLE"]}
          showCategoryFilter={true}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {postsToShow.map((post, index) => (
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

export default AllPosts;