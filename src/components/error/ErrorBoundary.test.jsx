import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';
import * as errorReporting from '../../services/errorReporting';

// Mock the error reporting service
jest.mock('../../services/errorReporting', () => ({
  captureReactError: jest.fn(),
}));

// Component that throws an error
function ThrowError({ shouldThrow = true }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Normal content</div>;
}

// Suppress console.error for expected errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('renders fallback UI when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('calls captureReactError when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(errorReporting.captureReactError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('calls onError callback when error occurs', () => {
    const onError = jest.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('resets error state when resetError is called', () => {
    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);

      return (
        <ErrorBoundary onReset={() => setShouldThrow(false)}>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );
    };

    // Need React for useState
    const React = require('react');
    render(<TestComponent />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  it('calls onReset callback when reset is triggered', () => {
    const onReset = jest.fn();

    render(
      <ErrorBoundary onReset={onReset}>
        <ThrowError />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(onReset).toHaveBeenCalled();
  });

  it('shows details in development mode', () => {
    render(
      <ErrorBoundary showDetails>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Technical Details')).toBeInTheDocument();
  });

  it('uses custom FallbackComponent', () => {
    const CustomFallback = ({ error, resetError }) => (
      <div>
        <p>Custom error: {error.message}</p>
        <button onClick={resetError}>Custom Reset</button>
      </div>
    );

    render(
      <ErrorBoundary FallbackComponent={CustomFallback}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error: Test error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /custom reset/i })).toBeInTheDocument();
  });

  it('uses custom fallback render prop', () => {
    render(
      <ErrorBoundary
        fallback={({ error, resetError }) => (
          <div>
            <p>Render prop error: {error.message}</p>
            <button onClick={resetError}>Render Reset</button>
          </div>
        )}
      >
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Render prop error: Test error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /render reset/i })).toBeInTheDocument();
  });

  it('prefers fallback render prop over FallbackComponent', () => {
    const CustomFallback = () => <div>Component fallback</div>;

    render(
      <ErrorBoundary
        fallback={() => <div>Render prop fallback</div>}
        FallbackComponent={CustomFallback}
      >
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Render prop fallback')).toBeInTheDocument();
    expect(screen.queryByText('Component fallback')).not.toBeInTheDocument();
  });

  it('passes showDetails to FallbackComponent', () => {
    const CustomFallback = ({ showDetails }) => (
      <div>{showDetails ? 'Details shown' : 'Details hidden'}</div>
    );

    render(
      <ErrorBoundary FallbackComponent={CustomFallback} showDetails>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Details shown')).toBeInTheDocument();
  });
});
