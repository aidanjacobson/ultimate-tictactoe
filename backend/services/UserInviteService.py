from datetime import datetime, timedelta
from database.schema import SessionLocal, UserInvite
from services.UserService import UserService
import random
import string

class UserInviteService:
    def __init__(self, user_service: UserService):
        self.db = SessionLocal()
        self.user_service = user_service

    def _generate_unique_invite_code(self) -> str:
        while True:
            invite_code = self._generate_invite_code()
            existing_invite = self.db.query(UserInvite).filter(UserInvite.invite_code == invite_code).first()
            if not existing_invite:
                return invite_code

    def _generate_invite_code(self) -> str:
        return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

    def create_user_invite(self, invited_by_id: int, invite_code: str|None, expiry_days: float = 7) -> UserInvite:
        if invite_code is None:
            invite_code = self._generate_unique_invite_code()

        if self.db.query(UserInvite).filter(UserInvite.invite_code == invite_code).first():
            raise ValueError(f"Invite code {invite_code} already exists")

        create_time = datetime.utcnow()
        expiry_time = create_time + timedelta(days=expiry_days)
        user_invite = UserInvite(
            invited_by_id=invited_by_id,
            invite_code=invite_code,
            created_at=int(create_time.timestamp()),
            expires_at=int(expiry_time.timestamp())
        )
        self.db.add(user_invite)
        self.db.commit()
        self.db.refresh(user_invite)
        return user_invite

    def delete_user_invite(self, invite_id: int) -> None:
        invite = self.db.query(UserInvite).filter(UserInvite.id == invite_id).first()
        if not invite:
            raise ValueError(f"Invite with ID {invite_id} does not exist")
        self.db.delete(invite)
        self.db.commit()

    def use_user_invite(self, invite_code: str, name: str, username: str, email: str, password: str) -> UserInvite:
        invite = self.db.query(UserInvite).filter(
            UserInvite.invite_code == invite_code,
            UserInvite.used == False,
            UserInvite.expires_at > int(datetime.utcnow().timestamp())
        ).first()

        if not invite:
            raise ValueError("Invalid or expired invite code")

        user = self.user_service.create_user(name, username, email, password)

        invite.used = True
        invite.used_by_user_id = user.id
        invite.used_at = int(datetime.utcnow().timestamp())
        self.db.commit()
        self.db.refresh(invite)
        return invite

    def get_user_invite(self, id: int) -> UserInvite|None:
        return self.db.query(UserInvite).filter(UserInvite.id == id).first()

    def get_user_invite_by_code(self, invite_code: str) -> UserInvite|None:
        return self.db.query(UserInvite).filter(UserInvite.invite_code == invite_code).first()

    def get_all_user_invites(self) -> list[UserInvite]:
        return self.db.query(UserInvite).all()

    def get_all_invites_by_user(self, user_id: int) -> list[UserInvite]:
        return self.db.query(UserInvite).filter(UserInvite.invited_by_id == user_id).all()