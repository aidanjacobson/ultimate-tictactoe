import { FC } from 'react';
import styles from './DashboardPage.module.scss';

/**
 * DashboardPage - Main hub for user after login
 * Route: /dashboard
 */
const DashboardPage: FC = () => {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Dashboard</h1>
      </header>

      <main className={styles.main}>
        <section className={styles.section}>
          <h2>User Info</h2>
          <p>Stub: User info header, name, rank, stats summary</p>
        </section>

        <section className={styles.section}>
          <h2>Quick Actions</h2>
          <ul>
            <li>Start New Game button</li>
            <li>Check Invites button</li>
            <li>View Leaderboard link</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>Games in Progress</h2>
          <p>Stub: Game cards with opponent, status, last move, quick join</p>
          <p>Empty state: "No games in progress"</p>
        </section>

        <section className={styles.section}>
          <h2>Recent Games</h2>
          <p>Stub: Compact game cards (won/lost/draw)</p>
          <p>Link to full Game History</p>
        </section>

        <section className={styles.section}>
          <h2>Personal Stats</h2>
          <p>Stub: Win/loss/draw counts, win rate, current rank</p>
        </section>

        <section className={styles.section}>
          <h2>Notifications</h2>
          <p>Stub: Inbox badge if unread</p>
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;
