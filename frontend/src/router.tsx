import { Routes, Route } from 'react-router-dom';
import LoginPage from './Components/Pages/LoginPage/LoginPage';
import DashboardPage from './Components/Pages/DashboardPage/DashboardPage';
import GameplayPage from './Components/Pages/GameplayPage/GameplayPage';
import LeaderboardPage from './Components/Pages/LeaderboardPage/LeaderboardPage';
import InviteUserPage from './Components/Pages/InviteUserPage/InviteUserPage';
import GameInvitePage from './Components/Pages/GameInvitePage/GameInvitePage';
import RespondToGameInvitePage from './Components/Pages/RespondToGameInvitePage/RespondToGameInvitePage';
import UseInvitePage from './Components/Pages/UseInvitePage/UseInvitePage';
import InboxPage from './Components/Pages/InboxPage/InboxPage';
import AdminDashboardPage from './Components/Pages/AdminDashboardPage/AdminDashboardPage';

/**
 * Application Routes Component
 * Renders all page routes with proper nesting and organization
 */
export const AppRoutes = () => {
  return (
    <Routes>
      {/* ===== PUBLIC ROUTES (No Auth Required) ===== */}
      <Route path="/login" element={<LoginPage />} />

      {/* ===== AUTHENTICATED ROUTES ===== */}

      {/* Main Dashboard / Landing Page */}
      <Route path="/" element={<DashboardPage />} />

      {/* Gameplay */}
      <Route path="/game/:gameId" element={<GameplayPage />} />

      {/* Leaderboard */}
      <Route path="/leaderboard" element={<LeaderboardPage />} />

      {/* Invitations - User Invites */}
      <Route path="/invites/user/create" element={<InviteUserPage />} />

      {/* Invitations - Game Invites */}
      <Route path="/invites/game/create" element={<GameInvitePage />} />

      {/* Invitations - Respond to Game Invites */}
      <Route path="/invites/game/use/:gameInviteId" element={<RespondToGameInvitePage />} />

      {/* Invitations - Use/Accept via Link */}
      <Route path="/j/:userInviteCode?" element={<UseInvitePage />} />
      <Route path="/j" element={<UseInvitePage />} />

      {/* Inbox - Notifications and Messages */}
      <Route path="/inbox" element={<InboxPage />} />

      {/* Admin Dashboard (Admin-only) */}
      <Route path="/admin" element={<AdminDashboardPage />} />
    </Routes>
  );
};
