from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from services.UserService import UserService
from services.GameFileService import GameFileService
from database.schema import SessionLocal, Game, User

import os

# Pydantic models for request/response
class UserCreate(BaseModel):
    name: str
    username: str
    email: str
    hashed_password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    hashed_password: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    name: str
    username: str
    email: str

    class Config:
        from_attributes = True

class GameCreate(BaseModel):
    x_user_id: int
    o_user_id: int

class GameTurn(BaseModel):
    player: str
    corner: str
    position: str

class GameResponse(BaseModel):
    id: int
    x_user_id: int
    o_user_id: int
    finished: bool
    winner_id: Optional[int]

    class Config:
        from_attributes = True

class GameStateResponse(BaseModel):
    id: int
    x_user_id: int
    o_user_id: int
    finished: bool
    winner_id: Optional[int]
    state: Dict[str, Any]

    class Config:
        from_attributes = True


class Server:
    def __init__(self):
        self.app = FastAPI()
        self.user_service = UserService()
        self.game_file_service = GameFileService()
        self.db = SessionLocal()

        self._setup_routes()
        self._ensure_www()
        self._setup_static()

    
    def _ensure_www(self):
        os.makedirs("www", exist_ok=True)

    def _setup_static(self):
        self.app.mount("/", StaticFiles(directory="www", html=True), name="static")

    def _setup_routes(self):
        """Setup all API routes"""

        @self.app.get("/api/health")
        async def health_check():
            """Health check endpoint"""
            return JSONResponse(content={"status": "ok"})
        
        # ===== User Routes =====
        
        @self.app.post("/api/users", response_model=UserResponse)
        async def create_user(user: UserCreate):
            """Create a new user"""
            try:
                new_user = self.user_service.create_user(
                    name=user.name,
                    username=user.username,
                    email=user.email,
                    hashed_password=user.hashed_password
                )
                return UserResponse.from_orm(new_user)
            except Exception as e:
                raise HTTPException(status_code=400, detail=str(e))

        @self.app.get("/api/users/{user_id}", response_model=UserResponse)
        async def get_user(user_id: int):
            """Get a user by ID"""
            user = self.user_service.get_user_by_id(user_id)
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            return UserResponse.from_orm(user)

        @self.app.get("/api/users", response_model=List[UserResponse])
        async def list_users():
            """List all users"""
            users = self.user_service.get_all_users()
            return [UserResponse.from_orm(u) for u in users]

        @self.app.get("/api/users/username/{username}", response_model=UserResponse)
        async def get_user_by_username(username: str):
            """Get a user by username"""
            user = self.user_service.get_user_by_username(username)
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            return UserResponse.from_orm(user)

        @self.app.put("/api/users/{user_id}", response_model=UserResponse)
        async def update_user(user_id: int, user: UserUpdate):
            """Update a user"""
            update_data = user.dict(exclude_unset=True)
            updated_user = self.user_service.update_user(user_id, **update_data)
            if not updated_user:
                raise HTTPException(status_code=404, detail="User not found")
            return UserResponse.from_orm(updated_user)

        @self.app.delete("/api/users/{user_id}")
        async def delete_user(user_id: int):
            """Delete a user (soft delete)"""
            success = self.user_service.delete_user(user_id)
            if not success:
                raise HTTPException(status_code=404, detail="User not found")
            return {"message": "User deleted"}

        # ===== Game Routes =====

        @self.app.post("/api/games", response_model=Dict[str, Any])
        async def create_game(game: GameCreate):
            """Create a new game"""
            try:
                # Verify users exist
                user_x = self.user_service.get_user_by_id(game.x_user_id)
                user_o = self.user_service.get_user_by_id(game.o_user_id)
                
                if not user_x or not user_o:
                    raise HTTPException(status_code=404, detail="One or both users not found")
                
                # Create game record in database
                game_record = Game(
                    x_user_id=game.x_user_id,
                    o_user_id=game.o_user_id,
                    finished=False
                )
                self.db.add(game_record)
                self.db.commit()
                self.db.refresh(game_record)
                
                # Initialize game via GameFileService
                game_state = self.game_file_service.start_new_game(game_record.id)
                
                # Serialize game state
                game_data = self.game_file_service._serialize_game(game_state)
                
                return {
                    "id": game_record.id,
                    "x_user_id": game_record.x_user_id,
                    "o_user_id": game_record.o_user_id,
                    "finished": game_record.finished,
                    "winner_id": game_record.winner_id,
                    "state": game_data
                }
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=400, detail=str(e))

        @self.app.get("/api/games/{game_id}", response_model=Dict[str, Any])
        async def get_game(game_id: int):
            """Get a game by ID with full state"""
            game_record = self.db.query(Game).filter(Game.id == game_id).first()
            if not game_record:
                raise HTTPException(status_code=404, detail="Game not found")
            
            # Load the game state from file
            game = self.game_file_service.load_game(game_id)
            if not game:
                raise HTTPException(status_code=400, detail="Could not load game state")
            
            # Serialize game state
            game_data = self.game_file_service._serialize_game(game)
            
            return {
                "id": game_record.id,
                "x_user_id": game_record.x_user_id,
                "o_user_id": game_record.o_user_id,
                "finished": game_record.finished,
                "winner_id": game_record.winner_id,
                "state": game_data
            }

        @self.app.get("/api/games", response_model=List[GameResponse])
        async def list_games():
            """List all games"""
            games = self.db.query(Game).all()
            return [GameResponse.from_orm(g) for g in games]

        @self.app.post("/api/games/{game_id}/turn", response_model=Dict[str, Any])
        async def take_turn(game_id: int, turn: GameTurn):
            """Execute a turn in a game"""
            try:
                game_record = self.db.query(Game).filter(Game.id == game_id).first()
                if not game_record:
                    raise HTTPException(status_code=404, detail="Game not found")
                
                # Load the game state from file
                game = self.game_file_service.load_game(game_id)
                if not game:
                    raise HTTPException(status_code=400, detail="Could not load game state")
                
                # Execute turn
                self.game_file_service.take_turn(
                    game_id=game_id,
                    game=game,
                    player=turn.player,
                    corner=turn.corner,
                    position=turn.position
                )
                
                # Refresh game record from database in case it was updated
                self.db.refresh(game_record)
                
                # Serialize updated game state
                game_data = self.game_file_service._serialize_game(game)
                
                return {
                    "id": game_record.id,
                    "x_user_id": game_record.x_user_id,
                    "o_user_id": game_record.o_user_id,
                    "finished": game_record.finished,
                    "winner_id": game_record.winner_id,
                    "state": game_data
                }
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=400, detail=str(e))

    def run(self, host: str = "0.0.0.0", port: int = 8080):
        """Run the server"""
        import uvicorn
        uvicorn.run(self.app, host=host, port=port)
