export interface UserProfile {
    id: string;
    name: string;
    email: string
    avatar: string;
    level: number;
    currentXp: number;
    maxXp: number;
    coins: number;
    streakDays: number;
    active: boolean;
}

export interface FamilyMember {
    id: string;
    name: string;
    email: string;
    avatar: string;
    role: 'Pai/Mãe' | 'Filho(a)' | 'Amigo/Amiga' | 'Marido' | 'Esposa';
    level: number;
    currentXp: number;
    maxXp: number;
    coins: number;
    streakDays: number;
    active: boolean;
}