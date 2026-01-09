from __future__ import annotations
from dataclasses import dataclass, asdict
from typing import Dict, List

@dataclass
class SubTicTacToeGame:
    finished: bool
    winner: str  # '', 'X', or 'O'

    topleft: str
    topmiddle: str
    topright: str
    middleleft: str
    center: str
    middleright: str
    bottomleft: str
    bottommiddle: str
    bottomright: str

    def getWinner(self) -> str:
        winning_combinations = [
            ['topleft', 'topmiddle', 'topright'],
            ['middleleft', 'center', 'middleright'],
            ['bottomleft', 'bottommiddle', 'bottomright'],
            ['topleft', 'middleleft', 'bottomleft'],
            ['topmiddle', 'center', 'bottommiddle'],
            ['topright', 'middleright', 'bottomright'],
            ['topleft', 'center', 'bottomright'],
            ['topright', 'center', 'bottomleft'],
        ]

        for combo in winning_combinations:
            values = [getattr(self, pos) for pos in combo]
            if values[0] and all(v == values[0] for v in values):
                return values[0]

        return ''

    def to_dict(self) -> Dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict) -> SubTicTacToeGame:
        return cls(**data)

    def updateSelf(self) -> None:
        # Check for a win
        winner = self.getWinner()
        if winner:
            self.winner = winner
            self.finished = True
            return

        # Check for draw (all cells filled, no winner)
        cells = [
            self.topleft, self.topmiddle, self.topright,
            self.middleleft, self.center, self.middleright,
            self.bottomleft, self.bottommiddle, self.bottomright,
        ]

        if all(cell != '' for cell in cells):
            self.winner = ''
            self.finished = True
            return

        # Otherwise, game is still in progress
        self.winner = ''
        self.finished = False

    def copy(self) -> SubTicTacToeGame:
        return SubTicTacToeGame(
            finished=self.finished,
            winner=self.winner,
            topleft=self.topleft,
            topmiddle=self.topmiddle,
            topright=self.topright,
            middleleft=self.middleleft,
            center=self.center,
            middleright=self.middleright,
            bottomleft=self.bottomleft,
            bottommiddle=self.bottommiddle,
            bottomright=self.bottomright,
        )

@dataclass
class UltimateTicTacToeGameState:
    turn: str          # 'X' or 'O'
    finished: bool
    winner: str        # '', 'X', or 'O'
    activeCorner: str  # '', or one of the 9 board names

    topleft: SubTicTacToeGame
    topmiddle: SubTicTacToeGame
    topright: SubTicTacToeGame
    middleleft: SubTicTacToeGame
    center: SubTicTacToeGame
    middleright: SubTicTacToeGame
    bottomleft: SubTicTacToeGame
    bottommiddle: SubTicTacToeGame
    bottomright: SubTicTacToeGame
    next_turn_timestamp: int = 0 # for history tracking of turn times

    def getWinner(self) -> str:
        winning_combinations = [
            ['topleft', 'topmiddle', 'topright'],
            ['middleleft', 'center', 'middleright'],
            ['bottomleft', 'bottommiddle', 'bottomright'],
            ['topleft', 'middleleft', 'bottomleft'],
            ['topmiddle', 'center', 'bottommiddle'],
            ['topright', 'middleright', 'bottomright'],
            ['topleft', 'center', 'bottomright'],
            ['topright', 'center', 'bottomleft'],
        ]

        for combo in winning_combinations:
            values = [getattr(self, pos).winner for pos in combo]
            if values[0] and all(v == values[0] for v in values):
                return values[0]

        return ''

    def to_dict(self) -> Dict:
        data = asdict(self)
        return data

    @classmethod
    def from_dict(cls, data: Dict) -> UltimateTicTacToeGameState:
        subgames = {}
        for key in [
            'topleft', 'topmiddle', 'topright',
            'middleleft', 'center', 'middleright',
            'bottomleft', 'bottommiddle', 'bottomright'
        ]:
            subgames[key] = SubTicTacToeGame.from_dict(data[key])

        return cls(
            turn=data['turn'],
            finished=data['finished'],
            winner=data['winner'],
            activeCorner=data['activeCorner'],
            **subgames
        )

    def updateSelf(self) -> None:
        # 1. Update all subgames
        subgames = [
            self.topleft, self.topmiddle, self.topright,
            self.middleleft, self.center, self.middleright,
            self.bottomleft, self.bottommiddle, self.bottomright,
        ]

        for subgame in subgames:
            subgame.updateSelf()

        # 2. Check for ultimate win
        winner = self.getWinner()
        if winner:
            self.winner = winner
            self.finished = True
            return

        # 3. Check for ultimate draw (all subgames finished, no winner)
        if all(subgame.finished for subgame in subgames):
            self.winner = ''
            self.finished = True
            return

        # 4. Otherwise, game is still in progress
        self.winner = ''
        self.finished = False

    def print_ascii(self) -> None:
        # Helper to fetch a cell by subgame + position
        def cell(sg, pos):
            return getattr(sg, pos) or '.'

        rows = [
            # Row 0
            [
                cell(self.topleft, 'topleft'),
                cell(self.topleft, 'topmiddle'),
                cell(self.topleft, 'topright'),
                '||',
                cell(self.topmiddle, 'topleft'),
                cell(self.topmiddle, 'topmiddle'),
                cell(self.topmiddle, 'topright'),
                '||',
                cell(self.topright, 'topleft'),
                cell(self.topright, 'topmiddle'),
                cell(self.topright, 'topright'),
            ],
            [
                cell(self.topleft, 'middleleft'),
                cell(self.topleft, 'center'),
                cell(self.topleft, 'middleright'),
                '||',
                cell(self.topmiddle, 'middleleft'),
                cell(self.topmiddle, 'center'),
                cell(self.topmiddle, 'middleright'),
                '||',
                cell(self.topright, 'middleleft'),
                cell(self.topright, 'center'),
                cell(self.topright, 'middleright'),
            ],
            [
                cell(self.topleft, 'bottomleft'),
                cell(self.topleft, 'bottommiddle'),
                cell(self.topleft, 'bottomright'),
                '||',
                cell(self.topmiddle, 'bottomleft'),
                cell(self.topmiddle, 'bottommiddle'),
                cell(self.topmiddle, 'bottomright'),
                '||',
                cell(self.topright, 'bottomleft'),
                cell(self.topright, 'bottommiddle'),
                cell(self.topright, 'bottomright'),
            ],

            'HSEP',

            # Row 1
            [
                cell(self.middleleft, 'topleft'),
                cell(self.middleleft, 'topmiddle'),
                cell(self.middleleft, 'topright'),
                '||',
                cell(self.center, 'topleft'),
                cell(self.center, 'topmiddle'),
                cell(self.center, 'topright'),
                '||',
                cell(self.middleright, 'topleft'),
                cell(self.middleright, 'topmiddle'),
                cell(self.middleright, 'topright'),
            ],
            [
                cell(self.middleleft, 'middleleft'),
                cell(self.middleleft, 'center'),
                cell(self.middleleft, 'middleright'),
                '||',
                cell(self.center, 'middleleft'),
                cell(self.center, 'center'),
                cell(self.center, 'middleright'),
                '||',
                cell(self.middleright, 'middleleft'),
                cell(self.middleright, 'center'),
                cell(self.middleright, 'middleright'),
            ],
            [
                cell(self.middleleft, 'bottomleft'),
                cell(self.middleleft, 'bottommiddle'),
                cell(self.middleleft, 'bottomright'),
                '||',
                cell(self.center, 'bottomleft'),
                cell(self.center, 'bottommiddle'),
                cell(self.center, 'bottomright'),
                '||',
                cell(self.middleright, 'bottomleft'),
                cell(self.middleright, 'bottommiddle'),
                cell(self.middleright, 'bottomright'),
            ],

            'HSEP',

            # Row 2
            [
                cell(self.bottomleft, 'topleft'),
                cell(self.bottomleft, 'topmiddle'),
                cell(self.bottomleft, 'topright'),
                '||',
                cell(self.bottommiddle, 'topleft'),
                cell(self.bottommiddle, 'topmiddle'),
                cell(self.bottommiddle, 'topright'),
                '||',
                cell(self.bottomright, 'topleft'),
                cell(self.bottomright, 'topmiddle'),
                cell(self.bottomright, 'topright'),
            ],
            [
                cell(self.bottomleft, 'middleleft'),
                cell(self.bottomleft, 'center'),
                cell(self.bottomleft, 'middleright'),
                '||',
                cell(self.bottommiddle, 'middleleft'),
                cell(self.bottommiddle, 'center'),
                cell(self.bottommiddle, 'middleright'),
                '||',
                cell(self.bottomright, 'middleleft'),
                cell(self.bottomright, 'center'),
                cell(self.bottomright, 'middleright'),
            ],
            [
                cell(self.bottomleft, 'bottomleft'),
                cell(self.bottomleft, 'bottommiddle'),
                cell(self.bottomleft, 'bottomright'),
                '||',
                cell(self.bottommiddle, 'bottomleft'),
                cell(self.bottommiddle, 'bottommiddle'),
                cell(self.bottommiddle, 'bottomright'),
                '||',
                cell(self.bottomright, 'bottomleft'),
                cell(self.bottomright, 'bottommiddle'),
                cell(self.bottomright, 'bottomright'),
            ],
        ]

        for r in rows:
            if r == 'HSEP':
                print('===========++===========++===========')
            else:
                print(
                    f" {r[0]} | {r[1]} | {r[2]} || "
                    f"{r[4]} | {r[5]} | {r[6]} || "
                    f"{r[8]} | {r[9]} | {r[10]}"
                )

        print("\n--- Game Status ---")
        if self.finished:
            if self.winner:
                print(f"Winner: {self.winner}")
            else:
                print("Result: DRAW")
        else:
            print("In progress")
            print(f"Turn: {self.turn}")
            print(f"Active Corner: {self.activeCorner}")

    def copy(self) -> UltimateTicTacToeGameState:
        return UltimateTicTacToeGameState(
            turn=self.turn,
            finished=self.finished,
            winner=self.winner,
            activeCorner=self.activeCorner,
            topleft=self.topleft.copy(),
            topmiddle=self.topmiddle.copy(),
            topright=self.topright.copy(),
            middleleft=self.middleleft.copy(),
            center=self.center.copy(),
            middleright=self.middleright.copy(),
            bottomleft=self.bottomleft.copy(),
            bottommiddle=self.bottommiddle.copy(),
            bottomright=self.bottomright.copy(),
        )


@dataclass
class UltimateTicTacToe:
    current_game: UltimateTicTacToeGameState
    history: List[UltimateTicTacToeGameState]

    def to_dict(self) -> Dict:
        return {
            "current_game": self.current_game.to_dict(),
            "history": [state.to_dict() for state in self.history],
        }

    @classmethod
    def from_dict(cls, data: Dict) -> UltimateTicTacToe:
        return cls(
            current_game=UltimateTicTacToeGameState.from_dict(data["current_game"]),
            history=[
                UltimateTicTacToeGameState.from_dict(s)
                for s in data["history"]
            ],
        )

    def print_ascii(self) -> None:
        self.current_game.print_ascii()