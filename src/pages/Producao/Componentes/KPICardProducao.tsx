import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  description?: string;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const KpiCard = ({
  title,
  value,
  description,
  change,
  changeLabel,
  icon,
  className,
}: KpiCardProps) => {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;
  
  return (
    <div className={cn("rounded-lg border bg-card p-6 shadow-sm", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <h2 className="text-3xl font-semibold">{value}</h2>
        {change !== undefined && (
          <div
            className={cn(
              "flex items-center text-xs font-medium",
              isPositive ? "text-green-600" : isNegative ? "text-red-600" : "text-gray-600"
            )}
          >
            {isPositive ? (
              <ArrowUpIcon className="mr-1 h-3 w-3" />
            ) : isNegative ? (
              <ArrowDownIcon className="mr-1 h-3 w-3" />
            ) : null}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      {(description || changeLabel) && (
        <div className="mt-2 text-xs text-muted-foreground">
          {description || changeLabel}
        </div>
      )}
    </div>
  );
};
