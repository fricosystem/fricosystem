import { Star, Trophy, Target, Users, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MainNavigation } from '@/components/MainNavigation';
import { Helmet } from 'react-helmet-async';
const competitionsImage = '/lovable-uploads/42570683-52c9-46b2-a2d9-80920934988a.png';
import dailyPackImage from '@/assets/daily-pack.png';
import lineupFormationImage from '@/assets/lineup-formation.png';
import hotStreaksImage from '@/assets/hot-streaks.webp';
import so5LineupImage from '@/assets/so5-lineup.png';
const BeginnersGuide = () => {
  const rarityLevels = [{
    name: 'Common',
    color: 'white',
    description: 'unlimited - for free',
    bgColor: 'bg-gray-100 text-gray-800 border-gray-300'
  }, {
    name: 'Limited',
    color: 'yellow',
    description: '1000 cards/season',
    bgColor: 'bg-yellow-100 text-yellow-800 border-yellow-300'
  }, {
    name: 'Rare',
    color: 'red',
    description: '100 cards/season',
    bgColor: 'bg-red-100 text-red-800 border-red-300'
  }, {
    name: 'Super Rare',
    color: 'blue',
    description: '10 cards/season',
    bgColor: 'bg-blue-100 text-blue-800 border-blue-300'
  }, {
    name: 'Unique',
    color: 'black',
    description: '1 card/season',
    bgColor: 'bg-gray-900 text-white border-gray-700'
  }];
  return <>
      <Helmet>
        <title>Sorare Beginners Guide 2025/26 - Complete Fantasy Football Tutorial</title>
        <meta name="description" content="Complete beginner's guide to Sorare fantasy football for 2025/26 season. Learn card rarities, game modes, competitions, and how to start playing for free." />
        <meta name="keywords" content="Sorare beginners guide, Sorare tutorial, fantasy football guide, Sorare 2025, Sorare cards, SO5, Academy mode, Sorare Pro" />
        <link rel="canonical" href="https://sorarebasic.lovable.app/beginners-guide" />
        <meta property="og:title" content="Sorare Beginners Guide 2025/26 - Complete Fantasy Football Tutorial" />
        <meta property="og:description" content="Learn everything about Sorare fantasy football: card rarities, game modes, competitions, and how to get started for free in 2025/26." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://sorarebasic.lovable.app/beginners-guide" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Sorare Beginners Guide 2025/26" />
        <meta name="twitter:description" content="Complete tutorial for new Sorare players - learn card rarities, game modes and competitions" />
        <script type="application/ld+json">
          {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "How to Start Playing Sorare Fantasy Football",
          "description": "Complete beginner's guide to Sorare fantasy football for the 2025/26 season",
          "image": "/lovable-uploads/02051b93-eef6-4abb-94bd-1e863e8b2dd7.png",
          "totalTime": "PT30M",
          "estimatedCost": {
            "@type": "MonetaryAmount",
            "currency": "USD",
            "value": "0"
          },
          "supply": [{
            "@type": "HowToSupply",
            "name": "Computer or mobile device"
          }, {
            "@type": "HowToSupply",
            "name": "Internet connection"
          }],
          "tool": [{
            "@type": "HowToTool",
            "name": "Sorare platform"
          }],
          "step": [{
            "@type": "HowToStep",
            "name": "Understand Sorare Basics",
            "text": "Learn what Sorare is and how digital trading cards work in fantasy football"
          }, {
            "@type": "HowToStep",
            "name": "Learn Card Rarities",
            "text": "Understand the 5 rarity levels: Common, Limited, Rare, Super Rare, and Unique"
          }, {
            "@type": "HowToStep",
            "name": "Choose Game Mode",
            "text": "Start with Free-to-Play Academy mode or jump into Sorare Pro competitions"
          }, {
            "@type": "HowToStep",
            "name": "Build Your Team",
            "text": "Create lineups with 5 players: GK, DEF, MID, FWD, and EXTRA position"
          }],
          "author": {
            "@type": "Organization",
            "name": "Sorare Basic"
          },
          "datePublished": "2025-01-01",
          "dateModified": "2025-01-01"
        })}
        </script>
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <MainNavigation />

        <main className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Header */}
          <header className="pt-16 pb-12 text-center animate-fade-in">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight leading-tight">
              Your Complete Guide to<br />
              <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Sorare Fantasy Football
              </span>
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed text-muted-foreground font-light">
              Everything you need to master Sorare in 2025/26 — from card rarities to competitions
            </p>
          </header>

          {/* What is Sorare Section */}
          <article className="py-20 animate-fade-in">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                What is Sorare?
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light">
                A global fantasy football platform merging real-life performances with digital trading cards
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="group">
                <div className="bg-card border border-border/50 rounded-2xl p-8 hover:shadow-2xl hover:border-primary/20 transition-all duration-300 h-full">
                  <div className="mb-6 flex justify-center">
                    <div className="p-4 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                      <Sparkles size={40} className="text-primary" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-center">Digital Cards</h3>
                  <p className="text-base text-muted-foreground leading-relaxed text-center">
                    Officially licensed collectibles, limited in quantity and varying by rarity
                  </p>
                </div>
              </div>
              
              <div className="group">
                <div className="bg-card border border-border/50 rounded-2xl p-8 hover:shadow-2xl hover:border-primary/20 transition-all duration-300 h-full">
                  <div className="mb-6 flex justify-center">
                    <div className="p-4 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                      <Trophy size={40} className="text-primary" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-center">Fantasy Competitions</h3>
                  <p className="text-base text-muted-foreground leading-relaxed text-center">
                    Enter tournaments where players score based on real-life performances
                  </p>
                </div>
              </div>
              
              <div className="group">
                <div className="bg-card border border-border/50 rounded-2xl p-8 hover:shadow-2xl hover:border-primary/20 transition-all duration-300 h-full">
                  <div className="mb-6 flex justify-center">
                    <div className="p-4 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                      <Star size={40} className="text-primary" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-center">Rewards</h3>
                  <p className="text-base text-muted-foreground leading-relaxed text-center">
                    Win cards, cash rewards, Essence, XP boosts, tickets and signed jerseys
                  </p>
                </div>
              </div>
            </div>
          </article>

          {/* Rarity Levels Section */}
          <article className="py-20 animate-fade-in">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                Card Rarity Levels
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto font-light">
                Each rarity determines how many copies exist per season and impacts value and competition eligibility
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
              {rarityLevels.map((rarity, index) => <div key={index} className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border/50 hover:shadow-lg hover:scale-105 transition-all duration-300">
                  <Badge className={`${rarity.bgColor} font-semibold mb-3 text-sm px-4 py-1`}>
                    {rarity.name}
                  </Badge>
                  <div className="text-xs text-muted-foreground font-medium">{rarity.description}</div>
                </div>)}
            </div>
            
            <div className="flex justify-center">
              <img src="/lovable-uploads/02051b93-eef6-4abb-94bd-1e863e8b2dd7.png" alt="Sorare card rarity examples 2025: Common white cards (unlimited), Limited yellow (1000/season), Rare red (100/season), Super Rare blue (10/season), Unique black (1/season) with real player cards" className="max-w-full h-auto rounded-3xl shadow-2xl border border-border/30" loading="lazy" width="800" height="400" />
            </div>
          </article>

          {/* How the Game Works Section */}
          <article className="py-20 animate-fade-in">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                How the Game Works
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto font-light mb-12">
                Sorare 26 offers two distinct game modes designed for different play styles
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16 max-w-4xl mx-auto">
              <a href="#f2p-section" className="flex items-center gap-4 p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer">
                <span className="w-4 h-4 bg-[hsl(var(--f2p-gray-border))] rounded-full flex-shrink-0"></span>
                <span className="text-lg font-semibold">Free-to-Play (F2P) Mode</span>
              </a>
              <a href="#sorare-pro-section" className="flex items-center gap-4 p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer">
                <span className="w-4 h-4 bg-[hsl(var(--sorare-gold))] rounded-full flex-shrink-0"></span>
                <span className="text-lg font-semibold">Sorare Pro (SO5 & SO7)</span>
              </a>
            </div>

            {/* Free-to-Play Section */}
            <div id="f2p-section" className="bg-card border border-border/50 rounded-3xl p-8 md:p-12 mb-12 shadow-xl scroll-mt-20">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-[hsl(var(--f2p-gray-border))]/20 rounded-xl">
                  <span className="w-6 h-6 bg-[hsl(var(--f2p-gray-border))] rounded-full block"></span>
                </div>
                <h3 className="text-3xl font-bold">Free-to-Play</h3>
              </div>
              
              <div className="space-y-8">
                <p className="text-lg leading-relaxed text-muted-foreground">
                  Perfect for newcomers — learn the basics with zero financial risk and start building your collection
                </p>
                
                {/* Daily Pack Section */}
                <div className="grid md:grid-cols-2 gap-10 items-center">
                  <div>
                    <h4 className="text-xl font-semibold mb-4">Daily Free Packs</h4>
                    <p className="text-base leading-relaxed text-muted-foreground">Every day, you receive a free pack with five common players from the biggest European leagues. You can collect these players and use them in various competitions, such as league-specific competitions or an All-Star competition</p>
                  </div>
                  <div className="flex justify-center">
                    <img src={dailyPackImage} alt="Sorare daily pack available for free pickup" className="max-w-[240px] h-auto rounded-2xl shadow-lg" loading="lazy" />
                  </div>
                </div>
                
                {/* Lineup Section */}
                <div className="grid md:grid-cols-2 gap-10 items-center">
                  <div>
                    <h4 className="text-xl font-semibold mb-4">Build Your Lineup</h4>
                    <p className="text-base leading-relaxed text-muted-foreground">
                      Create a 5-player lineup: goalkeeper, defender, midfielder, striker, and an extra position of your choice. Choose a captain to receive bonus points on their score.
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <img src={lineupFormationImage} alt="Sorare competition lineups and how to play" className="max-w-[240px] h-auto rounded-2xl shadow-lg" loading="lazy" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-primary/5 to-purple-500/5 p-8 rounded-2xl border border-primary/20">
                  <p className="text-base leading-relaxed text-muted-foreground mb-4">
                    Earn Essence, XP boosts, and real rewards based on your leaderboard performance. Consistent play can unlock Pro tier access — no spending required.
                  </p>
                  <p className="text-base font-semibold text-primary flex items-center gap-2">
                    <Sparkles size={20} />
                    Everyone can join the game — no wallet needed to start
                  </p>
                </div>
              </div>
            </div>

            {/* Sorare Pro Section */}
            <div id="sorare-pro-section" className="bg-gradient-to-br from-[hsl(var(--sorare-gold))]/30 to-purple-500/10 border border-[hsl(var(--sorare-gold-border))]/50 rounded-3xl p-8 md:p-12 shadow-xl scroll-mt-20">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-[hsl(var(--sorare-gold-border))]/20 rounded-xl">
                  <span className="w-6 h-6 bg-[hsl(var(--sorare-gold-border))] rounded-full block"></span>
                </div>
                <h3 className="text-3xl font-bold">Sorare Pro: Competitive Play</h3>
              </div>
              
              <div className="space-y-10">
                <p className="text-lg leading-relaxed text-muted-foreground">The competitive heart of Sorare with two distinct formats: In-Season (SO5) and Classic (SO7) - and huge rewards! To play in Pro Mode, you must purchase cards once in order to participate in the corresponding competitions. You can buy cards either in auctions, through instant purchases, or on a secondary market from other managers. The price of a player's card changes depending on their performance.</p>
                
                <div className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-border/50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-yellow-500/10 rounded-lg">
                      <Trophy className="text-yellow-500" size={28} />
                    </div>
                    <h4 className="text-2xl font-bold">In-Season (SO5)</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-base text-muted-foreground">Most competitive and rewarding mode</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-base text-muted-foreground">Cash rewards up to $1.6M for Premier League alone (2025/26 season)</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-base text-muted-foreground">Requires 4/5 cards from current season</p>
                        </div>
                      </div>
                      
                      <div className="p-6 bg-primary/5 rounded-xl border border-primary/20">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">Example:</span> Premier League 25/26 requires 4 players from the 25/26 collection plus 1 card from any season.
                        </p>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        Scoring powered by Opta stats, reflecting real-life performance and decisive contributions.
                      </p>
                    </div>
                    <div className="flex justify-center">
                      <img src={so5LineupImage} alt="Sorare SO5 lineup example with player cards and scores" className="max-w-sm h-auto rounded-2xl shadow-lg" loading="lazy" />
                    </div>
                  </div>
                </div>
                
                {/* Hot Streaks Section */}
                <div className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-border/50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                      <Sparkles className="text-orange-500" size={28} />
                    </div>
                    <h4 className="text-2xl font-bold">Hot Streaks</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-4">
                      <p className="text-base text-muted-foreground leading-relaxed">
                        Bonus system rewarding consistent scoring across multiple gameweeks
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-base text-muted-foreground">Unlock multipliers up to 5x during promotional periods</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-base text-muted-foreground">Rewards from $3 (smaller leagues) to $1,000 (major leagues)</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <img src={hotStreaksImage} alt="Sorare Hot Streaks reward levels showing progression from level 1 to 5" className="max-w-sm h-auto rounded-2xl shadow-lg" loading="lazy" />
                    </div>
                  </div>
                </div>
                
                {/* Classic Mode Section */}
                <div className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-border/50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <Trophy className="text-purple-500" size={28} />
                    </div>
                    <h4 className="text-2xl font-bold">Classic Mode (SO7)</h4>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-base text-muted-foreground">7-a-side format with enhanced lineup flexibility</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-base text-muted-foreground">No In-Season card restrictions</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-base text-muted-foreground">Valuable in-game rewards instead of cash prizes</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-muted/30 rounded-xl border border-border/30">
                      <h5 className="font-semibold mb-4 text-lg">SO7 Lineup</h5>
                      <div className="text-sm text-muted-foreground space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          <span>1 Goalkeeper</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          <span>2 Defenders</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          <span>2 Midfielders</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          <span>1 Forward</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          <span>1 Extra (any position)</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 bg-muted/30 rounded-xl border border-border/30">
                      <h5 className="font-semibold mb-4 text-lg">Rewards</h5>
                      <div className="text-sm text-muted-foreground space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          <span>Essence</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          <span>XP Boosts</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          <span>Market Credits</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          <span>Player Cards</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Competition Structure Section */}
                <div className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-border/50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <Trophy className="text-green-500" size={28} />
                    </div>
                    <h4 className="text-2xl font-bold">Available Competitions</h4>
                  </div>
                  <p className="text-base text-muted-foreground mb-8 leading-relaxed">
                    Seven premier leagues offer dedicated competitions with ~$1M prize pools each
                  </p>
                  
                  <div className="flex justify-center mb-8">
                    <img src={competitionsImage} alt="Sorare 2025/26 competitions: Premier League, La Liga, Bundesliga, Serie A, Ligue 1, Eredivisie, Liga Portugal with $1M+ prize pools each, plus Challenger and Contender leagues" className="max-w-full h-auto rounded-2xl shadow-lg" loading="lazy" width="600" height="400" />
                  </div>
                  
                  <p className="text-sm text-muted-foreground text-center">
                    Additional leagues compete in Challenger and Contender tiers
                  </p>
                </div>
              </div>
            </div>
          </article>

          {/* Call to Action */}
          <aside className="py-20 text-center animate-fade-in">
            <div className="bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border border-primary/20 rounded-3xl p-12 md:p-16">
              <h3 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">
                Ready to Start Your Journey?
              </h3>
              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto font-light">
                Join thousands of players building their fantasy football legacy on Sorare
              </p>
              <a href="https://sorare.pxf.io/Py6kWQ" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground rounded-full font-semibold text-lg hover:scale-105 hover:shadow-xl transition-all duration-300">
                Start Playing Sorare
              </a>
            </div>
          </aside>
        </main>
        
        {/* Footer Spacer */}
        <div className="h-16"></div>
      </div>
    </>;
};
export default BeginnersGuide;