import { render, screen, fireEvent } from '@testing-library/react';
import ErrorFallback from './ErrorFallback';

describe('ErrorFallback', () => {
  const mockError = new Error('Test error message');
  mockError.stack = 'Error: Test error message\n    at TestComponent';

  const originalLocation = window.location;

  beforeEach(() => {
    delete window.location;
    window.location = { reload: jest.fn() };
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  it('renders error message', () => {
    render(<ErrorFallback error={mockError} />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/we're sorry/i)).toBeInTheDocument();
  });

  it('has proper accessibility role', () => {
    render(<ErrorFallback error={mockError} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows Try Again button', () => {
    render(<ErrorFallback error={mockError} />);

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('shows Reload Page button', () => {
    render(<ErrorFallback error={mockError} />);

    expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();
  });

  it('calls resetError when Try Again is clicked', () => {
    const resetError = jest.fn();
    render(<ErrorFallback error={mockError} resetError={resetError} />);

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(resetError).toHaveBeenCalled();
  });

  it('reloads page when Try Again clicked with no resetError', () => {
    render(<ErrorFallback error={mockError} />);

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(window.location.reload).toHaveBeenCalled();
  });

  it('reloads page when Reload Page is clicked', () => {
    render(<ErrorFallback error={mockError} />);

    fireEvent.click(screen.getByRole('button', { name: /reload page/i }));

    expect(window.location.reload).toHaveBeenCalled();
  });

  it('does not show technical details by default', () => {
    render(<ErrorFallback error={mockError} />);

    expect(screen.queryByText('Technical Details')).not.toBeInTheDocument();
  });

  it('shows technical details when showDetails is true', () => {
    render(<ErrorFallback error={mockError} showDetails />);

    expect(screen.getByText('Technical Details')).toBeInTheDocument();
  });

  it('displays error name in details', () => {
    render(<ErrorFallback error={mockError} showDetails />);

    fireEvent.click(screen.getByText('Technical Details'));

    // Error: appears in both label and stack trace
    expect(screen.getAllByText(/Error:/).length).toBeGreaterThan(0);
  });

  it('displays error message in details', () => {
    render(<ErrorFallback error={mockError} showDetails />);

    fireEvent.click(screen.getByText('Technical Details'));

    // Message appears in both the summary and details sections
    expect(screen.getAllByText(/Test error message/).length).toBeGreaterThan(0);
  });

  it('displays stack trace in details', () => {
    render(<ErrorFallback error={mockError} showDetails />);

    fireEvent.click(screen.getByText('Technical Details'));

    expect(screen.getByText(/TestComponent/)).toBeInTheDocument();
  });

  it('handles error without stack trace', () => {
    const errorWithoutStack = new Error('No stack');
    delete errorWithoutStack.stack;

    render(<ErrorFallback error={errorWithoutStack} showDetails />);

    fireEvent.click(screen.getByText('Technical Details'));

    expect(screen.getByText(/No stack/)).toBeInTheDocument();
  });

  it('renders without error prop', () => {
    render(<ErrorFallback showDetails />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('shows support contact message', () => {
    render(<ErrorFallback error={mockError} />);

    expect(screen.getByText(/contact support/i)).toBeInTheDocument();
  });

  it('renders error icon', () => {
    const { container } = render(<ErrorFallback error={mockError} />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
