import json
import os
from pathlib import Path
from services.GameFileService import GameFileService
from services.UserService import UserService
from database.schema import SessionLocal, Game, User, init_db
from datamodels.tictactoe import UltimateTicTacToe

def main():
    user_service = UserService()
    game_file_service = GameFileService()
    db = SessionLocal()

    # Create test users via UserService
    print("Creating users...")
    user_x = user_service.create_user(
        name="Player X",
        username="player_x_final",
        email="x_final@example.com",
        hashed_password="hashed_password_x"
    )
    user_o = user_service.create_user(
        name="Player O",
        username="player_o_final",
        email="o_final@example.com",
        hashed_password="hashed_password_o"
    )
    print(f"Created users: {user_x.name} (ID: {user_x.id}), {user_o.name} (ID: {user_o.id})")

    # Rename users via UserService
    print("\nRenaming users...")
    user_x = user_service.update_user(user_x.id, name="Champion X")
    user_o = user_service.update_user(user_o.id, name="Champion O")
    print(f"Renamed users: {user_x.name}, {user_o.name}")

    # Create a game record in the database
    print("\nStarting game...")
    game_record = Game(
        x_user_id=user_x.id,
        o_user_id=user_o.id,
        finished=False
    )
    db.add(game_record)
    db.commit()

    game_id = game_record.id
    print(f"Created game with ID: {game_id}")

    # Initialize empty game via GameFileService
    game = game_file_service.start_new_game(game_id)

    # Move sequence: (player, board, position)
    moves = [
        ('X', 'center', 'topleft'),
        ('O', 'topleft', 'topmiddle'),
        ('X', 'topmiddle', 'topleft'),
        ('O', 'topleft', 'topright'),
        ('X', 'topright', 'topleft'),
        ('O', 'topleft', 'middleleft'),
        ('X', 'middleleft', 'topleft'),
        ('O', 'topleft', 'center'),
        ('X', 'center', 'topmiddle'),
        ('O', 'topmiddle', 'center'),
        ('X', 'center', 'topright'),
        ('O', 'topright', 'middleleft'),
        ('X', 'middleleft', 'topmiddle'),
        ('O', 'topmiddle', 'middleleft'),
        ('X', 'middleleft', 'topright'),
        ('O', 'topright', 'middleright'),
        ('X', 'middleright', 'topmiddle'),
        ('O', 'topmiddle', 'middleright'),
        ('X', 'middleright', 'topleft'),
        ('O', 'topleft', 'middleright'),
        ('X', 'middleright', 'topright')
    ]


    for i, (player, board, position) in enumerate(moves, start=1):
        print(f"\nTurn {i}: {player} plays {board}.{position}")

        try:
            game_file_service.take_turn(
                game_id=game_id,
                game=game,
                player=player,
                corner=board,
                position=position,
            )
        except Exception as e:
            print("\nERROR during move execution:")
            print(f"  {type(e).__name__}: {e}")
            print("\nBoard state at error:")
            game.current_game.print_ascii()
            return

        # Check for winner WITHOUT calling updateSelf
        winner = game.current_game.winner
        if winner:
            print("\nGAME FINISHED")
            print(f"Winner: {winner}")
            print("\nFinal board:")
            game.current_game.print_ascii()

    print("\nMove list exhausted without a winner.")
    print("\nFinal board:")
    game.current_game.print_ascii()
    
    user_service.close()
    db.close()


if __name__ == "__main__":
    init_db()
    main()