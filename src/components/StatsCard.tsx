import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    positive: boolean;
    label?: string;
  };
  className?: string;
  formula?: string;
}
const StatsCard = ({
  title,
  value,
  description,
  icon,
  trend,
  className,
  formula
}: StatsCardProps) => {
  const isPositiveTrend = trend?.positive;
  return <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xs sm:text-sm font-medium leading-tight">{title}</CardTitle>
        {icon && <div className="text-muted-foreground flex-shrink-0">{icon}</div>}
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-xl sm:text-2xl font-bold cursor-help break-words leading-tight" onDoubleClick={e => {
              e.stopPropagation();
              if (formula) {
                // Tooltip já será mostrado pelo Radix UI
              }
            }}>
                {value}
              </div>
            </TooltipTrigger>
            {formula && <TooltipContent>
                <p>{formula}</p>
              </TooltipContent>}
          </Tooltip>
        </TooltipProvider>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>;
};
export default StatsCard;