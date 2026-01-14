import type { UltimateTicTacToeGameState, Position } from '../../datamodels/tictactoe'
import './UltimateTicTacToeGameBoard.scss'

interface UltimateTicTacToeGameBoardProps {
  gameState: UltimateTicTacToeGameState
  activeCorner?: string | null
  onCellClick?: (corner: string, position: string) => void
  isPlayerTurn?: boolean
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

export default function UltimateTicTacToeGameBoard({ gameState, activeCorner, onCellClick, isPlayerTurn }: UltimateTicTacToeGameBoardProps) {
  const getCell = (subgameKey: Position, cellKey: Position) => {
    const subgame = gameState[subgameKey]
    return subgame[cellKey] || ''
  }

  const handleCellClick = (corner: string, position: string) => {
    if (onCellClick && isPlayerTurn) {
      onCellClick(corner, position)
    }
  }

  const renderSubgame = (subgameKey: Position) => {
    const subgame = gameState[subgameKey]
    const isFinished = subgame.finished
    const winner = subgame.winner
    const displayText = winner === '' ? 'TIE' : winner || ''
    const isActive = activeCorner === subgameKey
    const canPlayInThisCorner = isPlayerTurn && (activeCorner === subgameKey || activeCorner === '')

    return (
      <div key={subgameKey} className={`subgame ${isFinished ? 'finished' : ''} ${isActive ? 'active' : ''}`}>
        {POSITIONS.map((cellKey) => (
          <div 
            key={cellKey} 
            className={`cell ${canPlayInThisCorner && getCell(subgameKey, cellKey) === '' ? 'clickable' : ''}`}
            onClick={() => handleCellClick(subgameKey, cellKey)}
          >
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
