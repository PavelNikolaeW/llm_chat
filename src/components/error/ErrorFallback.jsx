import styles from './ErrorFallback.module.css';

/**
 * Error fallback UI component
 * Displays user-friendly error message when app crashes
 */
function ErrorFallback({ error, resetError, showDetails = false }) {
  const handleReload = () => {
    window.location.reload();
  };

  const handleReset = () => {
    if (resetError) {
      resetError();
    } else {
      handleReload();
    }
  };

  return (
    <div className={styles.container} role="alert">
      <div className={styles.content}>
        <div className={styles.icon}>
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h1 className={styles.title}>Something went wrong</h1>

        <p className={styles.message}>
          We're sorry, but something unexpected happened. Our team has been notified
          and is working to fix the issue.
        </p>

        {showDetails && error && (
          <details className={styles.details}>
            <summary>Technical Details</summary>
            <div className={styles.errorInfo}>
              <p><strong>Error:</strong> {error.name}</p>
              <p><strong>Message:</strong> {error.message}</p>
              {error.stack && (
                <pre className={styles.stack}>
                  {error.stack.split('\n').slice(0, 5).join('\n')}
                </pre>
              )}
            </div>
          </details>
        )}

        <div className={styles.actions}>
          <button
            className={styles.primaryButton}
            onClick={handleReset}
            type="button"
          >
            Try Again
          </button>
          <button
            className={styles.secondaryButton}
            onClick={handleReload}
            type="button"
          >
            Reload Page
          </button>
        </div>

        <p className={styles.help}>
          If this problem persists, please contact support.
        </p>
      </div>
    </div>
  );
}

export default ErrorFallback;
