import { FC, useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ApiService from '../../../services/ApiService';
import UltimateTicTacToeGameBoard from '../../GameBoard/UltimateTicTacToeGameBoard';
import ForkModal from './ForkModal';
import type { GameResponse, UltimateTicTacToeGameState, Position } from '../../../datamodels/tictactoe';
import styles from './MoveHistoryPage.module.scss';

const POSITIONS: Position[] = [
  'topleft', 'topmiddle', 'topright',
  'middleleft', 'center', 'middleright',
  'bottomleft', 'bottommiddle', 'bottomright',
];

const POSITION_LABELS: Record<Position, string> = {
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

function computeLastMove(
  prev: UltimateTicTacToeGameState,
  curr: UltimateTicTacToeGameState
): { corner: Position; position: Position } | null {
  for (const corner of POSITIONS) {
    for (const pos of POSITIONS) {
      if (prev[corner][pos] !== curr[corner][pos]) {
        return { corner, position: pos };
      }
    }
  }
  return null;
}

const MoveHistoryPage: FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();

  const [game, setGame] = useState<GameResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [showForkModal, setShowForkModal] = useState(false);
  const [forkLoading, setForkLoading] = useState(false);
  const [forkError, setForkError] = useState<string | null>(null);

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
        const totalStates = (gameData.state.history?.length ?? 0) + 1;
        setStepIndex(totalStates - 1);
      } catch {
        setError('Failed to load game. The game may not exist.');
      } finally {
        setLoading(false);
      }
    };
    fetchGame();
  }, [gameId]);

  const allStates: UltimateTicTacToeGameState[] = game
    ? [...(game.state.history ?? []), game.state.current_game]
    : [];

  const currentState = allStates[stepIndex] ?? null;
  const lastMove = stepIndex > 0
    ? computeLastMove(allStates[stepIndex - 1], allStates[stepIndex])
    : null;
  const movePlayer = stepIndex > 0 ? allStates[stepIndex - 1].turn : null;

  const goToPrev = useCallback(() => setStepIndex(i => Math.max(0, i - 1)), []);
  const goToNext = useCallback(
    () => setStepIndex(i => Math.min(allStates.length - 1, i + 1)),
    [allStates.length]
  );
  const goToStart = useCallback(() => setStepIndex(0), []);
  const goToEnd = useCallback(() => setStepIndex(allStates.length - 1), [allStates.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrev();
      else if (e.key === 'ArrowRight') goToNext();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [goToPrev, goToNext]);

  const handleFork = useCallback(async (xUserId: number, oUserId: number) => {
    if (!gameId) return;
    setForkLoading(true);
    setForkError(null);
    try {
      const newGame = await ApiService.forkGame(parseInt(gameId), stepIndex, xUserId, oUserId);
      navigate(`/game/${newGame.id}`);
    } catch (err) {
      setForkError(err instanceof Error ? err.message : 'Failed to fork game');
      setForkLoading(false);
    }
  }, [gameId, stepIndex, navigate]);

  const currentStateIsFinished = currentState?.finished ?? false;

  if (loading) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>Loading Game...</h1>
        </header>
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
            <div className={styles.errorBox}>{error || 'Game not found.'}</div>
            <button onClick={() => navigate('/')} className={styles.button}>
              Return to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  const totalMoves = allStates.length - 1;
  const isAtStart = stepIndex === 0;
  const isAtEnd = stepIndex >= allStates.length - 1;

  const playerName = (symbol: 'X' | 'O') =>
    symbol === 'X' ? (game.x_user?.name ?? 'Player X') : (game.o_user?.name ?? 'Player O');

  const winnerSymbol = game.winner_id === game.x_user_id ? 'X' : 'O';

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Move History</h1>
        <p className={styles.subtitle}>
          <span className={styles.playerName}>{game.x_user?.name ?? 'Player X'}</span>
          <span className={styles.vs}>vs</span>
          <span className={styles.playerName}>{game.o_user?.name ?? 'Player O'}</span>
        </p>
        <div className={styles.historyBadge}>History Viewer</div>
      </header>

      <main className={styles.main}>
        <div className={styles.stepIndicator}>
          {isAtStart
            ? 'Start of Game'
            : isAtEnd
              ? `End of Game — Move ${totalMoves}`
              : `Move ${stepIndex} of ${totalMoves}`}
        </div>

        <section className={styles.boardSection}>
          {currentState && (
            <UltimateTicTacToeGameBoard
              gameState={currentState}
              activeCorner={null}
              isPlayerTurn={false}
              lastMove={lastMove ?? undefined}
              showLastMove={stepIndex > 0}
            />
          )}
        </section>

        <section className={styles.controlsSection}>
          <div className={styles.navControls}>
            <button
              className={styles.navButton}
              onClick={goToStart}
              disabled={isAtStart}
              title="Go to start"
            >
              ««
            </button>
            <button
              className={styles.navButton}
              onClick={goToPrev}
              disabled={isAtStart}
              title="Previous move (←)"
            >
              ‹ Prev
            </button>
            <span className={styles.stepCounter}>{stepIndex} / {totalMoves}</span>
            <button
              className={styles.navButton}
              onClick={goToNext}
              disabled={isAtEnd}
              title="Next move (→)"
            >
              Next ›
            </button>
            <button
              className={styles.navButton}
              onClick={goToEnd}
              disabled={isAtEnd}
              title="Go to end"
            >
              »»
            </button>
          </div>

          <input
            type="range"
            min={0}
            max={allStates.length - 1}
            value={stepIndex}
            onChange={e => setStepIndex(parseInt(e.target.value))}
            className={styles.scrubber}
          />

          <div className={styles.infoBox}>
            {isAtStart ? (
              <p>Start of game. Use the controls or ← → arrow keys to step through moves.</p>
            ) : isAtEnd ? (
              <>
                <p><strong>Final State</strong></p>
                <p>
                  <strong>Outcome:</strong>{' '}
                  {game.finished
                    ? game.winner_id
                      ? `${winnerSymbol} wins — ${playerName(winnerSymbol)}`
                      : 'Draw'
                    : 'In Progress'}
                </p>
              </>
            ) : (
              <>
                <p>
                  <strong>Move {stepIndex}:</strong>{' '}
                  {movePlayer && playerName(movePlayer)} ({movePlayer}) played{' '}
                  {lastMove
                    ? `${POSITION_LABELS[lastMove.corner]} › ${POSITION_LABELS[lastMove.position]}`
                    : 'unknown'}
                </p>
                <p><strong>Next turn:</strong> {currentState?.turn} — {currentState && playerName(currentState.turn)}</p>
              </>
            )}
          </div>

          {forkError && (
            <div className={styles.forkError}>{forkError}</div>
          )}

          <button
            className={styles.forkButton}
            onClick={() => { setForkError(null); setShowForkModal(true); }}
            disabled={currentStateIsFinished}
            title={currentStateIsFinished ? 'Cannot fork from a finished game state' : 'Start a new game from this position'}
          >
            Fork from here
          </button>

          <button onClick={() => navigate(-1)} className={styles.button}>
            Go Back
          </button>
        </section>
      </main>

      {showForkModal && game && (
        <ForkModal
          game={game}
          stepIndex={stepIndex}
          totalMoves={totalMoves}
          onConfirm={handleFork}
          onClose={() => setShowForkModal(false)}
          loading={forkLoading}
        />
      )}
    </div>
  );
};

export default MoveHistoryPage;
