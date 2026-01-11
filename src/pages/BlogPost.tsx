import { useParams, Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { blogPosts } from "@/data/blogPosts";

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const post = blogPosts.find(p => p.id === id);

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-32 pb-32">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-light text-architectural mb-8">
                Post Not Found
              </h1>
              <Link 
                to="/blog" 
                className="text-minimal text-foreground hover:text-muted-foreground transition-colors duration-300"
              >
                ← BACK TO BLOG
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Article Header */}
      <article className="pt-32 pb-32">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            {/* Back Link */}
            <Link 
              to="/blog" 
              className="inline-block text-minimal text-muted-foreground hover:text-foreground transition-colors duration-300 mb-12"
            >
              ← BACK TO BLOG
            </Link>
            
            {/* Article Meta */}
            <div className="mb-8">
              <div className="flex items-center text-minimal text-muted-foreground space-x-4 mb-6">
                <span className="bg-muted px-3 py-1 text-foreground">{post.category}</span>
                <span>{post.date}</span>
                <span>•</span>
                <span>{post.author}</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-light text-architectural mb-6">
                {post.title}
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                {post.excerpt}
              </p>
            </div>
            
            {/* Featured Image */}
            {post.imageUrl && (
              <div className="w-full h-96 mb-12 overflow-hidden">
                <img 
                  src={post.imageUrl} 
                  alt={post.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
            )}
            
            {/* Article Content */}
            <div className="prose prose-lg max-w-none">
              <div className="text-muted-foreground leading-relaxed space-y-6">
                {post.content.map((section, index) => {
                  if (section.type === 'heading') {
                    return <h2 key={index} className="text-2xl md:text-3xl font-light text-architectural mb-6 mt-10">{section.content}</h2>;
                  } else if (section.type === 'subheading') {
                    return <h3 key={index} className="text-xl md:text-2xl font-medium text-foreground mb-4 mt-8">{section.content}</h3>;
                  } else if (section.type === 'list' && section.items) {
                    return (
                      <ul key={index} className="ml-6 mb-4">
                        {section.items.map((item, i) => (
                          <li key={i} className="mb-2">{item}</li>
                        ))}
                      </ul>
                    );
                  } else if (section.type === 'quote') {
                    return <blockquote key={index} className="border-l-4 border-primary pl-4 italic my-4">{section.content}</blockquote>;
                  } else {
                    return <p key={index} className="mb-4">{section.content}</p>;
                  }
                })}
              </div>
            </div>
            
            {/* Author Info */}
            <div className="mt-16 pt-8 border-t border-border">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-muted rounded-full"></div>
                <div>
                  <h3 className="text-lg font-medium text-foreground">{post.author}</h3>
                  <p className="text-muted-foreground">Architect & Writer</p>
                </div>
              </div>
            </div>
            
            {/* Related Posts */}
            <div className="mt-20">
              <h3 className="text-2xl font-light text-architectural mb-8">Related Articles</h3>
              <div className="grid md:grid-cols-2 gap-8">
                {blogPosts
                  .filter(p => p.id !== post.id && p.category === post.category)
                  .slice(0, 2)
                  .map(relatedPost => (
                    <Link key={relatedPost.id} to={`/blog/${relatedPost.id}`} className="group">
                      {relatedPost.imageUrl && (
                        <div className="w-full h-48 mb-4 overflow-hidden">
                          <img 
                            src={relatedPost.imageUrl} 
                            alt={relatedPost.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        </div>
                      )}
                      <h4 className="text-lg font-light text-architectural group-hover:text-muted-foreground transition-colors duration-300 mb-2">
                        {relatedPost.title}
                      </h4>
                      <p className="text-minimal text-muted-foreground">{relatedPost.date}</p>
                    </Link>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
};

export default BlogPost;