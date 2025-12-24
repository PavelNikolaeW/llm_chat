import { useUIStore } from './uiStore';
import { act } from '@testing-library/react';

describe('uiStore', () => {
  beforeEach(() => {
    act(() => {
      useUIStore.setState({
        sidebarOpen: true,
        settingsPanelOpen: false,
        activeModal: null,
      });
    });
  });

  describe('initial state', () => {
    it('should have sidebar open by default', () => {
      expect(useUIStore.getState().sidebarOpen).toBe(true);
    });

    it('should have settings panel closed by default', () => {
      expect(useUIStore.getState().settingsPanelOpen).toBe(false);
    });

    it('should have no active modal', () => {
      expect(useUIStore.getState().activeModal).toBeNull();
    });
  });

  describe('sidebar', () => {
    it('toggleSidebar should toggle sidebar state', () => {
      act(() => {
        useUIStore.getState().toggleSidebar();
      });
      expect(useUIStore.getState().sidebarOpen).toBe(false);

      act(() => {
        useUIStore.getState().toggleSidebar();
      });
      expect(useUIStore.getState().sidebarOpen).toBe(true);
    });

    it('setSidebarOpen should set specific state', () => {
      act(() => {
        useUIStore.getState().setSidebarOpen(false);
      });
      expect(useUIStore.getState().sidebarOpen).toBe(false);

      act(() => {
        useUIStore.getState().setSidebarOpen(true);
      });
      expect(useUIStore.getState().sidebarOpen).toBe(true);
    });
  });

  describe('settings panel', () => {
    it('openSettings should open settings panel', () => {
      act(() => {
        useUIStore.getState().openSettings();
      });
      expect(useUIStore.getState().settingsPanelOpen).toBe(true);
    });

    it('closeSettings should close settings panel', () => {
      act(() => {
        useUIStore.getState().openSettings();
        useUIStore.getState().closeSettings();
      });
      expect(useUIStore.getState().settingsPanelOpen).toBe(false);
    });

    it('toggleSettings should toggle settings panel', () => {
      act(() => {
        useUIStore.getState().toggleSettings();
      });
      expect(useUIStore.getState().settingsPanelOpen).toBe(true);

      act(() => {
        useUIStore.getState().toggleSettings();
      });
      expect(useUIStore.getState().settingsPanelOpen).toBe(false);
    });
  });

  describe('modal', () => {
    it('openModal should set active modal', () => {
      act(() => {
        useUIStore.getState().openModal('confirm-delete');
      });
      expect(useUIStore.getState().activeModal).toBe('confirm-delete');
    });

    it('closeModal should clear active modal', () => {
      act(() => {
        useUIStore.getState().openModal('settings');
        useUIStore.getState().closeModal();
      });
      expect(useUIStore.getState().activeModal).toBeNull();
    });
  });
});
