export type TaskCategory = 'diaria' | 'semanal' | 'mensal';
export type TaskUrgency = 'baixa' | 'media' | 'alta' | 'critica';

// Novos: listas e rótulos partilhados (formulário, cartão e dashboard usam os mesmos)
export const TASK_URGENCIES: TaskUrgency[] = ['baixa', 'media', 'alta', 'critica'];

export const URGENCY_LABELS: Record<TaskUrgency, string> = {
    baixa: 'Baixa',
    media: 'Média',
    alta: 'Alta',
    critica: 'Crítica'
};

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
    diaria: 'Diária',
    semanal: 'Semanal',
    mensal: 'Mensal'
};

export interface ParticipantContribution {
    userId: string;
    userName: string;
    actionsCompleted: number;
}

export interface Task {
    id: number;
    title: string;
    description: string;
    category: TaskCategory;
    urgency: TaskUrgency;
    xpReward: number;
    coinReward: number;
    completed: boolean;
    failed?: boolean;
    dueDate?: string;
    due_date?: string;
    isCooperative: boolean;
    participants?: ParticipantContribution[] | string[];
    acknowledgedBy?: string[];
    acknowledged_by?: string[];
    profile_id?: string;
    subtasks?: any[];
}

/** Convite para uma missão em conjunto, com o nome de quem convidou. */
export interface PendingInvite {
    task: Task;
    inviterName: string;
}
