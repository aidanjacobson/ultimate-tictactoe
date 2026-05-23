import { Routes, Route } from 'react-router-dom';
import LoginPage from './Components/Pages/LoginPage/LoginPage';
import DashboardPage from './Components/Pages/DashboardPage/DashboardPage';
import GameplayPage from './Components/Pages/GameplayPage/GameplayPage';
import SpectateGamePage from './Components/Pages/SpectateGamePage/SpectateGamePage';
import LeaderboardPage from './Components/Pages/LeaderboardPage/LeaderboardPage';
import InviteUserPage from './Components/Pages/InviteUserPage/InviteUserPage';
import GameInvitePage from './Components/Pages/GameInvitePage/GameInvitePage';
import RespondToGameInvitePage from './Components/Pages/RespondToGameInvitePage/RespondToGameInvitePage';
import UseInvitePage from './Components/Pages/UseInvitePage/UseInvitePage';
import InboxPage from './Components/Pages/InboxPage/InboxPage';
import AdminDashboardPage from './Components/Pages/AdminDashboardPage/AdminDashboardPage';
import UsersPage from './Components/Pages/UsersPage/UsersPage';
import UserProfilePage from './Components/Pages/UserProfilePage/UserProfilePage';
import ChangePasswordPage from './Components/Pages/ChangePasswordPage/ChangePasswordPage';

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

      {/* Spectate - read-only view of any game */}
      <Route path="/spectate/:gameId" element={<SpectateGamePage />} />

      {/* Leaderboard */}
      <Route path="/leaderboard" element={<LeaderboardPage />} />

      {/* Users - Browse and View Profiles */}
      <Route path="/users" element={<UsersPage />} />
      <Route path="/users/:userId" element={<UserProfilePage />} />

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

      {/* Change Password (required after admin password reset) */}
      <Route path="/change-password" element={<ChangePasswordPage />} />
    </Routes>
  );
};
