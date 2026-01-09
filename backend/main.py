from database.schema import init_db
from server import Server


def main():
    # Initialize database tables
    print("Initializing database...")
    init_db()
    print("Database initialized successfully")

    # Start the server
    print("Starting server on http://0.0.0.0:8080")
    server = Server()
    server.run()


if __name__ == "__main__":
    main()
