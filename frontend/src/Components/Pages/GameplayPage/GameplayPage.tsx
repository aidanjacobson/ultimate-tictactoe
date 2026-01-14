import { FC, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ApiService from '../../../services/ApiService';
import UltimateTicTacToeGameBoard from '../../GameBoard/UltimateTicTacToeGameBoard';
import type { GameResponse } from '../../../datamodels/tictactoe';
import styles from './GameplayPage.module.scss';

/**
 * GameplayPage - Active game board and move input
 * Route: /game/:gameId
 */
const GameplayPage: FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  
  const [game, setGame] = useState<GameResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        if (!gameId) {
          setError('Game ID is required');
          setLoading(false);
          return;
        }
        
        const gameData = await ApiService.getGame(parseInt(gameId));
        setGame(gameData);
        setError(null);
      } catch (err) {
        setError('Failed to load game. The game may not exist or you may not have access to it.');
        setGame(null);
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [gameId]);

  if (loading) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>Loading Game...</h1>
        </header>
        <main className={styles.main}>
          <p>Please wait while we load your game.</p>
        </main>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>Error Loading Game</h1>
        </header>
        <main className={styles.main}>
          <div className={styles.errorBox}>
            {error || 'Game not found.'}
          </div>
          <button onClick={() => navigate('/')} className={styles.button}>
            Return to Dashboard
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Ultimate TicTacToe</h1>
        <p className={styles.subtitle}>Game #{game.id}</p>
      </header>

      <main className={styles.main}>
        <section className={styles.boardSection}>
          <UltimateTicTacToeGameBoard gameState={game.state.current_game} />
        </section>

        <section className={styles.infoSection}>
          <h2>Game Info</h2>
          <div className={styles.infoBox}>
            <p><strong>Current Turn:</strong> Player {game.state.current_game.turn}</p>
            <p><strong>Status:</strong> {game.finished ? (game.winner_id ? 'Finished' : 'Draw') : 'In Progress'}</p>
            {game.state.current_game.activeCorner && (
              <p><strong>Active Corner:</strong> {game.state.current_game.activeCorner}</p>
            )}
          </div>
          <button onClick={() => navigate('/')} className={styles.button}>
            Return to Dashboard
          </button>
        </section>
      </main>
    </div>
  );
};

export default GameplayPage;
