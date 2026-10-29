export interface Profile {
    id: string;
    name: string;
    email: string;
    avatar: string;
    role: string;
    idAvatar: number | null;
    idRole: number | null;
    level: number;
    currentXp: number;
    maxXp: number;
    coins: number;
    streakDays: number;
    active: boolean;
    lastActiveDate: string | null;
    household_id?: string | null;
    profile_completed?: boolean;
    setup_mode?: 'alone' | 'together' | null;
}
