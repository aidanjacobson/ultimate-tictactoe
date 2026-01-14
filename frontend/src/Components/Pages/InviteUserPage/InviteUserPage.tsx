import { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../../../services/ApiService';
import styles from './InviteUserPage.module.scss';

interface InviteResponse {
  id: number;
  invite_code: string;
  created_at: number;
  expires_at: number;
  used: boolean;
}

/**
 * InviteUserPage - Create and send user invitations
 * Route: /invite/user
 */
const InviteUserPage: FC = () => {
  const [inviteCode, setInviteCode] = useState('');
  const [expiresIn, setExpiresIn] = useState('7days');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successCode, setSuccessCode] = useState('');
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  // Convert expiry dropdown value to days
  const getExpiryDays = (value: string): number | null => {
    switch (value) {
      case '1day':
        return 1;
      case '2days':
        return 2;
      case '3days':
        return 3;
      case '7days':
        return 7;
      case '2weeks':
        return 14;
      case '1month':
        return 30;
      case 'never':
        return null;
      default:
        return 7;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const expiryDays = getExpiryDays(expiresIn);
      const response = await ApiService.createUserInvite(
        inviteCode || null,
        expiryDays
      );

      setSuccessCode(response.invite_code);
      setShowModal(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create invite';
      
      // Check for duplicate code error (400)
      if (message.includes('400')) {
        setError('This invite code has already been used.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/j/${successCode}`;
    navigator.clipboard.writeText(link);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    navigate('/');
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>Create User Invite</h1>
          <p className={styles.subtitle}>Share an invitation for new players to join the game</p>
        </header>

        <main className={styles.main}>
          <form onSubmit={handleSubmit} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}

            {/* Invite Code Field */}
            <div className={styles.formGroup}>
              <label htmlFor="inviteCode" className={styles.label}>
                Invite Code
                <span className={styles.hint}> (leave blank to autogenerate)</span>
              </label>
              <input
                id="inviteCode"
                type="text"
                className={styles.input}
                placeholder="Leave blank for automatic generation"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
              />
            </div>

            {/* Expiry Dropdown */}
            <div className={styles.formGroup}>
              <label htmlFor="expiresIn" className={styles.label}>
                Expires In
              </label>
              <select
                id="expiresIn"
                className={styles.select}
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value)}
              >
                <option value="1day">1 Day</option>
                <option value="2days">2 Days</option>
                <option value="3days">3 Days</option>
                <option value="7days">7 Days (Default)</option>
                <option value="2weeks">2 Weeks</option>
                <option value="1month">1 Month</option>
                <option value="never">Never</option>
              </select>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Invite'}
            </button>
          </form>
        </main>
      </div>

      {/* Success Modal */}
      {showModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>Invite Created!</h2>
            
            <div className={styles.linkSection}>
              <label className={styles.linkLabel}>Share this link:</label>
              <div className={styles.linkContainer}>
                <input
                  type="text"
                  className={styles.linkInput}
                  value={`${window.location.origin}/j/${successCode}`}
                  readOnly
                />
                <button
                  type="button"
                  className={styles.copyButton}
                  onClick={handleCopyLink}
                >
                  Copy
                </button>
              </div>
            </div>

            <button
              type="button"
              className={styles.closeButton}
              onClick={handleCloseModal}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InviteUserPage;
