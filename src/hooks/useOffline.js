import { useState, useEffect, useCallback } from 'react';

export function useOffline() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  const handleOnline = useCallback(() => {
    setIsOffline(false);
    if (wasOffline) {
      setWasOffline(false);
    }
  }, [wasOffline]);

  const handleOffline = useCallback(() => {
    setIsOffline(true);
    setWasOffline(true);
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  const checkConnection = useCallback(async () => {
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-store',
      });
      setIsOffline(!response.ok);
      return response.ok;
    } catch {
      setIsOffline(true);
      return false;
    }
  }, []);

  return {
    isOffline,
    wasOffline,
    checkConnection,
  };
}