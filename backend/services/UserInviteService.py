from database.schema import SessionLocal, UserInvitation, User
from datetime import datetime, timedelta
from services.UserService import UserService
import secrets

class UserInviteService:
    def __init__(self, user_service: UserService):
        self.db = SessionLocal()
        self.user_service = user_service

    def generateRandomInviteCode(self) -> str:
        # Excludes ambiguous characters (0/O, 1/I) to reduce confusion
        alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
        length = 10  # reasonable: short enough to type, long enough to avoid collisions

        return "".join(secrets.choice(alphabet) for _ in range(length))

    def generateRandomUnusedInviteCode(self) -> str:
        while True:
            code = self.generateRandomInviteCode()
            existing = self.db.query(UserInvitation).filter(UserInvitation.invite_code == code).first()
            if not existing:
                return code

    def create_user_invitation(self, inviter_id: int, expiry_days: float = 7.0, invite_code: str|None = None) -> UserInvitation:
        """
        Create a new user invitation.
        
        Args:
            inviter_id: The ID of the user sending the invitation
            expiry_days: Number of days until the invitation expires
            invite_code: Optional custom invite code (if None, a random code will be generated)
        
        Returns:
            The created UserInvitation object
        """
        if invite_code is None:
            import uuid
            invite_code = self.generateRandomUnusedInviteCode()

        now_ts = int(datetime.utcnow().timestamp())
        expiry_ts = int((datetime.utcnow() + timedelta(days=expiry_days)).timestamp())

        invitation = UserInvitation(
            inviter_id=inviter_id,
            invite_code=invite_code,
            created_at=now_ts,
            expiry_at=expiry_ts
        )
        self.db.add(invitation)
        self.db.commit()
        self.db.refresh(invitation)
        return invitation
    

    def delete_user_invitation(self, invite_id: int) -> bool:
        """
        Delete a user invitation by ID.
        
        Args:
            invite_id: The ID of the invitation to delete
        
        Returns:
            True if deleted, False if not found
        """
        invitation = self.db.query(UserInvitation).filter(UserInvitation.id == invite_id).first()
        if not invitation:
            return False
        
        self.db.delete(invitation)
        self.db.commit()
        return True
    
    def use_invite_code(self, invite_code: str, name: str, username: str, email: str, password: str) -> User|None:
        """
        Use an invite code to create a new user.
        
        Args:
            invite_code: The invite code to use
            name: The user's display name
            username: The unique username
            email: The user's email address
            password: The plain password (will be hashed)
        
        Returns:
            The created User object, or None if the invite code is invalid or used
        """
        invitation = self.db.query(UserInvitation).filter(
            UserInvitation.invite_code == invite_code,
            UserInvitation.used == False,
            UserInvitation.expiry_at > int(datetime.utcnow().timestamp())
        ).first()
        
        if not invitation:
            return None  # Invalid or used invite code
        
        user = self.user_service.create_user(name, username, email, password)
        
        # Mark invitation as used
        invitation.used = True
        invitation.used_by_id = user.id
        invitation.used_at = int(datetime.utcnow().timestamp())
        self.db.commit()
        self.db.refresh(invitation)
        return user