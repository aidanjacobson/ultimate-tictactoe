import { FC, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../../services/ApiService';
import type { UserResponse } from '../../../datamodels/users';
import styles from './UsersPage.module.scss';

/**
 * UsersPage - Lists all users and allows navigation to their profiles
 * Route: /users
 */
const UsersPage: FC = () => {
  const navigate = useNavigate();
  
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const allUsers = await ApiService.getUsers();
        setUsers(allUsers);
        
        // Fetch current user
        const current = await ApiService.validate();
        setCurrentUser(current);
        
        setError(null);
      } catch (err) {
        setError('Failed to fetch users');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserClick = (userId: number) => {
    navigate(`/users/${userId}`);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1>Users</h1>
            <p className={styles.subtitle}>View user profiles and statistics</p>
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
        <div className={styles.searchSection}>
          <input
            type="text"
            placeholder="Search users by name or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {loading && (
          <div className={styles.loadingMessage}>
            <p>Loading users...</p>
          </div>
        )}

        {error && (
          <div className={styles.errorMessage}>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className={styles.usersList}>
            {filteredUsers.length > 0 ? (
              <div className={styles.usersGrid}>
                {filteredUsers.map(user => (
                  <div
                    key={user.id}
                    className={styles.userCard}
                    onClick={() => handleUserClick(user.id)}
                  >
                    <div className={styles.userInfo}>
                      <h3 className={styles.userName}>{user.name}</h3>
                      <p className={styles.userUsername}>@{user.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.noResults}>
                <p>No users found matching your search.</p>
              </div>
            )}
          </div>
        )}

        <div className={styles.userCount}>
          {!loading && (
            <p>Showing {filteredUsers.length} of {users.length} users</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default UsersPage;
