import { FC } from 'react';
import styles from './CreateGameInvitePage.module.scss';

/**
 * CreateGameInvitePage - Create shareable/linkable game invitations
 * Route: /invites/user/create
 */
const CreateGameInvitePage: FC = () => {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Create Game Invitation</h1>
      </header>

      <main className={styles.main}>
        <section className={styles.formSection}>
          <h2>Invite Details</h2>
          <ul>
            <li>Game name/title input</li>
            <li>Access level (public/private)</li>
            <li>Expiration date (optional)</li>
            <li>Custom message field</li>
            <li>Create button (Primary)</li>
          </ul>
        </section>

        <section className={styles.linkSection}>
          <h2>Share Invitation</h2>
          <p>Stub: Generated Invite Link Display</p>
          <ul>
            <li>Copyable link</li>
            <li>QR code (optional)</li>
            <li>Shareable icons (Discord, Twitter, Copy, etc.)</li>
          </ul>
        </section>

        <aside className={styles.history}>
          <h3>Recent Invites</h3>
          <p>Stub: Invite history (recent)</p>
        </aside>
      </main>
    </div>
  );
};

export default CreateGameInvitePage;
