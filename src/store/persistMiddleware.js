import { cacheService } from '../services/cache';

const CONVERSATIONS_KEY = 'conversations';
const MESSAGES_KEY = 'messages';

export function createPersistMiddleware(config = {}) {
  const {
    name = 'chat-store',
    partialize = (state) => ({
      conversations: state.conversations,
      messages: state.messages,
    }),
  } = config;

  return (f) => (set, get, store) => {
    const saveState = async () => {
      const state = get();
      const partial = partialize(state);

      await cacheService.set(`${name}:${CONVERSATIONS_KEY}`, partial.conversations);
      await cacheService.set(`${name}:${MESSAGES_KEY}`, partial.messages);
    };

    const wrappedSet = (...args) => {
      set(...args);
      saveState();
    };

    const loadState = async () => {
      const conversations = await cacheService.get(`${name}:${CONVERSATIONS_KEY}`);
      const messages = await cacheService.get(`${name}:${MESSAGES_KEY}`);

      if (conversations || messages) {
        set({
          ...(conversations && { conversations }),
          ...(messages && { messages }),
        });
      }
    };

    store.persist = {
      rehydrate: loadState,
      clearStorage: async () => {
        await cacheService.delete(`${name}:${CONVERSATIONS_KEY}`);
        await cacheService.delete(`${name}:${MESSAGES_KEY}`);
      },
    };

    return f(wrappedSet, get, store);
  };
}
