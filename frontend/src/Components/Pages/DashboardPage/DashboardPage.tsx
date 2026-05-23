import { FC, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../../services/ApiService';
import GameCard from '../../shared/GameCard/GameCard';
import type { GameResponse } from '../../../datamodels/tictactoe';
import type { UserResponse } from '../../../datamodels/users';
import type { GameInviteResponse } from '../../../datamodels/gameinvites';
import styles from './DashboardPage.module.scss';

const FINISHED_GAMES_PER_PAGE = 9;

/**
 * DashboardPage - Main hub for user after login
 * Route: /
 * 
 * Shows 4 sections, each only visible if it has content:
 * 1. Game Invites - Pending game invites received by the user
 * 2. Your Turn - Games where it's the user's turn
 * 3. Opponent Turn - Games where it's the opponent's turn
 * 4. Finished Games - Completed games
 * 
 * All sections except Game Invites use GameCard component
 * All games are sorted by last updated (most recent first)
 */
const DashboardPage: FC = () => {
  const navigate = useNavigate();
  
  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
  const [gameInvites, setGameInvites] = useState<GameInviteResponse[]>([]);
  const [yourTurnGames, setYourTurnGames] = useState<GameResponse[]>([]);
  const [opponentTurnGames, setOpponentTurnGames] = useState<GameResponse[]>([]);
  const [finishedGames, setFinishedGames] = useState<GameResponse[]>([]);
  const [finishedGamesPage, setFinishedGamesPage] = useState(1);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch current user on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await ApiService.validate();
        setCurrentUser(user);
      } catch (err) {
        setError('Failed to fetch user information');
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch dashboard data when user is available
  useEffect(() => {
    if (!currentUser) return;

    const fetchDashboardData = async (showLoading = true) => {
      try {
        if (showLoading) {
          setLoading(true);
        }
        setError(null);

        // Fetch all sections in parallel
        const [invites, yourTurn, opponentTurn, finished] = await Promise.all([
          ApiService.getGameInvitesForUser(currentUser.id),
          ApiService.getGamesUserTurn(currentUser.id),
          ApiService.getGamesOpponentTurn(currentUser.id),
          ApiService.getGamesFinished(currentUser.id),
        ]);

        setGameInvites(invites);
        setYourTurnGames(yourTurn);
        setOpponentTurnGames(opponentTurn);
        setFinishedGames(finished);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    };

    // Initial fetch with loading animation
    fetchDashboardData(true);

    // Set up polling every 10 seconds without loading animation
    const pollInterval = setInterval(() => {
      fetchDashboardData(false);
    }, 10000);

    // Clean up interval on unmount or when user changes
    return () => clearInterval(pollInterval);
  }, [currentUser?.id]);

  const handleInviteClick = (inviteId: number) => {
    navigate(`/invites/game/use/${inviteId}`);
  };

  const finishedGamesTotalPages = Math.max(
    1,
    Math.ceil(finishedGames.length / FINISHED_GAMES_PER_PAGE),
  );
  const finishedGamesStart = (finishedGamesPage - 1) * FINISHED_GAMES_PER_PAGE;
  const finishedGamesOnPage = finishedGames.slice(
    finishedGamesStart,
    finishedGamesStart + FINISHED_GAMES_PER_PAGE,
  );

  useEffect(() => {
    setFinishedGamesPage((prevPage) => {
      if (prevPage < 1) return 1;
      return prevPage > finishedGamesTotalPages ? finishedGamesTotalPages : prevPage;
    });
  }, [finishedGamesTotalPages]);

  if (loading) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>Dashboard</h1>
        </header>
        <main className={styles.main}>
          <p className={styles.loading}>Loading your games...</p>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>Dashboard</h1>
        </header>
        <main className={styles.main}>
          <p className={styles.error}>{error}</p>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Dashboard</h1>
      </header>

      <main className={styles.main}>
        {/* Game Invites Section */}
        {gameInvites.length > 0 && (
          <section className={styles.section}>
            <h2>Game Invites</h2>
            <div className={styles.inviteList}>
              {gameInvites.map((invite) => (
                <div key={invite.id} className={styles.inviteCard}>
                  <p className={styles.inviteText}>
                    Invitation from {invite.from_user?.name || 'Unknown User'}
                  </p>
                  <button
                    className={styles.button}
                    onClick={() => handleInviteClick(invite.id)}
                  >
                    Respond
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Your Turn Section */}
        {yourTurnGames.length > 0 && (
          <section className={styles.section}>
            <h2>Your Turn</h2>
            <div className={styles.gamesList}>
              {yourTurnGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  currentUserId={currentUser?.id ?? 0}
                />
              ))}
            </div>
          </section>
        )}

        {/* Opponent Turn Section */}
        {opponentTurnGames.length > 0 && (
          <section className={styles.section}>
            <h2>Opponent Turn</h2>
            <div className={styles.gamesList}>
              {opponentTurnGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  currentUserId={currentUser?.id ?? 0}
                />
              ))}
            </div>
          </section>
        )}

        {/* Finished Games Section */}
        {finishedGames.length > 0 && (
          <section className={styles.section}>
            <h2>Finished Games</h2>
            <div className={styles.gamesList}>
              {finishedGamesOnPage.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  currentUserId={currentUser?.id ?? 0}
                />
              ))}
            </div>
            {finishedGamesTotalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.button}
                  type="button"
                  onClick={() => setFinishedGamesPage((prev) => prev - 1)}
                  disabled={finishedGamesPage === 1}
                >
                  Previous
                </button>
                <span className={styles.pageIndicator}>
                  Page {finishedGamesPage} of {finishedGamesTotalPages}
                </span>
                <button
                  className={styles.button}
                  type="button"
                  onClick={() => setFinishedGamesPage((prev) => prev + 1)}
                  disabled={finishedGamesPage === finishedGamesTotalPages}
                >
                  Next
                </button>
              </div>
            )}
          </section>
        )}

        {/* Empty State */}
        {gameInvites.length === 0 &&
          yourTurnGames.length === 0 &&
          opponentTurnGames.length === 0 &&
          finishedGames.length === 0 && (
          <div className={styles.emptyState}>
            <p>No games or invites. Start by creating a new game!</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
