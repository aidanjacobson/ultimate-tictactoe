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
          <div className={styles.brandContent}>
            <h1 className={styles.title}><a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Ultimate TicTacToe</a></h1>
            <p className={styles.subtitle}>Now with 100% more Kubernetes!</p>
          </div>
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
          <a
            href="/users"
            className={`${styles.navLink} ${isActive('/users') ? styles.active : ''}`}
            onClick={(e) => {
              e.preventDefault();
              navigate('/users');
            }}
          >
            Users
          </a>
          <a
            href="/leaderboard"
            className={`${styles.navLink} ${isActive('/leaderboard') ? styles.active : ''}`}
            onClick={(e) => {
              e.preventDefault();
              navigate('/leaderboard');
            }}
          >
            Scoreboard
          </a>
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
