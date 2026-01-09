import os
from sqlalchemy import (
    UniqueConstraint,
    create_engine,
    Column,
    Integer,
    String,
    ForeignKey,
    Text,
    Boolean
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

DATA_DIR = os.environ.get("DATA_DIR", "./devdata")
# DB_DIR = os.path.join(DATA_DIR, "database")
DB_DIR = DATA_DIR
DB_PATH = os.path.join(DB_DIR, "app.db")

os.makedirs(DB_DIR, exist_ok=True)

# SQLAlchemy setup
engine = create_engine(f"sqlite:///{DB_PATH}", echo=False, future=True)
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

    # Relationships
    x_user = relationship("User", foreign_keys=[x_user_id], back_populates="games_as_x")
    o_user = relationship("User", foreign_keys=[o_user_id], back_populates="games_as_o")
    winner = relationship("User", foreign_keys=[winner_id], back_populates="games_won")

# ===== Init helper =====

def init_db():
    Base.metadata.create_all(bind=engine)