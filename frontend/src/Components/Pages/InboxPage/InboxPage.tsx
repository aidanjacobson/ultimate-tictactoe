import { FC } from 'react';
import styles from './InboxPage.module.scss';

/**
 * InboxPage - All notifications and messages
 * Route: /inbox
 */
const InboxPage: FC = () => {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Inbox</h1>
      </header>

      <main className={styles.main}>
        <section className={styles.tabsSection}>
          <h2>Tabs/Segments</h2>
          <ul>
            <li>All</li>
            <li>Invites (pending game invitations)</li>
            <li>Notifications (system messages, friend requests, etc.)</li>
            <li>Archived</li>
          </ul>
        </section>

        <section className={styles.listSection}>
          <h2>Messages</h2>
          <p>Stub: Message cards with sender, subject, timestamp, unread indicator</p>
          <p>Stub: Swipe to archive (mobile) or archive button (desktop)</p>
          <p>Stub: Mark as read/unread</p>
          <p>Stub: Delete button</p>
        </section>

        <section className={styles.detailSection}>
          <h2>Message Details</h2>
          <p>Stub: Message Detail View (modal or sidebar)</p>
          <p>Stub: Full message content</p>
          <p>Stub: Action buttons (Accept invite, Decline, etc.)</p>
        </section>
      </main>
    </div>
  );
};

export default InboxPage;
