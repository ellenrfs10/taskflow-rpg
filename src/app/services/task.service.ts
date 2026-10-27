import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase-service';
import { Task } from '../models/task.model';
import { Observable, from } from 'rxjs';
import { map, tap, switchMap } from 'rxjs/operators';
import { GamificationService } from './gamification.service';

@Injectable({
    providedIn: 'root'
})
export class TaskService {
    private supabaseService = inject(SupabaseService);
    private client = this.supabaseService.supabaseClient;
    private gamificationService = inject(GamificationService);

    readonly tasks = signal<Task[]>([]);

    private initialTasks = [
        {
            title: 'Limpar a Cozinha',
            description: 'Lavar a louça acumulada e limpar as bancadas.',
            category: 'Casa',
            urgency: 'Média',
            completed: false,
            xp_reward: 30,
            coin_reward: 15,
            due_date: null,
            is_cooperative: false,
            participants: [],
            created_at: new Date().toISOString()
        },
        {
            title: 'Fazer Compras no Supermercado',
            description: 'Comprar os ingredientes para as refeições da semana.',
            category: 'Compras',
            urgency: 'Alta',
            completed: false,
            xp_reward: 50,
            coin_reward: 25,
            due_date: null,
            is_cooperative: false,
            participants: [],
            created_at: new Date().toISOString()
        },
        {
            title: 'Organizar o Espaço de Trabalho',
            description: 'Arrumar a secretária e organizar os documentos.',
            category: 'Trabalho',
            urgency: 'Baixa',
            completed: false,
            xp_reward: 20,
            coin_reward: 10,
            due_date: null,
            is_cooperative: false,
            participants: [],
            created_at: new Date().toISOString()
        },
        {
            title: 'Caminhada de 30 minutos',
            description: 'Manter o corpo ativo ao ar livre.',
            category: 'Saúde',
            urgency: 'Média',
            completed: false,
            xp_reward: 40,
            coin_reward: 20,
            due_date: null,
            is_cooperative: false,
            participants: [],
            created_at: new Date().toISOString()
        }
    ];

    constructor() {
        this.loadTasks();
    }

    private mapDbTaskToModel(item: any): Task {
        return {
            id: item.id,
            title: item.title,
            description: item.description || '',
            category: item.category || 'Geral',
            urgency: item.urgency || 'Normal',
            completed: item.completed ?? false,
            xpReward: item.xp_reward ?? item.xpReward ?? 20,
            coinReward: item.coin_reward ?? item.coinReward ?? 10,
            dueDate: item.due_date || item.dueDate || '',
            isCooperative: item.is_cooperative ?? item.isCooperative ?? false,
            participants: item.participants || []
        };
    }

    getTasks(): Observable<Task[]> {
        const promise = (this.client as any)
            .from('tasks')
            .select('*')
            .order('id', { ascending: false });

        return from(promise).pipe(
            map((response: any) => {
                if (response.error) throw response.error;
                const rawData = response.data || [];
                return rawData.map((item: any) => this.mapDbTaskToModel(item));
            }),
            tap((data: Task[]) => {
                if (data.length > 0) {
                    this.tasks.set(data);
                } else {
                    this.seedInitialTasks();
                }
            })
        );
    }

    loadTasks() {
        this.getTasks().subscribe({
            error: (err: any) => console.error('Erro ao carregar tarefas:', err)
        });
    }

    private seedInitialTasks() {
        from(this.client.auth.getUser()).pipe(
            switchMap(({ data: { user } }) => {
                if (!user) throw new Error('Utilizador não autenticado');

                const tasksWithUser = this.initialTasks.map(t => ({
                    ...t,
                    profile_id: user.id
                }));

                const promise = (this.client as any)
                    .from('tasks')
                    .insert(tasksWithUser)
                    .select();

                return from(promise);
            })
        ).subscribe({
            next: (res: any) => {
                if (res.error) {
                    console.error('Erro ao popular tarefas iniciais:', res.error);
                    return;
                }
                const p2 = (this.client as any).from('tasks').select('*');
                from(p2).subscribe((res2: any) => {
                    if (res2.data) {
                        const mapped = res2.data.map((item: any) => this.mapDbTaskToModel(item));
                        this.tasks.set(mapped);
                    }
                });
            },
            error: (err: any) => console.error('Erro ao popular tarefas iniciais:', err)
        });
    }

    addTask(taskData: any): Observable<Task> {
        return from(this.client.auth.getUser()).pipe(
            switchMap(({ data: { user } }) => {
                if (!user) {
                    throw new Error('Utilizador não autenticado');
                }

                const payload = {
                    title: taskData.title,
                    description: taskData.description || '',
                    category: taskData.category || 'Geral',
                    urgency: taskData.urgency || 'Normal',
                    completed: false,
                    xp_reward: Number(taskData.xpReward ?? taskData.xp_reward) || 20,
                    coin_reward: Number(taskData.coinReward ?? taskData.coin_reward) || 10,
                    due_date: taskData.dueDate ?? taskData.due_date ?? null,
                    is_cooperative: taskData.isCooperative ?? taskData.is_cooperative ?? false,
                    participants: taskData.participants || [], // <-- Garante o envio dos participantes
                    created_at: new Date().toISOString(),
                    profile_id: user.id
                };

                const promise = (this.client as any)
                    .from('tasks')
                    .insert([payload])
                    .select()
                    .single();

                return from(promise);
            }),
            map((response: any) => {
                if (response.error) throw response.error;
                const newTask = this.mapDbTaskToModel(response.data);
                this.tasks.update(list => [newTask, ...list]);
                return newTask;
            })
        );
    }

    updateTask(task: Task): Observable<Task> {
        const payload = {
            title: task.title,
            description: task.description,
            category: task.category,
            urgency: task.urgency,
            completed: task.completed,
            xp_reward: task.xpReward,
            coin_reward: task.coinReward,
            due_date: task.dueDate || null,
            is_cooperative: task.isCooperative,
            participants: task.participants || [] // <-- Garante a atualização dos participantes
        };

        const promise = (this.client as any)
            .from('tasks')
            .update(payload)
            .eq('id', task.id)
            .select()
            .single();

        return from(promise).pipe(
            map((response: any) => {
                if (response.error) throw response.error;
                const updated = this.mapDbTaskToModel(response.data);
                this.tasks.update(list => list.map(t => t.id === updated.id ? updated : t));
                return updated;
            })
        );
    }

    toggleTask(id: number) {
        const task = this.tasks().find(t => t.id === id);
        if (!task) return;

        const newCompletedState = !task.completed;
        const updatedTask = { ...task, completed: newCompletedState };

        this.updateTask(updatedTask).subscribe({
            next: () => {
                if (newCompletedState) {
                    this.gamificationService.addRewards(task.xpReward, task.coinReward);
                }
            },
            error: (err: any) => console.error('Erro ao alternar tarefa:', err)
        });
    }

    deleteTask(id: number): Observable<any> {
        const promise = (this.client as any)
            .from('tasks')
            .delete()
            .eq('id', Number(id));

        return from(promise).pipe(
            map((response: any) => {
                if (response.error) throw response.error;
                this.tasks.update(list => list.filter(t => t.id !== Number(id)));
                return response.data;
            })
        );
    }
}