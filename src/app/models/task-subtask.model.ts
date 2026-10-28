export interface TaskSubtask {
    id: number;
    taskId: number;
    title: string;
    assignedTo: string | null;
    assignedToName?: string | null;
    completed: boolean;
    completedBy: string | null;
    completedAt: string | null;
    sortOrder: number;
    createdAt: string;
}
