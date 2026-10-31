import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { Household } from '../models/household.model';
import { SupabaseService } from './supabase-service';

/**
 * Casas (grupos de jogadores). Cada método devolve um Observable;
 * por dentro usa funções async simples, mais fáceis de ler.
 */
@Injectable({
    providedIn: 'root'
})
export class HouseholdService {
    private client = inject(SupabaseService).supabaseClient;
    private readonly db = this.client as any;

    private generateInviteCode(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    private async isInviteCodeUnique(code: string): Promise<boolean> {
        const { data, error } = await this.db
            .from('households')
            .select('id')
            .eq('invite_code', code)
            .maybeSingle();
        if (error) throw error;
        return !data;
    }

    /** Tenta até 10 vezes; se nenhum for único, falha em vez de usar um código repetido. */
    private async generateUniqueCode(): Promise<string> {
        for (let attempt = 0; attempt < 10; attempt++) {
            const code = this.generateInviteCode();
            if (await this.isInviteCodeUnique(code)) return code;
        }
        throw new Error('Não foi possível gerar um código único. Tenta novamente.');
    }

    createHousehold(name: string): Observable<Household> {
        return from(this.create(name));
    }

    private async create(name: string): Promise<Household> {
        const { data: { session } } = await this.client.auth.getSession();
        const user = session?.user;
        if (!user) throw new Error('Não autenticado');

        const code = await this.generateUniqueCode();

        const { data, error } = await this.db
            .from('households')
            .insert([{ name: name?.trim() || 'A nossa casa', invite_code: code, created_by: user.id }])
            .select()
            .single();

        if (error) throw error;
        return data as Household;
    }

    joinHousehold(inviteCode: string): Observable<Household> {
        return from(this.findByCode(inviteCode));
    }

    private async findByCode(inviteCode: string): Promise<Household> {
        const code = inviteCode.trim().toUpperCase();
        if (code.length < 6) throw new Error('O código de convite deve ter 6 caracteres.');

        const { data, error } = await this.db
            .from('households')
            .select('*')
            .eq('invite_code', code)
            .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error('Código de convite inválido ou inexistente.');
        return data as Household;
    }

    getHouseholdById(householdId: string): Observable<Household> {
        return from(this.findById(householdId));
    }

    private async findById(householdId: string): Promise<Household> {
        const { data, error } = await this.db
            .from('households')
            .select('*')
            .eq('id', householdId)
            .single();

        if (error) throw error;
        return data as Household;
    }

    leaveHousehold(userId: string): Observable<void> {
        return from(this.leave(userId));
    }

    private async leave(userId: string): Promise<void> {
        const { error } = await this.db.from('profile').update({ household_id: null }).eq('id', userId);
        if (error) throw error;
    }

    getHouseholdMembers(householdId: string): Observable<any[]> {
        return from(this.members(householdId));
    }

    private async members(householdId: string): Promise<any[]> {
        const { data, error } = await this.db.from('profile').select('*').eq('household_id', householdId);
        if (error) throw error;
        return data ?? [];
    }
}
