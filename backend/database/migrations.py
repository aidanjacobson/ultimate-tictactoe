"""
Database migration utilities for fixing data integrity issues.
"""
import os
import json
from typing import Optional
from sqlalchemy.orm import Session
from database.schema import Game, SessionLocal

DATA_DIR = os.environ.get("DATA_DIR", "./devdata")
GAMES_DIR = os.path.join(DATA_DIR, "games")


def repair_winner_ids(db: Optional[Session] = None) -> int:
    """
    Repair any finished games that are missing winner_id in the database.
    Loads game state from JSON files and updates winner_id based on the game outcome.
    
    Args:
        db: Optional database session. If not provided, creates a new one.
    
    Returns:
        Number of games repaired
    """
    session = db or SessionLocal()
    fixed_count = 0
    
    try:
        # Find all finished games
        finished_games = session.query(Game).filter(Game.finished == True).all()
        
        for game in finished_games:
            # Skip if winner_id is already set
            if game.winner_id is not None:
                continue
            
            # Load game state from JSON
            game_file = os.path.join(GAMES_DIR, f"{game.id}.json")
            if not os.path.exists(game_file):
                continue
            
            try:
                with open(game_file, 'r') as f:
                    game_data = json.load(f)
                
                # Check the winner from game state
                winner = game_data.get('current_game', {}).get('winner', '')
                
                if winner == 'X':
                    game.winner_id = game.x_user_id
                    fixed_count += 1
                elif winner == 'O':
                    game.winner_id = game.o_user_id
                    fixed_count += 1
                # If winner is empty string or '', it's a tie - leave winner_id as None
                
            except (json.JSONDecodeError, KeyError, IOError) as e:
                print(f"Warning: Could not process game {game.id}: {e}")
                continue
        
        # Commit all changes
        if fixed_count > 0:
            session.commit()
            print(f"✓ Repaired {fixed_count} game(s) with missing winner_id")
        
    except Exception as e:
        session.rollback()
        print(f"Error during winner_id repair: {e}")
        raise
    finally:
        if db is None:
            session.close()
    
    return fixed_count
