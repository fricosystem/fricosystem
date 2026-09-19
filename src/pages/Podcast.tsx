import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BlogCard from '@/components/BlogCard';
import PageFilter, { Post } from '@/components/PageFilter';
import { useState } from 'react';
import lifestylePost from '@/assets/lifestyle-post.jpg';
import fashionPost from '@/assets/fashion-post.jpg';
import workLifestyle from '@/assets/work-lifestyle.jpg';

const Podcast = () => {
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);

  const podcastEpisodes: Post[] = [
    {
      title: "The Future of Digital Storytelling: A Conversation with Content Creators",
      category: "PODCAST",
      subcategory: "Digital Media",
      date: "September 20, 2025",
      excerpt: "Join us as we explore how digital platforms are reshaping the way we tell and consume stories.",
      image: lifestylePost,
      slug: "future-digital-storytelling",
      tags: ["Storytelling", "Content Creation", "Digital Media"]
    },
    {
      title: "Building Authentic Brands in the Social Media Age",
      category: "PODCAST",
      subcategory: "Brand Strategy",
      date: "September 14, 2025",
      excerpt: "Industry experts discuss strategies for creating genuine connections with audiences online.",
      image: fashionPost,
      slug: "authentic-brands-social-media",
      tags: ["Brand Strategy", "Social Media", "Authenticity"]
    },
    {
      title: "The Psychology of Influence: Understanding Modern Marketing",
      category: "PODCAST",
      subcategory: "Marketing Psychology",
      date: "September 7, 2025",
      excerpt: "Diving deep into the psychological principles that drive successful marketing campaigns.",
      image: workLifestyle,
      slug: "psychology-influence-marketing",
      tags: ["Psychology", "Marketing", "Influence"]
    },
    {
      title: "Women in Tech: Breaking Barriers and Shaping the Future",
      category: "PODCAST",
      subcategory: "Tech Industry",
      date: "August 31, 2025",
      excerpt: "Inspiring conversations with female leaders who are transforming the technology landscape.",
      image: lifestylePost,
      slug: "women-in-tech",
      tags: ["Women in Tech", "Leadership", "Tech Industry"]
    },
    {
      title: "The Art of Personal Branding: From Vision to Execution",
      category: "PODCAST",
      subcategory: "Personal Development",
      date: "August 24, 2025",
      excerpt: "Learn how to craft and communicate your unique story in today's competitive market.",
      image: fashionPost,
      slug: "art-personal-branding",
      tags: ["Personal Branding", "Career Development", "Self-Marketing"]
    },
    {
      title: "Sustainable Living: Small Changes, Big Impact",
      category: "PODCAST",
      subcategory: "Sustainability",
      date: "August 17, 2025",
      excerpt: "Practical tips and insights for incorporating sustainability into your daily routine.",
      image: workLifestyle,
      slug: "sustainable-living-impact",
      tags: ["Sustainability", "Lifestyle", "Environmental Impact"]
    }
  ];

  const postsToShow = filteredPosts.length > 0 ? filteredPosts : podcastEpisodes;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main id="main-content" className="container-blog py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Podcast
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Engaging conversations with thought leaders, innovators, and creators shaping our world today.
          </p>
        </div>

        <PageFilter
          posts={podcastEpisodes}
          onFilteredPostsChange={setFilteredPosts}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {postsToShow.map((episode) => (
            <BlogCard
              key={episode.slug}
              title={episode.title}
              category={episode.category}
              date={episode.date}
              excerpt={episode.excerpt}
              image={episode.image}
              href={`/blog/${episode.slug}`}
              isSmall={false}
            />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Podcast;