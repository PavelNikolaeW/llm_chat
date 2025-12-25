import { useSettingsStore } from './settingsStore';
import { act } from '@testing-library/react';

describe('settingsStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      useSettingsStore.setState({
        theme: 'light',
        language: 'en',
        selectedModel: 'gpt-4',
        agentConfig: {
          temperature: 0.7,
          max_tokens: 2048,
        },
        selectedPreset: 'default',
      });
    });
  });

  describe('initial state', () => {
    it('should have default theme as light', () => {
      const state = useSettingsStore.getState();
      expect(state.theme).toBe('light');
    });

    it('should have default model as gpt-4', () => {
      const state = useSettingsStore.getState();
      expect(state.selectedModel).toBe('gpt-4');
    });

    it('should have default agent config', () => {
      const state = useSettingsStore.getState();
      expect(state.agentConfig).toEqual({
        temperature: 0.7,
        max_tokens: 2048,
      });
    });

    it('should have default preset', () => {
      const state = useSettingsStore.getState();
      expect(state.selectedPreset).toBe('default');
    });

    it('should have default language as en', () => {
      const state = useSettingsStore.getState();
      expect(state.language).toBe('en');
    });
  });

  describe('setTheme', () => {
    it('should set theme to dark', () => {
      act(() => {
        useSettingsStore.getState().setTheme('dark');
      });
      expect(useSettingsStore.getState().theme).toBe('dark');
    });

    it('should set theme to light', () => {
      act(() => {
        useSettingsStore.getState().setTheme('dark');
        useSettingsStore.getState().setTheme('light');
      });
      expect(useSettingsStore.getState().theme).toBe('light');
    });
  });

  describe('toggleTheme', () => {
    it('should toggle from light to dark', () => {
      act(() => {
        useSettingsStore.getState().toggleTheme();
      });
      expect(useSettingsStore.getState().theme).toBe('dark');
    });

    it('should toggle from dark to light', () => {
      act(() => {
        useSettingsStore.getState().setTheme('dark');
        useSettingsStore.getState().toggleTheme();
      });
      expect(useSettingsStore.getState().theme).toBe('light');
    });
  });

  describe('setModel', () => {
    it('should set selected model', () => {
      act(() => {
        useSettingsStore.getState().setModel('claude-3');
      });
      expect(useSettingsStore.getState().selectedModel).toBe('claude-3');
    });
  });

  describe('setAgentConfig', () => {
    it('should update agent config partially', () => {
      act(() => {
        useSettingsStore.getState().setAgentConfig({ temperature: 0.9 });
      });
      const state = useSettingsStore.getState();
      expect(state.agentConfig.temperature).toBe(0.9);
      expect(state.agentConfig.max_tokens).toBe(2048);
    });

    it('should update multiple config values', () => {
      act(() => {
        useSettingsStore.getState().setAgentConfig({
          temperature: 0.5,
          max_tokens: 4096,
        });
      });
      const state = useSettingsStore.getState();
      expect(state.agentConfig.temperature).toBe(0.5);
      expect(state.agentConfig.max_tokens).toBe(4096);
    });
  });

  describe('setPreset', () => {
    it('should set selected preset', () => {
      act(() => {
        useSettingsStore.getState().setPreset('code_assistant');
      });
      expect(useSettingsStore.getState().selectedPreset).toBe('code_assistant');
    });
  });

  describe('setLanguage', () => {
    it('should set language to ru', () => {
      act(() => {
        useSettingsStore.getState().setLanguage('ru');
      });
      expect(useSettingsStore.getState().language).toBe('ru');
    });

    it('should set language back to en', () => {
      act(() => {
        useSettingsStore.getState().setLanguage('ru');
        useSettingsStore.getState().setLanguage('en');
      });
      expect(useSettingsStore.getState().language).toBe('en');
    });
  });
});
