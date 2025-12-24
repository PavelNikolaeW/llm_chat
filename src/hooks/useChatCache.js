import { useEffect, useCallback, useState } from 'react';
import { useChatStore } from '../store/chatStore';
import { cacheService } from '../services/cache';

const CONVERSATIONS_KEY = 'chat:conversations';
const MESSAGES_KEY = 'chat:messages';

export function useChatCache() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [cacheStats, setCacheStats] = useState(null);

  const conversations = useChatStore((state) => state.conversations);
  const messages = useChatStore((state) => state.messages);

  // Load cached data on mount
  useEffect(() => {
    const hydrate = async () => {
      const cachedConversations = await cacheService.get(CONVERSATIONS_KEY);
      const cachedMessages = await cacheService.get(MESSAGES_KEY);

      if (cachedConversations) {
        useChatStore.setState({ conversations: cachedConversations });
      }

      if (cachedMessages) {
        useChatStore.setState({ messages: cachedMessages });
      }

      setIsHydrated(true);
    };

    hydrate();
  }, []);

  // Save conversations when they change
  useEffect(() => {
    if (isHydrated && conversations.length > 0) {
      cacheService.set(CONVERSATIONS_KEY, conversations);
    }
  }, [conversations, isHydrated]);

  // Save messages when they change
  useEffect(() => {
    if (isHydrated && Object.keys(messages).length > 0) {
      cacheService.set(MESSAGES_KEY, messages);
    }
  }, [messages, isHydrated]);

  const clearCache = useCallback(async () => {
    await cacheService.clear();
    useChatStore.setState({
      conversations: [],
      messages: {},
      activeConversationId: null,
    });
    setIsHydrated(false);
    setTimeout(() => setIsHydrated(true), 0);
  }, []);

  const refreshStats = useCallback(async () => {
    const stats = await cacheService.getStats();
    setCacheStats(stats);
    return stats;
  }, []);

  const cleanExpired = useCallback(async () => {
    await cacheService.cleanExpired();
    await refreshStats();
  }, [refreshStats]);

  return {
    isHydrated,
    cacheStats,
    clearCache,
    refreshStats,
    cleanExpired,
  };
}
