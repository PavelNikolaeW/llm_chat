import styles from './OfflineBanner.module.css';

function OfflineBanner({ isOffline, onRetry }) {
  if (!isOffline) {
    return null;
  }

  return (
    <div className={styles.banner} role="alert">
      <span className={styles.icon}>&#x26A0;</span>
      <span className={styles.message}>
        You are offline. Some features may be unavailable.
      </span>
      {onRetry && (
        <button className={styles.retryButton} onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export default OfflineBanner;
