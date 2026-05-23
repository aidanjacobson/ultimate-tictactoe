import { FC, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ApiService from '../../../services/ApiService';
import UltimateTicTacToeGameBoard from '../../GameBoard/UltimateTicTacToeGameBoard';
import type { GameResponse, Position } from '../../../datamodels/tictactoe';
import styles from './SpectateGamePage.module.scss';

/**
 * SpectateGamePage - Read-only view of any game for spectators
 * Route: /spectate/:gameId
 */
const SpectateGamePage: FC = () => {
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

        const gameData = await ApiService.spectateGame(parseInt(gameId));
        setGame(gameData);
        setError(null);
      } catch (err) {
        setError('Failed to load game. The game may not exist.');
        setGame(null);
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [gameId]);

  // Poll for live updates every 3 seconds while game is in progress
  useEffect(() => {
    if (!gameId || !game || game.finished) return;

    const interval = setInterval(async () => {
      try {
        const updatedGame = await ApiService.spectateGame(parseInt(gameId));
        setGame(updatedGame);
      } catch {
        // Silently ignore polling errors
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [gameId, game?.finished]);

  const getCurrentTurnDescription = (): string => {
    if (!game) return '';
    if (game.state.current_game.finished) return 'Game Over';

    const symbol = game.state.current_game.turn;
    const player = symbol === 'X' ? game.x_user : game.o_user;
    if (player) return `${symbol} — ${player.name} (@${player.username})`;
    return `Player ${symbol}`;
  };

  const formatCornerName = (corner: Position | ''): string => {
    const cornerNames: Record<Position, string> = {
      topleft: 'Top Left',
      topmiddle: 'Top Middle',
      topright: 'Top Right',
      middleleft: 'Middle Left',
      center: 'Center',
      middleright: 'Middle Right',
      bottomleft: 'Bottom Left',
      bottommiddle: 'Bottom Middle',
      bottomright: 'Bottom Right',
    };
    return corner === '' ? 'None (go anywhere)' : cornerNames[corner];
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>Loading Game...</h1>
        </header>
        <main className={styles.main}>
          <p>Please wait while we load the game.</p>
        </main>
      </div>
    );
  }

  if (error || !game || !game.state) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>Error Loading Game</h1>
        </header>
        <main className={styles.errorMain}>
          <div className={styles.errorContainer}>
            <div className={styles.errorBox}>
              {error || 'Game not found or invalid state.'}
            </div>
            <button onClick={() => navigate('/')} className={styles.button}>
              Return to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Ultimate TicTacToe</h1>
        <p className={styles.subtitle}>
          <span className={styles.playerName}>{game.x_user?.name || 'Player X'}</span>
          <span className={styles.vs}>vs</span>
          <span className={styles.playerName}>{game.o_user?.name || 'Player O'}</span>
        </p>
        <div className={styles.spectateBadge}>Spectating</div>
      </header>

      <main className={styles.main}>
        <div className={styles.turnIndicator}>
          <h2>
            {game.finished ? 'Game Over' : `Current Turn: ${getCurrentTurnDescription()}`}
          </h2>
        </div>

        <section className={styles.boardSection}>
          <UltimateTicTacToeGameBoard
            gameState={game.state.current_game}
            activeCorner={game.finished ? null : (game.state.current_game.activeCorner || null)}
            isPlayerTurn={false}
            lastMove={game.last_move}
          />
        </section>

        <section className={styles.infoSection}>
          <h2>Game Info</h2>
          <div className={styles.infoBox}>
            {!game.finished ? (
              <>
                <p><strong>Current Turn:</strong> {getCurrentTurnDescription()}</p>
                <p><strong>Active Corner:</strong> {formatCornerName(game.state.current_game.activeCorner)}</p>
              </>
            ) : (
              <>
                {(() => {
                  if (!game.winner_id) {
                    return <p><strong>Winner:</strong> None (Tie)</p>;
                  }
                  const winner = game.winner_id === game.x_user_id ? game.x_user : game.o_user;
                  const winnerSymbol = game.winner_id === game.x_user_id ? 'X' : 'O';
                  if (winner) {
                    return <p><strong>Winner:</strong> {winnerSymbol} — {winner.name} (@{winner.username})</p>;
                  }
                  return <p><strong>Winner:</strong> Player {winnerSymbol}</p>;
                })()}
              </>
            )}
            <p><strong>Status:</strong> {game.finished ? (game.winner_id ? 'Finished' : 'Draw') : 'In Progress'}</p>
          </div>
          <button onClick={() => navigate(-1)} className={styles.button}>
            Go Back
          </button>
          <button onClick={() => navigate(`/history/${gameId}`)} className={styles.button}>
            View Move History
          </button>
        </section>
      </main>
    </div>
  );
};

export default SpectateGamePage;
