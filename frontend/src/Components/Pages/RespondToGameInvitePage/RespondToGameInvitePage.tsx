import { FC } from 'react';
import { useParams } from 'react-router-dom';
import styles from './RespondToGameInvitePage.module.scss';

/**
 * RespondToGameInvitePage - Accept/decline incoming game invitations
 * Route: /invites/game/:gameInviteId
 */
const RespondToGameInvitePage: FC = () => {
  const { gameInviteId } = useParams<{ gameInviteId: string }>();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Game Invitation</h1>
        <p>Invite ID: {gameInviteId || 'loading...'}</p>
      </header>

      <main className={styles.main}>
        <section className={styles.inviteCard}>
          <h2>Pending Invite</h2>
          <ul>
            <li>Inviter name</li>
            <li>Invite timestamp</li>
            <li>Optional message from inviter</li>
          </ul>
        </section>

        <section className={styles.actions}>
          <h2>Actions</h2>
          <ul>
            <li>Accept button (Primary Green)</li>
            <li>Decline button (Secondary)</li>
            <li>Archive button (Ghost)</li>
          </ul>
        </section>

        <section className={styles.emptyState}>
          <p>Stub: Empty state: "No pending invites"</p>
        </section>
      </main>
    </div>
  );
};

export default RespondToGameInvitePage;
