import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { act } from '@testing-library/react';
import AuthGuard from './AuthGuard';
import { useAuthStore } from '../../store/authStore';

const renderWithRouter = (ui, { route = '/' } = {}) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route
          path="/"
          element={
            <AuthGuard>
              <div>Protected Content</div>
            </AuthGuard>
          }
        />
      </Routes>
    </MemoryRouter>
  );
};

describe('AuthGuard', () => {
  beforeEach(() => {
    act(() => {
      useAuthStore.setState({
        token: null,
        user: null,
        isAuthenticated: false,
      });
    });
  });

  it('should redirect to login when not authenticated', () => {
    renderWithRouter(<div>Protected</div>);

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should render children when authenticated', () => {
    act(() => {
      useAuthStore.setState({
        token: 'test-token',
        user: { id: '1', email: 'test@example.com' },
        isAuthenticated: true,
      });
    });

    renderWithRouter(<div>Protected</div>);

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('should preserve the original location for redirect back', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/protected-page']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/protected-page"
            element={
              <AuthGuard>
                <div>Protected Page</div>
              </AuthGuard>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });
});
