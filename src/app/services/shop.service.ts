import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Reward, RewardCategory } from '../models/reward.model';

@Injectable({
    providedIn: 'root'
})
export class ShopService {
    private platformId = inject(PLATFORM_ID);
    private readonly STORAGE_KEY = 'taskflow_shop_rewards';

    private initialRewards: Reward[] = [
        {
            id: '1',
            title: '30 Minutos de Videojogo',
            description: 'Tempo extra de consola ou PC',
            cost: 50,
            icon: '🎮',
            category: 'Lazer'
        },
        {
            id: '2',
            title: 'Escolher o Jantar de Sexta',
            description: 'Direito a escolher a refeição da família',
            cost: 100,
            icon: '🍕',
            category: 'Comida'
        },
        {
            id: '3',
            title: 'Dormir 1 Hora Mais Tarde',
            description: 'Válido para fins de semana ou férias',
            cost: 80,
            icon: '🌙',
            category: 'Privilégios'
        },
        {
            id: '4',
            title: 'Ir ao Cinema',
            description: 'Bilhete para ver um filme à escolha',
            cost: 150,
            icon: '🍿',
            category: 'Lazer'
        }
    ];

    readonly rewards = signal<Reward[]>(this.loadRewards());

    private loadRewards(): Reward[] {
        if (isPlatformBrowser(this.platformId)) {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            return saved ? JSON.parse(saved) : this.initialRewards;
        }
        return this.initialRewards;
    }

    private saveToStorage(rewards: Reward[]) {
        if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(rewards));
        }
    }

    // Adicionar novo prémio
    addReward(reward: Omit<Reward, 'id'>) {
        const newReward: Reward = {
            ...reward,
            id: Date.now().toString()
        };
        const updated = [...this.rewards(), newReward];
        this.rewards.set(updated);
        this.saveToStorage(updated);
    }

    // Eliminar um prémio
    deleteReward(id: string) {
        const updated = this.rewards().filter(r => r.id !== id);
        this.rewards.set(updated);
        this.saveToStorage(updated);
    }
}