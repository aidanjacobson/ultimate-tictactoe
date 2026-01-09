from typing import Optional, List
from database.schema import SessionLocal, User


class UserService:
    def __init__(self):
        self.db = SessionLocal()

    def create_user(self, name: str, username: str, email: str, hashed_password: str) -> User:
        """
        Create a new user.
        
        Args:
            name: The user's display name
            username: The unique username
            email: The user's email address
            hashed_password: The hashed password
        
        Returns:
            The created User object
        """
        user = User(
            name=name,
            username=username,
            email=email,
            hashed_password=hashed_password
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """
        Retrieve a user by ID (excludes deleted users).
        
        Args:
            user_id: The user's ID
        
        Returns:
            The User object, or None if not found or deleted
        """
        return self.db.query(User).filter(User.id == user_id, User.deleted == False).first()

    def get_user_by_username(self, username: str) -> Optional[User]:
        """
        Retrieve a user by username (excludes deleted users).
        
        Args:
            username: The username to search for
        
        Returns:
            The User object, or None if not found or deleted
        """
        return self.db.query(User).filter(User.username == username, User.deleted == False).first()

    def get_user_by_email(self, email: str) -> Optional[User]:
        """
        Retrieve a user by email (excludes deleted users).
        
        Args:
            email: The email to search for
        
        Returns:
            The User object, or None if not found or deleted
        """
        return self.db.query(User).filter(User.email == email, User.deleted == False).first()

    def get_all_users(self) -> List[User]:
        """
        Retrieve all users (excludes deleted users).
        
        Returns:
            A list of all non-deleted User objects
        """
        return self.db.query(User).filter(User.deleted == False).all()

    def update_user(self, user_id: int, **kwargs) -> Optional[User]:
        """
        Update a user's information.
        
        Args:
            user_id: The user's ID
            **kwargs: The fields to update (name, username, email, hashed_password)
        
        Returns:
            The updated User object, or None if not found
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        
        for key, value in kwargs.items():
            if hasattr(user, key) and key in ['name', 'username', 'email', 'hashed_password']:
                setattr(user, key, value)
        
        self.db.commit()
        self.db.refresh(user)
        return user

    def delete_user(self, user_id: int) -> bool:
        """
        Soft delete a user (marks as deleted instead of removing from database).
        
        Args:
            user_id: The user's ID
        
        Returns:
            True if the user was marked deleted, False if not found
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        
        user.deleted = True  # type: ignore
        self.db.commit()
        return True

    def close(self):
        """Close the database session."""
        self.db.close()
