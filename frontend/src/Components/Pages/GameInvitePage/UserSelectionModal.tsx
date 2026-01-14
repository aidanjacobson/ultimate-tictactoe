import { FC, useState, useEffect } from 'react';
import ApiService from '../../../services/ApiService';
import type { UserResponse } from '../../../datamodels/users';
import styles from './UserSelectionModal.module.scss';

interface UserSelectionModalProps {
  onSelectUser: (user: UserResponse) => void;
  onClose: () => void;
}

const UserSelectionModal: FC<UserSelectionModalProps> = ({ onSelectUser, onClose }) => {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const user = await ApiService.validate();
        setCurrentUser(user);

        // Get all users
        const allUsers = await ApiService.getUsers();
        
        // Filter out current user
        const otherUsers = allUsers.filter(u => u.id !== user.id);
        setUsers(otherUsers);
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Select Opponent</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          {loading ? (
            <p className={styles.loadingMessage}>Loading users...</p>
          ) : users.length === 0 ? (
            <p className={styles.emptyMessage}>No other users available</p>
          ) : (
            <div className={styles.userList}>
              {users.map((user) => (
                <button
                  key={user.id}
                  className={styles.userItem}
                  onClick={() => onSelectUser(user)}
                >
                  <div className={styles.userContent}>
                    <p className={styles.userName}>{user.name}</p>
                    <p className={styles.userUsername}>@{user.username}</p>
                  </div>
                  <div className={styles.arrow}>→</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSelectionModal;
