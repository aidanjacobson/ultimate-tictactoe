"""
Authentication system for Ultimate TicTacToe API.

Provides:
- JWT token creation and validation
- AuthContext with user ID and admin status
- get_current_auth_context dependency for injection
- Auth decorator markers for route protection
- Enforcement helper functions
"""

from fastapi import Depends, HTTPException, status, Request
from typing import Optional, Callable
from datetime import datetime, timedelta
import jwt
from services.UserService import UserService
import os

# Secret key for JWT encoding/decoding
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "secret-key")
ALGORITHM = "HS256"


class AuthContext:
    """Context object containing authenticated user information"""
    def __init__(self, user_id: Optional[int] = None, is_admin: bool = False):
        self.user_id = user_id
        self.is_admin = is_admin
    
    def __repr__(self):
        return f"AuthContext(user_id={self.user_id}, is_admin={self.is_admin})"


def create_token(user_id: int, expires_in_minutes: int = 1440) -> str:
    """
    Create a JWT token for a user.
    
    Args:
        user_id: The user ID to encode
        expires_in_minutes: Token expiration time in minutes (default: 24 hours)
    
    Returns:
        JWT token string
    """
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(minutes=expires_in_minutes)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    """
    Decode and validate a JWT token.
    
    Args:
        token: JWT token string
    
    Returns:
        Decoded payload dict, or None if token is invalid
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


async def get_current_auth_context(request: Request) -> AuthContext:
    """
    Dependency that extracts auth context from request Bearer token.
    
    Returns AuthContext even if no token provided (user_id=None, is_admin=False).
    Only raises HTTPException if token is provided but invalid.
    
    This allows routes to be flexible about whether auth is required or optional.
    """
    auth_header = request.headers.get("Authorization")
    
    if not auth_header:
        # No token provided - return empty context
        return AuthContext()
    
    try:
        scheme, token = auth_header.split()
        if scheme.lower() != "bearer":
            # Invalid scheme - return empty context
            return AuthContext()
    except ValueError:
        # Malformed header - return empty context
        return AuthContext()
    
    # Token was provided, so decode it
    payload = decode_token(token)
    
    if not payload:
        # Token is invalid or expired
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    user_id = payload.get("user_id")
    
    # Get user info including admin status
    user_service = UserService()
    user = user_service.get_user_by_id(user_id)
    
    if not user:
        # User not found
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return AuthContext(user_id=user_id, is_admin=user.admin)


# ===== Auth Decorators (markers for later enforcement) =====

def auth_none():
    """Route requires no authentication"""
    def decorator(func: Callable) -> Callable:
        func._auth_type = "none"
        return func
    return decorator


def auth_logged_in():
    """Route requires authenticated user (valid token)"""
    def decorator(func: Callable) -> Callable:
        func._auth_type = "logged_in"
        return func
    return decorator


def auth_as_id(param_name: str = "user_id"):
    """Route requires user to be accessing their own data (user_id path param) or be admin"""
    def decorator(func: Callable) -> Callable:
        func._auth_type = "as_id"
        func._auth_param = param_name
        return func
    return decorator


def auth_admin():
    """Route requires user to be an admin"""
    def decorator(func: Callable) -> Callable:
        func._auth_type = "admin"
        return func
    return decorator


def auth_as_id_in_game(game_id_param: str = "game_id"):
    """Route requires user to be a player in the specified game (game_id path param) or be admin"""
    def decorator(func: Callable) -> Callable:
        func._auth_type = "as_id_in_game"
        func._auth_param = game_id_param
        return func
    return decorator

def auth_as_inviter(invite_id_param: str = "invite_id"):
    """Route requires user to be the inviter of the specified invite (invite_id path param) or be admin"""
    def decorator(func: Callable) -> Callable:
        func._auth_type = "as_inviter"
        func._auth_param = invite_id_param
        return func
    return decorator

# ===== Auth enforcement helpers =====

def require_logged_in(auth_context: AuthContext):
    """Check that user is logged in, raise 401 if not"""
    if auth_context.user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )


def require_admin(auth_context: AuthContext):
    """Check that user is admin, raise 401 if not authenticated or 403 if not admin"""
    if auth_context.user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    if not auth_context.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )


def require_as_id(auth_context: AuthContext, target_user_id: int):
    """Check that user is accessing their own data or is admin"""
    if auth_context.user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    if auth_context.user_id != target_user_id and not auth_context.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this resource"
        )


def require_as_id_in_game(auth_context: AuthContext, game_id: int):
    """Check that user is a player in the specified game or is admin"""
    from database.schema import SessionLocal, Game
    
    if auth_context.user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    db = SessionLocal()
    game = db.query(Game).filter(Game.id == game_id).first()
    db.close()
    
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found"
        )
    
    if auth_context.user_id not in [game.x_user_id, game.o_user_id] and not auth_context.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a player in this game"
        )

def require_as_inviter(auth_context: AuthContext, invite_id: int):
    """Check that user is the inviter of the specified invite or is admin"""
    from database.schema import SessionLocal, UserInvite
    
    if auth_context.user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    db = SessionLocal()
    invite = db.query(UserInvite).filter(UserInvite.id == invite_id).first()
    db.close()
    
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invite not found"
        )
    
    if auth_context.user_id != invite.invited_by_id and not auth_context.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not the inviter of this invite"
        )