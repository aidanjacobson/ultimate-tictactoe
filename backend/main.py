from database.schema import init_db
from server import Server
from services.UserService import UserService
import os
from dotenv import load_dotenv


def main():
    # Load environment variables from .env.dev
    load_dotenv(".env.dev")
    
    # Initialize database tables
    print("Initializing database...")
    init_db()
    print("Database initialized successfully")

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

    # Start the server
    print("Starting server on http://0.0.0.0:8080")
    server = Server()
    server.run()


if __name__ == "__main__":
    main()
