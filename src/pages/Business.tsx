import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BlogCard from '@/components/BlogCard';
import PageFilter, { Post } from '@/components/PageFilter';
import { useState } from 'react';
import businessPost from '@/assets/business-post.jpg';
import workLifestyle from '@/assets/work-lifestyle.jpg';

const Business = () => {
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);

  const businessPosts: Post[] = [
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
      title: "Digital Marketing Strategies That Actually Work",
      category: "BUSINESS",
      subcategory: "Digital Marketing",
      date: "August 28, 2025",
      excerpt: "Proven digital marketing tactics to grow your business in today's competitive landscape.",
      image: workLifestyle,
      slug: "digital-marketing-strategies",
      tags: ["Digital Marketing", "Growth Strategies", "Online Marketing"]
    },
    {
      title: "Leadership in Times of Change",
      category: "BUSINESS",
      subcategory: "Leadership",
      date: "August 25, 2025",
      excerpt: "How effective leaders navigate uncertainty and drive organizational success.",
      image: businessPost,
      slug: "leadership-times-change",
      tags: ["Leadership", "Change Management", "Business Strategy"]
    },
    {
      title: "The Economics of Startup Growth",
      category: "BUSINESS",
      subcategory: "Startup Growth",
      date: "August 22, 2025",
      excerpt: "Understanding the financial dynamics that drive successful startup scaling.",
      image: workLifestyle,
      slug: "economics-startup-growth",
      tags: ["Startups", "Growth Economics", "Business Finance"]
    }
  ];

  const postsToShow = filteredPosts.length > 0 ? filteredPosts : businessPosts;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main id="main-content" className="container-blog py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Business
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Insights and strategies for modern business leaders and entrepreneurs navigating today's competitive landscape.
          </p>
        </div>

        <PageFilter
          posts={businessPosts}
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

export default Business;