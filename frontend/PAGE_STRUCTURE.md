# Ultimate TicTacToe - Page Structure & Component Architecture

## Page Hierarchy

```
├── Public Routes (No Auth Required)
│   ├── Login Page
│   └── Landing Info Page (if not logged in)
│
├── Authenticated Routes
│   ├── Dashboard / Home
│   ├── Gameplay Page
│   ├── Game History Page
│   ├── Leaderboard Page
│   ├── Invite User Screen
│   ├── Respond to Game Invite Screen
│   ├── Use Invite Screen
│   ├── Create Game Invite Screen
│   ├── Inbox
│   └── Admin Dashboard (admin-only)
```

---

## Page Specifications

### 1. Login Page
**Route**: `/login`  
**Purpose**: User authentication  
**Auth Required**: No  
**Layout**: Centered, full-height

#### Components:
- Logo/Branding (header)
- Login Form
  - Email input
  - Password input
  - "Remember me" checkbox
  - "Forgot password?" link
  - Login button (Primary)
  - Sign up link
- Social login buttons (optional future feature)
- Footer with copyright

#### Design Notes:
- Minimal, focused design
- Centered card on dark background
- No navigation bar
- Background could have subtle pattern or game board elements

---

### 2. Dashboard / Home Page
**Route**: `/dashboard` or `/`  
**Purpose**: Main hub - overview of user's games, quick actions  
**Auth Required**: Yes  
**Layout**: 2-3 column grid

#### Components:
- Navigation Bar (persistent)
- User Info Header (name, rank, stats summary)
- Quick Actions Section
  - "Start New Game" button (Primary)
  - "Check Invites" button
  - "View Leaderboard" link
- Games in Progress Section (sortable, filterable)
  - Game cards showing:
    - Opponent name
    - Game status
    - Last move timestamp
    - Current turn indicator
    - Quick join button
  - If empty: "No games in progress" message + CTA
- Recent Games Section
  - Compact game cards (won/lost/draw)
  - Link to full Game History
- Personal Stats Widget
  - Win/loss/draw counts
  - Win rate percentage
  - Current rank
- Notifications/Inbox badge (if unread)

#### Component Breakdown:
- `Navigation` (persistent)
- `UserInfoHeader`
- `QuickActionsBar`
- `GamesInProgressGrid`
- `GameCard` (reusable)
- `PersonalStatsWidget`
- `NotificationBadge`

---

### 3. Gameplay Page
**Route**: `/game/:gameId`  
**Purpose**: Active game board and move input  
**Auth Required**: Yes  
**Layout**: Board-centric with sidebars

#### Components:
- Navigation Bar (persistent)
- Game Header
  - Player names with X/O markers
  - Whose turn indicator (highlight current player)
  - Game status (in progress, won, lost, draw)
- Game Board (UltimateTicTacToe grid)
  - 3x3 macro grid of 3x3 micro boards
  - Active corner highlight (if applicable)
  - Move history indicators
- Game Sidebar (right or bottom on mobile)
  - Move history log (scrollable)
  - Game timer (optional)
  - Resign/Draw buttons
  - "Return to Dashboard" link
- Mobile: Stack vertically

#### Component Breakdown:
- `Navigation` (persistent)
- `GameHeader`
- `UltimateTicTacToeGameBoard` (existing)
- `MoveHistoryLog`
- `GameSidebar`
- `ResignButton` (Danger style)
- `DrawOfferButton`

---

### 4. Game History Page
**Route**: `/games/history`  
**Purpose**: View past and ongoing games  
**Auth Required**: Yes  
**Layout**: List/table view

#### Components:
- Navigation Bar (persistent)
- Filter/Search Section
  - Status filter (all, won, lost, draw, in-progress)
  - Date range picker
  - Search by opponent name
- Game History Table/List
  - Columns: Opponent, Result, Date, Duration, Quick View button
  - Pagination (20 games per page)
  - Sort by date (newest first)
- Game Details Modal (on "View")
  - Replay of moves
  - Full move history
  - Final board state
  - Duration, date, etc.

#### Component Breakdown:
- `Navigation` (persistent)
- `FilterBar`
- `GameHistoryTable`
- `GameHistoryRow` (reusable)
- `GameDetailsModal`
- `MoveReplayViewer`

---

### 5. Leaderboard Page
**Route**: `/leaderboard`  
**Purpose**: Global rankings and stats  
**Auth Required**: Yes  
**Layout**: Leaderboard table with sidebar stats

#### Components:
- Navigation Bar (persistent)
- Page Title & Filters
  - Time period filter (All time, This month, This week)
  - Stat type filter (Win rate %, Total wins, Rank rating, etc.)
- Leaderboard Table
  - Rank, Player name, Stat value, Trend indicator (↑↓)
  - Pagination (50 players per page)
  - Highlight current user row
  - Clickable rows to view player profile (optional)
- Personal Rank Card (floating or sidebar)
  - Current rank
  - Points/rating
  - Recent trend
  - "View my profile" link

#### Component Breakdown:
- `Navigation` (persistent)
- `LeaderboardHeader` (title + filters)
- `LeaderboardTable`
- `LeaderboardRow` (reusable)
- `PersonalRankCard`
- `TrendIndicator`

---

### 6. Invite User Screen
**Route**: `/invite/user`  
**Purpose**: Initiate game with another user  
**Auth Required**: Yes  
**Layout**: Form-centric

#### Components:
- Navigation Bar (persistent)
- Page Title: "Invite a Player"
- Invite Form
  - Search/Select user input (autocomplete from user list)
  - Game settings (optional)
    - Time limit (if implemented)
    - AI difficulty (if playing AI)
  - Message field (optional)
  - "Send Invite" button (Primary)
  - "Create Invite Link" alternative (generates shareable link)
- Recent opponents list (quick select)
- Invitation sent confirmation

#### Component Breakdown:
- `Navigation` (persistent)
- `UserSearchInput` (with autocomplete)
- `InviteForm`
- `RecentOpponentsList`
- `SuccessMessage` or `ConfirmationModal`

---

### 7. Respond to Game Invite Screen
**Route**: `/invites/pending` or inline on Dashboard  
**Purpose**: Accept/decline incoming game invitations  
**Auth Required**: Yes  
**Layout**: Modal or dedicated page

#### Components:
- Navigation Bar (persistent, if page-based)
- Invite Card(s)
  - Inviter name
  - Invite timestamp
  - Optional message from inviter
  - Accept button (Primary Green)
  - Decline button (Secondary)
  - Archive button (Ghost)
- If multiple invites: card list with scroll
- Empty state: "No pending invites"

#### Component Breakdown:
- `Navigation` (persistent)
- `PendingInvitesList`
- `InviteCard` (reusable)
- `AcceptButton` / `DeclineButton`
- `EmptyState`

---

### 8. Create Game Invite Screen
**Route**: `/invites/user/create`  
**Purpose**: Create shareable/linkable game invitations  
**Auth Required**: Yes  
**Layout**: Form with link generation

#### Components:
- Navigation Bar (persistent)
- Page Title: "Create Game Invitation"
- Invite Form
  - Game name/title input
  - Access level (public/private)
  - Expiration date (optional)
  - Custom message field
  - Create button (Primary)
- Generated Invite Link Display
  - Copyable link
  - QR code (optional)
  - Shareable icons (Discord, Twitter, Copy, etc.)
- Invite History (recent)

#### Component Breakdown:
- `Navigation` (persistent)
- `CreateInviteForm`
- `InviteLinkDisplay`
- `CopyButton`
- `QRCodeGenerator` (optional)
- `ShareButtons`
- `RecentInvitesHistory`

---

### 9. Use Invite Screen
**Route**: `/invites/use/:inviteCode` or `/join/:inviteCode`  
**Purpose**: Accept and join game via invite link  
**Auth Required**: Yes (redirects to login if not)  
**Layout**: Simple confirmation screen

#### Components:
- Logo (minimal nav)
- Invite Details Card
  - Inviter name
  - Game info
  - "Join Game" button (Primary)
  - "Cancel" button (Ghost)
- Loading state while joining
- Success state with link to game

#### Component Breakdown:
- `MinimalHeader` (logo only)
- `InviteDetailsCard`
- `JoinGameButton`
- `LoadingSpinner`
- `SuccessMessage`

---

### 10. Inbox Page
**Route**: `/inbox`  
**Purpose**: All notifications and messages  
**Auth Required**: Yes  
**Layout**: Tab-based or segmented

#### Components:
- Navigation Bar (persistent)
- Tabs/Segments
  - All
  - Invites (pending game invitations)
  - Notifications (system messages, friend requests, etc.)
  - Archived
- Inbox List
  - Message cards with sender, subject, timestamp, unread indicator
  - Swipe to archive (mobile) or archive button (desktop)
  - Mark as read/unread
  - Delete button
- Message Detail View (modal or sidebar)
  - Full message content
  - Action buttons (Accept invite, Decline, etc.)

#### Component Breakdown:
- `Navigation` (persistent)
- `InboxTabBar`
- `InboxList`
- `InboxMessage` (reusable)
- `MessageDetailPanel`
- `UnreadBadge`

---

### 11. Admin Dashboard
**Route**: `/admin`  
**Purpose**: Admin controls and moderation  
**Auth Required**: Yes (admin-only)  
**Layout**: Dashboard with multiple sections

#### Components:
- Navigation Bar (persistent)
- Admin Sidebar (quick links to sections)
- Statistics Overview
  - Total users
  - Active games
  - New signups (today/week)
  - System health
- Users Management Section
  - User list/table
  - Search, filter, sort
  - Ban/unban user button
  - View user details modal
- Game Moderation
  - Active games list
  - Flagged games
  - Force end game button (admin action)
- Reports/Issues
  - User-reported issues
  - Resolved/unresolved filters
  - Details and action buttons
- System Logs (optional)
  - Activity log
  - Error log

#### Component Breakdown:
- `Navigation` (persistent)
- `AdminSidebar`
- `StatisticsOverview`
- `UsersManagementTable`
- `GameModerationPanel`
- `ReportsSection`
- `ConfirmActionModal` (for destructive actions)

---

## Shared Components Library

These components are used across multiple pages:

### Layout Components
- `Navigation` - Top navigation bar
- `Sidebar` - Optional side navigation
- `PageHeader` - Consistent page title area
- `Container` - Consistent max-width wrapper
- `Grid` - Responsive grid layout

### UI Components
- `Button` - Primary, Secondary, Ghost, Danger variants
- `Card` - Generic card container
- `Modal` / `Dialog` - Modal windows
- `Input` - Text, email, number inputs
- `Select` / `Dropdown` - Dropdown selectors
- `SearchInput` - Input with autocomplete
- `Tab` / `TabBar` - Tabbed interface
- `Badge` / `Tag` - Status indicators
- `Spinner` / `Loader` - Loading states
- `EmptyState` - Empty state placeholders
- `Toast` / `Notification` - Floating notifications
- `Checkbox` / `RadioButton` - Form controls

### Game Components
- `UltimateTicTacToeGameBoard` - Main game board (existing)
- `TicTacToeCell` - Individual cell
- `MoveHistoryLog` - Move history display
- `GameHeader` - Game status header
- `GameCard` - Mini game summary card

### Data Display
- `Table` - Reusable table component
- `ListItem` - List item component
- `Avatar` / `UserIcon` - User representations
- `StatisticsWidget` - Stats display
- `ChartComponent` - Stats visualization (optional)

---

## Component Naming Convention

All component files follow this structure:

```
src/components/
├── Layout/
│   ├── Navigation/
│   │   ├── Navigation.tsx
│   │   ├── Navigation.module.scss
│   │   └── Navigation.types.ts
│   ├── Sidebar/
│   └── ...
├── UI/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.module.scss
│   │   └── Button.types.ts
│   ├── Card/
│   ├── Modal/
│   └── ...
├── Game/
│   ├── UltimateTicTacToeGameBoard/
│   ├── MoveHistoryLog/
│   └── ...
├── Pages/
│   ├── LoginPage/
│   ├── DashboardPage/
│   ├── GameplayPage/
│   └── ...
└── Common/
    ├── EmptyState/
    ├── Loader/
    └── ...
```

### File Naming Rules
- **Components**: PascalCase.tsx (e.g., `Button.tsx`)
- **Styles**: kebab-case.module.scss (e.g., `button.module.scss`)
- **Types/Props**: Component.types.ts (e.g., `Button.types.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `BUTTON_SIZES.ts`)

---

## Responsive Behavior

### Mobile (< 640px)
- Full-width layouts
- Bottom navigation (if tabbed)
- Modals for detailed views
- Stack cards vertically
- Hamburger menu for navigation

### Tablet (641px - 1024px)
- 2-column layouts where applicable
- Side drawer for navigation
- Larger touch targets

### Desktop (1025px+)
- Multi-column layouts
- Persistent navigation sidebar (optional)
- Hover effects on interactive elements
- Optimized spacing and readability

---

## Accessibility Requirements

Each page must:
1. Have proper heading hierarchy (H1, H2, H3, etc.)
2. Include ARIA labels for interactive elements
3. Maintain color contrast ratios (7:1 for text)
4. Support keyboard navigation (Tab, Enter, Escape)
5. Have focus visible on all buttons and links
6. Use semantic HTML (button, a, form, etc.)
7. Include alt text for images (if any)
8. Support screen readers (ARIA live regions for updates)

---

## State Management Across Pages

### Data to Track
- Current user (auth state)
- Current game state (if playing)
- Pending invites count
- Unread notifications count
- User's games list

### Store Structure (using Zustand or Context API)
```
- auth
  - currentUser
  - isLoggedIn
  - token
- game
  - currentGame
  - gameHistory
  - gamesInProgress
- notifications
  - pendingInvites
  - unreadCount
  - inboxMessages
- ui
  - theme (dark/light, though mostly dark)
  - sidebarOpen
  - activeTab
```

---

## Color Application by Page

### Login Page
- Dark background with subtle blue accents
- Primary button in blue
- Links in cyan

### Dashboard
- Game cards with status-based header colors (blue = active, green = won, red = lost)
- Primary CTA buttons in blue
- Badges for status indicators

### Gameplay
- Active cell highlighting (blue for X, amber for O)
- Winning pattern in green
- Sidebar background in secondary slate

### Leaderboard
- Rank numbers highlighted
- Trend indicators (↑ green, ↓ red, → gray)
- Current user row highlighted in blue

### Admin Dashboard
- Warning colors for flagged items (amber, red)
- Success green for resolved items
- Critical stats in red

