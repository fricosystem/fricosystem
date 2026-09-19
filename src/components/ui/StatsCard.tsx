import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import React from "react";
interface StatsCardProps {
  title: string;
  value: string | React.ReactNode;
  icon: React.ReactNode;
  trend?: {
    value: number;
    positive: boolean;
    label: string;
  };
  description?: string;
  className?: string;
  onClick?: () => void;
  formula?: string;
  disableHover?: boolean;
}
export const StatsCard = ({
  title,
  value,
  icon,
  trend,
  description,
  className = "",
  onClick,
  formula,
  disableHover = false
}: StatsCardProps) => {
  return <Card className={`${className} ${onClick && !disableHover ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`} onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
               <div className="text-2xl font-bold" onDoubleClick={e => {
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
        {trend && (
          <div className={`flex items-center gap-1 text-xs mt-1 ${trend.positive ? "text-green-600" : "text-red-600"}`}>
            <span>{trend.positive ? '↑' : '↓'}</span>
            <span>{Math.abs(trend.value)}%</span>
            {trend.label && <span className="text-muted-foreground">({trend.label})</span>}
          </div>
        )}
        {description && description.trim() && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
      </CardContent>
    </Card>;
};