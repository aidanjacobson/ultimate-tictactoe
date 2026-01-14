import { FC, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ApiService from '../../../services/ApiService';
import UltimateTicTacToeGameBoard from '../../GameBoard/UltimateTicTacToeGameBoard';
import type { GameResponse, Player } from '../../../datamodels/tictactoe';
import type { UserResponse } from '../../../datamodels/users';
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
  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await ApiService.validate();
        setCurrentUser(user);
      } catch (err) {
        // User validation will redirect to login if needed
      }
    };

    fetchCurrentUser();
  }, []);

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

  const getTurnIndicator = (): string => {
    if (!game || !currentUser) return '';
    
    const currentPlayerSymbol = game.state.current_game.turn;
    const isCurrentUserXPlayer = game.x_user_id === currentUser.id;
    const currentPlayerIsX = currentPlayerSymbol === 'X';
    
    const isCurrentUserTurn = 
      (isCurrentUserXPlayer && currentPlayerIsX) ||
      (!isCurrentUserXPlayer && !currentPlayerIsX);
    
    return isCurrentUserTurn ? 'Your Turn' : "Opponent's Turn";
  };

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
      </header>

      <main className={styles.main}>
        <div className={styles.turnIndicator}>
          <h2>{getTurnIndicator()}</h2>
        </div>
        <section className={styles.boardSection}>
          <UltimateTicTacToeGameBoard gameState={game.state.current_game} />
        </section>

        <section className={styles.infoSection}>
          <h2>Game Info</h2>
          <div className={styles.infoBox}>
            {(() => {
              const currentPlayer = game.state.current_game.turn === 'X' ? game.x_user : game.o_user;
              const symbol = game.state.current_game.turn;
              if (currentPlayer) {
                return <p><strong>Current Turn:</strong> {symbol} - {currentPlayer.name} (@{currentPlayer.username})</p>;
              }
              return <p><strong>Current Turn:</strong> Player {symbol}</p>;
            })()}
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
