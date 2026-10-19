export interface Reward {
    id: number;
    title: string;
    description: string;
    cost: number;
    icon: string;
    category: 'lazer' | 'descanso' | 'comida' | 'especial';
}