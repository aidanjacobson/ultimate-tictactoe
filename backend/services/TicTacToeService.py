from datamodels.tictactoe import UltimateTicTacToe, UltimateTicTacToeGameState, SubTicTacToeGame
import time

class TicTacToeService:
    def init_empty_game(self) -> UltimateTicTacToe:
        def create_empty_subgame() -> SubTicTacToeGame:
            return SubTicTacToeGame(
                finished=False,
                winner='',
                topleft='',
                topmiddle='',
                topright='',
                middleleft='',
                center='',
                middleright='',
                bottomleft='',
                bottommiddle='',
                bottomright='',
            )
        
        game_state = UltimateTicTacToeGameState(
            turn='X',
            finished=False,
            winner='',
            activeCorner='center',
            topleft=create_empty_subgame(),
            topmiddle=create_empty_subgame(),
            topright=create_empty_subgame(),
            middleleft=create_empty_subgame(),
            center=create_empty_subgame(),
            middleright=create_empty_subgame(),
            bottomleft=create_empty_subgame(),
            bottommiddle=create_empty_subgame(),
            bottomright=create_empty_subgame(),
        )

        return UltimateTicTacToe(current_game=game_state, history=[])

    def take_turn(self, game: UltimateTicTacToe, player: str, corner: str, position: str) -> None:
        # if game is finished, cannot play
        if game.current_game.finished:
            raise ValueError("The game is already finished!")

        # player must be the current turn
        if game.current_game.turn != player:
            raise ValueError("It's not your turn!")
        
        # if activeCorner is set, player must play there
        if game.current_game.activeCorner != '' and game.current_game.activeCorner != corner:
            raise ValueError(f"You must play in the {game.current_game.activeCorner} corner!")
        
        # if the subgame is finished, cannot play there
        subgame: SubTicTacToeGame = getattr(game.current_game, corner)
        if subgame.finished:
            raise ValueError(f"The {corner} subgame is already finished!")
        
        # if the position is already taken, cannot play there
        if getattr(subgame, position) != '':
            raise ValueError(f"The position {position} in {corner} is already taken!")
        
        # safe to make a move
        # copy the current game state to history
        history_entry = game.current_game.copy()
        history_entry.next_turn_timestamp = int(time.time())
        game.history.append(history_entry)
        # make the move
        setattr(subgame, position, player)
        
        # Update the subgame to check for wins/draws
        subgame.updateSelf()
        
        # the next active corner is determined by the position played, unless that subgame is finished
        next_active_corner = position
        next_subgame: SubTicTacToeGame = getattr(game.current_game, next_active_corner)
        if next_subgame.finished:
            next_active_corner = ''
        game.current_game.activeCorner = next_active_corner

        # next player's turn
        game.current_game.turn = 'O' if player == 'X' else 'X'

        # update overall game state (checks for ultimate wins/draws)
        game.current_game.updateSelf()