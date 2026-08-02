export interface Article {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  image: string;
  slug: string;
  colorClass: string;
  author: {
    name: string;
    avatar: string;
  };
  readTime: string;
  content?: string;
}

export const articles: Article[] = [
  {
    id: "1",
    title: "BUILDING A CAPSULE WARDROBE",
    excerpt: "Discover how to curate a versatile wardrobe with fewer pieces that work seamlessly together, creating endless styling possibilities while embracing sustainable fashion.",
    date: "March 19, 2025",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=800&fit=crop",
    slug: "building-capsule-wardrobe",
    colorClass: "bg-vibrant-purple",
    author: {
      name: "Sofia Laurent",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
    },
    readTime: "5 min",
    content: `
      <p>The capsule wardrobe concept has revolutionized how we approach getting dressed. It's not about restriction—it's about intentional curation and discovering your authentic style.</p>
      
      <h2>UNDERSTANDING THE FOUNDATION</h2>
      <p>A capsule wardrobe typically consists of 30-40 versatile pieces that can be mixed and matched to create multiple outfits. The key is selecting items that reflect your lifestyle and personal aesthetic.</p>
      
      <h2>STARTING WITH ESSENTIALS</h2>
      <p>Begin with classic pieces: a well-fitted blazer, quality denim, crisp white shirts, and neutral basics. These foundational items form the backbone of your wardrobe and never go out of style.</p>
      
      <h2>COLOR HARMONY</h2>
      <p>Choose a cohesive color palette that complements your skin tone and personal style. Neutrals like black, white, navy, and beige provide versatility, while one or two accent colors add personality.</p>
      
      <h2>QUALITY OVER QUANTITY</h2>
      <p>Invest in well-made pieces that will last. Look for quality fabrics, proper construction, and timeless silhouettes. A higher price point per item often means better longevity and less overall spending.</p>
      
      <h2>SEASONAL TRANSITIONS</h2>
      <p>Rotate pieces seasonally while maintaining your core wardrobe. Layering pieces like cardigans and lightweight jackets allow your capsule to work year-round.</p>
      
      <p>Building a capsule wardrobe is a journey of self-discovery. It teaches you what you truly love to wear and helps eliminate decision fatigue while promoting more sustainable fashion choices.</p>
    `
  },
  {
    id: "2",
    title: "SUSTAINABLE FASHION LUXURY",
    excerpt: "Explore how conscious design is reshaping the fashion industry, from innovative materials to transparent production practices.",
    date: "March 15, 2025",
    image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&h=800&fit=crop",
    slug: "sustainable-fashion-luxury",
    colorClass: "bg-vibrant-yellow",
    author: {
      name: "Alessandro Verde",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
    },
    readTime: "7 min"
  },
  {
    id: "3",
    title: "THRIFTING DESIGNER PIECES",
    excerpt: "Learn the art of vintage shopping and how to spot authentic designer gems while building a unique, sustainable wardrobe.",
    date: "March 10, 2025",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=800&fit=crop",
    slug: "thrifting-designer-pieces",
    colorClass: "bg-vibrant-mint",
    author: {
      name: "Isabella Monroe",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop"
    },
    readTime: "6 min"
  },
  {
    id: "4",
    title: "MASTERING YOUR COLOR PALETTE",
    excerpt: "Unlock the power of color to enhance your natural features and create stunning, cohesive outfits that express your unique style.",
    date: "February 28, 2025",
    image: "https://images.unsplash.com/photo-1525562723836-dca67a71d5f1?w=800&h=800&fit=crop",
    slug: "color-palette-fashion",
    colorClass: "bg-vibrant-coral",
    author: {
      name: "Sofia Laurent",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
    },
    readTime: "5 min"
  },
  {
    id: "5",
    title: "WHY CUSTOM FIT MATTERS",
    excerpt: "Discover how proper tailoring transforms off-the-rack pieces into perfectly fitted garments that elevate your entire wardrobe.",
    date: "February 20, 2025",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&h=800&fit=crop",
    slug: "custom-fit-tailoring",
    colorClass: "bg-vibrant-blue",
    author: {
      name: "Alessandro Verde",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
    },
    readTime: "4 min"
  },
  {
    id: "6",
    title: "STATEMENT PIECES STYLING",
    excerpt: "Master the art of accessorizing to transform simple outfits into memorable looks with jewelry, bags, and scarves.",
    date: "February 15, 2025",
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=800&fit=crop",
    slug: "statement-pieces-styling",
    colorClass: "bg-vibrant-magenta",
    author: {
      name: "Isabella Monroe",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop"
    },
    readTime: "6 min"
  },
  {
    id: "7",
    title: "UNDERSTANDING TEXTILE QUALITY",
    excerpt: "Learn to identify premium fabrics and understand how material choice impacts garment longevity, comfort, and style.",
    date: "February 10, 2025",
    image: "https://images.unsplash.com/photo-1558769132-cb1aea1847c8?w=800&h=800&fit=crop",
    slug: "textile-quality-guide",
    colorClass: "bg-vibrant-orange",
    author: {
      name: "Sofia Laurent",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
    },
    readTime: "8 min"
  },
  {
    id: "8",
    title: "EMERGING FASHION DESIGNERS",
    excerpt: "Spotlight on innovative new designers who are redefining fashion with fresh perspectives and boundary-pushing creativity.",
    date: "February 5, 2025",
    image: "https://images.unsplash.com/photo-1558769132-92e717d613cd?w=800&h=800&fit=crop",
    slug: "emerging-fashion-designers",
    colorClass: "bg-vibrant-lavender",
    author: {
      name: "Alessandro Verde",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
    },
    readTime: "5 min"
  },
  {
    id: "9",
    title: "MONOCHROME STYLING GUIDE",
    excerpt: "Master the sophisticated art of head-to-toe monochromatic dressing for effortlessly chic and elongating looks.",
    date: "January 28, 2025",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=800&fit=crop",
    slug: "monochrome-styling-guide",
    colorClass: "bg-vibrant-yellow",
    author: {
      name: "Isabella Monroe",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop"
    },
    readTime: "7 min"
  }
];
