# Copilot Instructions for Ultimate TicTacToe

## Architecture Overview
This is a full-stack ultimate TicTacToe game with a FastAPI backend (Python) and React+TypeScript+Vite frontend. The backend manages users, game state, and persistence; the frontend handles UI and user interaction.

**Key Design Pattern**: Three-layer persistence strategy unique to this codebase:
- **Database Layer** ([database/schema.py](database/schema.py)): SQLite with SQLAlchemy ORM stores User and Game *records* (metadata only: player IDs, finished status, winner)
- **File Layer** ([backend/services/GameFileService.py](backend/services/GameFileService.py)): Game state serialized to JSON files in `devdata/games/` directory—this is the source of truth for actual game board state
- **Memory Layer** ([datamodels/tictactoe.py](datamodels/tictactoe.py)): Python dataclasses (`SubTicTacToeGame`, `UltimateTicTacToeGameState`, `UltimateTicTacToe`) hold in-memory game logic

**Data Flow**: Game turn → TicTacToeService validates move → GameFileService saves to JSON → Database record updated only when game finishes.

## Critical Service Boundaries

### Backend Services
1. **UserService** ([backend/services/UserService.py](backend/services/UserService.py)): CRUD operations for users; supports soft-delete (deleted flag in DB)
2. **TicTacToeService** ([backend/services/TicTacToeService.py](backend/services/TicTacToeService.py)): Game logic validation only—move legality, win detection. Does NOT handle persistence
3. **GameFileService** ([backend/services/GameFileService.py](backend/services/GameFileService.py)): Orchestrates game persistence—loads/saves JSON, updates DB records, calls TicTacToeService

### API Endpoints Structure ([backend/server.py](backend/server.py))
- **User routes**: `/api/users/*` (create, read, update, delete)
- **Game routes**: `/api/games*` (create, get game by ID, list games, take turn)
- Static files served from `/app/www` (frontend build output)

## Running the Project

### Backend
```bash
cd backend && pip install -r requirements.txt
python main.py  # Initializes DB and starts server on http://0.0.0.0:8080
```

### Frontend
```bash
cd frontend
npm install
npm run dev      # Runs Vite dev server with HMR
npm run build    # Builds to dist/ for production
npm run lint     # ESLint check
```

### Docker
```bash
docker build -t tictactoe .  # Multi-stage: builds frontend, copies to backend
docker run -p 8080:8000 tictactoe
```

### Testing
```bash
cd backend && python test.py  # Integration test; creates users and game, plays moves
```

## Code Patterns & Conventions

### Game State Mutations
- **Never mutate** game state directly; always go through `GameFileService.take_turn()` which calls `TicTacToeService.take_turn()` then auto-saves
- Positions in subgames use naming: `topleft`, `topmiddle`, `topright`, `middleleft`, `center`, `middleright`, `bottomleft`, `bottommiddle`, `bottomright`
- `activeCorner` in game state: empty string `''` means any corner allowed; non-empty means player must play in that corner

### Database Patterns
- All models use SQLAlchemy with `from_attributes=True` in Pydantic response classes for ORM object serialization
- Users have soft-delete support (always filter `User.deleted == False` in queries)
- Foreign key relationships: `User.games_as_x`, `User.games_as_o`, `User.games_won` for querying user's games

### Dataclass Serialization
- `SubTicTacToeGame.to_dict()` and full game state use `asdict()` for JSON serialization
- Game history stored as list of moves in `UltimateTicTacToe.history`

## Development Tips

1. **Database Reset**: Delete `devdata/app.db` to start fresh; `init_db()` runs on server startup
2. **Game File Format**: JSON files in `devdata/games/` are human-readable; inspect them to debug game state
3. **Frontend HMR**: Vite dev server auto-reloads on changes; no manual rebuild needed during development
4. **Type Safety**: Frontend uses TypeScript strict mode; backend has Pydantic validation on all routes
5. **Error Handling**: Service methods raise `ValueError` with descriptive messages; API routes wrap these as 400 HTTPExceptions

## Integration Points
- Frontend fetches from `/api/` endpoints (backend must be running on same host or CORS configured)
- Frontend build artifacts go to `www/` during Docker build, served as static files by FastAPI
- Game state is JSON-serializable by design for persistence and API responses
