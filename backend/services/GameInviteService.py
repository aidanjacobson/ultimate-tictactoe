import random
from database.schema import SessionLocal, GameInviteRequest
from services.GameService import GameService
from services.NotificationService import NotificationService
from sqlalchemy.orm import joinedload

class GameInviteService:
    def __init__(self, game_service: GameService, notification_service: NotificationService):
        self.db = SessionLocal()
        self.game_service = game_service
        self.notification_service = notification_service

    def create_game_invite(self,
        from_user_id: int,
        to_user_id: int,
        inviter_has_preferred_symbol: bool|None = None,
        preferred_symbol: str|None = None
    ) -> GameInviteRequest:
        # Validate users are different
        if from_user_id == to_user_id:
            raise ValueError("Cannot send a game invite to yourself")
        
        # if a preferred_symbol is provided, make sure it's X or O
        if inviter_has_preferred_symbol and preferred_symbol not in ['X', 'O']:
            raise ValueError("preferred_symbol must be 'X' or 'O' if inviter_has_preferred_symbol is True")

        invite_request = GameInviteRequest(
            from_user_id=from_user_id,
            to_user_id=to_user_id,
            inviter_has_preferred_symbol=inviter_has_preferred_symbol or False,
            preferred_symbol=preferred_symbol
        )
        self.db.add(invite_request)
        self.db.commit()
        self.db.refresh(invite_request)
        return invite_request

    def get_game_invite(self, invite_id: int) -> GameInviteRequest:
        """Retrieve a game invite by ID"""
        invite = self.db.query(GameInviteRequest).filter(GameInviteRequest.id == invite_id).first()
        if not invite:
            raise ValueError(f"Invite with ID {invite_id} does not exist")
        return invite

    def respond_to_game_invite(self,
        invite_id: int,
        accepted: bool,
        preferred_symbol: str|None = None
    ):
        invite = self.db.query(GameInviteRequest).filter(GameInviteRequest.id == invite_id).first()
        if not invite:
            raise ValueError(f"Invite with ID {invite_id} does not exist")

        # if not accepted: mark as reviewed, accepted false, notify sending user
        if not accepted:
            invite.reviewed = True
            invite.accepted = False
            self.db.commit()
            self.notification_service.send_notification(
                user_id=invite.from_user_id,
                title="Game Invite Declined",
                message=f"Your game invite to user {invite.to_user_id} was declined."
            )
            return None

        # the invite is accepted
        invite.reviewed = True
        invite.accepted = True

        # if the inviter had a preferred symbol, assign accordingly
        if invite.inviter_has_preferred_symbol and invite.preferred_symbol in ['X', 'O']:
            x_user_id = invite.from_user_id if invite.preferred_symbol == 'X' else invite.to_user_id
            o_user_id = invite.to_user_id if invite.preferred_symbol == 'X' else invite.from_user_id

        # if the inviter did not have a preferred symbol, and the invitee provided one, assign accordingly
        elif preferred_symbol in ['X', 'O']:
            x_user_id = invite.to_user_id if preferred_symbol == 'X' else invite.from_user_id
            o_user_id = invite.from_user_id if preferred_symbol == 'X' else invite.to_user_id

        # otherwise, assign randomly
        else:
            if random.choice([True, False]):
                x_user_id = invite.from_user_id
                o_user_id = invite.to_user_id
            else:
                x_user_id = invite.to_user_id
                o_user_id = invite.from_user_id

        self.db.commit()
        self.db.refresh(invite)

        inviter_symbol = 'X' if x_user_id == invite.from_user_id else 'O'

        # notify the inviter
        self.notification_service.send_notification(
            user_id=invite.from_user_id,
            title="Game Invite Accepted",
            message=f"Your game invite to user {invite.to_user_id} was accepted. A new game has been created. You are playing as '{inviter_symbol}'."
        )

        # create the game and return it
        game_data = self.game_service.create_game(x_user_id=x_user_id, o_user_id=o_user_id)
        return game_data

    def get_invites_for_user(self, user_id: int) -> list:
        """Get all pending game invites for a user (as recipient)"""
        return self.db.query(GameInviteRequest).options(
            joinedload(GameInviteRequest.from_user),
            joinedload(GameInviteRequest.to_user)
        ).filter(
            GameInviteRequest.to_user_id == user_id,
            GameInviteRequest.reviewed == False
        ).order_by(GameInviteRequest.id.desc()).all()