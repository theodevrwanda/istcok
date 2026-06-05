import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/button';
import { RefreshCw, X } from 'lucide-react';

function ReloadPrompt() {
  const sw = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  // Defensive check for hook return value
  if (!sw) {
    console.warn('PWA: useRegisterSW returned undefined');
    return null;
  }

  const {
    offlineReady: offlineReadyState,
    needUpdate: needUpdateState,
    updateServiceWorker,
  } = sw;

  // Verify tuples before destructuring
  const [offlineReady, setOfflineReady] = Array.isArray(offlineReadyState) ? offlineReadyState : [false, (v: boolean) => {}];
  const [needUpdate, setNeedUpdate] = Array.isArray(needUpdateState) ? needUpdateState : [false, (v: boolean) => {}];

  const close = () => {
    setOfflineReady(false);
    setNeedUpdate(false);
  };

  if (!offlineReady && !needUpdate) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-md animate-in fade-in slide-in-from-bottom-5 duration-500 ease-out"
    >
      <div className="bg-card/95 backdrop-blur-xl border border-primary/20 p-5 rounded-2xl shadow-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <RefreshCw className="h-5 w-5 animate-spin-slow" />
          </div>
          <div>
            <h4 className="font-display text-sm font-bold text-foreground">
              {needUpdate ? 'System Update Available' : 'Ready for Mobile'}
            </h4>
            <p className="text-xs text-muted-foreground leading-snug">
              {needUpdate 
                ? 'A new version of iStock is ready. Refresh to update.' 
                : 'App cached for offline use. You can now use iStock as a desktop app.'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {needUpdate && (
            <Button 
              size="sm" 
              onClick={() => updateServiceWorker(true)}
              className="bg-primary text-primary-foreground font-bold text-[10px] uppercase tracking-widest px-4 hover:scale-105 transition-transform"
            >
              Update
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={close}
            className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ReloadPrompt;
