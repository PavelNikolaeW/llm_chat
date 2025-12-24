import styles from './ChatPage.module.css';

function ChatPage() {
  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <h2>Dialogs</h2>
        <p>Dialog list will be here</p>
      </aside>
      <main className={styles.main}>
        <h1>LLM Gateway Chat</h1>
        <p>Chat interface will be here</p>
      </main>
    </div>
  );
}

export default ChatPage;
