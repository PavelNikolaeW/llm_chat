import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { act } from '@testing-library/react';
import SettingsPage from './SettingsPage';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { cacheService } from '../../services/cache';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../services/cache', () => ({
  cacheService: {
    clear: jest.fn().mockResolvedValue(true),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(true),
    getStats: jest.fn().mockResolvedValue({
      itemCount: 5,
      totalSize: 1024,
      maxSize: 50 * 1024 * 1024,
      usagePercent: 1,
    }),
    cleanExpired: jest.fn().mockResolvedValue(undefined),
  },
}));

const renderSettingsPage = () => {
  return render(
    <MemoryRouter>
      <SettingsPage />
    </MemoryRouter>
  );
};

describe('SettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      useAuthStore.setState({
        token: 'test-token',
        user: { id: '1', name: 'Test User', email: 'test@example.com' },
        isAuthenticated: true,
      });
      useSettingsStore.setState({
        theme: 'light',
        language: 'en',
      });
    });
  });

  it('should render settings page', async () => {
    renderSettingsPage();

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Storage')).toBeInTheDocument();
  });

  it('should display user info', async () => {
    renderSettingsPage();

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('should navigate back when clicking back button', async () => {
    renderSettingsPage();

    fireEvent.click(screen.getByText(/back/i));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('should logout and navigate to login', async () => {
    renderSettingsPage();

    fireEvent.click(screen.getByText('Sign out'));

    await waitFor(() => {
      expect(cacheService.clear).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  it('should change theme', async () => {
    renderSettingsPage();

    fireEvent.change(screen.getByLabelText(/theme/i), {
      target: { value: 'dark' },
    });

    expect(useSettingsStore.getState().theme).toBe('dark');
  });

  it('should change language', async () => {
    renderSettingsPage();

    fireEvent.change(screen.getByLabelText(/language/i), {
      target: { value: 'ru' },
    });

    expect(useSettingsStore.getState().language).toBe('ru');
  });

  it('should display cache stats', async () => {
    renderSettingsPage();

    await waitFor(() => {
      expect(screen.getByText(/cache usage/i)).toBeInTheDocument();
      expect(screen.getByText(/items cached/i)).toBeInTheDocument();
    });
  });

  it('should clear cache when clicking clear button', async () => {
    renderSettingsPage();

    fireEvent.click(screen.getByText('Clear cache'));

    await waitFor(() => {
      expect(cacheService.clear).toHaveBeenCalled();
    });
  });

  it('should display user avatar with first letter', async () => {
    renderSettingsPage();

    expect(screen.getByText('T')).toBeInTheDocument();
  });
});
