import { FC, useState, useEffect } from 'react';
import ApiService from '../../../services/ApiService';
import type { UserResponse } from '../../../datamodels/users';
import UserSelectionModal from './UserSelectionModal';
import SuccessModal from './SuccessModal';
import ErrorModal from './ErrorModal';
import styles from './GameInvitePage.module.scss';

/**
 * GameInvitePage - Send game invites to other players
 * Route: /invite
 */
const GameInvitePage: FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [requestSymbol, setRequestSymbol] = useState(false);
  const [preferredSymbol, setPreferredSymbol] = useState<'X' | 'O'>('X');
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [invitedUserName, setInvitedUserName] = useState('');

  const handleUserSelected = (user: UserResponse) => {
    setSelectedUser(user);
    setShowModal(false);
  };

  const handleReset = () => {
    setSelectedUser(null);
    setRequestSymbol(false);
    setPreferredSymbol('X');
  };

  const handleSendInvite = async () => {
    if (!selectedUser) return;

    setIsLoading(true);
    try {
      await ApiService.createGameInvite(
        selectedUser.id,
        requestSymbol,
        requestSymbol ? preferredSymbol : null
      );
      setInvitedUserName(selectedUser.name);
      setShowSuccessModal(true);
      handleReset();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send invite. Please try again.';
      setErrorMessage(message);
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Send Game Invite</h1>
        <p className={styles.subtitle}>Challenge a friend to Ultimate TicTacToe</p>
      </header>

      <main className={styles.main}>
        <section className={styles.card}>
          <h2>Select Opponent</h2>
          
          {selectedUser ? (
            <div className={styles.selectedUser}>
              <div className={styles.userInfo}>
                <p><strong>Selected Opponent:</strong></p>
                <p className={styles.userName}>{selectedUser.name}</p>
                <p className={styles.userUsername}>@{selectedUser.username}</p>
              </div>
              <button 
                onClick={() => setShowModal(true)} 
                className={styles.changeButton}
                disabled={isLoading}
              >
                Change
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowModal(true)} 
              className={styles.selectButton}
              disabled={isLoading}
            >
              Select User
            </button>
          )}

          <div className={styles.symbolSection}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={requestSymbol}
                onChange={(e) => setRequestSymbol(e.target.checked)}
                disabled={isLoading}
              />
              <span>Request specific symbol</span>
            </label>

            {requestSymbol && (
              <div className={styles.symbolChoice}>
                <p><strong>Preferred Symbol:</strong></p>
                <div className={styles.symbolButtons}>
                  <button
                    className={`${styles.symbolButton} ${preferredSymbol === 'X' ? styles.active : ''}`}
                    onClick={() => setPreferredSymbol('X')}
                    disabled={isLoading}
                  >
                    Play as X
                  </button>
                  <button
                    className={`${styles.symbolButton} ${preferredSymbol === 'O' ? styles.active : ''}`}
                    onClick={() => setPreferredSymbol('O')}
                    disabled={isLoading}
                  >
                    Play as O
                  </button>
                </div>
              </div>
            )}
          </div>

          {selectedUser && (
            <div className={styles.inviteInfo}>
              <div className={styles.infoBox}>
                <p><strong>Opponent:</strong> {selectedUser.name} (@{selectedUser.username})</p>
                {requestSymbol && (
                  <p><strong>Your Symbol:</strong> {preferredSymbol}</p>
                )}
              </div>
            </div>
          )}

          <div className={styles.buttonGroup}>
            <button 
              className={styles.sendButton}
              onClick={handleSendInvite}
              disabled={isLoading || !selectedUser}
            >
              {isLoading ? 'Sending...' : 'Send Invite'}
            </button>
            <button 
              className={styles.resetButton} 
              onClick={handleReset}
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </section>
      </main>

      {showModal && (
        <UserSelectionModal
          onSelectUser={handleUserSelected}
          onClose={() => setShowModal(false)}
        />
      )}

      {showSuccessModal && (
        <SuccessModal
          message={`Invite sent to ${invitedUserName}!`}
          onClose={() => setShowSuccessModal(false)}
        />
      )}

      {showErrorModal && (
        <ErrorModal
          message={errorMessage}
          onClose={() => setShowErrorModal(false)}
        />
      )}
    </div>
  );
};

export default GameInvitePage;
