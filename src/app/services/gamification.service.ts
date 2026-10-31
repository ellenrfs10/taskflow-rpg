import { Injectable, inject, signal } from '@angular/core';
import { CatalogService } from './catalog.service';
import { SupabaseService } from './supabase-service';

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
    household_id?: string | null;
}

const DEFAULT_AVATAR = '🧙‍♂️';

function defaultProfile(): Profile {
    return {
        id: '',
        name: 'Aventureiro',
        email: '',
        avatar: DEFAULT_AVATAR,
        role: 'Aventureiro',
        idAvatar: 1,
        idRole: 1,
        level: 1,
        currentXp: 0,
        maxXp: 100,
        coins: 50,
        streakDays: 1,
        active: true,
        lastActiveDate: null,
        household_id: null
    };
}

/**
 * Estado do jogador (nível, XP, moedas, streak) e dos membros da casa.
 * Quem decide QUANDO carregar é o AppComponent: carrega ao entrar e limpa ao sair.
 */
@Injectable({ providedIn: 'root' })
export class GamificationService {
    private client = inject(SupabaseService).supabaseClient;
    private catalog = inject(CatalogService);
    private readonly db = this.client as any;

    /** Eu + membros da minha casa. */
    readonly profiles = signal<Profile[]>([]);
    /** O meu perfil. */
    readonly userProfile = signal<Profile>(defaultProfile());

    /** Evita tentar criar o perfil inicial em ciclo se a base de dados recusar. */
    private seedTried = false;

    private getLocalDateString(date: Date = new Date()): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /** Limpa tudo (logout): a conta seguinte não pode ver dados da anterior. */
    reset(): void {
        this.seedTried = false;
        this.profiles.set([]);
        this.userProfile.set(defaultProfile());
    }

    refreshProfile(): Promise<void> {
        return this.loadProfiles();
    }

    async loadProfiles(): Promise<void> {
        const { data: { session } } = await this.client.auth.getSession();
        const user = session?.user;
        if (!user) return; // sem sessão não há nada para carregar (e não insiste em loop)

        await this.catalog.load();

        const { data: mine, error } = await this.db
            .from('profile')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

        if (error) {
            console.error('Erro ao carregar perfil:', error);
            return;
        }

        if (!mine) {
            await this.seedDefaultProfile(user);
            return;
        }

        // Só vai buscar os membros da MINHA casa (e não todos os perfis da tabela)
        let rows: any[] = [mine];
        if (mine.household_id) {
            const { data: members, error: membersError } = await this.db
                .from('profile')
                .select('*')
                .eq('household_id', mine.household_id);
            if (!membersError && members?.length) rows = members;
        }

        const profiles = rows.map((row) => this.toProfile(row));
        this.profiles.set(profiles);

        const current = profiles.find((p) => p.id === user.id);
        if (current) {
            this.userProfile.set(current);
            await this.checkAndUpdateStreak();
        }
    }

    private toProfile(item: any): Profile {
        const avatar = this.catalog.avatars().find((a) => a.id === Number(item.id_avatar));
        const role = this.catalog.roles().find((r) => r.id === Number(item.id_role));
        return {
            id: item.id,
            name: item.name,
            email: item.email ?? '',
            avatar: avatar?.image_url ?? DEFAULT_AVATAR,
            role: role?.name ?? 'Aventureiro',
            idAvatar: item.id_avatar ?? null,
            idRole: item.id_role ?? null,
            level: item.level ?? 1,
            currentXp: item.current_xp ?? 0,
            maxXp: item.max_xp ?? 100,
            coins: item.coins ?? 0,
            streakDays: item.streak_days ?? 1,
            active: item.active ?? true,
            lastActiveDate: item.last_active_date ?? null,
            household_id: item.household_id ?? null
        };
    }

    /** Primeiro login: cria a linha base do perfil (sem sobrescrever uma existente). */
    private async seedDefaultProfile(user: { id: string; email?: string | null; user_metadata?: any }): Promise<void> {
        if (this.seedTried) return;
        this.seedTried = true;

        const initial = defaultProfile();
        const { error } = await this.db.from('profile').upsert(
            {
                id: user.id,
                name: user.user_metadata?.['name'] || initial.name,
                email: user.email || '',
                id_avatar: initial.idAvatar,
                id_role: initial.idRole,
                level: initial.level,
                current_xp: initial.currentXp,
                max_xp: initial.maxXp,
                coins: initial.coins,
                streak_days: initial.streakDays,
                active: true,
                last_active_date: this.getLocalDateString()
            },
            { onConflict: 'id', ignoreDuplicates: true }
        );

        if (error) {
            console.error('Erro ao criar perfil inicial:', error);
            return;
        }
        await this.loadProfiles();
    }

    /**
     * Cria o perfil no registo. Agora grava mesmo o avatar e a classe escolhidos
     * (os parâmetros chegam como texto: "3" -> 3).
     */
    async addProfile(name: string, email: string, avatarId: string | number, roleId: string | number): Promise<void> {
        const { data: { session } } = await this.client.auth.getSession();
        const user = session?.user;
        if (!user) return; // conta a aguardar confirmação de e-mail: o perfil nasce no primeiro login

        const initial = defaultProfile();
        const { error } = await this.db.from('profile').upsert(
            {
                id: user.id,
                name,
                email,
                id_avatar: Number(avatarId) || initial.idAvatar,
                id_role: Number(roleId) || initial.idRole,
                level: 1,
                current_xp: 0,
                max_xp: 100,
                coins: 30,
                streak_days: 1,
                active: true,
                last_active_date: this.getLocalDateString()
            },
            { onConflict: 'id' }
        );

        if (error) {
            console.error('Erro ao criar perfil:', error);
            throw error;
        }
        await this.loadProfiles();
    }

    async checkAndUpdateStreak(): Promise<void> {
        const active = this.userProfile();
        if (!active.id) return;

        const today = this.getLocalDateString();
        if (active.lastActiveDate === today) return;

        let newStreak = 1;
        if (active.lastActiveDate) {
            const [y, m, d] = active.lastActiveDate.slice(0, 10).split('-').map(Number);
            const last = new Date(y, m - 1, d);
            const now = new Date();
            const current = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const diffDays = Math.round((current.getTime() - last.getTime()) / 86_400_000);

            if (diffDays === 1) newStreak = active.streakDays + 1; // ontem -> continua a sequência
            else if (diffDays > 1) newStreak = 1; // falhou dias -> recomeça
            else newStreak = active.streakDays;
        }

        const { error } = await this.db
            .from('profile')
            .update({ streak_days: newStreak, last_active_date: today })
            .eq('id', active.id);

        if (error) {
            console.error('Erro ao atualizar streak:', error);
            return;
        }
        this.applyProfile({ ...active, streakDays: newStreak, lastActiveDate: today });
    }

    async addRewards(xp: number, coins: number): Promise<void> {
        const active = this.userProfile();
        if (!active.id) return;

        let currentXp = active.currentXp + xp;
        let level = active.level;
        let maxXp = active.maxXp;
        while (currentXp >= maxXp) {
            currentXp -= maxXp;
            level += 1;
            maxXp = Math.floor(maxXp * 1.2);
        }
        const newCoins = active.coins + coins;

        const { error } = await this.db
            .from('profile')
            .update({ current_xp: currentXp, level, max_xp: maxXp, coins: newCoins })
            .eq('id', active.id);

        if (error) {
            console.error('Erro ao atualizar recompensas:', error);
            return;
        }
        this.applyProfile({ ...active, currentXp, level, maxXp, coins: newCoins });
    }

    /** Só desconta no ecrã depois de a base de dados confirmar. */
    async spendCoins(amount: number): Promise<boolean> {
        const active = this.userProfile();
        if (!active.id || active.coins < amount) return false;

        const coins = active.coins - amount;
        const { error } = await this.db.from('profile').update({ coins }).eq('id', active.id);
        if (error) {
            console.error('Erro ao gastar moedas:', error);
            return false;
        }
        this.applyProfile({ ...active, coins });
        return true;
    }

    private applyProfile(updated: Profile): void {
        this.userProfile.set(updated);
        this.profiles.update((list) => list.map((p) => (p.id === updated.id ? updated : p)));
    }
}
