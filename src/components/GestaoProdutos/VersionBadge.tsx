import { Badge } from "@/components/ui/badge";
import { History } from "lucide-react";

interface VersionBadgeProps {
  version: number;
  totalVersions?: number;
  onClick?: () => void;
}

export const VersionBadge = ({ version, totalVersions, onClick }: VersionBadgeProps) => {
  return (
    <Badge
      variant="outline"
      className="cursor-pointer hover:bg-accent inline-flex items-center gap-1 shrink-0"
      onClick={onClick}
    >
      <History className="h-3 w-3 shrink-0" />
      v{version}
      {totalVersions && totalVersions > 1 && (
        <span className="text-muted-foreground ml-1">({totalVersions})</span>
      )}
    </Badge>
  );
};
