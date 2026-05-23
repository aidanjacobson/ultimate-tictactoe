"""
Database migration utilities for fixing data integrity issues.
"""
import os
import json
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import text
from database.schema import Game, SessionLocal

DATA_DIR = os.environ.get("DATA_DIR", "./devdata")
GAMES_DIR = os.path.join(DATA_DIR, "games")


def add_game_state_column(db: Optional[Session] = None) -> bool:
    """
    Add game_state column to games table if it doesn't exist.
    This migration allows SQLite databases to match the schema used by PostgreSQL.
    
    Args:
        db: Optional database session. If not provided, creates a new one.
    
    Returns:
        True if column was added, False if it already existed
    """
    session = db or SessionLocal()
    
    try:
        # Check if column exists by attempting to query it
        session.execute(text("SELECT game_state FROM games LIMIT 1"))
        # If we get here, column already exists
        return False
    except Exception:
        # Column doesn't exist, add it
        try:
            # Add the column (for SQLite, JSON columns default to NULL)
            session.execute(text("ALTER TABLE games ADD COLUMN game_state JSON"))
            session.commit()
            print("✓ Added game_state column to games table")
            return True
        except Exception as e:
            session.rollback()
            print(f"Warning: Could not add game_state column: {e}")
            # This might fail on PostgreSQL (column already exists) - that's OK
            return False
    finally:
        if db is None:
            session.close()


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
        # Use raw SQL to avoid schema mismatch issues with older SQLite databases
        # that don't have the game_state column yet
        result = session.execute(text("""
            SELECT id, x_user_id, o_user_id, winner_id
            FROM games 
            WHERE finished = 1 AND winner_id IS NULL
        """))
        
        finished_games_without_winner = result.fetchall()
        
        for game_row in finished_games_without_winner:
            game_id, x_user_id, o_user_id, winner_id = game_row
            
            # Load game state from JSON
            game_file = os.path.join(GAMES_DIR, f"{game_id}.json")
            if not os.path.exists(game_file):
                continue
            
            try:
                with open(game_file, 'r') as f:
                    game_data = json.load(f)
                
                # Check the winner from game state
                winner = game_data.get('current_game', {}).get('winner', '')
                
                new_winner_id = None
                if winner == 'X':
                    new_winner_id = x_user_id
                elif winner == 'O':
                    new_winner_id = o_user_id
                # If winner is empty string or '', it's a tie - leave winner_id as None
                
                if new_winner_id is not None:
                    # Update using raw SQL to avoid schema issues
                    session.execute(text("""
                        UPDATE games 
                        SET winner_id = :winner_id 
                        WHERE id = :game_id
                    """), {"winner_id": new_winner_id, "game_id": game_id})
                    fixed_count += 1
                
            except (json.JSONDecodeError, KeyError, IOError) as e:
                print(f"Warning: Could not process game {game_id}: {e}")
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
