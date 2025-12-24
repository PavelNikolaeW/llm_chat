import { useAuthStore } from './authStore';
import { act } from '@testing-library/react';

describe('authStore', () => {
  beforeEach(() => {
    act(() => {
      useAuthStore.setState({
        token: null,
        user: null,
        isAuthenticated: false,
      });
    });
  });

  describe('initial state', () => {
    it('should have null token', () => {
      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
    });

    it('should have null user', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
    });

    it('should not be authenticated', () => {
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('login', () => {
    it('should set token, user and isAuthenticated', () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      const mockToken = 'jwt-token-123';

      act(() => {
        useAuthStore.getState().login(mockToken, mockUser);
      });

      const state = useAuthStore.getState();
      expect(state.token).toBe(mockToken);
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('logout', () => {
    it('should clear token, user and isAuthenticated', () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      const mockToken = 'jwt-token-123';

      act(() => {
        useAuthStore.getState().login(mockToken, mockUser);
        useAuthStore.getState().logout();
      });

      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('setToken', () => {
    it('should update token only', () => {
      const mockToken = 'new-jwt-token';

      act(() => {
        useAuthStore.getState().setToken(mockToken);
      });

      const state = useAuthStore.getState();
      expect(state.token).toBe(mockToken);
      expect(state.isAuthenticated).toBe(false);
    });
  });
});
