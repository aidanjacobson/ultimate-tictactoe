from typing import Optional, Dict, Any
from datamodels.tictactoe import UltimateTicTacToe
from services.GameFileService import GameFileService
from services.UserService import UserService
from services.NotificationService import NotificationService
from database.schema import SessionLocal, Game
from sqlalchemy.orm import joinedload


class GameService:
    """
    High-level game orchestration service.
    Handles game creation, retrieval, turn execution, and database coordination.
    """
    
    def __init__(self, game_file_service: GameFileService, user_service: UserService, notification_service: NotificationService):
        self.game_file_service = game_file_service
        self.user_service = user_service
        self.notification_service = notification_service
        self.db = SessionLocal()
    
    def create_game(self, x_user_id: int, o_user_id: int) -> Game:
        """
        Create a new game between two users.
        
        Args:
            x_user_id: ID of the user playing X
            o_user_id: ID of the user playing O
        
        Returns:
            Game object
        
        Raises:
            ValueError: If users don't exist or are the same
        """
        # Validate users are different
        if x_user_id == o_user_id:
            raise ValueError("Cannot play a game against yourself")
        
        # Verify users exist
        user_x = self.user_service.get_user_by_id(x_user_id)
        user_o = self.user_service.get_user_by_id(o_user_id)
        
        if not user_x or not user_o:
            raise ValueError("One or both users not found")
        
        # Create game record in database
        game_record = Game(
            x_user_id=x_user_id,
            o_user_id=o_user_id,
            finished=False
        )
        self.db.add(game_record)
        self.db.commit()
        self.db.refresh(game_record)
        
        # Initialize game via GameFileService
        self.game_file_service.start_new_game(game_record.id)
        
        return game_record
    
    def get_game(self, game_id: int) -> Dict[str, Any]:
        """
        Get a game by ID with full state.
        
        Args:
            game_id: The game ID
        
        Returns:
            Dictionary with game data including state
        
        Raises:
            ValueError: If game not found
        """
        game_record = self.db.query(Game).filter(Game.id == game_id).first()
        if not game_record:
            raise ValueError(f"Game with ID {game_id} not found")
        
        # Load the game state from file
        game = self.game_file_service.load_game(game_id)
        if not game:
            raise ValueError("Could not load game state")
        
        # Serialize game state
        game_data = self.game_file_service._serialize_game(game)
        
        # Get player information
        x_user = self.user_service.get_user_by_id(game_record.x_user_id)
        o_user = self.user_service.get_user_by_id(game_record.o_user_id)
        
        return {
            "id": game_record.id,
            "x_user_id": game_record.x_user_id,
            "o_user_id": game_record.o_user_id,
            "finished": game_record.finished,
            "winner_id": game_record.winner_id,
            "state": game_data,
            "x_user": {"id": x_user.id, "name": x_user.name, "username": x_user.username} if x_user else None,
            "o_user": {"id": o_user.id, "name": o_user.name, "username": o_user.username} if o_user else None
        }
    
    def get_game_ascii(self, game_id: int) -> str:
        """
        Get ASCII representation of a game.
        
        Args:
            game_id: The game ID
        
        Returns:
            ASCII string representation of the game
        
        Raises:
            ValueError: If game not found
        """
        game_record = self.db.query(Game).filter(Game.id == game_id).first()
        if not game_record:
            raise ValueError(f"Game with ID {game_id} not found")
        
        # Load the game state from file
        game = self.game_file_service.load_game(game_id)
        if not game:
            raise ValueError("Could not load game state")
        
        return str(game)
    
    def list_games(self) -> list:
        """
        List all games.
        
        Returns:
            List of game records from database
        """
        return self.db.query(Game).all()

    def delete_game(self, game_id: int) -> None:
        """
        Delete a game by ID (removes from database and file storage).
        
        Args:
            game_id: The game ID
        
        Raises:
            ValueError: If game not found
        """
        game_record = self.db.query(Game).filter(Game.id == game_id).first()
        if not game_record:
            raise ValueError(f"Game with ID {game_id} not found")
        
        # Delete the JSON file
        self.game_file_service.delete_game(game_id)
        
        # Delete from database
        self.db.delete(game_record)
        self.db.commit()

    def list_games_by_user(self, user_id: int) -> list:
        """
        List all games for a specific user.
        
        Args:
            user_id: The user's ID
        Returns:
            List of game records involving the user
        """
        return self.db.query(Game).options(
            joinedload(Game.x_user),
            joinedload(Game.o_user)
        ).filter(
            (Game.x_user_id == user_id) | (Game.o_user_id == user_id)
        ).order_by(Game.updated_at.desc()).all()

    def list_games_user_turn(self, user_id: int) -> list:
        """
        List games where it's the user's turn (and game is not finished).
        
        Args:
            user_id: The user's ID
        Returns:
            List of game records sorted by updated_at descending
        """
        # Get all games where the user is a player and game is not finished
        # Eagerly load relationships before detaching from session
        games = self.db.query(Game).options(
            joinedload(Game.x_user),
            joinedload(Game.o_user)
        ).filter(
            (Game.x_user_id == user_id) | (Game.o_user_id == user_id),
            Game.finished == False
        ).all()
        
        # Detach objects from session to free connection
        self.db.expunge_all()
        
        # Filter to only games where it's the user's turn
        user_turn_games = []
        for game_record in games:
            try:
                game = self.game_file_service.load_game(game_record.id)
                if game:
                    # Determine if it's the user's turn
                    is_user_x = game_record.x_user_id == user_id
                    current_player_is_x = game.current_game.turn == 'X'
                    
                    if (is_user_x and current_player_is_x) or (not is_user_x and not current_player_is_x):
                        user_turn_games.append(game_record)
            except Exception:
                # Skip games that can't be loaded
                pass
        
        # Sort by updated_at descending
        user_turn_games.sort(key=lambda g: g.updated_at, reverse=True)
        return user_turn_games

    def list_games_opponent_turn(self, user_id: int) -> list:
        """
        List games where it's the opponent's turn (and game is not finished).
        
        Args:
            user_id: The user's ID
        Returns:
            List of game records sorted by updated_at descending
        """
        # Get all games where the user is a player and game is not finished
        # Eagerly load relationships before detaching from session
        games = self.db.query(Game).options(
            joinedload(Game.x_user),
            joinedload(Game.o_user)
        ).filter(
            (Game.x_user_id == user_id) | (Game.o_user_id == user_id),
            Game.finished == False
        ).all()
        
        # Detach objects from session to free connection
        self.db.expunge_all()
        
        # Filter to only games where it's the opponent's turn
        opponent_turn_games = []
        for game_record in games:
            try:
                game = self.game_file_service.load_game(game_record.id)
                if game:
                    # Determine if it's the user's turn (if not, it's opponent's)
                    is_user_x = game_record.x_user_id == user_id
                    current_player_is_x = game.current_game.turn == 'X'
                    
                    if (is_user_x and not current_player_is_x) or (not is_user_x and current_player_is_x):
                        opponent_turn_games.append(game_record)
            except Exception:
                # Skip games that can't be loaded
                pass
        
        # Sort by updated_at descending
        opponent_turn_games.sort(key=lambda g: g.updated_at, reverse=True)
        return opponent_turn_games

    def list_games_finished(self, user_id: int) -> list:
        """
        List finished games for a user.
        
        Args:
            user_id: The user's ID
        Returns:
            List of finished game records sorted by updated_at descending
        """
        return self.db.query(Game).options(
            joinedload(Game.x_user),
            joinedload(Game.o_user)
        ).filter(
            (Game.x_user_id == user_id) | (Game.o_user_id == user_id),
            Game.finished == True
        ).order_by(Game.updated_at.desc()).all()
    
    def take_turn(self, game_id: int, player: str, corner: str, position: str) -> Dict[str, Any]:
        """
        Execute a turn in a game.
        
        Args:
            game_id: The game ID
            player: The player making the move ('X' or 'O')
            corner: The corner to play in
            position: The position within the corner
        
        Returns:
            Dictionary with updated game data including state
        
        Raises:
            ValueError: If game not found or move is invalid
        """
        game_record = self.db.query(Game).filter(Game.id == game_id).first()
        if not game_record:
            raise ValueError(f"Game with ID {game_id} not found")
        
        # Load the game state from file
        game = self.game_file_service.load_game(game_id)
        if not game:
            raise ValueError("Could not load game state")
        
        # Execute turn via GameFileService (which handles persistence)
        self.game_file_service.take_turn(
            game_id=game_id,
            game=game,
            player=player,
            corner=corner,
            position=position
        )
        
        # Refresh game record from database in case it was updated
        self.db.refresh(game_record)
        
        # Re-query to ensure we have the latest data including updated winner_id
        game_record = self.db.query(Game).filter(Game.id == game_id).first()
        
        # Serialize updated game state
        game_data = self.game_file_service._serialize_game(game)

        # notify the player who's turn it is now
        # reload the game
        new_loaded_game = self.game_file_service.load_game(game_id)
        if new_loaded_game.current_game.winner is None and not new_loaded_game.current_game.finished:
            next_player = new_loaded_game.current_game.current_player
            if next_player == 'X':
                next_user_id = game_record.x_user_id
            else:
                next_user_id = game_record.o_user_id
            self.notification_service.send_notification(
                user_id=next_user_id,
                title="It's your turn!",
                message=f"Game ID {game_id}: It's your turn to play as {next_player}."
            )
        
        return {
            "id": game_record.id,
            "x_user_id": game_record.x_user_id,
            "o_user_id": game_record.o_user_id,
            "finished": game_record.finished,
            "winner_id": game_record.winner_id,
            "state": game_data
        }
