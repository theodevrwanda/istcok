import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InstallPWAProps {
  iconOnly?: boolean;
}

export const InstallPWA = ({ iconOnly }: InstallPWAProps) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      // Stash the event so it can be triggered later, but DO NOT preventDefault
      // preventing default hides the native browser install icon in the URL bar
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setShowInstall(false);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstall(false);
    }
  };

  if (!showInstall) return null;

  return (
    <Button 
      variant="outline" 
      size={iconOnly ? "icon" : "sm"}
      onClick={handleInstall}
      className={`gap-2 bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 font-bold transition-all ${iconOnly ? 'w-8 h-8 mx-auto' : 'w-full text-xs'}`}
      title="Install iStock Admin"
    >
      <Download size={iconOnly ? 16 : 14} />
      {!iconOnly && "Install App"}
    </Button>
  );
};
