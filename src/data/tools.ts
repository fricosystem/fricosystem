import { Twitter, BarChart3, Images, Database, Zap, Calendar, Clock, Plus, Mic, Heart, Youtube, Home, Activity, BookOpen, Search, Gamepad2, Disc, TrendingUp, Presentation } from 'lucide-react';

export const tools = [{
  name: 'SorareMega',
  description: 'Explore new game modes and competitions beyond the core Sorare experience. Earn rewards and climb alternative leaderboards.',
  url: 'https://www.soraremega.com/',
  icon: Gamepad2,
  iconColor: 'bg-blue-500'
}, {
  name: 'SorareFeed',
  description: 'Stay up to date with tweets and news about the players in your gallery.',
  url: 'https://sorarefeed.com/',
  icon: Twitter,
  iconColor: 'bg-pink-500'
}, {
  name: 'SorareInside',
  description: 'Check live player availability, expected lineups, injury updates and more.',
  url: 'https://sorareinside.com/',
  icon: BarChart3,
  iconColor: 'bg-blue-500'
}, {
  name: 'SorareDeal',
  description: 'Manage your gallery with advanced filters and compare player prices with detailed stats.',
  url: 'https://www.soraredeal.com/',
  icon: Images,
  iconColor: 'bg-purple-500'
}, {
  name: 'SorareHive',
  description: 'Dive deep into data-driven gallery analysis, valuations, and player performance. Ideal for serious managers.',
  url: 'https://sorarehive.vercel.app/',
  icon: Database,
  iconColor: 'bg-slate-500'
}, {
  name: 'Sorare NBA Jet',
  description: 'Optimize your Sorare NBA lineups using this smart assistant tailored for basketball strategy.',
  url: 'https://www.sorarenbajet.com/',
  icon: Disc,
  iconColor: 'bg-pink-500'
}, {
  name: 'SorareProbabilities',
  description: 'SorareProbabilities provides curated player stats, match probabilities, and projected player scores to help you build smarter lineups and make informed decisions.',
  url: 'https://linktr.ee/soprob',
  icon: TrendingUp,
  iconColor: 'bg-blue-500'
}, {
  name: 'Predictorfy',
  description: 'Predictorfy is designed to provide a best-in-class Line Up Predictions website and web-app for Sorare.',
  url: 'https://predictorfy.com',
  icon: Presentation,
  iconColor: 'bg-purple-500'
}, {
  name: 'Premier Injuries',
  description: 'The latest player injuries, suspensions and absences in the English Premier League',
  url: 'https://www.premierinjuries.com/injury-table.php',
  icon: Activity,
  iconColor: 'bg-slate-500'
}, {
  name: 'Sorare Craft Helper',
  description: 'Search Sorare cards in rewards pools by player quality, nationality and league to easily find the best cards to craft.',
  url: 'https://sorare-craft-helper.lovable.app/',
  icon: Search,
  iconColor: 'bg-purple-500'
}, {
  name: 'Sorare DNP',
  description: 'Sorare DNP is the library of sources to avoid dnps in sorare',
  url: 'https://sorare-dnp.com',
  icon: Database,
  iconColor: 'bg-slate-500'
}, {
  name: 'SorareScore',
  description: 'SorareScore is a complete platform that centralizes 📊 statistics and insights to save you time.',
  url: 'https://sorarescore.com/',
  icon: BarChart3,
  iconColor: 'bg-blue-500'
}, {
  name: 'Support us',
  description: 'If you want to support our work, feel free to send us ingame a card.',
  url: 'https://sorare.com/de/football/my-club/sorare-trading-coach?t=KDuJgi&utm_medium=social&utm_term=football',
  icon: Heart,
  iconColor: 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500',
  isSupport: true
}, {
  name: 'More to come',
  description: 'We\'re constantly discovering new tools and platforms to boost your Sorare journey. Stay tuned!',
  url: '',
  icon: Plus,
  iconColor: 'bg-muted',
  comingSoon: true
}];