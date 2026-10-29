export type TaskCategory = 'diaria' | 'semanal' | 'mensal';
export type TaskUrgency = 'baixa' | 'media' | 'alta' | 'critica';

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
