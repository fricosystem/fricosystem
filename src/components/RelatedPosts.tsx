import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface Post {
  slug: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  image: string;
  excerpt?: string;
}

interface RelatedPostsProps {
  currentPost: {
    category: string;
    title: string;
  };
  allPosts: Post[];
  maxPosts?: number;
}

const RelatedPosts = ({ currentPost, allPosts, maxPosts = 3 }: RelatedPostsProps) => {
  // Algorithm to find related posts
  const getRelatedPosts = () => {
    const scoredPosts = allPosts
      .filter(post => post.title !== currentPost.title) // Exclude current post
      .map(post => {
        let score = 0;
        
        // Same category gets highest score
        if (post.category === currentPost.category) {
          score += 10;
        }
        
        // Check for common words in titles (simple keyword matching)
        const currentWords = currentPost.title.toLowerCase().split(' ');
        const postWords = post.title.toLowerCase().split(' ');
        const commonWords = currentWords.filter(word => 
          word.length > 3 && postWords.includes(word)
        );
        score += commonWords.length * 2;
        
        return { ...post, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, maxPosts);

    return scoredPosts;
  };

  const relatedPosts = getRelatedPosts();

  if (relatedPosts.length === 0) return null;

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-foreground">Related Articles</h3>
      
      <div className="grid gap-6">
        {relatedPosts.map((post) => (
          <Card key={post.slug} className="group hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              <Link to={`/blog/${post.slug}`} className="block">
                <div className="flex gap-4">
                  <div className="w-24 h-24 flex-shrink-0">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  
                  <div className="flex-1 py-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {post.category}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {post.readTime}
                      </div>
                    </div>
                    
                    <h4 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h4>
                    
                    <p className="text-xs text-muted-foreground mt-1">
                      {post.date}
                    </p>
                    
                    {post.excerpt && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RelatedPosts;