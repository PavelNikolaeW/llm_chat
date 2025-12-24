import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSettingsStore = create(
  persist(
    (set) => ({
      theme: 'light',
      selectedModel: 'gpt-4',
      agentConfig: {
        temperature: 0.7,
        max_tokens: 2048,
      },
      selectedPreset: 'default',

      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        })),
      setModel: (selectedModel) => set({ selectedModel }),
      setAgentConfig: (agentConfig) =>
        set((state) => ({
          agentConfig: { ...state.agentConfig, ...agentConfig },
        })),
      setPreset: (selectedPreset) => set({ selectedPreset }),
    }),
    {
      name: 'llm-settings',
    }
  )
);
