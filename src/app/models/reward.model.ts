
export type RewardCategory = 'Geral' | 'Lazer' | 'Privilégios' | 'Comida' | 'Especial' | 'Descanso';

export interface Reward {
    id: string;
    title: string;
    description: string;
    cost: number; 
    icon?: string;
    category: RewardCategory;
}