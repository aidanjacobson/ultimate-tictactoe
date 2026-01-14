import { FC, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ApiService from '../../../services/ApiService';
import styles from './RespondToGameInvitePage.module.scss';

interface GameInvite {
  id: number;
  from_user_id: number;
  to_user_id: number;
  inviter_has_preferred_symbol: boolean;
  preferred_symbol: string | null;
  reviewed: boolean;
  accepted: boolean | null;
}

/**
 * RespondToGameInvitePage - Accept/decline incoming game invitations
 * Route: /invites/game/use/:gameInviteId
 */
const RespondToGameInvitePage: FC = () => {
  const { gameInviteId } = useParams<{ gameInviteId: string }>();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<GameInvite | null>(null);
  const [inviterName, setInviterName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [preferSymbol, setPreferSymbol] = useState(false);
  const [preferredSymbol, setPreferredSymbol] = useState<'X' | 'O'>('X');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchInvite = async () => {
      if (!gameInviteId) {
        setError('Invalid invite ID');
        setIsLoading(false);
        return;
      }

      try {
        const inviteData = await ApiService.getGameInvite(parseInt(gameInviteId));
        setInvite(inviteData);
        
        // Fetch inviter's name
        const inviter = await ApiService.getUser(inviteData.from_user_id);
        setInviterName(inviter.name);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load invite';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvite();
  }, [gameInviteId]);

  const handleAccept = async () => {
    if (!gameInviteId) return;

    setIsProcessing(true);
    setErrorMessage('');
    try {
      const response = await ApiService.acceptGameInvite(
        parseInt(gameInviteId),
        preferSymbol ? preferredSymbol : undefined
      );
      navigate(`/game/${response.game_id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to accept invite. Please try again.';
      setErrorMessage(message);
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!gameInviteId) return;

    setIsProcessing(true);
    setErrorMessage('');
    try {
      await ApiService.declineGameInvite(parseInt(gameInviteId));
      navigate('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to decline invite. Please try again.';
      setErrorMessage(message);
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>Game Invitation</h1>
        </header>
        <main className={styles.main}>
          <section className={styles.card}>
            <p>Loading...</p>
          </section>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>Game Invitation</h1>
        </header>
        <main className={styles.main}>
          <section className={styles.card}>
            <div className={styles.errorBox}>
              <p className={styles.errorMessage}>{error}</p>
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>Game Invitation</h1>
        </header>
        <main className={styles.main}>
          <section className={styles.card}>
            <p>Invite not found</p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Game Invitation</h1>
      </header>

      <main className={styles.main}>
        <section className={styles.card}>
          <h2>Game request from {inviterName}</h2>
          
          <div className={styles.inviteDetails}>
            {invite.inviter_has_preferred_symbol ? (
              <p className={styles.symbolInfo}>
                They have requested to be <strong className={styles.symbolValue}>{invite.preferred_symbol}</strong>
              </p>
            ) : (
              <div className={styles.symbolSection}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={preferSymbol}
                    onChange={(e) => setPreferSymbol(e.target.checked)}
                  />
                  <span>Do you prefer a symbol?</span>
                </label>

                {preferSymbol && (
                  <div className={styles.symbolChoice}>
                    <p><strong>Preferred Symbol:</strong></p>
                    <div className={styles.symbolButtons}>
                      <button
                        className={`${styles.symbolButton} ${preferredSymbol === 'X' ? styles.active : ''}`}
                        onClick={() => setPreferredSymbol('X')}
                      >
                        Play as X
                      </button>
                      <button
                        className={`${styles.symbolButton} ${preferredSymbol === 'O' ? styles.active : ''}`}
                        onClick={() => setPreferredSymbol('O')}
                      >
                        Play as O
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={styles.buttonGroup}>
            {errorMessage && (
              <div className={styles.errorBox}>
                <p className={styles.errorMessage}>{errorMessage}</p>
              </div>
            )}
            <button 
              className={styles.acceptButton}
              onClick={handleAccept}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Accept Invite'}
            </button>
            <button 
              className={styles.declineButton}
              onClick={handleDecline}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Decline Invite'}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default RespondToGameInvitePage;
