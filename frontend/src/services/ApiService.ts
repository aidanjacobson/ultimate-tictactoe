import type { GameCreate, GameResponse, GameTurn } from "../datamodels/tictactoe";
import type { UserCreate, UserResponse, UserUpdate } from "../datamodels/users";

const API_BASE = "/api"

function getAuthToken(): string | null {
    return ""; // Placeholder for actual token retrieval logic
}

export class ApiService {
    private static handleError(error: unknown): never {
        if (error instanceof Response) {
            throw new Error(`API Error: ${error.statusText}`)
        }
        throw error
    }

    private static async request<T>(
        method: string,
        endpoint: string,
        body?: unknown
    ): Promise<T> {
        const url = `${API_BASE}${endpoint}`
        const options: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        }

        const token = getAuthToken()
        if (token) {
            options.headers = {
                ...options.headers,
                'Authorization': `Bearer ${token}`,
            }
        }

        if (body) {
            options.body = JSON.stringify(body)
        }

        const response = await fetch(url, options)
        if (!response.ok) {
            this.handleError(response)
        }
        return response.json()
    }

    // Health check
    static async healthCheck(): Promise<{ status: string }> {
        return this.request('GET', '/health')
    }

    static async createUser(userCreateRequest: UserCreate): Promise<UserResponse> {
        return this.request('POST', '/users', userCreateRequest)
    }

    static async getUser(userId: number): Promise<UserResponse> {
        return this.request('GET', `/users/${userId}`)
    }

    static async getUsers(): Promise<UserResponse[]> {
        return this.request('GET', '/users')
    }

    static async getUserByUsername(username: string): Promise<UserResponse> {
        return this.request('GET', `/users/username/${username}`)
    }

    static async updateUser(userId: number, userUpdateRequest: Partial<UserUpdate>): Promise<UserResponse> {
        return this.request('PUT', `/users/${userId}`, userUpdateRequest)
    }

    static async deleteUser(userId: number): Promise<UserResponse> {
        return this.request('DELETE', `/users/${userId}`)
    }

    static async createGame(createGameRequest: GameCreate): Promise<GameResponse> {
        return this.request('POST', '/games', createGameRequest);
    }

    static async getGame(gameId: number): Promise<GameResponse> {
        return this.request('GET', `/games/${gameId}`);
    }

    static async getGames(): Promise<GameResponse[]> {
        return this.request('GET', '/games');
    }
    
    static async takeTurn(gameId: number, turn: GameTurn): Promise<GameResponse> {
        return this.request('POST', `/games/${gameId}/turns`, turn);
    }
}

export default ApiService;