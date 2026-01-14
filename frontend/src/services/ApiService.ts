import type { GameCreate, GameResponse, GameTurn } from "../datamodels/tictactoe";
import type { UserCreate, UserResponse, UserUpdate } from "../datamodels/users";

const API_BASE = "/api"
const TOKEN_KEY = 'auth_token'

function getAuthToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
}

function setAuthToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token)
}

function clearAuthToken(): void {
    localStorage.removeItem(TOKEN_KEY)
}

export interface LoginRequest {
    username: string
    password: string
}

export interface LoginResponse {
    token: string
    user: UserResponse
}

export class ApiService {
    private static handleError(error: unknown): never {
        if (error instanceof Response) {
            // Clear token on 401 Unauthorized
            if (error.status === 401) {
                clearAuthToken();
            }
            throw new Error(`API Error: ${error.status} ${error.statusText}`)
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

    // Auth
    static async login(credentials: LoginRequest): Promise<LoginResponse> {
        const response = await this.request<LoginResponse>('POST', '/login', credentials)
        setAuthToken(response.token)
        return response
    }

    static logout(): void {
        clearAuthToken()
    }

    static getToken(): string | null {
        return getAuthToken()
    }

    // Health check
    static async healthCheck(): Promise<{ status: string }> {
        return this.request('GET', '/health')
    }

    // Validate token
    static async validate(): Promise<UserResponse> {
        return this.request('GET', '/validate')
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

    // Invites
    static async createUserInvite(inviteCode: string | null, expiryDays: number | null): Promise<any> {
        return this.request('POST', '/invite', {
            invite_code: inviteCode,
            expiry_days: expiryDays,
        });
    }

    static async useUserInvite(inviteCode: string, name: string, username: string, email: string, password: string): Promise<any> {
        return this.request('POST', '/invite/use', {
            invite_code: inviteCode,
            name,
            username,
            email,
            password,
        });
    }
}

export default ApiService;