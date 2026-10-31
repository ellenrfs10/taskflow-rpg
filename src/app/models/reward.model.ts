// Fonte única das categorias: formulário, filtros e mapeamento usam esta lista.
export const REWARD_CATEGORIES = ['Geral', 'Lazer', 'Privilégios', 'Guloseimas'] as const;
export type RewardCategory = (typeof REWARD_CATEGORIES)[number];

export interface Reward {
    id: string;
    title: string;
    description: string;
    cost: number;
    icon?: string;
    category: RewardCategory;
}

/** Linha da tabela `rewards` tal como a API REST do Supabase a devolve. */
export interface RewardRow {
    id: number;
    title: string;
    description: string | null;
    cost: number;
    icon: string | null;
    category: string | null;
}

/** Categorias antigas da base de dados (ex.: "Bem-estar") passam a "Geral". */
export function toRewardCategory(value: string | null): RewardCategory {
    return (REWARD_CATEGORIES as readonly string[]).includes(value ?? '')
        ? (value as RewardCategory)
        : 'Geral';
}
