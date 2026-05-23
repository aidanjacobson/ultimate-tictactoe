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
    password_must_reset?: boolean;
}

export interface GameRecordResponse {
    id: number;
    x_user_id: number;
    o_user_id: number;
    winner_id: number | null;
    created_at: string | null;
    opponent: UserResponse | null;
    outcome: 'win' | 'loss' | 'tie';
}

export interface ActiveGameRecord {
    id: number;
    x_user_id: number;
    o_user_id: number;
    created_at: string | null;
    x_user: UserResponse | null;
    o_user: UserResponse | null;
}

export interface UserStatsResponse {
    id: number;
    name: string;
    username: string;
    created_at: string | null;
    is_admin: boolean;
    wins: number;
    losses: number;
    ties: number;
    total_games: number;
    win_ratio: number;
    loss_ratio: number;
    tie_ratio: number;
    recent_games: GameRecordResponse[];
    active_games: ActiveGameRecord[];
}