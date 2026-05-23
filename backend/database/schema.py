import os
from sqlalchemy import (
    UniqueConstraint,
    create_engine,
    Column,
    Integer,
    String,
    ForeignKey,
    Text,
    Boolean,
    DateTime,
    JSON
)
import datetime
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

# Database configuration
DATA_DIR = os.environ.get("DATA_DIR", "./devdata")
DB_TYPE = os.environ.get("DB_TYPE", "sqlite").lower()

if DB_TYPE == "postgres":
    # PostgreSQL configuration
    DB_HOST = os.environ.get("DB_HOST", "localhost")
    DB_PORT = os.environ.get("DB_PORT", "5432")
    DB_NAME = os.environ.get("DB_NAME", "tictactoe")
    DB_USER = os.environ.get("DB_USER", "postgres")
    DB_PASSWORD = os.environ.get("DB_PASSWORD", "")
    
    # Build PostgreSQL connection string
    if DB_PASSWORD:
        DB_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    else:
        DB_URL = f"postgresql://{DB_USER}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    
    # PostgreSQL engine configuration
    engine = create_engine(
        DB_URL,
        echo=False,
        future=True,
        pool_size=10,
        max_overflow=20,
    )
else:
    # SQLite configuration (default)
    DB_DIR = DATA_DIR
    DB_PATH = os.path.join(DB_DIR, "app.db")
    os.makedirs(DB_DIR, exist_ok=True)
    
    # SQLite engine configuration
    engine = create_engine(
        f"sqlite:///{DB_PATH}",
        echo=False,
        future=True,
        connect_args={"timeout": 30},
        pool_size=10,
        max_overflow=20,
    )
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    username = Column(String, nullable=False, unique=True)
    email = Column(String, nullable=False, unique=True)
    hashed_password = Column(String, nullable=False)
    deleted = Column(Boolean, default=False)
    admin = Column(Boolean, default=False)

    # Relationships
    games_as_x = relationship("Game", foreign_keys="Game.x_user_id", back_populates="x_user")
    games_as_o = relationship("Game", foreign_keys="Game.o_user_id", back_populates="o_user")
    games_won = relationship("Game", foreign_keys="Game.winner_id", back_populates="winner")


class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, autoincrement=True)
    x_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    o_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    finished = Column(Boolean, default=False)
    winner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)
    
    # For PostgreSQL: store game state as JSON in database
    # For SQLite: game state is stored in JSON files
    game_state = Column(JSON, nullable=True)  # Only used when DB_TYPE is postgres

    # Relationships
    x_user = relationship("User", foreign_keys=[x_user_id], back_populates="games_as_x")
    o_user = relationship("User", foreign_keys=[o_user_id], back_populates="games_as_o")
    winner = relationship("User", foreign_keys=[winner_id], back_populates="games_won")

class UserInvite(Base):
    __tablename__ = "user_invites"

    id = Column(Integer, primary_key=True, autoincrement=True)
    invite_code = Column(String, nullable=False, unique=True)
    invited_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    used = Column(Boolean, default=False)
    used_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(Integer, nullable=False)  # Unix timestamp
    expires_at = Column(Integer, nullable=True)  # Unix timestamp - optional
    used_at = Column(Integer, nullable=True)  # Unix timestamp

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=True)
    message = Column(Text, nullable=False)
    read = Column(Boolean, default=False)
    created_at = Column(Integer, nullable=False)  # Unix timestamp

class GameInviteRequest(Base):
    __tablename__ = "game_invite_requests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    from_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    to_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    inviter_has_preferred_symbol = Column(Boolean, default=False)
    preferred_symbol = Column(String, nullable=True)  # 'X' or 'O'
    reviewed = Column(Boolean, default=False)
    accepted = Column(Boolean, nullable=True)  # Null if not reviewed yet

    # Relationships
    from_user = relationship("User", foreign_keys=[from_user_id])
    to_user = relationship("User", foreign_keys=[to_user_id])

# ===== Init helper =====

def init_db():
    Base.metadata.create_all(bind=engine)