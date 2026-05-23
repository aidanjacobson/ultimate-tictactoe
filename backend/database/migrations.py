"""
Database migration utilities for fixing data integrity issues.
"""
import os
import json
from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
from database.schema import Game, SessionLocal, engine

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


def add_user_created_at_column(db: Optional[Session] = None) -> bool:
    """
    Add created_at column to users table if it doesn't exist.
    This tracks when each user account was created.
    
    For SQLite, adds column with NULL default, then updates existing rows.
    For PostgreSQL, uses DEFAULT CURRENT_TIMESTAMP.
    
    Args:
        db: Optional database session. If not provided, creates a new one.
    
    Returns:
        True if column was added, False if it already existed
    """
    session = db or SessionLocal()
    
    try:
        # First, check if column already exists
        try:
            inspector = inspect(engine)
            users_columns = [col['name'] for col in inspector.get_columns('users')]
            
            if 'created_at' in users_columns:
                print("✓ created_at column already exists")
                return False
        except Exception as e:
            print(f"Note: Could not inspect columns: {e}, will attempt to add anyway")
        
        # Try to add the column
        print("Adding created_at column to users table...")
        try:
            # Try PostgreSQL first (with DEFAULT CURRENT_TIMESTAMP)
            session.execute(text(
                "ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP"
            ))
            session.commit()
            print("✓ Successfully added created_at column with PostgreSQL-style default")
            return True
        except Exception as pg_err:
            # PostgreSQL error - check if column already exists
            error_msg = str(pg_err).lower()
            if 'already exists' in error_msg or 'duplicate' in error_msg:
                print("✓ created_at column already exists")
                return False
            
            # Likely a SQLite error (doesn't support function defaults in ALTER TABLE)
            # Try SQLite approach: add with NULL default, then update
            try:
                session.rollback()
                print("PostgreSQL approach failed, trying SQLite approach...")
                
                # Add column with NULL default (SQLite-compatible)
                session.execute(text(
                    "ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT NULL"
                ))
                session.commit()
                print("✓ Added created_at column (NULL default)")
                
                # Update existing rows to have current timestamp
                now = datetime.utcnow()
                session.execute(text(
                    "UPDATE users SET created_at = :now WHERE created_at IS NULL"
                ), {"now": now})
                session.commit()
                print(f"✓ Updated existing users with timestamp: {now}")
                
                return True
            except Exception as sqlite_err:
                # Check if column already exists
                error_msg = str(sqlite_err).lower()
                if 'already exists' in error_msg or 'duplicate' in error_msg:
                    print("✓ created_at column already exists")
                    return False
                else:
                    session.rollback()
                    print(f"Warning: Error adding created_at column: {sqlite_err}")
                    return False
        
    finally:
        if db is None:
            session.close()


def add_user_password_must_reset_column(db: Optional[Session] = None) -> bool:
    """
    Add password_must_reset column to users table if it doesn't exist.
    This flag is set when an admin resets a user's password.
    
    Args:
        db: Optional database session. If not provided, creates a new one.
    
    Returns:
        True if column was added, False if it already existed
    """
    session = db or SessionLocal()
    
    try:
        # First, try to check using inspector
        try:
            inspector = inspect(engine)
            users_columns = [col['name'] for col in inspector.get_columns('users')]
            
            if 'password_must_reset' in users_columns:
                print("✓ password_must_reset column already exists")
                return False
        except Exception as e:
            print(f"Note: Could not inspect columns: {e}, will attempt to add anyway")
        
        # Try to add the column
        print("Adding password_must_reset column to users table...")
        try:
            session.execute(text(
                "ALTER TABLE users ADD COLUMN password_must_reset BOOLEAN DEFAULT 0"
            ))
            session.commit()
            print("✓ Successfully added password_must_reset column")
            return True
        except Exception as add_err:
            # Check if error is "column already exists"
            error_msg = str(add_err).lower()
            if 'already exists' in error_msg or 'duplicate' in error_msg:
                print("✓ password_must_reset column already exists")
                return False
            else:
                session.rollback()
                print(f"Warning: Error adding password_must_reset column: {add_err}")
                return False
        
    finally:
        if db is None:
            session.close()

