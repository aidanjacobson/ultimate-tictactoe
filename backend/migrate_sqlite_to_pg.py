#!/usr/bin/env python3
"""
Migration script to migrate data from SQLite to PostgreSQL.

Usage:
    python migrate_sqlite_to_pg.py [--sqlite-path PATH] [--dry-run]

Environment variables for PostgreSQL:
    DB_HOST: PostgreSQL host (default: localhost)
    DB_PORT: PostgreSQL port (default: 5432)
    DB_NAME: PostgreSQL database name (default: tictactoe)
    DB_USER: PostgreSQL user (default: postgres)
    DB_PASSWORD: PostgreSQL password (default: empty)

Example:
    cd backend && DB_HOST=localhost DB_PORT=5432 DB_NAME=tictactoe DB_USER=postgres DB_PASSWORD=mypass python migrate_sqlite_to_pg.py
"""

import os
import sys
import argparse
import json
from pathlib import Path

from sqlalchemy import inspect, text
from database.schema import Base, SessionLocal, engine as pg_engine, DB_TYPE
from sqlalchemy import create_engine

def get_sqlite_engine(sqlite_path):
    """Create SQLite engine for the source database."""
    if not Path(sqlite_path).exists():
        print(f"❌ SQLite database not found at {sqlite_path}")
        sys.exit(1)
    
    return create_engine(f"sqlite:///{sqlite_path}", connect_args={"timeout": 30})

def verify_postgres_connection(pg_engine):
    """Verify PostgreSQL connection is working."""
    try:
        with pg_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            print("✓ PostgreSQL connection verified")
    except Exception as e:
        print(f"❌ Failed to connect to PostgreSQL: {e}")
        sys.exit(1)

def get_table_count(engine, table_name):
    """Get count of records in a table."""
    try:
        with engine.connect() as conn:
            result = conn.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
            return result.scalar()
    except Exception:
        return 0

def migrate_data(sqlite_engine, pg_engine, dry_run=False):
    """Migrate all data from SQLite to PostgreSQL."""
    
    # Create all tables in PostgreSQL
    print("\n📋 Creating tables in PostgreSQL...")
    Base.metadata.create_all(bind=pg_engine)
    print("✓ Tables created in PostgreSQL")
    
    # Get SQLite session
    sqlite_session_maker = __import__('sqlalchemy.orm', fromlist=['sessionmaker']).sessionmaker(bind=sqlite_engine)
    sqlite_session = sqlite_session_maker()
    
    # Get PostgreSQL session
    pg_session = SessionLocal()
    
    try:
        # Import all models
        from database.schema import User, Game, UserInvite, Notification, GameInviteRequest
        
        # Check if game_state column exists in SQLite (it won't in older databases)
        sqlite_has_game_state = False
        try:
            with sqlite_engine.connect() as conn:
                conn.execute(text("SELECT game_state FROM games LIMIT 1"))
                sqlite_has_game_state = True
        except:
            sqlite_has_game_state = False
        
        # Migrate models excluding Game for now
        models = [User, UserInvite, Notification, GameInviteRequest]
        total_records = 0
        
        for model in models:
            table_name = model.__tablename__
            count = get_table_count(sqlite_engine, table_name)
            
            if count == 0:
                print(f"  ⊘ {table_name}: 0 records")
                continue
            
            print(f"  → {table_name}: migrating {count} records...")
            
            records = sqlite_session.query(model).all()
            
            if not dry_run:
                for record in records:
                    pg_session.merge(record)
                
                pg_session.flush()
            
            total_records += count
            print(f"    ✓ {count} records migrated")
        
        # Special handling for Game model
        game_count = get_table_count(sqlite_engine, "games")
        if game_count > 0:
            print(f"  → games: migrating {game_count} records...")
            
            # Query games without the game_state column
            if sqlite_has_game_state:
                games = sqlite_session.query(Game).all()
            else:
                # Use raw query to avoid the missing column
                with sqlite_engine.connect() as conn:
                    result = conn.execute(text("""
                        SELECT id, x_user_id, o_user_id, finished, winner_id, created_at, updated_at
                        FROM games
                    """))
                    
                    games = []
                    for row in result:
                        game = Game(
                            id=row[0],
                            x_user_id=row[1],
                            o_user_id=row[2],
                            finished=row[3],
                            winner_id=row[4],
                            created_at=row[5],
                            updated_at=row[6],
                            game_state=None
                        )
                        games.append(game)
            
            if not dry_run:
                for game in games:
                    pg_session.merge(game)
                
                pg_session.flush()
            
            total_records += game_count
            print(f"    ✓ {game_count} records migrated")
        
        # Special handling for game state files -> PostgreSQL game_state column
        print(f"\n  → game_state JSON files: migrating to game_state column...")
        # Use the same DATA_DIR resolution as the app does
        data_dir = os.environ.get("DATA_DIR", "../devdata")
        games_dir = os.path.join(data_dir, "games")
        if os.path.exists(games_dir):
            game_files = [f for f in os.listdir(games_dir) if f.endswith('.json')]
            migrated_games = 0
            
            for game_file in game_files:
                try:
                    game_id = int(game_file.replace('.json', ''))
                    game_path = os.path.join(games_dir, game_file)
                    
                    with open(game_path, 'r') as f:
                        game_data = json.load(f)
                    
                    if not dry_run:
                        # Update the game record with game_state
                        game_record = pg_session.query(Game).filter(Game.id == game_id).first()
                        if game_record:
                            game_record.game_state = game_data
                            migrated_games += 1
                except Exception as e:
                    print(f"    ⚠ Error migrating game {game_file}: {e}")
            
            if migrated_games > 0:
                print(f"    ✓ {migrated_games} game state files migrated")
        
        if not dry_run:
            pg_session.commit()
            print(f"\n✅ Migration complete! {total_records} database records migrated.")
        else:
            print(f"\n📋 Dry-run complete. Would migrate {total_records} total records.")
    
    except Exception as e:
        pg_session.rollback()
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    finally:
        sqlite_session.close()
        pg_session.close()

def main():
    parser = argparse.ArgumentParser(
        description="Migrate data from SQLite to PostgreSQL",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    parser.add_argument(
        "--sqlite-path",
        default="../devdata/app.db",
        help="Path to SQLite database (default: ../devdata/app.db)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Perform a dry-run without actually migrating data"
    )
    
    args = parser.parse_args()
    
    # Check that we're using PostgreSQL for target
    if DB_TYPE != "postgres":
        print("❌ DB_TYPE must be set to 'postgres' to run migration")
        print("   Set DB_TYPE=postgres and configure PostgreSQL connection variables")
        sys.exit(1)
    
    # Get SQLite engine
    sqlite_engine = get_sqlite_engine(args.sqlite_path)
    
    # Verify PostgreSQL connection
    print("🔍 Verifying PostgreSQL connection...")
    verify_postgres_connection(pg_engine)
    
    # Show what we're doing
    sqlite_count = get_table_count(sqlite_engine, "users")
    print(f"\n📦 Source: SQLite at {args.sqlite_path}")
    print(f"   Found {sqlite_count} users (and related data)")
    
    db_host = os.environ.get("DB_HOST", "localhost")
    db_port = os.environ.get("DB_PORT", "5432")
    db_name = os.environ.get("DB_NAME", "tictactoe")
    db_user = os.environ.get("DB_USER", "postgres")
    print(f"\n🎯 Target: PostgreSQL at {db_user}@{db_host}:{db_port}/{db_name}")
    
    if args.dry_run:
        print("\n🧪 Running in DRY-RUN mode (no data will be modified)")
    
    # Confirm before migration
    if not args.dry_run:
        response = input("\n⚠️  This will overwrite data in PostgreSQL. Continue? (yes/no): ").strip().lower()
        if response != "yes":
            print("Migration cancelled.")
            sys.exit(0)
    
    # Perform migration
    print("\n🚀 Starting migration...")
    migrate_data(sqlite_engine, pg_engine, dry_run=args.dry_run)

if __name__ == "__main__":
    main()
