import type { UltimateTicTacToeGameState, Position } from '../../datamodels/tictactoe'
import './UltimateTicTacToeGameBoard.scss'

interface UltimateTicTacToeGameBoardProps {
  gameState: UltimateTicTacToeGameState
}

const POSITIONS: Position[] = [
  'topleft',
  'topmiddle',
  'topright',
  'middleleft',
  'center',
  'middleright',
  'bottomleft',
  'bottommiddle',
  'bottomright',
]

export default function UltimateTicTacToeGameBoard({ gameState }: UltimateTicTacToeGameBoardProps) {
  const getCell = (subgameKey: Position, cellKey: Position) => {
    const subgame = gameState[subgameKey]
    return subgame[cellKey] || ''
  }

  const renderSubgame = (subgameKey: Position) => {
    const subgame = gameState[subgameKey]
    const isFinished = subgame.finished
    const winner = subgame.winner
    const displayText = winner === '' ? 'TIE' : winner || ''

    return (
      <div key={subgameKey} className={`subgame ${isFinished ? 'finished' : ''}`}>
        {POSITIONS.map((cellKey) => (
          <div key={cellKey} className="cell">
            {getCell(subgameKey, cellKey)}
          </div>
        ))}
        {isFinished && <div className="overlay">{displayText}</div>}
      </div>
    )
  }

  return (
    <div className="ultimate-board">
      {POSITIONS.map((subgameKey) => renderSubgame(subgameKey))}
    </div>
  )
}
