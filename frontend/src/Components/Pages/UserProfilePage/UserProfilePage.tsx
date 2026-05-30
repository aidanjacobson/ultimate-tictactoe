import { FC, useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ApiService from '../../../services/ApiService';
import type { UserStatsResponse, UserResponse, ActiveGameRecord } from '../../../datamodels/users';
import styles from './UserProfilePage.module.scss';

const COMPLETED_GAMES_PER_PAGE = 9;

/**
 * UserProfilePage - Detailed user profile with statistics
 * Route: /users/:userId
 * 
 * Shows:
 * - User name and username
 * - Account age
 * - Win/loss/tie statistics with ratios
 * - Recent games with outcomes
 * - Admin controls if logged in as admin
 */
const UserProfilePage: FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  const [userStats, setUserStats] = useState<UserStatsResponse | null>(null);
  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetUsernameModal, setShowResetUsernameModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [showResetPasswordConfirm, setShowResetPasswordConfirm] = useState(false);
  const [showResetPasswordResult, setShowResetPasswordResult] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [usernameChangeSuccess, setUsernameChangeSuccess] = useState(false);
  const [recentGamesPage, setRecentGamesPage] = useState(1);
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const userIdNum = parseInt(userId || '0', 10);
  const recentGamesTotalPages = useMemo(
    () => Math.max(1, Math.ceil((userStats?.recent_games.length ?? 0) / COMPLETED_GAMES_PER_PAGE)),
    [userStats?.recent_games.length],
  );
  const boundedRecentGamesPage = useMemo(
    () => Math.min(Math.max(recentGamesPage, 1), recentGamesTotalPages),
    [recentGamesPage, recentGamesTotalPages],
  );
  const recentGamesOnPage = useMemo(() => {
    const recentGamesStart = (boundedRecentGamesPage - 1) * COMPLETED_GAMES_PER_PAGE;
    return userStats?.recent_games.slice(
      recentGamesStart,
      recentGamesStart + COMPLETED_GAMES_PER_PAGE,
    ) ?? [];
  }, [boundedRecentGamesPage, userStats?.recent_games]);

  // Fetch user stats and current user
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch user stats
        const stats = await ApiService.getUserStats(userIdNum);
        setUserStats(stats);
        
        // Fetch current user to check if admin
        const current = await ApiService.validate();
        setCurrentUser(current);
        
        // Get current user's stats to check if admin
        const currentUserStats = await ApiService.getUserStats(current.id);
        setIsAdmin(currentUserStats.is_admin || false);
        
        setError(null);
      } catch (err) {
        setError('Failed to fetch user information');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (userIdNum > 0) {
      fetchData();
    }
  }, [userIdNum]);

  // Auto-focus and select username input when modal opens
  useEffect(() => {
    if (showResetUsernameModal && usernameInputRef.current) {
      usernameInputRef.current.focus();
      usernameInputRef.current.select();
    }
  }, [showResetUsernameModal]);

  // Auto-focus and select password when result modal opens
  useEffect(() => {
    if (showResetPasswordResult && passwordInputRef.current) {
      passwordInputRef.current.focus();
      passwordInputRef.current.select();
    }
  }, [showResetPasswordResult]);

  useEffect(() => {
    setRecentGamesPage(1);
  }, [userIdNum]);

  useEffect(() => {
    setRecentGamesPage((prev) => Math.min(prev, recentGamesTotalPages));
  }, [recentGamesTotalPages]);

  const handleDeleteUser = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    try {
      await ApiService.adminDeleteUser(userIdNum, true);
      navigate('/users');
    } catch (err) {
      setError('Failed to delete user');
      console.error(err);
    }
  };

  const handleResetUsername = async () => {
    if (!newUsername.trim()) {
      setError('Username cannot be empty');
      return;
    }

    try {
      await ApiService.adminResetUsername(userIdNum, newUsername);
      setShowResetUsernameModal(false);
      setNewUsername('');
      setUsernameChangeSuccess(true);
      // Auto-hide success banner after 3 seconds
      setTimeout(() => setUsernameChangeSuccess(false), 3000);
      // Refresh user data
      if (userStats) {
        setUserStats({
          ...userStats,
          username: newUsername
        });
      }
    } catch (err) {
      setError('Failed to reset username');
      console.error(err);
    }
  };

  const handleResetPassword = () => {
    setShowResetPasswordConfirm(true);
  };

  const confirmResetPassword = async () => {
    try {
      const response = await ApiService.adminResetPassword(userIdNum);
      setShowResetPasswordConfirm(false);
      setNewPassword(response.new_password);
      setShowResetPasswordResult(true);
    } catch (err) {
      setError('Failed to reset password');
      console.error(err);
      setShowResetPasswordConfirm(false);
    }
  };

  // Handle keyboard input for modals — defined after handlers to avoid TDZ
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showResetUsernameModal) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleResetUsername();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setShowResetUsernameModal(false);
          setNewUsername('');
        }
      } else if (showResetPasswordConfirm) {
        if (e.key === 'Enter') {
          e.preventDefault();
          confirmResetPassword();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setShowResetPasswordConfirm(false);
        }
      } else if (showResetPasswordResult) {
        if (e.key === 'Enter' || e.key === 'Escape') {
          e.preventDefault();
          setShowResetPasswordResult(false);
          setNewPassword('');
        }
      } else if (showDeleteConfirm) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleDeleteUser();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setShowDeleteConfirm(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showResetUsernameModal, showResetPasswordConfirm, showResetPasswordResult, showDeleteConfirm, handleResetUsername, confirmResetPassword, handleDeleteUser]);

  const copyPassword = () => {
    navigator.clipboard.writeText(newPassword);
  };

  const handleGameClick = (gameId: number) => {
    if (currentUser && (currentUser.id === userStats?.id || currentUser.id === userIdNum)) {
      navigate(`/game/${gameId}`);
    } else {
      navigate(`/spectate/${gameId}`);
    }
  };

  const handleSpectateClick = (gameId: number) => {
    navigate(`/spectate/${gameId}`);
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingMessage}>
          <p>Loading user profile...</p>
        </div>
      </div>
    );
  }

  if (error || !userStats) {
    return (
      <div className={styles.page}>
        <div className={styles.errorMessage}>
          <p>{error || 'User not found'}</p>
          <button onClick={() => navigate('/users')} className={styles.backButton}>
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button onClick={() => navigate('/users')} className={styles.backButton}>
          ← Back to Users
        </button>
        <h1>{userStats.name}</h1>
        <p className={styles.username}>@{userStats.username}</p>
      </header>

      <main className={styles.main}>
        {/* Admin Controls - Top, Compact */}
        {isAdmin && (
          <section className={styles.adminControls}>
            <div className={styles.controlsGrid}>
              <button
                className={styles.adminButton}
                onClick={() => {
                  setNewUsername(userStats.username);
                  setShowResetUsernameModal(true);
                }}
              >
                Change Username
              </button>
              <button
                className={styles.adminButton}
                onClick={handleResetPassword}
              >
                Reset Password
              </button>
              {currentUser?.id !== userIdNum && (
                <button
                  className={`${styles.adminButton} ${styles.dangerButton}`}
                  onClick={handleDeleteUser}
                >
                  {showDeleteConfirm ? 'Confirm Delete' : 'Delete User'}
                </button>
              )}
            </div>
          </section>
        )}

        {/* Statistics Card */}
        <section className={styles.statsCard}>
          <h2>Statistics</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>{userStats.wins}</div>
              <div className={styles.statLabel}>Wins</div>
              <div className={styles.statRatio}>{(userStats.win_ratio * 100).toFixed(1)}%</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>{userStats.losses}</div>
              <div className={styles.statLabel}>Losses</div>
              <div className={styles.statRatio}>{(userStats.loss_ratio * 100).toFixed(1)}%</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>{userStats.ties}</div>
              <div className={styles.statLabel}>Ties</div>
              <div className={styles.statRatio}>{(userStats.tie_ratio * 100).toFixed(1)}%</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statNumber}>{userStats.total_games}</div>
              <div className={styles.statLabel}>Total Games</div>
            </div>
          </div>
        </section>

        {/* Active Games - In Progress */}
        {userStats.active_games && userStats.active_games.length > 0 && (
          <section className={styles.recentGamesCard}>
            <h2>Active Games ({userStats.active_games.length})</h2>
            <div className={styles.gamesGrid}>
              {userStats.active_games.map((game: ActiveGameRecord) => {
                const opponent = game.x_user_id === userIdNum ? game.o_user : game.x_user;
                return (
                  <div
                    key={game.id}
                    className={`${styles.gameTile} ${styles.active}`}
                    onClick={() => handleSpectateClick(game.id)}
                  >
                    <div className={styles.resultBadge}>IN PROGRESS</div>
                    {opponent && (
                      <div className={styles.tileOpponent}>
                        vs {opponent.username}
                      </div>
                    )}
                    <div className={styles.gameDate}>
                      {game.created_at ? new Date(game.created_at).toLocaleDateString() : 'Unknown'}
                    </div>
                    <div className={styles.spectateHint}>Click to spectate</div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Recent Games Card - Full Width with Tiles */}
        {userStats.recent_games.length > 0 && (
          <section className={styles.recentGamesCard}>
            <h2>Recent Games ({userStats.recent_games.length})</h2>
            <div className={styles.gamesGrid}>
              {recentGamesOnPage.map(game => (
                <div
                  key={game.id}
                  className={`${styles.gameTile} ${styles[game.outcome]}`}
                  onClick={() => handleGameClick(game.id)}
                >
                  <div className={styles.resultBadge}>{game.outcome.toUpperCase()}</div>
                  {game.opponent && (
                    <div className={styles.tileOpponent}>
                      vs {game.opponent.username}
                    </div>
                  )}
                  <div className={styles.gameDate}>
                    {game.created_at ? new Date(game.created_at).toLocaleDateString() : 'Unknown'}
                  </div>
                </div>
              ))}
            </div>
            {recentGamesTotalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageButton}
                  type="button"
                  onClick={() => setRecentGamesPage((prev) => Math.max(1, prev - 1))}
                  disabled={boundedRecentGamesPage === 1}
                >
                  Previous
                </button>
                <span className={styles.pageIndicator}>
                  Page {boundedRecentGamesPage} of {recentGamesTotalPages}
                </span>
                <button
                  className={styles.pageButton}
                  type="button"
                  onClick={() => setRecentGamesPage((prev) => Math.min(recentGamesTotalPages, prev + 1))}
                  disabled={boundedRecentGamesPage === recentGamesTotalPages}
                >
                  Next
                </button>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Modals */}
      {showResetUsernameModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Change Username</h2>
            <input
              ref={usernameInputRef}
              type="text"
              placeholder="New username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className={styles.modalInput}
            />
            <div className={styles.modalButtons}>
              <button onClick={handleResetUsername} className={styles.confirmButton}>
                Reset
              </button>
              <button
                onClick={() => {
                  setShowResetUsernameModal(false);
                  setNewUsername('');
                }}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetPasswordConfirm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Reset Password</h2>
            <p>Are you sure you want to reset this user's password? They will need to use the new password to log in.</p>
            <div className={styles.modalButtons}>
              <button onClick={() => setShowResetPasswordConfirm(false)} className={styles.cancelButton}>
                Cancel
              </button>
              <button onClick={confirmResetPassword} className={styles.confirmButton}>
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetPasswordResult && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>New Password Generated</h2>
            <p>The user's password has been reset. Share this password with them:</p>
            <div className={styles.passwordDisplayContainer}>
              <input
                ref={passwordInputRef}
                type="text"
                value={newPassword}
                readOnly
                className={styles.passwordDisplay}
              />
              <button onClick={copyPassword} className={styles.copyButton}>
                Copy
              </button>
            </div>
            <div className={styles.modalButtons}>
              <button 
                onClick={() => {
                  setShowResetPasswordResult(false);
                  setNewPassword('');
                }} 
                className={styles.confirmButton}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Confirm Deletion</h2>
            <p>Are you sure you want to delete this user? This action cannot be undone.</p>
            <div className={styles.modalButtons}>
              <button onClick={() => setShowDeleteConfirm(false)} className={styles.cancelButton}>
                Cancel
              </button>
              <button onClick={handleDeleteUser} className={styles.dangerButton}>
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {usernameChangeSuccess && (
        <div className={styles.successBanner}>
          Username changed successfully.
        </div>
      )}
    </div>
  );
};

export default UserProfilePage;
