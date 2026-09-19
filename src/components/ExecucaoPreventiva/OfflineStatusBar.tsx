import { useOfflineSyncContext } from '@/contexts/OfflineSyncContext';
import { Wifi, WifiOff, RefreshCw, CloudUpload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function OfflineStatusBar() {
  const { isOnline, isSyncing, pendingCount, syncPendingActions } = useOfflineSyncContext();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      className={cn(
        "fixed top-16 left-0 right-0 z-50 px-4 py-2 flex items-center justify-between text-sm",
        isOnline 
          ? "bg-amber-500/90 text-amber-950" 
          : "bg-destructive/90 text-destructive-foreground"
      )}
    >
      <div className="flex items-center gap-2">
        {isOnline ? (
          <>
            <CloudUpload className="h-4 w-4" />
            <span>
              {pendingCount} {pendingCount === 1 ? 'registro pendente' : 'registros pendentes'}
            </span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span>Modo offline - Os dados serão sincronizados quando voltar online</span>
          </>
        )}
      </div>

      {isOnline && pendingCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={syncPendingActions}
          disabled={isSyncing}
          className="h-7 px-2 hover:bg-amber-600/50"
        >
          <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
          <span className="ml-1">{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
        </Button>
      )}
    </div>
  );
}
