from database.schema import SessionLocal, Notification
from datetime import datetime, UTC

class NotificationService:
    def __init__(self):
        self.db = SessionLocal()

    def send_notification(self, user_id: int, title: str|None, message: str) -> Notification:
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            read=False,
            created_at=int(datetime.now(UTC).timestamp())
        )
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def get_notifications_for_user(self, user_id: int) -> list[Notification]:
        return self.db.query(Notification).filter(Notification.user_id == user_id).all()

    def mark_notification_as_read(self, notification_id: int) -> None:
        notification = self.db.query(Notification).filter(Notification.id == notification_id).first()
        if not notification:
            raise ValueError(f"Notification with ID {notification_id} does not exist")
        notification.read = True
        self.db.commit()

    def mark_user_notifications_as_read(self, user_id: int) -> None:
        notifications = self.db.query(Notification).filter(Notification.user_id == user_id, Notification.read == False).all()
        for notification in notifications:
            notification.read = True
        self.db.commit()