import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useChatCache } from '../../hooks';
import { cacheService } from '../../services/cache';
import styles from './SettingsPage.module.css';

function SettingsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { theme, language, setTheme, setLanguage } = useSettingsStore();
  const { cacheStats, refreshStats, clearCache } = useChatCache();

  const handleLogout = async () => {
    await cacheService.clear();
    logout();
    navigate('/login');
  };

  const handleClearCache = async () => {
    await clearCache();
    await refreshStats();
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          &larr; Back
        </button>
        <h1>Settings</h1>
      </header>

      <main className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Account</h2>
          <div className={styles.card}>
            <div className={styles.userInfo}>
              <div className={styles.avatar}>
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <div className={styles.userName}>{user?.name || 'User'}</div>
                <div className={styles.userEmail}>{user?.email || ''}</div>
              </div>
            </div>
            <button className={styles.logoutButton} onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Appearance</h2>
          <div className={styles.card}>
            <div className={styles.setting}>
              <label htmlFor="theme">Theme</label>
              <select
                id="theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className={styles.select}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>

            <div className={styles.setting}>
              <label htmlFor="language">Language</label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={styles.select}
              >
                <option value="en">English</option>
                <option value="ru">Russian</option>
              </select>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Storage</h2>
          <div className={styles.card}>
            <div className={styles.storageInfo}>
              <div>
                <span>Cache usage:</span>
                <span className={styles.storageValue}>
                  {cacheStats
                    ? `${Math.round(cacheStats.totalSize / 1024)} KB (${cacheStats.usagePercent}%)`
                    : 'Loading...'}
                </span>
              </div>
              <div>
                <span>Items cached:</span>
                <span className={styles.storageValue}>
                  {cacheStats?.itemCount ?? '...'}
                </span>
              </div>
            </div>
            <button
              className={styles.clearButton}
              onClick={handleClearCache}
            >
              Clear cache
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default SettingsPage;
