import styles from './ChatHeader.module.css';
import { Button } from '../common';

function ChatHeader({
  title = 'New Chat',
  onMenuClick,
  onSettingsClick,
  showMenuButton = false,
}) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {showMenuButton && (
          <Button
            variant="ghost"
            size="small"
            onClick={onMenuClick}
            aria-label="Toggle menu"
          >
            ☰
          </Button>
        )}
        <h1 className={styles.title}>{title}</h1>
      </div>

      <div className={styles.right}>
        {onSettingsClick && (
          <Button
            variant="ghost"
            size="small"
            onClick={onSettingsClick}
            aria-label="Settings"
          >
            ⚙
          </Button>
        )}
      </div>
    </header>
  );
}

export default ChatHeader;
