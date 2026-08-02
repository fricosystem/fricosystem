import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRef } from 'react';
import businessPost from '@/assets/business-post.jpg';
import techPost from '@/assets/tech-post.jpg';
import fashionPost from '@/assets/fashion-post.jpg';
import lifestylePost from '@/assets/lifestyle-post.jpg';
import workLifestyle from '@/assets/work-lifestyle.jpg';
import fashionLifestyle from '@/assets/fashion-lifestyle.jpg';

interface PickItem {
  id: string;
  title: string;
  category: string;
  date: string;
  excerpt: string;
  image: string;
}

const EditorsPick = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const picks: PickItem[] = [
    {
      id: '1',
      title: 'Editor Pick Title — Featured Content Description',
      category: 'CATEGORY',
      date: 'DATE',
      excerpt: 'Editor pick excerpt — Brief preview of the featured article content.',
      image: fashionLifestyle,
    },
    {
      id: '2',
      title: 'Featured Article — Content Summary',
      category: 'CATEGORY',
      date: 'DATE',
      excerpt: 'Article excerpt — Short description of what this featured content covers.',
      image: techPost,
    },
    {
      id: '3',
      title: 'Pick Title — Article Preview',
      category: 'CATEGORY',
      date: 'DATE',
      excerpt: 'Content preview — Description of the article topic and main points.',
      image: lifestylePost,
    },
    {
      id: '4',
      title: 'Selected Content — Featured Description',
      category: 'CATEGORY',
      date: 'DATE',
      excerpt: 'Featured excerpt — Summary of the highlighted article content.',
      image: workLifestyle,
    },
    {
      id: '5',
      title: 'Editor Choice — Content Overview',
      category: 'CATEGORY',
      date: 'DATE',
      excerpt: 'Choice excerpt — Brief overview of this specially selected content.',
      image: businessPost,
    },
    {
      id: '6',
      title: 'Top Pick — Article Highlight',
      category: 'CATEGORY',
      date: 'DATE',
      excerpt: 'Highlight excerpt — Preview of this top recommended article.',
      image: fashionPost,
    },
  ];

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="container-blog py-16">
      <div className="flex items-center justify-between mb-8">
        <h2 id="editors-pick-heading" className="section-title mb-0">Editor's Pick</h2>
        <div className="flex space-x-2" role="group" aria-label="Navigation controls for editor's picks">
          <Button
            variant="outline"
            size="sm"
            onClick={() => scroll('left')}
            className="p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="Scroll to previous articles"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => scroll('right')}
            className="p-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="Scroll to next articles"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex space-x-6 overflow-x-auto scrollbar-hide pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        role="region"
        aria-label="Editor's pick articles carousel"
        tabIndex={0}
      >
        {picks.map((pick) => (
          <article
            key={pick.id}
            className="flex-shrink-0 w-80 bg-card rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200"
          >
            <a
              href={`/article/${pick.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}`}
              className="block focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
              aria-label={`Read article: ${pick.title}`}
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={pick.image}
                  alt={`Editor's pick article: ${pick.title} - A professional image related to ${pick.category.toLowerCase()}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              
              <div className="p-6">
                <div className="flex items-center space-x-4 mb-3">
                  <span className="blog-meta">{pick.category}</span>
                  <span className="text-muted-foreground" aria-hidden="true">—</span>
                  <time className="blog-meta" dateTime="2023-09-10">{pick.date}</time>
                </div>
                
                <h3 className="text-lg font-bold text-foreground leading-tight mb-3">
                  {pick.title}
                </h3>
                
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  {pick.excerpt}
                </p>
                
                <Button variant="outline" size="sm" className="text-xs font-medium">
                  READ MORE
                </Button>
              </div>
            </a>
          </article>
        ))}
      </div>
    </section>
  );
};

export default EditorsPick;