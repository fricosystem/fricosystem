import BlogCard from './BlogCard';
import businessPost from '@/assets/business-post.jpg';
import techPost from '@/assets/tech-post.jpg';
import fashionPost from '@/assets/fashion-post.jpg';
import lifestylePost from '@/assets/lifestyle-post.jpg';
import workLifestyle from '@/assets/work-lifestyle.jpg';
import fashionLifestyle from '@/assets/fashion-lifestyle.jpg';

const blogPosts = [
  {
    title: "Blog Post Title — Main Content Description",
    category: "CATEGORY",
    date: "DATE",
    excerpt: "Blog post excerpt — Brief description of the article content for preview.",
    image: businessPost
  },
  {
    title: "Article Title — Content Preview", 
    category: "CATEGORY",
    date: "DATE",
    excerpt: "Article excerpt — Short summary of what readers can expect from this post.",
    image: techPost
  },
  {
    title: "Post Title — Article Summary",
    category: "CATEGORY",
    date: "DATE",
    excerpt: "Post excerpt — Description that gives readers insight into the article topic.",
    image: workLifestyle
  },
  {
    title: "Title — Description", 
    category: "CATEGORY",
    date: "DATE",
    image: lifestylePost
  },
  {
    title: "Sample Title — Sample Description",
    category: "CATEGORY",
    date: "DATE", 
    image: fashionLifestyle
  },
  {
    title: "Content Title — Content Description",
    category: "CATEGORY",
    date: "DATE",
    image: fashionPost
  }
];

const BlogGrid = () => {
  return (
    <section className="container-blog py-16">
      <h2 id="all-posts-heading" className="section-title mb-8">All Posts</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {blogPosts.map((post, index) => (
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

export default BlogGrid;