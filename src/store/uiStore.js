import { create } from 'zustand';

export const useUIStore = create((set) => ({
  sidebarOpen: true,
  settingsPanelOpen: false,
  activeModal: null,

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  openSettings: () => set({ settingsPanelOpen: true }),

  closeSettings: () => set({ settingsPanelOpen: false }),

  toggleSettings: () =>
    set((state) => ({ settingsPanelOpen: !state.settingsPanelOpen })),

  openModal: (modalId) => set({ activeModal: modalId }),

  closeModal: () => set({ activeModal: null }),
}));
