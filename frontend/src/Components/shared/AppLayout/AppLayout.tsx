import { FC, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ApiService } from '../../../services/ApiService';
import Header from '../Header/Header';
import styles from './AppLayout.module.scss';

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * AppLayout - Wraps page content with shared header
 * Header is hidden on login page and invite accept page
 * Checks auth token on protected pages
 */
const AppLayout: FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage = location.pathname === '/login';
  const isInvitePage = location.pathname.startsWith('/j/') || location.pathname === '/j';

  useEffect(() => {
    // Check auth token on non-login, non-invite-accept pages
    if (!isLoginPage && !isInvitePage) {
      const token = ApiService.getToken();
      if (!token) {
        // No token found, redirect to login
        ApiService.logout();
        navigate('/login');
      }
    }
  }, [location.pathname, isLoginPage, isInvitePage, navigate]);

  return (
    <div className={styles.layout}>
      {!isLoginPage && !isInvitePage && <Header />}
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
