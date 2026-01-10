export type Player = 'X' | 'O';
export type Position = "topleft" | "topmiddle" | "topright" | "middleleft" | "center" | "middleright" | "bottomleft" | "bottommiddle" | "bottomright";

export interface GameCreate {
    x_user_id: number;
    o_user_id: number;
}

export interface GameTurn {
    player: Player;
    corner: Position;
    position: Position;
}

export interface GameResponse {
    id: number;
    x_user_id: number;
    o_user_id: number;
    finished: boolean;
    winner_id: number | null;
    state: UltimateTicTacToeGame;
}

export interface UltimateTicTacToeGame {
    current_game: UltimateTicTacToeGameState;
    history: UltimateTicTacToeGameState[];
}

export interface UltimateTicTacToeGameState {
    turn: Player;
    finished: boolean;
    winner: Player | "";
    activeCorner: Position | "";

    topleft: TicTacToeSubGame;
    topmiddle: TicTacToeSubGame;
    topright: TicTacToeSubGame;
    middleleft: TicTacToeSubGame;
    center: TicTacToeSubGame;
    middleright: TicTacToeSubGame;
    bottomleft: TicTacToeSubGame;
    bottommiddle: TicTacToeSubGame;
    bottomright: TicTacToeSubGame;
}

export interface TicTacToeSubGame {
    finished: boolean;
    winner: Player | "";
    topleft: Player | "",
    topmiddle: Player | "",
    topright: Player | "",
    middleleft: Player | "",
    center: Player | "",
    middleright: Player | "",
    bottomleft: Player | "",
    bottommiddle: Player | "",
    bottomright: Player | ""
}