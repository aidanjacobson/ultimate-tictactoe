import argparse
import os

from database.schema import init_db
from server import Server


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", type=str, help="Path to data directory")
    args = parser.parse_args()

    if args.data_dir:
        os.environ["DATA_DIR"] = args.data_dir

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
