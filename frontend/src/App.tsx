import UltimateTicTacToeGameBoard from './Components/GameBoard/UltimateTicTacToeGameBoard'
import type { UltimateTicTacToeGameState } from './datamodels/tictactoe'

function App() {
  const dummyGameState: UltimateTicTacToeGameState = {
    turn: 'X',
    finished: true,
    winner: 'X',
    activeCorner: 'center',

    // ───── Top Row ─────
    topleft: {
      finished: false,
      winner: '',
      topleft: '',
      topmiddle: 'O',
      topright: 'O',
      middleleft: 'O',
      center: 'O',
      middleright: 'O',
      bottomleft: '',
      bottommiddle: '',
      bottomright: '',
    },

    topmiddle: {
      finished: true,
      winner: 'O',
      topleft: 'X',
      topmiddle: '',
      topright: '',
      middleleft: 'O',
      center: 'O',
      middleright: 'O',
      bottomleft: '',
      bottommiddle: '',
      bottomright: '',
    },

    topright: {
      finished: false,
      winner: '',
      topleft: 'X',
      topmiddle: '',
      topright: '',
      middleleft: 'O',
      center: '',
      middleright: 'O',
      bottomleft: '',
      bottommiddle: '',
      bottomright: '',
    },

    // ───── Middle Row (all X wins) ─────
    middleleft: {
      finished: true,
      winner: 'X',
      topleft: 'X',
      topmiddle: 'X',
      topright: 'X',
      middleleft: '',
      center: '',
      middleright: '',
      bottomleft: '',
      bottommiddle: '',
      bottomright: '',
    },

    center: {
      finished: true,
      winner: 'X',
      topleft: 'X',
      topmiddle: 'X',
      topright: 'X',
      middleleft: '',
      center: '',
      middleright: '',
      bottomleft: '',
      bottommiddle: '',
      bottomright: '',
    },

    middleright: {
      finished: true,
      winner: 'X',
      topleft: 'X',
      topmiddle: 'X',
      topright: 'X',
      middleleft: '',
      center: '',
      middleright: '',
      bottomleft: '',
      bottommiddle: '',
      bottomright: '',
    },

    // ───── Bottom Row ─────
    bottomleft: {
      finished: false,
      winner: '',
      topleft: '',
      topmiddle: '',
      topright: '',
      middleleft: '',
      center: '',
      middleright: '',
      bottomleft: '',
      bottommiddle: '',
      bottomright: '',
    },

    bottommiddle: {
      finished: false,
      winner: '',
      topleft: '',
      topmiddle: '',
      topright: '',
      middleleft: '',
      center: '',
      middleright: '',
      bottomleft: '',
      bottommiddle: '',
      bottomright: '',
    },

    bottomright: {
      finished: true,
      winner: '',
      topleft: 'X',
      topmiddle: 'O',
      topright: 'X',
      middleleft: 'O',
      center: 'X',
      middleright: 'O',
      bottomleft: 'O',
      bottommiddle: 'X',
      bottomright: 'O',
    },
  }

  return (
    <div>
      <UltimateTicTacToeGameBoard gameState={dummyGameState} />
    </div>
  )
}

export default App
