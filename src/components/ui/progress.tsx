import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    progressType?: 'entrada' | 'externo' | 'default';
  }
>(({ className, value, progressType = 'default', ...props }, ref) => {
  const getProgressStyle = () => {
    switch (progressType) {
      case 'entrada':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'externo':
        return 'bg-gradient-to-r from-orange-500 to-red-500';
      default:
        return 'bg-primary';
    }
  };

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn("h-full w-full flex-1 transition-all", getProgressStyle())}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
