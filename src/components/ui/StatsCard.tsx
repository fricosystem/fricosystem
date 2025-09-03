import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import React from "react";

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    positive: boolean;
    label: string;
  };
  description?: string;
  className?: string;
  onClick?: () => void;
}

export const StatsCard = ({
  title,
  value,
  icon,
  trend,
  description,
  className = "",
  onClick,
}: StatsCardProps) => {
  return (
    <Card 
      className={`${className} ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <div className="flex items-center pt-1">
            <span
              className={`text-sm font-medium ${
                trend.positive ? "text-green-600" : "text-red-600"
              }`}
            >
              {trend.label}
            </span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground pt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};