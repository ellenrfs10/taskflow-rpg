import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase-service';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Profile {
    id: string;
    name: string;
    email: string;
    avatar: string;
    role: string;
    idAvatar: number | null;
    idRole: number | null;
    level: number;
    currentXp: number;
    maxXp: number;
    coins: number;
    streakDays: number;
    active: boolean;
    lastActiveDate: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class GamificationService {
    private supabaseService = inject(SupabaseService);
    private client = this.supabaseService.supabaseClient;

    readonly profiles = signal<Profile[]>([]);

    readonly userProfile = signal<Profile>({
        id: '',
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
        active: true,
        lastActiveDate: null
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
                const data = response.data as any[];
                const error = response.error;

                if (error) {
                    console.error('Erro ao carregar perfis:', error);
                    return;
                }

                if (data && data.length > 0) {
                    const mapped: Profile[] = data.map((item: any) => ({
                        id: item.id,
                        name: item.name,
                        email: item.email || '',
                        avatar: '🧙‍♂️',
                        role: 'Filho(a)',
                        idAvatar: item.id_avatar,
                        idRole: item.id_role,
                        level: item.level || 1,
                        currentXp: item.current_xp || 0,
                        maxXp: item.max_xp || 100,
                        coins: item.coins || 0,
                        streakDays: item.streak_days || 1,
                        active: item.active ?? true,
                        lastActiveDate: item.last_active_date || null
                    }));

                    this.profiles.set(mapped);
                    const active = mapped.find(p => p.active) || mapped[0];
                    this.userProfile.set(active);

                    this.checkAndUpdateStreak();
                } else {
                    this.seedDefaultProfile();
                }
            },
            error: (err: unknown) => console.error('Erro de ligação ao Supabase:', err)
        });
    }

    private async seedDefaultProfile() {
        const authResult = await this.client.auth.getUser();
        const user = authResult.data?.user;
        if (!user) return;

        const today = new Date().toISOString().split('T')[0];
        const initial = this.userProfile();
        const dbPayload = {
            id: user.id,
            name: user.user_metadata?.['name'] || initial.name,
            email: user.email || initial.email,
            id_avatar: initial.idAvatar,
            id_role: initial.idRole,
            level: initial.level,
            current_xp: initial.currentXp,
            max_xp: initial.maxXp,
            coins: initial.coins,
            streak_days: initial.streakDays,
            active: true,
            last_active_date: today
        };

        const promise = (this.client as any)
            .from('profile')
            .insert([dbPayload])
            .select();

        from(promise).subscribe({
            next: () => this.loadProfiles(),
            error: (err: unknown) => console.error('Erro ao criar perfil inicial:', err)
        });
    }

    checkAndUpdateStreak() {
        const active = this.userProfile();
        if (!active || !active.id) return;

        const todayStr = new Date().toISOString().split('T')[0];
        const lastActive = active.lastActiveDate;

        if (lastActive === todayStr) return;

        let newStreak = active.streakDays;

        if (!lastActive) {
            newStreak = 1;
        } else {
            const lastDate = new Date(lastActive);
            const currentDate = new Date(todayStr);
            const diffTime = currentDate.getTime() - lastDate.getTime();
            const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

            if (diffDays === 1) {
                newStreak += 1;
            } else if (diffDays > 1) {
                newStreak = 1;
            }
        }

        const dbPayload = {
            streak_days: newStreak,
            last_active_date: todayStr
        };

        const promise = (this.client as any)
            .from('profile')
            .update(dbPayload)
            .eq('id', active.id)
            .select();

        from(promise).subscribe({
            next: () => {
                const updated: Profile = {
                    ...active,
                    streakDays: newStreak,
                    lastActiveDate: todayStr
                };
                this.userProfile.set(updated);
                this.profiles.update(list =>
                    list.map(p => p.id === active.id ? updated : p)
                );
            },
            error: (err: unknown) => console.error('Erro ao atualizar streak:', err)
        });
    }

    switchActiveProfile(profileId: string) {
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
            this.checkAndUpdateStreak();
        }
    }

    async addProfile(name: string, email: string, avatarEmoji: string, roleName: string) {
        const authResult = await this.client.auth.getUser();
        const user = authResult.data?.user;
        if (!user) return;

        const today = new Date().toISOString().split('T')[0];
        const newProfileDb = {
            id: user.id,
            name,
            email,
            id_avatar: 1,
            id_role: 1,
            level: 1,
            current_xp: 0,
            max_xp: 100,
            coins: 30,
            streak_days: 1,
            active: false,
            last_active_date: today
        };

        const promise = (this.client as any)
            .from('profile')
            .insert([newProfileDb])
            .select();

        from(promise).subscribe({
            next: () => this.loadProfiles(),
            error: (err: unknown) => console.error('Erro ao adicionar novo perfil:', err)
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
            error: (err: unknown) => console.error('Erro ao atualizar recompensas:', err)
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
            error: (err: unknown) => console.error('Erro ao gastar moedas:', err)
        });

        return true;
    }

    updateAvatar(avatarId: number): Observable<any> {
        const active = this.userProfile();
        const promise = (this.client as any)
            .from('profile')
            .update({ id_avatar: avatarId })
            .eq('id', active.id)
            .select();

        return from(promise).pipe(
            map((response: any) => {
                if (response.error) throw response.error;
                const updated = { ...active, idAvatar: avatarId };
                this.userProfile.set(updated);
                this.profiles.update(list => list.map(p => p.id === active.id ? updated : p));
                return response.data;
            })
        );
    }
}