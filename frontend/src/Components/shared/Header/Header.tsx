import { FC } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ApiService } from '../../../services/ApiService';
import styles from './Header.module.scss';

/**
 * Header - Shared navigation header
 * Appears on all pages except login
 */
const Header: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    ApiService.logout();
    navigate('/login');
  };

  const isActive = (path: string): boolean => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* App Name */}
        <div className={styles.brand}>
          <h1 className={styles.title}>Ultimate TicTacToe</h1>
        </div>

        {/* Navigation Tabs */}
        <nav className={styles.nav}>
          <a
            href="/"
            className={`${styles.navLink} ${isActive('/') ? styles.active : ''}`}
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
          >
            Dashboard
          </a>
          {/* <a
            href="/leaderboard"
            className={`${styles.navLink} ${isActive('/leaderboard') ? styles.active : ''}`}
            onClick={(e) => {
              e.preventDefault();
              navigate('/leaderboard');
            }}
          >
            Leaderboard
          </a>
          <a
            href="/inbox"
            className={`${styles.navLink} ${isActive('/inbox') ? styles.active : ''}`}
            onClick={(e) => {
              e.preventDefault();
              navigate('/inbox');
            }}
          >
            Inbox
          </a> */}
        </nav>

        {/* Action Buttons */}
        <div className={styles.actions}>
           <button 
            className={styles.inviteGameButton} 
            onClick={() => navigate('/invites/game/create')}
          >
            Start New Game
          </button>
          <button 
            className={styles.inviteButton} 
            onClick={() => navigate('/invites/user/create')}
          >
            Invite User
          </button>
          <button className={styles.logoutButton} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
