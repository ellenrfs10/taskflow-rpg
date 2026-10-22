import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase-service';
import { from } from 'rxjs';

export interface Profile {
    id: number;
    name: string;
    email: string;
    avatar: string; // Propriedade visual para o HTML
    role: string;   // Propriedade visual para o HTML
    idAvatar: number | null;
    idRole: number | null;
    level: number;
    currentXp: number;
    maxXp: number;
    coins: number;
    streakDays: number;
    active: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class GamificationService {
    private supabaseService = inject(SupabaseService);
    private client = this.supabaseService.supabaseClient;

    readonly profiles = signal<Profile[]>([]);

    readonly userProfile = signal<Profile>({
        id: 1,
        name: 'Aventureiro',
        email: '',
        avatar: '🧙‍♂️',
        role: 'Individual',
        idAvatar: 1,
        idRole: 1,
        level: 1,
        currentXp: 0,
        maxXp: 100,
        coins: 50,
        streakDays: 1,
        active: true
    });

    constructor() {
        this.loadProfiles();
    }

    loadProfiles() {
        const promise = (this.client as any)
            .from('profile')
            .select('*');

        from(promise).subscribe({
            next: (response: any) => {
                const { data, error } = response;
                if (error) {
                    console.error('Erro ao carregar perfis:', error);
                    return;
                }

                if (data && data.length > 0) {
                    const mapped: Profile[] = data.map((item: any) => ({
                        id: item.id,
                        name: item.name,
                        email: item.email || '',
                        avatar: '🧙‍♂️', // Valor visual padrão para o HTML
                        role: 'Filho(a)',   // Valor visual padrão para o HTML
                        idAvatar: item.id_avatar,
                        idRole: item.id_role,
                        level: item.level || 1,
                        currentXp: item.current_xp || 0,
                        maxXp: item.max_xp || 100,
                        coins: item.coins || 0,
                        streakDays: item.streak_days || 1,
                        active: item.active ?? true
                    }));

                    this.profiles.set(mapped);
                    const active = mapped.find(p => p.active) || mapped[0];
                    this.userProfile.set(active);
                } else {
                    this.seedDefaultProfile();
                }
            },
            error: (err) => console.error('Erro de ligação ao Supabase:', err)
        });
    }

    private seedDefaultProfile() {
        const initial = this.userProfile();
        const dbPayload = {
            name: initial.name,
            email: initial.email,
            id_avatar: initial.idAvatar,
            id_role: initial.idRole,
            level: initial.level,
            current_xp: initial.currentXp,
            max_xp: initial.maxXp,
            coins: initial.coins,
            streak_days: initial.streakDays,
            active: initial.active
        };

        const promise = (this.client as any)
            .from('profile')
            .insert([dbPayload])
            .select();

        from(promise).subscribe({
            next: () => this.loadProfiles(),
            error: (err) => console.error('Erro ao criar perfil inicial:', err)
        });
    }

    switchActiveProfile(profileId: number) {
        const currentList = this.profiles();

        currentList.forEach(p => {
            const isActive = p.id === profileId;
            const promise = (this.client as any)
                .from('profile')
                .update({ active: isActive })
                .eq('id', p.id);

            from(promise).subscribe();
        });

        const updated = currentList.map(p => ({
            ...p,
            active: p.id === profileId
        }));

        this.profiles.set(updated);
        const newActive = updated.find(p => p.id === profileId);
        if (newActive) {
            this.userProfile.set(newActive);
        }
    }

    addProfile(name: string, email: string, avatarEmoji: string, roleName: string) {
        // Envia as chaves estrangeiras numéricas para a base de dados
        const newProfileDb = {
            name,
            email,
            id_avatar: 1,
            id_role: 1,
            level: 1,
            current_xp: 0,
            max_xp: 100,
            coins: 30,
            streak_days: 1,
            active: false
        };

        const promise = (this.client as any)
            .from('profile')
            .insert([newProfileDb])
            .select();

        from(promise).subscribe({
            next: () => this.loadProfiles(),
            error: (err) => console.error('Erro ao adicionar novo perfil:', err)
        });
    }

    addRewards(xp: number, coins: number) {
        const active = this.userProfile();
        let newXp = active.currentXp + xp;
        let newLevel = active.level;
        let newMaxXp = active.maxXp;

        if (newXp >= newMaxXp) {
            newXp -= newMaxXp;
            newLevel += 1;
            newMaxXp = Math.floor(newMaxXp * 1.2);
        }

        const newCoins = active.coins + coins;

        const dbPayload = {
            current_xp: newXp,
            level: newLevel,
            max_xp: newMaxXp,
            coins: newCoins
        };

        const promise = (this.client as any)
            .from('profile')
            .update(dbPayload)
            .eq('id', active.id)
            .select();

        from(promise).subscribe({
            next: () => {
                const updatedActive: Profile = {
                    ...active,
                    currentXp: newXp,
                    level: newLevel,
                    maxXp: newMaxXp,
                    coins: newCoins
                };
                this.userProfile.set(updatedActive);

                this.profiles.update(list =>
                    list.map(p => p.id === active.id ? updatedActive : p)
                );
            },
            error: (err) => console.error('Erro ao atualizar recompensas:', err)
        });
    }

    spendCoins(amount: number): boolean {
        const active = this.userProfile();
        if (active.coins < amount) return false;

        const newCoins = active.coins - amount;

        const promise = (this.client as any)
            .from('profile')
            .update({ coins: newCoins })
            .eq('id', active.id)
            .select();

        from(promise).subscribe({
            next: () => {
                const updatedActive: Profile = { ...active, coins: newCoins };
                this.userProfile.set(updatedActive);

                this.profiles.update(list =>
                    list.map(p => p.id === active.id ? updatedActive : p)
                );
            },
            error: (err) => console.error('Erro ao gastar moedas:', err)
        });

        return true;
    }
}