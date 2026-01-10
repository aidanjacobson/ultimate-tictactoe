export interface UserCreate {
    name: string;
    username: string;
    email: string;
    password: string;
}

export interface UserUpdate {
    name?: string;
    username?: string;
    email?: string;
    password?: string;
}

export interface UserResponse {
    id: number;
    name: string;
    username: string;
}