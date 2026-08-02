import { Twitter, Mic, Heart, Youtube } from 'lucide-react';
import { ToolCard } from './ToolCard';
import { MainNavigation } from './MainNavigation';
import { LazyMatchCalendar } from './LazyMatchCalendar';
import { tools } from '@/data/tools';
import { useState, useEffect } from 'react';
export const SorareBasicLanding = () => {
  const [favorites, setFavorites] = useState<string[]>([]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('sorare-favorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch {
        // If parsing fails, use empty array
        setFavorites([]);
      }
    }
  }, []);

  // Save favorites to localStorage whenever favorites change
  useEffect(() => {
    localStorage.setItem('sorare-favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Toggle favorite status
  const toggleFavorite = (toolName: string) => {
    setFavorites(prev => {
      if (prev.includes(toolName)) {
        return prev.filter(name => name !== toolName);
      } else {
        return [...prev, toolName];
      }
    });
  };

  // Sort tools: favorites first, then the rest
  const sortedTools = [...tools].sort((a, b) => {
    const aIsFavorite = favorites.includes(a.name);
    const bIsFavorite = favorites.includes(b.name);
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;
    return 0; // Keep original order within each group
  });
  return <div className="min-h-screen bg-background">
      <MainNavigation />
      
      <div className="container mx-auto px-6 lg:px-8">
        {/* Hero Section */}
        <header className="text-center pt-20 pb-16 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Sorare Basic
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed font-light">
            Your go-to dashboard for all helpful Sorare tools, community resources, 
            and expert insights neatly organized in one place.
          </p>
        </header>

        {/* Essential Sorare Tools */}
        <section className="mb-24">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-foreground">
            Essential Sorare Tools
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {sortedTools.map(tool => <ToolCard key={tool.name} name={tool.name} description={tool.description} url={tool.url} icon={tool.icon} iconColor={tool.iconColor} comingSoon={tool.comingSoon} isSupport={tool.isSupport} isFavorite={favorites.includes(tool.name)} onToggleFavorite={toggleFavorite} />)}
          </div>
        </section>

        {/* Community Content Section */}
        <section className="mb-24 max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-foreground">
            Sorare Community Content
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* DoppelDNP */}
            <div className="group bg-card rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-500 border border-border/50 hover:border-border hover:-translate-y-1">
              <div className="flex flex-col h-full">
                <div className="mb-6">
                  <div className="inline-flex p-4 rounded-2xl bg-green-500/10 mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Mic className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    DoppelDNP 🇩🇪
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    The first German Sorare Podcast! Weekly episodes about our favorite Fantasy Football game.
                  </p>
                </div>
                <div className="mt-auto">
                  <a href="https://open.spotify.com/show/1DW05peAwO2kQklg4pbIc4?si=L_bciPv9R-SV3l_uqvdH-w&nd=1&dlsi=3df838f676384af4" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-full px-6 py-3 rounded-xl font-medium transition-all duration-300 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md">
                    Listen on Spotify
                  </a>
                </div>
              </div>
            </div>

            {/* NoTime Sorare */}
            <div className="group bg-card rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-500 border border-border/50 hover:border-border hover:-translate-y-1">
              <div className="flex flex-col h-full">
                <div className="mb-6">
                  <div className="inline-flex p-4 rounded-2xl bg-red-500/10 mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Youtube className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    NoTime Sorare 🇩🇪
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    German Sorare content with insights, strategies and weekly updates.
                  </p>
                </div>
                <div className="mt-auto">
                  <a href="https://www.youtube.com/@NoTimeW3" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-full px-6 py-3 rounded-xl font-medium transition-all duration-300 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md">
                    Watch on YouTube
                  </a>
                </div>
              </div>
            </div>

            {/* Quinny */}
            <div className="group bg-card rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-500 border border-border/50 hover:border-border hover:-translate-y-1">
              <div className="flex flex-col h-full">
                <div className="mb-6">
                  <div className="inline-flex p-4 rounded-2xl bg-red-500/10 mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Youtube className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Quinny 🇬🇧
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    One of the most well-known Sorare creators. Lineups, challenges and weekly content.
                  </p>
                </div>
                <div className="mt-auto">
                  <a href="https://www.youtube.com/c/Quinny3001" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-full px-6 py-3 rounded-xl font-medium transition-all duration-300 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md">
                    Watch on YouTube
                  </a>
                </div>
              </div>
            </div>

            {/* Harry Trades */}
            <div className="group bg-card rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-500 border border-border/50 hover:border-border hover:-translate-y-1">
              <div className="flex flex-col h-full">
                <div className="mb-6">
                  <div className="inline-flex p-4 rounded-2xl bg-red-500/10 mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Youtube className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Harry Trades 🇬🇧
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Deep dives into Sorare strategies, scouting tips and trading approaches.
                  </p>
                </div>
                <div className="mt-auto">
                  <a href="https://www.youtube.com/@HarryTrades" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-full px-6 py-3 rounded-xl font-medium transition-all duration-300 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md">
                    Watch on YouTube
                  </a>
                </div>
              </div>
            </div>

            {/* NepentheZ Sorare */}
            <div className="group bg-card rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-500 border border-border/50 hover:border-border hover:-translate-y-1">
              <div className="flex flex-col h-full">
                <div className="mb-6">
                  <div className="inline-flex p-4 rounded-2xl bg-red-500/10 mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Youtube className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    NepentheZ Sorare 🇬🇧
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Popular YouTuber with a focus on Fantasy sports and Sorare guides.
                  </p>
                </div>
                <div className="mt-auto">
                  <a href="https://www.youtube.com/@FantasyNFT" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-full px-6 py-3 rounded-xl font-medium transition-all duration-300 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md">
                    Watch on YouTube
                  </a>
                </div>
              </div>
            </div>

            {/* proownez sorare */}
            <div className="group bg-card rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-500 border border-border/50 hover:border-border hover:-translate-y-1">
              <div className="flex flex-col h-full">
                <div className="mb-6">
                  <div className="inline-flex p-4 rounded-2xl bg-red-500/10 mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Youtube className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    proownez sorare 🇩🇪
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    proownez mit Tipps und Tricks zu sorare!
                  </p>
                </div>
                <div className="mt-auto">
                  <a href="https://www.youtube.com/@proownezsorare" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-full px-6 py-3 rounded-xl font-medium transition-all duration-300 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md">
                    Watch on YouTube
                  </a>
                </div>
              </div>
            </div>

            {/* Sorareando */}
            <div className="group bg-card rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-500 border border-border/50 hover:border-border hover:-translate-y-1">
              <div className="flex flex-col h-full">
                <div className="mb-6">
                  <div className="inline-flex p-4 rounded-2xl bg-green-500/10 mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Mic className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Sorareando 🇪🇸
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Charlas sobre Sorare con la comunidad española: análisis, estrategias, mercado y fútbol.
                  </p>
                </div>
                <div className="mt-auto">
                  <a href="https://tr.ee/0-5xZS86uy" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-full px-6 py-3 rounded-xl font-medium transition-all duration-300 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md">Listen on Spotify</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Match Calendar Section */}
        <div className="mb-24">
          <LazyMatchCalendar />
        </div>

        {/* Follow us on X Section */}
        <section className="text-center pb-24">
          <div className="bg-card rounded-3xl p-12 shadow-sm hover:shadow-xl transition-all duration-500 border border-border/50 hover:border-border max-w-2xl mx-auto">
            <p className="text-2xl font-semibold text-foreground mb-6">Follow us on X</p>
            <a href="https://x.com/sorare_coach" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-14 h-14 bg-foreground hover:bg-foreground/90 text-background rounded-full transition-all duration-300 hover:scale-110 shadow-md">
              <Twitter size={24} />
            </a>
          </div>
        </section>
      </div>
    </div>;
};