import { FC, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../../services/ApiService';
import type { ScoreboardEntryResponse } from '../../../datamodels/users';
import type { UserResponse } from '../../../datamodels/users';
import styles from './LeaderboardPage.module.scss';

// Wilson score lower bound (95% confidence interval for a proportion)
// Rewards high win rate AND sample size — avoids inflating players with few games
const wilsonScore = (wins: number, losses: number, ties: number): number => {
  const total = wins + losses + ties;
  if (total === 0) return 0;
  const z = 1.96;
  const p = (wins + 0.5 * ties) / total;  // ties count as half
  const numerator = p + (z * z) / (2 * total) - z * Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total));
  const denominator = 1 + (z * z) / total;
  return Math.max(0, numerator / denominator);
};

interface RankingCategory {
  title: string;
  subtitle: string;
  statLabel: string;
  getStat: (entry: ScoreboardEntryResponse) => number;
  formatStat: (value: number) => string;
  minGames?: number;
}

const CATEGORIES: RankingCategory[] = [
  {
    title: 'Most Games Played',
    subtitle: 'Total finished games',
    statLabel: 'Games',
    getStat: (e) => e.total_games,
    formatStat: (v) => v.toString(),
  },
  {
    title: 'Most Wins',
    subtitle: 'Total victories',
    statLabel: 'Wins',
    getStat: (e) => e.wins,
    formatStat: (v) => v.toString(),
  },
  {
    title: 'Best Win Rate',
    subtitle: 'Minimum 3 games played',
    statLabel: 'Win %',
    getStat: (e) => e.win_ratio,
    formatStat: (v) => `${(v * 100).toFixed(1)}%`,
    minGames: 3,
  },
  {
    title: 'Wilson Score',
    subtitle: 'Win rate adjusted for sample size — the most reliable ranking',
    statLabel: 'Score',
    getStat: (e) => wilsonScore(e.wins, e.losses, e.ties),
    formatStat: (v) => (v * 100).toFixed(1),
    minGames: 3,
  },
  {
    title: 'Most Losses',
    subtitle: 'The hall of pain',
    statLabel: 'Losses',
    getStat: (e) => e.losses,
    formatStat: (v) => v.toString(),
  },
];

const RANK_LABELS = ['1st', '2nd', '3rd'];

const PODIUM_ORDER = [1, 0, 2]; // indices into top-3: renders 2nd, 1st, 3rd left-to-right

const LeaderboardPage: FC = () => {
  const navigate = useNavigate();

  const [entries, setEntries] = useState<ScoreboardEntryResponse[]>([]);
  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [scoreboardData, userData] = await Promise.all([
          ApiService.getScoreboard(),
          ApiService.validate(),
        ]);
        setEntries(scoreboardData);
        setCurrentUser(userData);
        setError(null);
      } catch (err) {
        setError('Failed to load scoreboard');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getRankedEntries = (category: RankingCategory) => {
    const filtered = category.minGames
      ? entries.filter((e) => e.total_games >= category.minGames!)
      : entries;
    return [...filtered]
      .sort((a, b) => category.getStat(b) - category.getStat(a))
      .slice(0, 10);
  };

  const wilsonTop3 = (() => {
    const qualified = entries.filter((e) => e.total_games >= 3);
    return [...qualified]
      .sort((a, b) => wilsonScore(b.wins, b.losses, b.ties) - wilsonScore(a.wins, a.losses, a.ties))
      .slice(0, 3);
  })();

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div>
            <h1>Scoreboard</h1>
            <p className={styles.subtitle}>Global rankings across all players</p>
          </div>
          {currentUser && (
            <button
              className={styles.myProfileButton}
              onClick={() => navigate(`/users/${currentUser.id}`)}
            >
              My Profile
            </button>
          )}
        </div>
      </header>

      <main className={styles.main}>
        {loading && (
          <div className={styles.loadingMessage}>
            <p>Loading scoreboard...</p>
          </div>
        )}

        {error && (
          <div className={styles.errorMessage}>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Wilson Score Podium */}
            {wilsonTop3.length > 0 && (
              <section className={styles.podiumSection}>
                <div className={styles.podiumHeader}>
                  <h2 className={styles.podiumTitle}>Top Players by Wilson Score</h2>
                  <p className={styles.podiumSubtitle}>
                    Win rate adjusted for sample size — rewards consistency over lucky streaks
                  </p>
                </div>
                <div className={styles.podiumStage}>
                  {PODIUM_ORDER.map((topIdx) => {
                    const entry = wilsonTop3[topIdx];
                    if (!entry) return null;
                    const rank = topIdx + 1; // 1-indexed
                    const score = wilsonScore(entry.wins, entry.losses, entry.ties);
                    const isCurrentUser = currentUser?.id === entry.id;
                    return (
                      <div
                        key={entry.id}
                        className={`${styles.podiumSlot} ${styles[`podiumRank${rank}`]}`}
                      >
                        <div className={`${styles.podiumPlayerInfo} ${isCurrentUser ? styles.podiumCurrentUser : ''}`}>
                          <button
                            className={styles.podiumName}
                            onClick={() => navigate(`/users/${entry.id}`)}
                          >
                            {entry.name}
                          </button>
                          <span className={styles.podiumUsername}>@{entry.username}</span>
                          <span className={styles.podiumScore}>{(score * 100).toFixed(1)}</span>
                          <span className={styles.podiumRecord}>
                            {entry.wins}W – {entry.losses}L – {entry.ties}T
                          </span>
                        </div>
                        <div className={styles.podiumBlock}>
                          <span className={styles.podiumRankLabel}>{RANK_LABELS[topIdx]}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Ranking Tables */}
            <div className={styles.rankingGrid}>
              {CATEGORIES.map((category) => {
                const ranked = getRankedEntries(category);
                return (
                  <div key={category.title} className={styles.rankingCard}>
                    <div className={styles.cardHeader}>
                      <h2 className={styles.cardTitle}>{category.title}</h2>
                      <p className={styles.cardSubtitle}>{category.subtitle}</p>
                    </div>
                    {ranked.length === 0 ? (
                      <p className={styles.emptyState}>No players qualify yet</p>
                    ) : (
                      <ol className={styles.rankingList}>
                        {ranked.map((entry, index) => {
                          const isCurrentUser = currentUser?.id === entry.id;
                          const statValue = category.getStat(entry);
                          return (
                            <li
                              key={entry.id}
                              className={`${styles.rankingRow} ${isCurrentUser ? styles.currentUser : ''}`}
                            >
                              <span className={`${styles.rank} ${index < 3 ? styles[`rank${index + 1}`] : ''}`}>
                                {index < 3 ? RANK_LABELS[index] : `${index + 1}th`}
                              </span>
                              <button
                                className={styles.playerName}
                                onClick={() => navigate(`/users/${entry.id}`)}
                              >
                                {entry.name}
                                <span className={styles.playerUsername}>@{entry.username}</span>
                              </button>
                              <span className={styles.statValue}>
                                {category.formatStat(statValue)}
                                <span className={styles.statLabel}>{category.statLabel}</span>
                              </span>
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default LeaderboardPage;
