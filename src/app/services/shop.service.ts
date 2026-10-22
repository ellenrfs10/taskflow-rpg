import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase-service';
import { Reward } from '../models/reward.model';
import { from } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ShopService {
    private supabaseService = inject(SupabaseService);
    private client = this.supabaseService.supabaseClient;

    // Signal reativo para a lista de prémios da loja
    readonly rewards = signal<Reward[]>([]);

    // Lista de prémios pré-prontos para a loja
    private initialRewards = [
        {
            title: 'Noite de Cinema',
            description: 'Escolher o filme e direito a pipocas.',
            cost: 50,
            icon: '🍿',
            category: 'Lazer',
            created_at: new Date().toISOString()
        },
        {
            title: 'Massagem Relaxante',
            description: '15 minutos de pausa com direito a massagem.',
            cost: 80,
            icon: '💆‍♂️',
            category: 'Bem-estar',
            created_at: new Date().toISOString()
        },
        {
            title: 'Escolher o Jantar',
            description: 'Decidir o que vai ser pedido ou cozinhado hoje.',
            cost: 40,
            icon: '🍕',
            category: 'Alimentação',
            created_at: new Date().toISOString()
        },
        {
            title: '1 Hora de Videogames / Série',
            description: 'Tempo livre extra sem interrupções.',
            cost: 30,
            icon: '🎮',
            category: 'Lazer',
            created_at: new Date().toISOString()
        }
    ];

    constructor() {
        this.loadRewards();
    }

    // Carregar todos os prémios da base de dados
    loadRewards() {
        const promise = (this.client as any)
            .from('rewards')
            .select('*')
            .order('id', { ascending: false });

        from(promise).subscribe({
            next: (response: any) => {
                const { data, error } = response;
                if (error) {
                    console.error('Erro ao carregar prémios:', error);
                    return;
                }

                if (data && data.length > 0) {
                    const mappedRewards = data.map((item: any) => ({
                        id: item.id.toString(),
                        title: item.title,
                        description: item.description || '',
                        cost: item.cost,
                        icon: item.icon || '🎁',
                        category: item.category || 'Geral'
                    })) as Reward[];

                    this.rewards.set(mappedRewards);
                } else {
                    // Se a tabela estiver vazia, insere os prémios pré-prontos
                    this.seedInitialRewards();
                }
            },
            error: (err) => console.error('Erro de comunicação com o Supabase:', err)
        });
    }

    private seedInitialRewards() {
        const promise = (this.client as any)
            .from('rewards')
            .insert(this.initialRewards)
            .select();

        from(promise).subscribe({
            next: () => this.loadRewards(),
            error: (err) => console.error('Erro ao popular prémios iniciais:', err)
        });
    }

    // Adicionar novo prémio à base de dados
    addReward(reward: Omit<Reward, 'id'>) {
        const dbPayload = {
            title: reward.title,
            description: reward.description || '',
            cost: Number(reward.cost),
            icon: reward.icon || '🎁',
            category: reward.category || 'Geral',
            created_at: new Date().toISOString() // Obrigatório visto que a coluna não tem default no Supabase
        };

        const promise = (this.client as any)
            .from('rewards')
            .insert([dbPayload])
            .select();

        from(promise).subscribe({
            next: (response: any) => {
                const { error } = response;
                if (error) {
                    console.error('Erro ao criar prémio:', error);
                    return;
                }
                this.loadRewards();
            },
            error: (err) => console.error('Erro ao adicionar prémio:', err)
        });
    }

    // Eliminar um prémio da base de dados
    deleteReward(id: string) {
        const promise = (this.client as any)
            .from('rewards')
            .delete()
            .eq('id', Number(id));

        from(promise).subscribe({
            next: (response: any) => {
                const { error } = response;
                if (error) {
                    console.error('Erro ao eliminar prémio:', error);
                    return;
                }
                this.rewards.update(list => list.filter(r => r.id !== id));
            },
            error: (err) => console.error('Erro ao eliminar prémio:', err)
        });
    }
}