from database.schema import init_db
from database.migrations import repair_winner_ids
from server import Server
from services.UserService import UserService
from services.UserInviteService import UserInviteService
from services.GameInviteService import GameInviteService
from services.TicTacToeService import TicTacToeService
from services.GameFileService import GameFileService
from services.GameService import GameService
from services.NotificationService import NotificationService

import os
from dotenv import load_dotenv

def setup_services():
    notification_service = NotificationService()
    user_service = UserService()
    user_invite_service = UserInviteService(user_service=user_service, notification_service=notification_service)
    tictactoe_service = TicTacToeService()
    game_file_service = GameFileService(tictactoe_service=tictactoe_service)
    game_service = GameService(
        game_file_service=game_file_service,
        user_service=user_service,
        notification_service=notification_service
    )
    game_invite_service = GameInviteService(game_service=game_service, notification_service=notification_service)

    # Start the server
    print("Starting server on http://0.0.0.0:8080")
    server = Server(
        user_service=user_service,
        game_service=game_service,
        user_invite_service=user_invite_service,
        game_invite_service=game_invite_service,
        notification_service=notification_service
    )
    server.run()

def main():
    # Load environment variables from .env.dev
    load_dotenv(".env.dev")
    
    # Initialize database tables
    print("Initializing database...")
    init_db()
    print("Database initialized successfully")

    # Run database migrations
    print("Running database migrations...")
    repair_winner_ids()

    # Initialize default admin user if no users exist
    print("Checking for users...")
    user_service = UserService()
    all_users = user_service.get_all_users()
    
    if not all_users:
        print("No users found. Creating default admin user...")
        admin_username = os.getenv("DEFAULT_ADMIN_USERNAME", "admin")
        admin_password = os.getenv("DEFAULT_ADMIN_PASSWORD", "password")
        admin_email = os.getenv("DEFAULT_ADMIN_EMAIL", "admin@admin.com")
        
        try:
            admin_user = user_service.create_user(
                name="Administrator",
                username=admin_username,
                email=admin_email,
                password=admin_password,
                admin=True
            )
            print(f"Default admin user created: {admin_username}")
        except Exception as e:
            print(f"Warning: Could not create default admin user: {e}")
    else:
        print(f"Found {len(all_users)} existing user(s)")

    setup_services()


if __name__ == "__main__":
    main()
