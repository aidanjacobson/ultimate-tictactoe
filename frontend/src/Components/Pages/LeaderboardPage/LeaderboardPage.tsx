import { FC } from 'react';
import styles from './LeaderboardPage.module.scss';

/**
 * LeaderboardPage - Global rankings and stats
 * Route: /leaderboard
 */
const LeaderboardPage: FC = () => {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Leaderboard</h1>
      </header>

      <main className={styles.main}>
        <section className={styles.filterSection}>
          <h2>Filters</h2>
          <ul>
            <li>Time period filter (All time, This month, This week)</li>
            <li>Stat type filter (Win rate %, Total wins, Rank rating, etc.)</li>
          </ul>
        </section>

        <section className={styles.leaderboardSection}>
          <h2>Rankings</h2>
          <p>Stub: Rank, Player name, Stat value, Trend indicator (↑↓)</p>
          <p>Stub: Pagination (50 players per page)</p>
          <p>Stub: Highlight current user row</p>
          <p>Stub: Clickable rows to view player profile (optional)</p>
        </section>

        <aside className={styles.personalRank}>
          <h3>Your Rank</h3>
          <p>Stub: Current rank, Points/rating, Recent trend</p>
          <p>Stub: "View my profile" link</p>
        </aside>
      </main>
    </div>
  );
};

export default LeaderboardPage;
