import { useState, useEffect, useRef } from 'react';

const MatchCalendarFrame = () => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full overflow-x-auto">
      {shouldLoad ? (
        <iframe 
          src="https://docs.google.com/spreadsheets/d/1PiIIMkNP_tcD5nNY75xzXR7oD2DuKR4HiR3SjZpxFQ8/edit?usp=sharing&single=true&widget=true&headers=false&gid=1733842481" 
          width="100%" 
          height="600" 
          frameBorder="0" 
          className="min-w-[800px]" 
          title="Match Calendar"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-[600px] min-w-[800px] flex items-center justify-center bg-muted/20 rounded border-2 border-dashed border-muted">
          <div className="text-center text-muted-foreground">
            <div className="text-2xl mb-2">📅</div>
            <div>Calendar will load when visible</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchCalendarFrame;