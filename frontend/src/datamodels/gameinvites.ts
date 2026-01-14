import type { UserResponse } from './users';

export interface GameInviteResponse {
    id: number;
    from_user_id: number;
    to_user_id: number;
    inviter_has_preferred_symbol: boolean;
    preferred_symbol: string | null;
    reviewed: boolean;
    accepted: boolean | null;
    from_user?: UserResponse | null;
    to_user?: UserResponse | null;
}
