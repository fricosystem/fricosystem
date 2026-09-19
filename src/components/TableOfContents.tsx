import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { List } from 'lucide-react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

const TableOfContents = ({ content }: TableOfContentsProps) => {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // Extract headings from content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const items: TocItem[] = [];

    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      const text = heading.textContent || '';
      const id = `heading-${index}`;
      
      // Add ID to the heading for navigation
      heading.id = id;
      
      items.push({ id, text, level });
    });

    setTocItems(items);

    // Update the actual DOM with IDs
    const articleContent = document.querySelector('[data-article-content]');
    if (articleContent) {
      articleContent.innerHTML = tempDiv.innerHTML;
    }
  }, [content]);

  useEffect(() => {
    const handleScroll = () => {
      const headingElements = tocItems.map(item => 
        document.getElementById(item.id)
      ).filter(Boolean);

      let current = '';
      
      for (const element of headingElements) {
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100) {
            current = element.id;
          }
        }
      }
      
      setActiveId(current);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [tocItems]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80; // Account for fixed header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  if (tocItems.length === 0) return null;

  return (
    <Card className="sticky top-24">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <List className="h-5 w-5" />
          Table of Contents
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <nav className="space-y-1">
          {tocItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToHeading(item.id)}
              className={`block w-full text-left text-sm py-1 px-2 rounded hover:bg-muted transition-colors ${
                activeId === item.id
                  ? 'text-primary font-medium bg-muted'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              style={{ paddingLeft: `${(item.level - 1) * 12 + 8}px` }}
            >
              {item.text}
            </button>
          ))}
        </nav>
      </CardContent>
    </Card>
  );
};

export default TableOfContents;