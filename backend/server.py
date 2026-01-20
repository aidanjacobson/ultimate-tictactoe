from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import JSONResponse, PlainTextResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from services.UserService import UserService
from services.GameService import GameService
from services.UserInviteService import UserInviteService
from services.GameInviteService import GameInviteService
from services.NotificationService import NotificationService
from database.schema import SessionLocal, Game, User, GameInviteRequest
from auth import create_token, auth_none, auth_logged_in, auth_as_id, auth_admin, auth_as_id_in_game, auth_as_inviter, get_current_auth_context, AuthContext, require_logged_in, require_admin, require_as_id, require_as_id_in_game, require_as_inviter

import os

sessions = {}

# Pydantic models for request/response
class UserCreate(BaseModel):
    name: str
    username: str
    email: str
    password: str
    admin: bool = False

class UserUpdate(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    name: str
    username: str

    class Config:
        from_attributes = True

class UserInviteCreate(BaseModel):
    invite_code: Optional[str] = None
    expiry_days: Optional[float] = 7

class UserInviteResponse(BaseModel):
    id: int
    invite_code: str
    created_at: int
    expires_at: int
    used: bool

    class Config:
        from_attributes = True

class UserInviteUse(BaseModel):
    invite_code: str
    name: str
    username: str
    email: str
    password: str

class GameCreate(BaseModel):
    x_user_id: int
    o_user_id: int

class GameTurn(BaseModel):
    corner: str
    position: str

class GameResponse(BaseModel):
    id: int
    x_user_id: int
    o_user_id: int
    finished: bool
    winner_id: Optional[int]
    state: Optional[Dict[str, Any]] = None
    x_user: Optional[UserResponse] = None
    o_user: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    token: str
    user: UserResponse

class GameInviteCreate(BaseModel):
    to_user_id: int
    inviter_has_preferred_symbol: Optional[bool] = False
    preferred_symbol: Optional[str] = None

class GameInviteResponse(BaseModel):
    id: int
    from_user_id: int
    to_user_id: int
    inviter_has_preferred_symbol: bool
    preferred_symbol: Optional[str]
    reviewed: bool
    accepted: Optional[bool]
    from_user: Optional[UserResponse] = None
    to_user: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class GameInviteAccept(BaseModel):
    preferred_symbol: Optional[str] = None


class Server:
    def __init__(self, user_service: UserService, game_service: GameService, user_invite_service: UserInviteService, game_invite_service: GameInviteService, notification_service: NotificationService):
        base_url = os.getenv("BASE_URL", "/")

        self.app = FastAPI(root_path=base_url)
        self.user_service = user_service
        self.game_service = game_service
        self.user_invite_service = user_invite_service
        self.game_invite_service = game_invite_service
        self.notification_service = notification_service
        self.db = SessionLocal()

        # Add auth middleware - REMOVED, using per-route enforcement instead
        # self.app.add_middleware(AuthMiddleware)

        self._setup_routes()
        self._ensure_www()
        self._setup_spa_middleware()
        self._setup_static()

    
    def _ensure_www(self):
        os.makedirs("www", exist_ok=True)

    def _setup_spa_middleware(self):
        """Setup SPA fallback middleware for client-side routing"""
        class SPAMiddleware(BaseHTTPMiddleware):
            async def dispatch(self, request: Request, call_next):
                path = request.url.path
                # Always pass through /api routes
                if "/api" in path:
                    return await call_next(request)
                # Don't intercept files with extensions
                if "." in path.split("/")[-1]:
                    return await call_next(request)
                # Serve index.html for all other routes (client-side routing)
                return FileResponse(path="www/index.html")
        
        self.app.add_middleware(SPAMiddleware)

    def _setup_static(self):
        self.app.mount("/", StaticFiles(directory="www", html=True), name="static")

    def _setup_routes(self):
        """Setup all API routes"""

        @self.app.get("/api/health")
        @auth_none()
        async def health_check(auth_context: AuthContext = Depends(get_current_auth_context)):
            """Health check endpoint"""
            return JSONResponse(content={"status": "ok"})

        @self.app.get("/api/config.js", response_class=PlainTextResponse)
        @self.app.get("{path:path}/api/config.js", response_class=PlainTextResponse)
        @auth_none()
        async def get_config(auth_context: AuthContext = Depends(get_current_auth_context)):
            """Get frontend configuration as JavaScript"""
            base_url = os.getenv("BASE_URL", "/")
            return f"window.__BASE_URL__ = '{base_url}';"

        @self.app.get("/api/validate", response_model=UserResponse)
        @auth_logged_in()
        async def validate(auth_context: AuthContext = Depends(get_current_auth_context)):
            """Validate token and return user info"""
            require_logged_in(auth_context)
            user = self.user_service.get_user_by_id(auth_context.user_id)
            if not user:
                raise HTTPException(status_code=401, detail="User not found")
            return UserResponse.from_orm(user)
        
        # ===== User Routes =====
        
        @self.app.post("/api/login", response_model=LoginResponse)
        @auth_none()
        async def login(body: LoginRequest, auth_context: AuthContext = Depends(get_current_auth_context)):
            """Authenticate a user and return JWT token"""
            try:
                user = self.user_service.authenticate_user(body.username, body.password)
                if not user:
                    raise HTTPException(status_code=401, detail="Invalid credentials")
                
                token = create_token(user.id)
                return {
                    "token": token,
                    "user": UserResponse.from_orm(user)
                }
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=400, detail=str(e))
        
        @self.app.post("/api/users", response_model=UserResponse)
        @auth_admin()
        async def create_user(user: UserCreate, auth_context: AuthContext = Depends(get_current_auth_context)):
            """Create a new user"""
            # Enforce admin requirement
            require_admin(auth_context)
            
            try:
                new_user = self.user_service.create_user(
                    name=user.name,
                    username=user.username,
                    email=user.email,
                    password=user.password,
                    admin=user.admin
                )
                return UserResponse.from_orm(new_user)
            except Exception as e:
                raise HTTPException(status_code=400, detail=str(e))

        @self.app.get("/api/users/{user_id}", response_model=UserResponse) 
        @auth_logged_in()
        async def get_user(user_id: int, auth_context: AuthContext = Depends(get_current_auth_context)):
            """Get a user by ID"""
            # Enforce logged in requirement
            require_logged_in(auth_context)
            
            user = self.user_service.get_user_by_id(user_id)
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            return UserResponse.from_orm(user)

        @self.app.get("/api/users", response_model=List[UserResponse])
        @auth_logged_in()
        async def list_users(auth_context: AuthContext = Depends(get_current_auth_context)):
            """List all users"""
            # Enforce auth requirement
            require_logged_in(auth_context)
            
            print(f"\n[ROUTE HANDLER] list_users called")
            print(f"[ROUTE HANDLER] auth_context: user_id={auth_context.user_id}, is_admin={auth_context.is_admin}")
            users = self.user_service.get_all_users()
            print(f"[ROUTE HANDLER] Found {len(users)} users")
            return [UserResponse.from_orm(u) for u in users]

        @self.app.get("/api/users/username/{username}", response_model=UserResponse)
        @auth_logged_in()
        async def get_user_by_username(username: str, auth_context: AuthContext = Depends(get_current_auth_context)):
            """Get a user by username"""
            # Enforce logged in requirement
            require_logged_in(auth_context)
            
            user = self.user_service.get_user_by_username(username)
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            return UserResponse.from_orm(user)

        @self.app.put("/api/users/{user_id}", response_model=UserResponse)
        @auth_as_id(param_name="user_id")
        async def update_user(user_id: int, user: UserUpdate, auth_context: AuthContext = Depends(get_current_auth_context)):
            """Update a user"""
            # Enforce as_id requirement
            require_as_id(auth_context, user_id)
            
            update_data = user.dict(exclude_unset=True)
            updated_user = self.user_service.update_user(user_id, **update_data)
            if not updated_user:
                raise HTTPException(status_code=404, detail="User not found")
            return UserResponse.from_orm(updated_user)

        @self.app.delete("/api/users/{user_id}")
        @auth_as_id(param_name="user_id")
        async def delete_user(user_id: int, auth_context: AuthContext = Depends(get_current_auth_context)):
            """Delete a user (soft delete)"""
            # Enforce as_id requirement
            require_as_id(auth_context, user_id)
            
            success = self.user_service.delete_user(user_id)
            if not success:
                raise HTTPException(status_code=404, detail="User not found")
            return {"message": "User deleted"}

        # ===== User Invite Routes =====

        @self.app.post("/api/invite")
        @auth_logged_in()
        async def create_user_invite(user_invite_create: UserInviteCreate, auth_context: AuthContext = Depends(get_current_auth_context)):
            """Create a new user invite"""
            # Enforce logged in requirement
            require_logged_in(auth_context)
            
            try:
                user_invite = self.user_invite_service.create_user_invite(
                    invited_by_id=auth_context.user_id,
                    invite_code=user_invite_create.invite_code,
                    expiry_days=user_invite_create.expiry_days
                )
                return UserInviteResponse.from_orm(user_invite)
            except Exception as e:
                raise HTTPException(status_code=400, detail=str(e))

        @self.app.get("/api/invite/{invite_id}", response_model=UserInviteResponse)
        @auth_as_inviter(invite_id_param="invite_id")
        async def get_user_invite(invite_id: int, auth_context: AuthContext = Depends(get_current_auth_context)):
            """Get a user invite by ID"""
            # Enforce as_inviter requirement
            require_as_inviter(auth_context, invite_id)
            
            user_invite = self.user_invite_service.get_user_invite(invite_id)
            if not user_invite:
                raise HTTPException(status_code=404, detail="Invite not found")
            return UserInviteResponse.from_orm(user_invite)

        @self.app.delete("/api/invite/{invite_id}")
        @auth_as_inviter(invite_id_param="invite_id")
        async def delete_user_invite(invite_id: int, auth_context: AuthContext = Depends(get_current_auth_context)):
            """Delete a user invite by ID"""
            # Enforce as_inviter requirement
            require_as_inviter(auth_context, invite_id)
            
            success = self.user_invite_service.delete_user_invite(invite_id)
            if not success:
                raise HTTPException(status_code=404, detail="Invite not found")
            return {"message": "Invite deleted"}

        @self.app.post("/api/invite/use", response_model=UserInviteResponse)
        @auth_none()
        async def use_user_invite(user_invite_use: UserInviteUse, auth_context: AuthContext = Depends(get_current_auth_context)):
            """Use a user invite to create a new user"""
            try:
                user_invite = self.user_invite_service.use_user_invite(
                    invite_code=user_invite_use.invite_code,
                    name=user_invite_use.name,
                    username=user_invite_use.username,
                    email=user_invite_use.email,
                    password=user_invite_use.password
                )
                return UserInviteResponse.from_orm(user_invite)
            except Exception as e:
                raise HTTPException(status_code=400, detail=str(e))

        # ===== Game Routes =====

        @self.app.post("/api/games", response_model=GameResponse)
        @auth_logged_in()
        async def create_game(game: GameCreate, auth_context: AuthContext = Depends(get_current_auth_context)):
            """Create a new game"""
            # Enforce logged in requirement
            require_logged_in(auth_context)
            
            try:
                return self.game_service.create_game(
                    x_user_id=game.x_user_id,
                    o_user_id=game.o_user_id
                )
            except Exception as e:
                raise HTTPException(status_code=400, detail=str(e))

        @self.app.get("/api/games/{game_id}", response_model=GameResponse)
        @auth_as_id_in_game(game_id_param="game_id")
        async def get_game(game_id: int, auth_context: AuthContext = Depends(get_current_auth_context)):
            """Get a game by ID with full state"""
            # Enforce as_id_in_game requirement
            require_as_id_in_game(auth_context, game_id)
            
            try:
                return self.game_service.get_game(game_id)
            except Exception as e:
                raise HTTPException(status_code=400, detail=str(e))

        @self.app.get("/api/games/{game_id}/ascii", response_model=str)
        @auth_as_id_in_game(game_id_param="game_id")
        async def get_game_ascii(game_id: int, auth_context: AuthContext = Depends(get_current_auth_context)):
            """Get a game's ASCII representation"""
            # Enforce as_id_in_game requirement
            require_as_id_in_game(auth_context, game_id)
            
            try:
                return PlainTextResponse(content=self.game_service.get_game_ascii(game_id))
            except Exception as e:
                raise HTTPException(status_code=400, detail=str(e))

        @self.app.get("/api/games", response_model=List[GameResponse])
        @auth_admin()
        async def list_games(auth_context: AuthContext = Depends(get_current_auth_context)):
            """List all games"""
            # Enforce admin requirement
            require_admin(auth_context)
            
            games = self.game_service.list_games()
            return [GameResponse.from_orm(g) for g in games]

        
        @self.app.get("/api/games/user/{user_id}", response_model=List[GameResponse])
        @auth_as_id(param_name="user_id")
        async def list_games_by_user(user_id: int, auth_context: AuthContext = Depends(get_current_auth_context)):
            """List all games for a specific user"""
            # Enforce as_id requirement
            require_as_id(auth_context, user_id)
            
            games = self.game_service.list_games_by_user(user_id)
            return [GameResponse.from_orm(g) for g in games]

        @self.app.get("/api/games/user/{user_id}/your-turn", response_model=List[GameResponse])
        @auth_as_id(param_name="user_id")
        async def list_games_user_turn(user_id: int, auth_context: AuthContext = Depends(get_current_auth_context)):
            """List games where it's the user's turn"""
            # Enforce as_id requirement
            require_as_id(auth_context, user_id)
            
            games = self.game_service.list_games_user_turn(user_id)
            result = []
            for g in games:
                try:
                    game_data = self.game_service.get_game(g.id)
                    result.append(game_data)
                except Exception as e:
                    # Skip games that fail to load
                    print(f"Error loading game {g.id}: {e}")
            return result
            return result

        @self.app.get("/api/games/user/{user_id}/opponent-turn", response_model=List[GameResponse])
        @auth_as_id(param_name="user_id")
        async def list_games_opponent_turn(user_id: int, auth_context: AuthContext = Depends(get_current_auth_context)):
            """List games where it's the opponent's turn"""
            # Enforce as_id requirement
            require_as_id(auth_context, user_id)
            
            games = self.game_service.list_games_opponent_turn(user_id)
            result = []
            for g in games:
                try:
                    game_data = self.game_service.get_game(g.id)
                    result.append(game_data)
                except Exception as e:
                    # Skip games that fail to load
                    print(f"Error loading game {g.id}: {e}")
            return result
            return result

        @self.app.get("/api/games/user/{user_id}/finished", response_model=List[GameResponse])
        @auth_as_id(param_name="user_id")
        async def list_games_finished(user_id: int, auth_context: AuthContext = Depends(get_current_auth_context)):
            """List finished games for a user"""
            # Enforce as_id requirement
            require_as_id(auth_context, user_id)
            
            games = self.game_service.list_games_finished(user_id)
            result = []
            for g in games:
                try:
                    game_data = self.game_service.get_game(g.id)
                    result.append(game_data)
                except Exception as e:
                    # Skip games that fail to load
                    print(f"Error loading game {g.id}: {e}")
            return result
            return result

        @self.app.post("/api/games/{game_id}/turn", response_model=GameResponse)
        @auth_as_id_in_game(game_id_param="game_id")
        async def take_turn(game_id: int, turn: GameTurn, auth_context: AuthContext = Depends(get_current_auth_context)):
            """Execute a turn in a game"""
            # Enforce as_id_in_game requirement
            require_as_id_in_game(auth_context, game_id)
            
            player = 'X' if auth_context.user_id == self.game_service.get_game(game_id)["x_user_id"] else 'O'

            try:
                return self.game_service.take_turn(
                    game_id=game_id,
                    player=player,
                    corner=turn.corner,
                    position=turn.position
                )
            except Exception as e:
                raise HTTPException(status_code=400, detail=str(e))

        @self.app.delete("/api/games/{game_id}")
        @auth_admin()
        async def delete_game(game_id: int, auth_context: AuthContext = Depends(get_current_auth_context)):
            """Delete a game (admin only)"""
            # Enforce admin requirement
            require_admin(auth_context)
            
            try:
                self.game_service.delete_game(game_id)
                return {"message": f"Game {game_id} deleted successfully"}
            except Exception as e:
                raise HTTPException(status_code=400, detail=str(e))

        @self.app.post("/api/game-invites", response_model=GameInviteResponse)
        @auth_logged_in()
        async def create_game_invite(invite: GameInviteCreate, auth_context: AuthContext = Depends(get_current_auth_context)):
            """Create a game invite"""
            require_logged_in(auth_context)
            
            try:
                return self.game_invite_service.create_game_invite(
                    from_user_id=auth_context.user_id,
                    to_user_id=invite.to_user_id,
                    inviter_has_preferred_symbol=invite.inviter_has_preferred_symbol,
                    preferred_symbol=invite.preferred_symbol
                )
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.get("/api/game-invites/", response_model=List[GameInviteResponse])
        @auth_admin()
        async def list_all_game_invites(auth_context: AuthContext = Depends(get_current_auth_context)):
            """List game invites"""
            require_admin(auth_context)
            
            try:
                invites = self.game_invite_service.get_all_invites()
                return invites
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.get("/api/game-invites/unused", response_model=List[GameInviteResponse])
        @auth_admin()
        async def list_all_unused_game_invites(auth_context: AuthContext = Depends(get_current_auth_context)):
            """List all unreviewed game invites"""
            require_admin(auth_context)
            
            try:
                invites = self.game_invite_service.get_all_unused_invites()
                return invites
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.get("/api/game-invites/{invite_id}", response_model=GameInviteResponse)
        @auth_logged_in()
        async def get_game_invite(invite_id: int, auth_context: AuthContext = Depends(get_current_auth_context)):
            """Get a game invite by ID"""
            require_logged_in(auth_context)
            
            try:
                invite = self.game_invite_service.get_game_invite(invite_id)
                # Verify the current user is either the inviter or invitee
                if auth_context.user_id != invite.from_user_id and auth_context.user_id != invite.to_user_id:
                    raise HTTPException(status_code=403, detail="You do not have permission to view this invite")
                return invite
            except ValueError as e:
                raise HTTPException(status_code=404, detail=str(e))
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.get("/api/game-invites/user/{user_id}", response_model=List[GameInviteResponse])
        @auth_as_id(param_name="user_id")
        async def list_game_invites_for_user(user_id: int, auth_context: AuthContext = Depends(get_current_auth_context)):
            """Get all pending game invites for a user (as recipient)"""
            # Enforce as_id requirement
            require_as_id(auth_context, user_id)
            
            try:
                invites = self.game_invite_service.get_invites_for_user(user_id)
                return invites
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.post("/api/game-invites/{invite_id}/accept")
        @auth_logged_in()
        async def accept_game_invite(invite_id: int, accept_data: GameInviteAccept, auth_context: AuthContext = Depends(get_current_auth_context)):
            """Accept a game invite"""
            require_logged_in(auth_context)
            
            try:
                # Get the invite first to check permissions
                invite = self.game_invite_service.get_game_invite(invite_id)
                if auth_context.user_id != invite.to_user_id:
                    raise HTTPException(status_code=403, detail="You do not have permission to accept this invite")
                
                game = self.game_invite_service.respond_to_game_invite(
                    invite_id=invite_id,
                    accepted=True,
                    preferred_symbol=accept_data.preferred_symbol
                )
                if not game:
                    raise HTTPException(status_code=500, detail="Failed to create game")
                return {"game_id": game.id}
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.post("/api/game-invites/{invite_id}/decline")
        @auth_logged_in()
        async def decline_game_invite(invite_id: int, auth_context: AuthContext = Depends(get_current_auth_context)):
            """Decline a game invite"""
            require_logged_in(auth_context)
            
            try:
                # Get the invite first to check permissions
                invite = self.game_invite_service.get_game_invite(invite_id)
                if auth_context.user_id != invite.to_user_id:
                    raise HTTPException(status_code=403, detail="You do not have permission to decline this invite")
                
                self.game_invite_service.respond_to_game_invite(
                    invite_id=invite_id,
                    accepted=False,
                    preferred_symbol=None
                )
                return {"status": "declined"}
            except ValueError as e:
                raise HTTPException(status_code=400, detail=str(e))
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

    def run(self, host: str = "0.0.0.0", port: int = 8080):
        """Run the server"""
        import uvicorn
        uvicorn.run(self.app, host=host, port=port)
