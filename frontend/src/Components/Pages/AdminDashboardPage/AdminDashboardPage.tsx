import { FC } from 'react';
import styles from './AdminDashboardPage.module.scss';

/**
 * AdminDashboardPage - Admin controls and moderation
 * Route: /admin
 * Auth Required: Admin-only
 */
const AdminDashboardPage: FC = () => {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Admin Dashboard</h1>
        <p>Admin-only access</p>
      </header>

      <main className={styles.main}>
        <aside className={styles.sidebar}>
          <h2>Admin Menu</h2>
          <ul>
            <li>Statistics Overview</li>
            <li>Users Management</li>
            <li>Game Moderation</li>
            <li>Reports/Issues</li>
            <li>System Logs</li>
          </ul>
        </aside>

        <section className={styles.content}>
          <div className={styles.section}>
            <h2>Statistics Overview</h2>
            <ul>
              <li>Total users</li>
              <li>Active games</li>
              <li>New signups (today/week)</li>
              <li>System health</li>
            </ul>
          </div>

          <div className={styles.section}>
            <h2>Users Management</h2>
            <p>Stub: User list/table with search, filter, sort</p>
            <p>Stub: Ban/unban user button</p>
            <p>Stub: View user details modal</p>
          </div>

          <div className={styles.section}>
            <h2>Game Moderation</h2>
            <p>Stub: Active games list</p>
            <p>Stub: Flagged games</p>
            <p>Stub: Force end game button (admin action)</p>
          </div>

          <div className={styles.section}>
            <h2>Reports/Issues</h2>
            <p>Stub: User-reported issues</p>
            <p>Stub: Resolved/unresolved filters</p>
            <p>Stub: Details and action buttons</p>
          </div>

          <div className={styles.section}>
            <h2>System Logs (optional)</h2>
            <p>Stub: Activity log</p>
            <p>Stub: Error log</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboardPage;
