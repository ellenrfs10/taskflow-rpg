import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, finalize, from, map, of, switchMap, tap, throwError } from 'rxjs';
import { PendingInvite, Task, TaskCategory, TaskUrgency, TASK_URGENCIES } from '../models/task.model';
import { GamificationService } from './gamification.service';
import { SupabaseService } from './supabase-service';

const CATEGORIES: TaskCategory[] = ['diaria', 'semanal', 'mensal'];

/** "Média" -> "media": tira acentos e maiúsculas para aceitar valores antigos da BD. */
const plain = (value: unknown): string =>
    String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function normalizeParticipants(participants: unknown): any[] {
    if (!Array.isArray(participants)) return [];
    return participants
        .map((p: any) => {
            if (typeof p === 'string') return { userId: p, userName: '', actionsCompleted: 0 };
            if (p && typeof p === 'object') {
                return {
                    userId: p.userId || p.id || p.user_id,
                    userName: p.userName || p.name || '',
                    actionsCompleted: p.actionsCompleted ?? p.actions_completed ?? 0
                };
            }
            return null;
        })
        .filter((p: any) => p && p.userId);
}

function extractParticipantIds(participants: unknown): string[] {
    if (!Array.isArray(participants)) return [];
    return participants
        .map((p: any) => (typeof p === 'string' ? p : p?.userId || p?.id || p?.user_id))
        .filter((id: unknown): id is string => typeof id === 'string' && id.length > 0);
}

/** Converte uma linha da BD (snake_case) numa Task (camelCase) com valores válidos. */
export function mapDbTaskToModel(item: any): Task {
    const participants = normalizeParticipants(item.participants);
    const urgency = plain(item.urgency);
    const category = plain(item.category);

    return {
        id: item.id,
        title: item.title,
        description: item.description || '',
        category: (CATEGORIES as string[]).includes(category) ? (category as TaskCategory) : 'diaria',
        urgency: (TASK_URGENCIES as string[]).includes(urgency) ? (urgency as TaskUrgency) : 'media',
        completed: item.completed ?? false,
        xpReward: item.xp_reward ?? 20,
        coinReward: item.coin_reward ?? 10,
        dueDate: item.due_date || undefined,
        isCooperative: item.is_cooperative ?? participants.length > 0,
        participants,
        acknowledgedBy: Array.isArray(item.acknowledged_by) ? item.acknowledged_by : [],
        profile_id: item.profile_id || undefined
    };
}

/**
 * Única fonte de verdade das missões.
 * Quem decide QUANDO carregar é o AppComponent (ao entrar) e a página de missões (ao abrir).
 */
@Injectable({ providedIn: 'root' })
export class TaskService {
    private client = inject(SupabaseService).supabaseClient;
    private gamification = inject(GamificationService);
    private readonly db = this.client as any;

    private readonly _tasks = signal<Task[]>([]);
    private readonly _loading = signal<boolean>(false);

    /** Só o serviço escreve; os componentes só leem. */
    readonly tasks = this._tasks.asReadonly();
    readonly loading = this._loading.asReadonly();
    readonly error = signal<string | null>(null);

    private readonly userId = computed(() => this.gamification.userProfile().id);

    // ---- Regras partilhadas: Dashboard, lista de missões e menu usam as mesmas ----

    /** Missões minhas, ou cooperativas que já aceitei. */
    readonly myTasks = computed(() => {
        const me = this.userId();
        if (!me) return [];
        return this._tasks().filter(
            (t) =>
                !t.profile_id ||
                t.profile_id === me ||
                (t.isCooperative && (t.acknowledgedBy ?? []).includes(me))
        );
    });

    readonly pendingTasks = computed(() => this.myTasks().filter((t) => !t.completed));
    readonly completedTasks = computed(() => this.myTasks().filter((t) => t.completed));

    /** Convites de missões em conjunto que ainda não aceitei. */
    readonly pendingInvites = computed<PendingInvite[]>(() => {
        const me = this.userId();
        if (!me) return [];
        const profiles = this.gamification.profiles();

        return this._tasks()
            .filter((t) => {
                if (!t.isCooperative || t.profile_id === me) return false;
                const participants = (t.participants ?? []) as any[];
                const invited = participants.some((p) => (typeof p === 'string' ? p === me : p?.userId === me));
                return invited && !(t.acknowledgedBy ?? []).includes(me);
            })
            .map((task) => ({
                task,
                inviterName: profiles.find((p) => p.id === task.profile_id)?.name || 'Alguém'
            }));
    });

    /** Cada carregamento recebe um número; respostas atrasadas (de outra conta) são ignoradas. */
    private loadSeq = 0;

    private query<T>(request: PromiseLike<{ data: any; error: any }>): Observable<T> {
        return from(request).pipe(
            map((res) => {
                if (res.error) throw res.error;
                return res.data as T;
            })
        );
    }

    loadTasks(): void {
        const requestId = ++this.loadSeq;
        this._loading.set(true);
        this.error.set(null);

        from(this.client.auth.getSession())
            .pipe(
                switchMap(({ data }) => {
                    if (!data.session) return of<Task[]>([]); // sem sessão não há missões
                    return this.query<any[]>(
                        this.db.from('tasks').select('*').order('id', { ascending: false })
                    ).pipe(map((rows) => rows.map((row) => mapDbTaskToModel(row))));
                }),
                finalize(() => {
                    if (requestId === this.loadSeq) this._loading.set(false);
                })
            )
            .subscribe({
                next: (tasks) => {
                    if (requestId === this.loadSeq) this._tasks.set(tasks);
                },
                error: (err) => {
                    if (requestId !== this.loadSeq) return;
                    console.error('Erro ao carregar tarefas:', err);
                    this.error.set('Não foi possível carregar as missões. Tenta novamente.');
                }
            });
    }

    /** Limpa o estado (logout) e invalida qualquer carregamento ainda a decorrer. */
    clear(): void {
        this.loadSeq++;
        this._tasks.set([]);
        this._loading.set(false);
        this.error.set(null);
    }

    addTask(taskData: any): Observable<Task> {
        return from(this.client.auth.getSession()).pipe(
            switchMap(({ data }) => {
                const user = data.session?.user;
                if (!user) return throwError(() => new Error('Utilizador não autenticado'));

                const isCoop = taskData.isCooperative ?? false;
                const payload = {
                    title: taskData.title,
                    description: taskData.description || '',
                    category: taskData.category || 'diaria',
                    urgency: taskData.urgency || 'media',
                    completed: false,
                    xp_reward: Number(taskData.xpReward) || 20,
                    coin_reward: Number(taskData.coinReward) || 10,
                    due_date: taskData.dueDate || null,
                    is_cooperative: isCoop,
                    participants: isCoop ? extractParticipantIds(taskData.participants) : [],
                    acknowledged_by: [],
                    created_at: new Date().toISOString(),
                    profile_id: user.id
                };

                return this.query<any>(this.db.from('tasks').insert([payload]).select().single());
            }),
            map((row) => mapDbTaskToModel(row)),
            tap((task) => this._tasks.update((list) => [task, ...list]))
        );
    }

    updateTask(task: Task): Observable<Task> {
        const isCoop = task.isCooperative ?? false;
        const payload = {
            title: task.title,
            description: task.description,
            category: task.category,
            urgency: task.urgency,
            completed: task.completed,
            xp_reward: task.xpReward,
            coin_reward: task.coinReward,
            due_date: task.dueDate || null,
            is_cooperative: isCoop,
            participants: isCoop ? extractParticipantIds(task.participants) : []
        };

        return this.query<any>(
            this.db.from('tasks').update(payload).eq('id', task.id).select().single()
        ).pipe(
            map((row) => mapDbTaskToModel(row)),
            tap((updated) => this.replaceInList(updated))
        );
    }

    acknowledgeInvitation(task: Task, userId: string): Observable<Task> {
        const current = Array.isArray(task.acknowledgedBy) ? task.acknowledgedBy : [];
        if (current.includes(userId)) return of(task);

        return this.query<any>(
            this.db
                .from('tasks')
                .update({ acknowledged_by: [...current, userId] })
                .eq('id', task.id)
                .select()
                .single()
        ).pipe(
            map((row) => mapDbTaskToModel(row)),
            tap((updated) => this.replaceInList(updated))
        );
    }

    deleteTask(id: number): Observable<void> {
        return this.query<any[]>(this.db.from('tasks').delete().eq('id', Number(id)).select()).pipe(
            tap((deleted) => {
                // Se as regras (RLS) bloquearem, o Supabase não dá erro: devolve 0 linhas
                if (deleted.length === 0) throw new Error('Sem permissão para eliminar esta missão.');
            }),
            tap(() => this._tasks.update((list) => list.filter((t) => t.id !== Number(id)))),
            map(() => undefined)
        );
    }

    private replaceInList(updated: Task): void {
        this._tasks.update((list) => list.map((t) => (t.id === updated.id ? updated : t)));
    }
}
