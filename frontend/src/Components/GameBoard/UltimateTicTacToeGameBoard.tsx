import { useMemo } from 'react'
import type { UltimateTicTacToeGameState, Position } from '../../datamodels/tictactoe'
import './UltimateTicTacToeGameBoard.scss'

interface UltimateTicTacToeGameBoardProps {
  gameState: UltimateTicTacToeGameState
  activeCorner?: string | null
  onCellClick?: (corner: string, position: string) => void
  isPlayerTurn?: boolean
  lastMove?: { corner: Position; position: Position } | null
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

const WINNING_COMBINATIONS: Position[][] = [
  ['topleft', 'topmiddle', 'topright'],
  ['middleleft', 'center', 'middleright'],
  ['bottomleft', 'bottommiddle', 'bottomright'],
  ['topleft', 'middleleft', 'bottomleft'],
  ['topmiddle', 'center', 'bottommiddle'],
  ['topright', 'middleright', 'bottomright'],
  ['topleft', 'center', 'bottomright'],
  ['topright', 'center', 'bottomleft'],
]

export default function UltimateTicTacToeGameBoard({ gameState, activeCorner, onCellClick, isPlayerTurn, lastMove }: UltimateTicTacToeGameBoardProps) {
  const getCell = (subgameKey: Position, cellKey: Position) => {
    const subgame = gameState[subgameKey]
    return subgame[cellKey] || ''
  }

  const isLastMove = (cornerKey: Position, positionKey: Position): boolean => {
    if (!lastMove || !isPlayerTurn || gameState.finished) return false
    return lastMove.corner === cornerKey && lastMove.position === positionKey
  }

  const handleCellClick = (corner: string, position: string) => {
    if (onCellClick && isPlayerTurn) {
      onCellClick(corner, position)
    }
  }

  const winningPositionsBySubgame = useMemo<Record<Position, Set<Position>>>(() => {
    const subgames = {} as Record<Position, Set<Position>>

    POSITIONS.forEach((subgameKey) => {
      const subgame = gameState[subgameKey]
      const winningPositions = new Set<Position>()

      if (subgame.finished && subgame.winner) {
        WINNING_COMBINATIONS.forEach((combo) => {
          const values = combo.map((position) => subgame[position])
          if (values[0] && values.every((value) => value === values[0])) {
            combo.forEach((position) => winningPositions.add(position))
          }
        })
      }

      subgames[subgameKey] = winningPositions
    })

    return subgames
  }, [gameState])

  const renderSubgame = (subgameKey: Position) => {
    const subgame = gameState[subgameKey]
    const isFinished = subgame.finished
    const winner = subgame.winner
    const displayText = winner === '' ? 'TIE' : winner || ''
    const isActive = activeCorner === subgameKey
    const canPlayInThisCorner = isPlayerTurn && (activeCorner === subgameKey || activeCorner === '')
    const isActivePlayerTurn = isActive && isPlayerTurn
    const winningPositions = winningPositionsBySubgame[subgameKey]

    return (
      <div key={subgameKey} className={`subgame ${isFinished ? 'finished' : ''} ${isActive ? 'active' : ''} ${isActivePlayerTurn ? 'active-player-turn' : ''}`}>
        {POSITIONS.map((cellKey) => {
          const isLast = isLastMove(subgameKey, cellKey)
          return (
            <div 
              key={cellKey} 
              className={`cell ${canPlayInThisCorner && getCell(subgameKey, cellKey) === '' ? 'clickable' : ''} ${isLast ? 'last-move' : ''} ${winningPositions.has(cellKey) ? 'winning-cell' : ''}`}
              onClick={() => handleCellClick(subgameKey, cellKey)}
            >
              {getCell(subgameKey, cellKey)}
            </div>
          )
        })}
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
