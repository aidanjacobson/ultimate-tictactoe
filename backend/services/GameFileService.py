import json
import os
from typing import Optional
from datamodels.tictactoe import UltimateTicTacToe
from services.TicTacToeService import TicTacToeService
from database.schema import SessionLocal, Game, User

DATA_DIR = os.environ.get("DATA_DIR", "./devdata")
GAMES_DIR = os.path.join(DATA_DIR, "games")
os.makedirs(GAMES_DIR, exist_ok=True)


class GameFileService:
    def __init__(self):
        self.tictactoe_service = TicTacToeService()
        self.db = SessionLocal()

    def start_new_game(self, game_id: int) -> UltimateTicTacToe:
        """
        Initialize a new game and associate it with database Game record.
        
        Args:
            game_id: The unique ID for the game (from database Game record)
        
        Returns:
            The initialized UltimateTicTacToe game object
        """
        # Verify the game exists in the database
        game_record = self.db.query(Game).filter(Game.id == game_id).first()
        if not game_record:
            raise ValueError(f"Game with ID {game_id} not found in database")
        
        game = self.tictactoe_service.init_empty_game()
        self.save_game(game_id, game)
        return game

    def take_turn(self, game_id: int, game: UltimateTicTacToe, player: str, corner: str, position: str) -> None:
        """
        Execute a turn in the game.
        
        Args:
            game_id: The unique ID for the game
            game: The UltimateTicTacToe game object
            player: The player making the move ('X' or 'O')
            corner: The corner to play in (e.g., 'topleft', 'center', etc.)
            position: The position within the corner (e.g., 'topleft', 'center', etc.)
        """
        self.tictactoe_service.take_turn(game, player, corner, position)
        self.save_game(game_id, game)
        
        # Update database game record if game is finished
        if game.current_game.finished:
            game_record = self.db.query(Game).filter(Game.id == game_id).first()
            if game_record:
                game_record.finished = True  # type: ignore
                # Set winner based on game state
                if game.current_game.winner == 'X':
                    game_record.winner_id = game_record.x_user_id
                elif game.current_game.winner == 'O':
                    game_record.winner_id = game_record.o_user_id
                self.db.commit()

    def save_game(self, game_id: int, game: UltimateTicTacToe) -> None:
        """
        Save the game state to a JSON file.
        
        Args:
            game_id: The unique ID for the game
            game: The UltimateTicTacToe game object to save
        """
        file_path = os.path.join(GAMES_DIR, f"{game_id}.json")
        game_data = self._serialize_game(game)
        with open(file_path, 'w') as f:
            json.dump(game_data, f, indent=2)

    def load_game(self, game_id: int) -> Optional[UltimateTicTacToe]:
        """
        Load a game state from a JSON file.
        
        Args:
            game_id: The unique ID for the game
        
        Returns:
            The UltimateTicTacToe game object, or None if the game doesn't exist
        """
        file_path = os.path.join(GAMES_DIR, f"{game_id}.json")
        if not os.path.exists(file_path):
            return None
        
        with open(file_path, 'r') as f:
            game_data = json.load(f)
        
        return self._deserialize_game(game_data)

    def _serialize_game(self, game: UltimateTicTacToe) -> dict:
        """Convert a game object to a JSON-serializable dictionary."""
        def serialize_subgame(subgame):
            return {
                'finished': subgame.finished,
                'winner': subgame.winner,
                'topleft': subgame.topleft,
                'topmiddle': subgame.topmiddle,
                'topright': subgame.topright,
                'middleleft': subgame.middleleft,
                'center': subgame.center,
                'middleright': subgame.middleright,
                'bottomleft': subgame.bottomleft,
                'bottommiddle': subgame.bottommiddle,
                'bottomright': subgame.bottomright,
            }
        
        current_game = game.current_game
        return {
            'current_game': {
                'turn': current_game.turn,
                'finished': current_game.finished,
                'winner': current_game.winner,
                'activeCorner': current_game.activeCorner,
                'topleft': serialize_subgame(current_game.topleft),
                'topmiddle': serialize_subgame(current_game.topmiddle),
                'topright': serialize_subgame(current_game.topright),
                'middleleft': serialize_subgame(current_game.middleleft),
                'center': serialize_subgame(current_game.center),
                'middleright': serialize_subgame(current_game.middleright),
                'bottomleft': serialize_subgame(current_game.bottomleft),
                'bottommiddle': serialize_subgame(current_game.bottommiddle),
                'bottomright': serialize_subgame(current_game.bottomright),
            },
            'history': [self._serialize_game_state(state) for state in game.history]
        }

    def _serialize_game_state(self, game_state) -> dict:
        """Convert a game state object to a JSON-serializable dictionary."""
        def serialize_subgame(subgame):
            return {
                'finished': subgame.finished,
                'winner': subgame.winner,
                'topleft': subgame.topleft,
                'topmiddle': subgame.topmiddle,
                'topright': subgame.topright,
                'middleleft': subgame.middleleft,
                'center': subgame.center,
                'middleright': subgame.middleright,
                'bottomleft': subgame.bottomleft,
                'bottommiddle': subgame.bottommiddle,
                'bottomright': subgame.bottomright,
            }
        
        return {
            'turn': game_state.turn,
            'finished': game_state.finished,
            'winner': game_state.winner,
            'activeCorner': game_state.activeCorner,
            'topleft': serialize_subgame(game_state.topleft),
            'topmiddle': serialize_subgame(game_state.topmiddle),
            'topright': serialize_subgame(game_state.topright),
            'middleleft': serialize_subgame(game_state.middleleft),
            'center': serialize_subgame(game_state.center),
            'middleright': serialize_subgame(game_state.middleright),
            'bottomleft': serialize_subgame(game_state.bottomleft),
            'bottommiddle': serialize_subgame(game_state.bottommiddle),
            'bottomright': serialize_subgame(game_state.bottomright),
        }

    def _deserialize_game(self, data: dict) -> UltimateTicTacToe:
        """Convert a JSON-serializable dictionary back to a game object."""
        from datamodels.tictactoe import SubTicTacToeGame, UltimateTicTacToeGameState
        
        def deserialize_subgame(subgame_data):
            return SubTicTacToeGame(**subgame_data)
        
        current_game_data = data['current_game']
        current_game = UltimateTicTacToeGameState(
            turn=current_game_data['turn'],
            finished=current_game_data['finished'],
            winner=current_game_data['winner'],
            activeCorner=current_game_data['activeCorner'],
            topleft=deserialize_subgame(current_game_data['topleft']),
            topmiddle=deserialize_subgame(current_game_data['topmiddle']),
            topright=deserialize_subgame(current_game_data['topright']),
            middleleft=deserialize_subgame(current_game_data['middleleft']),
            center=deserialize_subgame(current_game_data['center']),
            middleright=deserialize_subgame(current_game_data['middleright']),
            bottomleft=deserialize_subgame(current_game_data['bottomleft']),
            bottommiddle=deserialize_subgame(current_game_data['bottommiddle']),
            bottomright=deserialize_subgame(current_game_data['bottomright']),
        )
        
        history = [self._deserialize_game_state(state_data) for state_data in data['history']]
        
        game = UltimateTicTacToe(current_game=current_game, history=history)
        
        return game

    def _deserialize_game_state(self, data: dict):
        """Convert a JSON-serializable dictionary back to a game state object."""
        from datamodels.tictactoe import SubTicTacToeGame, UltimateTicTacToeGameState
        
        def deserialize_subgame(subgame_data):
            return SubTicTacToeGame(**subgame_data)
        
        return UltimateTicTacToeGameState(
            turn=data['turn'],
            finished=data['finished'],
            winner=data['winner'],
            activeCorner=data['activeCorner'],
            topleft=deserialize_subgame(data['topleft']),
            topmiddle=deserialize_subgame(data['topmiddle']),
            topright=deserialize_subgame(data['topright']),
            middleleft=deserialize_subgame(data['middleleft']),
            center=deserialize_subgame(data['center']),
            middleright=deserialize_subgame(data['middleright']),
            bottomleft=deserialize_subgame(data['bottomleft']),
            bottommiddle=deserialize_subgame(data['bottommiddle']),
            bottomright=deserialize_subgame(data['bottomright']),
        )
