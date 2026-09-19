import { lazy, Suspense } from 'react';

const MatchCalendarFrame = lazy(() => import('./MatchCalendarFrame'));

export const LazyMatchCalendar = () => {
  return (
    <section className="max-w-6xl mx-auto mt-16 mb-16">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full mb-6">
          <span className="text-3xl">📅</span>
        </div>
        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-gray-500">
          Live Match Calendar & Gameweek Schedule
        </h2>
        
        <p className="text-lg max-w-3xl mx-auto leading-relaxed text-gray-500">
          Plan your lineups better. Here's a live calendar showing the number of matches per league in each Gameweek. 
          <span className="font-medium text-amber-500"> Updated regularly by SorareProbabilities.</span>
        </p>
      </div>
      
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300"></div>
        <div className="relative bg-card rounded-xl border border-border/50 overflow-hidden shadow-lg backdrop-blur-sm">
          <div className="bg-gradient-to-r from-primary/5 to-accent/5 p-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium text-muted-foreground ml-4">Live Match Calendar</span>
            </div>
          </div>
          <Suspense fallback={
            <div className="w-full h-[600px] flex items-center justify-center bg-muted/50">
              <div className="text-muted-foreground">Loading calendar...</div>
            </div>
          }>
            <MatchCalendarFrame />
          </Suspense>
        </div>
      </div>
    </section>
  );
};