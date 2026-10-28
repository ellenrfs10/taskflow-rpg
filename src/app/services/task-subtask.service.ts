import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase-service';
import { from, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { TaskSubtask } from '../models/task-subtask.model';

@Injectable({
    providedIn: 'root'
})
export class TaskSubtaskService {
    private supabaseService = inject(SupabaseService);
    private client = this.supabaseService.supabaseClient;

    private map(row: any): TaskSubtask {
        return {
            id: row.id,
            taskId: row.task_id,
            title: row.title,
            assignedTo: row.assigned_to,
            completed: row.completed ?? false,
            completedBy: row.completed_by,
            completedAt: row.completed_at,
            sortOrder: row.sort_order ?? 0,
            createdAt: row.created_at
        };
    }

    getByTask(taskId: number): Observable<TaskSubtask[]> {
        const promise = (this.client as any)
            .from('task_subtasks')
            .select('*')
            .eq('task_id', taskId)
            .order('sort_order', { ascending: true });

        return from(promise).pipe(
            map((res: any) => {
                if (res.error) throw res.error;
                return (res.data || []).map((r: any) => this.map(r));
            })
        );
    }

    add(taskId: number, title: string, assignedTo: string | null = null): Observable<TaskSubtask> {
        const payload = {
            task_id: taskId,
            title,
            assigned_to: assignedTo,
            completed: false,
            sort_order: 0
        };

        const promise = (this.client as any)
            .from('task_subtasks')
            .insert([payload])
            .select()
            .single();

        return from(promise).pipe(
            map((res: any) => {
                if (res.error) throw res.error;
                return this.map(res.data);
            })
        );
    }

    toggle(subtask: TaskSubtask): Observable<TaskSubtask> {
        const newCompleted = !subtask.completed;

        // Se estiver a desmarcar, basta limpar quem concluiu e a data
        if (!newCompleted) {
            const payload = {
                completed: false,
                completed_by: null,
                completed_at: null
            };

            const promise = (this.client as any)
                .from('task_subtasks')
                .update(payload)
                .eq('id', subtask.id)
                .select()
                .single();

            return from(promise).pipe(
                map((res: any) => {
                    if (res.error) throw res.error;
                    return this.map(res.data);
                })
            );
        }

        // Se estiver a marcar como concluída, temos de obter o utilizador autenticado
        return from(this.client.auth.getUser()).pipe(
            switchMap(({ data, error }: any) => {
                if (error) throw error;

                const user = data?.user;
                if (!user) throw new Error('Utilizador não autenticado');

                const payload = {
                    completed: true,
                    completed_by: user.id,
                    completed_at: new Date().toISOString()
                };

                const promise = (this.client as any)
                    .from('task_subtasks')
                    .update(payload)
                    .eq('id', subtask.id)
                    .select()
                    .single();

                return from(promise);
            }),
            map((res: any) => {
                if (res.error) throw res.error;
                return this.map(res.data);
            })
        );
    }

    assign(subtaskId: number, profileId: string | null): Observable<TaskSubtask> {
        const promise = (this.client as any)
            .from('task_subtasks')
            .update({ assigned_to: profileId })
            .eq('id', subtaskId)
            .select()
            .single();

        return from(promise).pipe(
            map((res: any) => {
                if (res.error) throw res.error;
                return this.map(res.data);
            })
        );
    }

    remove(subtaskId: number): Observable<any> {
        const promise = (this.client as any)
            .from('task_subtasks')
            .delete()
            .eq('id', subtaskId);

        return from(promise).pipe(
            map((res: any) => {
                if (res.error) throw res.error;
                return res;
            })
        );
    }
}
