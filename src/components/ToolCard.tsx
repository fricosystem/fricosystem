import { LucideIcon, Bookmark } from 'lucide-react';
import { memo } from 'react';

interface ToolCardProps {
  name: string;
  description: string;
  url: string;
  icon: LucideIcon;
  iconColor: string;
  comingSoon?: boolean;
  isSupport?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (name: string) => void;
}

export const ToolCard = memo(({
  name,
  description,
  url,
  icon: Icon,
  iconColor,
  comingSoon,
  isSupport,
  isFavorite = false,
  onToggleFavorite
}: ToolCardProps) => {
  return <div className={`rounded-2xl p-3 md:p-6 shadow-apple-lg hover:shadow-apple-xl transition-all duration-500 border border-border/50 hover:border-border group flex flex-col min-h-[220px] md:min-h-[280px] relative ${isSupport ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200/50 shadow-apple-xl" : "bg-card"}`}>
      {/* Bookmark Icon */}
      {onToggleFavorite && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleFavorite(name);
          }}
          className="absolute top-2 right-2 p-1 rounded-lg hover:bg-muted/50 transition-colors duration-200 z-10"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Bookmark 
            size={16} 
            className={`transition-all duration-200 ${
              isFavorite 
                ? "text-primary fill-primary" 
                : "text-muted-foreground hover:text-foreground"
            }`} 
          />
        </button>
      )}
      
      <div className="flex flex-col items-center text-center h-full justify-between">
        <div className="flex flex-col items-center space-y-2 md:space-y-3">
          <div className={`p-2 md:p-3 rounded-2xl ${iconColor} group-hover:scale-110 transition-transform duration-300`}>
            <Icon size={20} className={`md:w-6 md:h-6 ${comingSoon ? "text-muted-foreground" : "text-white"}`} />
          </div>
          
          <h3 className="text-sm md:text-base font-semibold text-foreground leading-tight">
            {name}
          </h3>
        </div>
        
        <p className="text-muted-foreground leading-snug text-xs md:text-sm my-2 md:my-3 flex-1 flex items-center justify-center text-center">
          {description}
        </p>
        
        <div className="mt-auto">
          {comingSoon ? <div className="inline-flex items-center justify-center px-2 md:px-4 py-1 md:py-2 bg-muted text-muted-foreground rounded-xl font-medium cursor-not-allowed text-xs md:text-sm">
              Coming Soon
            </div> : <a href={url} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center justify-center px-2 md:px-4 py-1 md:py-2 rounded-xl font-medium transition-all duration-300 shadow-apple-sm hover:shadow-apple group-hover:scale-105 text-xs md:text-sm ${isSupport ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600" : "bg-primary text-primary-foreground hover:bg-button-hover"}`}>
              {isSupport ? "Send a card" : "Visit"}
            </a>}
        </div>
      </div>
    </div>;
});

ToolCard.displayName = 'ToolCard';