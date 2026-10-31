import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase-service';

export interface Avatar {
    id: number;
    name: string;
    image_url: string;
}

export interface Role {
    id: number;
    name: string;
}

const FALLBACK_AVATARS: Avatar[] = [
    { id: 1, name: 'Guerreiro', image_url: 'assets/avatars/warrior.png' },
    { id: 2, name: 'Mago', image_url: 'assets/avatars/mage.png' },
    { id: 3, name: 'Arqueiro', image_url: 'assets/avatars/archer.png' },
    { id: 4, name: 'Clérigo', image_url: 'assets/avatars/cleric.png' }
];

const FALLBACK_ROLES: Role[] = [
    { id: 1, name: 'Aventureiro' },
    { id: 2, name: 'Guerreiro' },
    { id: 3, name: 'Mago' },
    { id: 4, name: 'Arqueiro' }
];

/**
 * Avatares e classes: carregados uma única vez e partilhados por
 * Auth, ProfileSetup, ProfileEdit e GamificationService (antes havia 4 cópias do mesmo código).
 */
@Injectable({ providedIn: 'root' })
export class CatalogService {
    private client = inject(SupabaseService).supabaseClient;

    private readonly _avatars = signal<Avatar[]>([]);
    private readonly _roles = signal<Role[]>([]);
    readonly avatars = this._avatars.asReadonly();
    readonly roles = this._roles.asReadonly();

    private pending: Promise<void> | null = null;

    /** Vários componentes podem chamar; o pedido à BD só acontece uma vez. */
    load(): Promise<void> {
        this.pending ??= this.fetch();
        return this.pending;
    }

    private async fetch(): Promise<void> {
        const db = this.client as any;
        try {
            const [avatarsRes, rolesRes] = await Promise.all([
                db.from('avatar').select('*').order('id'),
                db.from('role').select('*').order('id')
            ]);
            this._avatars.set(!avatarsRes.error && avatarsRes.data?.length ? avatarsRes.data : FALLBACK_AVATARS);
            this._roles.set(!rolesRes.error && rolesRes.data?.length ? rolesRes.data : FALLBACK_ROLES);
        } catch (err) {
            console.error('Erro ao carregar avatares e classes:', err);
            this._avatars.set(FALLBACK_AVATARS);
            this._roles.set(FALLBACK_ROLES);
        }
    }
}
