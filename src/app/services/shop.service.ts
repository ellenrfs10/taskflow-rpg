import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { Observable, finalize, from, map, switchMap, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Reward, RewardRow, toRewardCategory } from '../models/reward.model';
import { SupabaseService } from './supabase-service';

function toReward(row: RewardRow): Reward {
    return {
        id: String(row.id),
        title: row.title,
        description: row.description ?? '',
        cost: row.cost,
        icon: row.icon ?? '🎁',
        category: toRewardCategory(row.category)
    };
}

/**
 * Prémios da loja, lidos e gravados com HttpClient na API REST do Supabase
 * (https://<projeto>.supabase.co/rest/v1/rewards).
 */
@Injectable({ providedIn: 'root' })
export class ShopService {
    private http = inject(HttpClient);
    private client = inject(SupabaseService).supabaseClient;
    private platformId = inject(PLATFORM_ID);

    private readonly apiUrl = `${environment.supabaseUrl}/rest/v1/rewards`;

    private readonly _rewards = signal<Reward[]>([]);
    readonly rewards = this._rewards.asReadonly();

    /** Começa a true: até o primeiro pedido terminar, a loja mostra "A carregar". */
    readonly loading = signal(true);
    readonly error = signal<string | null>(null);

    /** Cabeçalhos exigidos pelo Supabase: a chave pública e, se houver sessão, o token do utilizador. */
    private headers(): Observable<HttpHeaders> {
        return from(this.client.auth.getSession()).pipe(
            map(({ data }) => {
                let headers = new HttpHeaders({
                    apikey: environment.supabaseKey,
                    Prefer: 'return=representation'
                });
                const token = data.session?.access_token;
                if (token) headers = headers.set('Authorization', `Bearer ${token}`);
                return headers;
            })
        );
    }

    loadRewards(): void {
        // No servidor (SSR/prerender) não há sessão: o pedido só faz sentido no browser
        if (!isPlatformBrowser(this.platformId)) return;

        this.loading.set(true);
        this.error.set(null);

        this.headers()
            .pipe(
                switchMap((headers) =>
                    this.http.get<RewardRow[]>(this.apiUrl, {
                        headers,
                        params: { select: '*', order: 'id.desc' }
                    })
                ),
                map((rows) => rows.map(toReward)),
                finalize(() => this.loading.set(false))
            )
            .subscribe({
                next: (rewards) => this._rewards.set(rewards),
                error: () => this.error.set('Não foi possível carregar os prémios. Tenta novamente.')
            });
    }

    addReward(reward: Omit<Reward, 'id'>): Observable<Reward> {
        const body = {
            title: reward.title.trim(),
            description: reward.description?.trim() || '',
            cost: Number(reward.cost),
            icon: reward.icon || '🎁',
            category: reward.category,
            created_at: new Date().toISOString() // a coluna não tem default no Supabase
        };

        return this.headers().pipe(
            switchMap((headers) => this.http.post<RewardRow[]>(this.apiUrl, body, { headers })),
            map((rows) => toReward(rows[0])),
            tap((created) => this._rewards.update((list) => [created, ...list]))
        );
    }

    deleteReward(id: string): Observable<void> {
        return this.headers().pipe(
            switchMap((headers) =>
                this.http.delete<RewardRow[]>(this.apiUrl, { headers, params: { id: `eq.${id}` } })
            ),
            tap((deleted) => {
                // Se as regras (RLS) bloquearem, o Supabase não dá erro: devolve 0 linhas
                if (deleted.length === 0) throw new Error('Sem permissão para eliminar este prémio.');
            }),
            tap(() => this._rewards.update((list) => list.filter((r) => r.id !== id))),
            map(() => undefined)
        );
    }
}
