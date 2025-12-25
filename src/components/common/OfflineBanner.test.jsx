import { render, screen, fireEvent } from '@testing-library/react';
import OfflineBanner from './OfflineBanner';

describe('OfflineBanner', () => {
  it('should not render when online', () => {
    const { container } = render(<OfflineBanner isOffline={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render when offline', () => {
    render(<OfflineBanner isOffline={true} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(
      screen.getByText(/you are offline/i)
    ).toBeInTheDocument();
  });

  it('should display warning icon', () => {
    render(<OfflineBanner isOffline={true} />);

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('\u26A0');
  });

  it('should render retry button when onRetry is provided', () => {
    const handleRetry = jest.fn();
    render(<OfflineBanner isOffline={true} onRetry={handleRetry} />);

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('should not render retry button when onRetry is not provided', () => {
    render(<OfflineBanner isOffline={true} />);

    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it('should call onRetry when retry button is clicked', () => {
    const handleRetry = jest.fn();
    render(<OfflineBanner isOffline={true} onRetry={handleRetry} />);

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('should have correct accessibility role', () => {
    render(<OfflineBanner isOffline={true} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
