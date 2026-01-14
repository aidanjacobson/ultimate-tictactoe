import { FC } from 'react';
import { Link } from 'react-router-dom';
import type { GameResponse } from '../../../datamodels/tictactoe';
import styles from './GameCard.module.scss';

interface GameCardProps {
  game: GameResponse;
  currentUserId: number;
}

/**
 * GameCard - Displays a single game with player info and current status
 * Shows whose turn it is (if ongoing) or winner/tie (if finished)
 * Links to the game play page
 */
const GameCard: FC<GameCardProps> = ({ game, currentUserId }) => {
  const xName = game.x_user?.name || 'User';
  const oName = game.o_user?.name || 'User';
  const isXCurrentUser = game.x_user_id === currentUserId;
  const isOCurrentUser = game.o_user_id === currentUserId;

  // Determine status text
  let statusText = '';
  if (game.finished) {
    if (game.winner_id === null) {
      statusText = 'Tie Game';
    } else if (game.winner_id === currentUserId) {
      statusText = `Winner: ${isXCurrentUser ? xName : oName}`;
    } else {
      statusText = `Winner: ${isXCurrentUser ? oName : xName}`;
    }
  } else {
    // Game is in progress - determine whose turn it is
    const currentPlayerIsX = game.state?.current_game?.turn === 'X';
    if ((currentPlayerIsX && isXCurrentUser) || (!currentPlayerIsX && isOCurrentUser)) {
      statusText = 'Your Turn';
    } else {
      statusText = "Opponent's Turn";
    }
  }

  return (
    <Link to={`/game/${game.id}`} className={styles.card}>
      <div className={styles.players}>
        <div className={styles.player}>
          <span className={styles.symbol}>X</span>
          <span className={styles.name}>{xName}</span>
        </div>
        <div className={styles.vs}>VS</div>
        <div className={styles.player}>
          <span className={styles.symbol}>O</span>
          <span className={styles.name}>{oName}</span>
        </div>
      </div>
      <div className={styles.status}>
        {statusText}
      </div>
    </Link>
  );
};

export default GameCard;
