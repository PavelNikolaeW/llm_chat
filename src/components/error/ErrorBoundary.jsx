import { Component } from 'react';
import { captureReactError } from '../../services/errorReporting';
import ErrorFallback from './ErrorFallback';

/**
 * React Error Boundary component
 * Catches JavaScript errors in child component tree and displays fallback UI
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so next render shows fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to error reporting service
    captureReactError(error, errorInfo);

    // Update state with error info
    this.setState({ errorInfo });

    // Call optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Call optional onReset callback
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback, FallbackComponent, showDetails } = this.props;

    if (hasError) {
      // Custom fallback render prop
      if (fallback) {
        return fallback({ error, resetError: this.handleReset });
      }

      // Custom fallback component
      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={error}
            resetError={this.handleReset}
            showDetails={showDetails}
          />
        );
      }

      // Default fallback
      return (
        <ErrorFallback
          error={error}
          resetError={this.handleReset}
          showDetails={showDetails}
        />
      );
    }

    return children;
  }
}

export default ErrorBoundary;
