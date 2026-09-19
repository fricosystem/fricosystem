import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BlogCard from '@/components/BlogCard';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Import all post data
import businessPost from '@/assets/business-post.jpg';
import fashionPost from '@/assets/fashion-post.jpg';
import techPost from '@/assets/tech-post.jpg';
import lifestylePost from '@/assets/lifestyle-post.jpg';
import fashionLifestyle from '@/assets/fashion-lifestyle.jpg';
import workLifestyle from '@/assets/work-lifestyle.jpg';

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  
  // All posts data combined from different pages
  const allPosts = useMemo(() => [
    // Fashion posts
    {
      title: "The Rise of Fashion Blogging: The Role of Influencers in the Industry",
      category: "FASHION",
      date: "September 20, 2025",
      excerpt: "Explore how fashion bloggers and influencers have transformed the industry landscape.",
      image: fashionPost,
      slug: "rise-of-fashion-blogging"
    },
    {
      title: "Fashion Week Highlights: Trends That Define the Season",
      category: "FASHION", 
      date: "September 8, 2024",
      excerpt: "A comprehensive look at the standout moments from this season's fashion weeks.",
      image: fashionLifestyle,
      slug: "fashion-week-highlights"
    },
    // Technology posts
    {
      title: "AI and Machine Learning: Transforming Business Operations",
      category: "TECHNOLOGY",
      date: "September 18, 2024", 
      excerpt: "Discover how artificial intelligence is revolutionizing the way businesses operate.",
      image: techPost,
      slug: "ai-machine-learning-business"
    },
    {
      title: "The Rise of Artificial Intelligence in Everyday Life",
      category: "TECHNOLOGY",
      date: "September 18, 2024",
      excerpt: "Exploring how AI is transforming industries and reshaping our daily experiences.",
      image: techPost,
      slug: "ai-everyday-life"
    },
    {
      title: "Blockchain Beyond Cryptocurrency: Real-World Applications",
      category: "TECHNOLOGY",
      date: "September 12, 2024",
      excerpt: "Discovering innovative uses of blockchain technology across various sectors.",
      image: fashionLifestyle,
      slug: "blockchain-real-world-applications"
    },
    {
      title: "The Future of Web Development: Trends to Watch in 2024",
      category: "TECHNOLOGY",
      date: "September 8, 2024",
      excerpt: "Key technologies and frameworks shaping the next generation of web applications.",
      image: techPost,
      slug: "web-development-trends-2024"
    },
    {
      title: "Cybersecurity Best Practices for Small Businesses",
      category: "TECHNOLOGY",
      date: "September 5, 2024",
      excerpt: "Essential security measures every small business should implement to protect their data.",
      image: fashionLifestyle,
      slug: "cybersecurity-small-business"
    },
    // Business posts
    {
      title: "Sustainable Business Practices for Modern Entrepreneurs",
      category: "BUSINESS",
      date: "September 15, 2024",
      excerpt: "Learn how to build a sustainable business that benefits both profit and planet.",
      image: businessPost,
      slug: "sustainable-business-practices"
    },
    {
      title: "The Future of Remote Work: Trends and Predictions",
      category: "BUSINESS",
      date: "September 10, 2024",
      excerpt: "Analyzing the evolution of remote work and what lies ahead.",
      image: workLifestyle,
      slug: "future-remote-work"
    },
    {
      title: "Building a Personal Brand in the Digital Age",
      category: "BUSINESS",
      date: "September 3, 2024",
      excerpt: "Essential strategies for creating and maintaining your online presence.",
      image: businessPost,
      slug: "personal-brand-digital-age"
    },
    // Lifestyle posts
    {
      title: "Mindful Living: Creating Balance in a Busy World",
      category: "LIFESTYLE",
      date: "September 12, 2024",
      excerpt: "Practical tips for incorporating mindfulness into your daily routine.",
      image: lifestylePost,
      slug: "mindful-living-balance"
    },
    {
      title: "Wellness Trends: What's Actually Worth Your Time",
      category: "LIFESTYLE",
      date: "September 1, 2024",
      excerpt: "Separating wellness fads from genuinely beneficial practices.",
      image: lifestylePost,
      slug: "wellness-trends-worth-time"
    },
    // Podcast episodes
    {
      title: "The Future of Digital Storytelling: A Conversation with Content Creators",
      category: "PODCAST",
      date: "September 20, 2024",
      excerpt: "Join us as we explore how digital platforms are reshaping the way we tell and consume stories.",
      image: lifestylePost,
      slug: "future-digital-storytelling"
    },
    {
      title: "Building Authentic Brands in the Social Media Age",
      category: "PODCAST",
      date: "September 14, 2024",
      excerpt: "Industry experts discuss strategies for creating genuine connections with audiences online.",
      image: fashionPost,
      slug: "authentic-brands-social-media"
    }
  ], []);

  // Filter posts based on search query
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase().trim();
    return allPosts.filter(post => 
      post.title.toLowerCase().includes(query) ||
      post.category.toLowerCase().includes(query) ||
      post.excerpt.toLowerCase().includes(query) ||
      post.slug.toLowerCase().includes(query)
    );
  }, [searchQuery, allPosts]);

  // Update search query when URL params change
  useEffect(() => {
    const queryParam = searchParams.get('q') || '';
    setSearchQuery(queryParam);
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchParams({});
  };

  const currentQuery = searchParams.get('q') || '';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main id="main-content" className="container-blog py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-8">
            Search Results
          </h1>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="relative max-w-md">
              <label htmlFor="search-input" className="sr-only">Search articles</label>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="search-input"
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-12 py-3"
                aria-label="Search articles"
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>

          {/* Search Results */}
          {currentQuery ? (
            <div>
              <div className="mb-6">
                <p className="text-lg text-muted-foreground">
                  {filteredPosts.length > 0 
                    ? `Found ${filteredPosts.length} result${filteredPosts.length === 1 ? '' : 's'} for "${currentQuery}"`
                    : `No results found for "${currentQuery}"`
                  }
                </p>
              </div>

              {filteredPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredPosts.map((post) => (
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
              ) : (
                <div className="text-center py-12">
                  <h2 className="text-2xl font-semibold text-foreground mb-4">
                    No articles found
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Try adjusting your search terms or browse our categories:
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <Button variant="outline" onClick={() => navigate('/business')}>
                      Business
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/technology')}>
                      Technology
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/podcast')}>
                      Podcast
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/posts')}>
                      All Posts
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                What are you looking for?
              </h2>
              <p className="text-muted-foreground mb-6">
                Enter a search term above to find articles, or browse our latest content:
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button variant="outline" onClick={() => navigate('/posts')}>
                  All Posts
                </Button>
                <Button variant="outline" onClick={() => navigate('/business')}>
                  Business
                </Button>
                <Button variant="outline" onClick={() => navigate('/technology')}>
                  Technology
                </Button>
                <Button variant="outline" onClick={() => navigate('/podcast')}>
                  Podcast
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SearchResults;