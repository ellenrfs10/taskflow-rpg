import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase-service';
import { from, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Household } from '../models/household.model';

@Injectable({
    providedIn: 'root'
})
export class HouseholdService {
    private supabaseService = inject(SupabaseService);
    private client = this.supabaseService.supabaseClient;

    private generateInviteCode(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    private async isInviteCodeUnique(code: string): Promise<boolean> {
        const { data, error } = await (this.client as any)
            .from('households')
            .select('id')
            .eq('invite_code', code)
            .maybeSingle();
        if (error) return false;
        return !data;
    }

    createHousehold(name: string): Observable<Household> {
        return from(this.client.auth.getUser()).pipe(
            switchMap(async ({ data: { user }, error }) => {
                if (error) throw error;
                if (!user) throw new Error('Não autenticado');

                let code = '';
                let attempts = 0;
                while (attempts < 10) {
                    code = this.generateInviteCode();
                    if (await this.isInviteCodeUnique(code)) break;
                    attempts++;
                }
                if (!code) throw new Error('Não foi possível gerar código único.');

                const payload = {
                    name: name?.trim() || 'A nossa casa',
                    invite_code: code,
                    created_by: user.id
                };

                const promise = (this.client as any)
                    .from('households')
                    .insert([payload])
                    .select()
                    .single();

                return from(promise);
            }),
            switchMap((obs: any) => obs),
            map((res: any) => {
                if (res.error) throw res.error;
                return res.data as Household;
            })
        );
    }

    joinHousehold(inviteCode: string): Observable<Household> {
        const code = inviteCode.trim().toUpperCase();

        if (code.length < 6) {
            throw new Error('O código de convite deve ter 6 caracteres.');
        }

        const promise = (this.client as any)
            .from('households')
            .select('*')
            .eq('invite_code', code)
            .maybeSingle();

        return from(promise).pipe(
            map((res: any) => {
                if (res.error) throw res.error;
                if (!res.data) throw new Error('Código de convite inválido ou inexistente.');
                return res.data as Household;
            })
        );
    }

    getHouseholdById(householdId: string): Observable<Household> {
        const promise = (this.client as any)
            .from('households')
            .select('*')
            .eq('id', householdId)
            .single();

        return from(promise).pipe(
            map((res: any) => {
                if (res.error) throw res.error;
                return res.data as Household;
            })
        );
    }

    leaveHousehold(userId: string): Observable<any> {
        const promise = (this.client as any)
            .from('profile')
            .update({ household_id: null })
            .eq('id', userId);

        return from(promise).pipe(
            map((res: any) => {
                if (res.error) throw res.error;
                return res.data;
            })
        );
    }

    kickMember(householdId: string, memberId: string, creatorId: string): Observable<any> {
        // Só o criador da casa pode expulsar
        const promise = (this.client as any)
            .from('households')
            .select('created_by')
            .eq('id', householdId)
            .single();

        return from(promise).pipe(
            switchMap((res: any) => {
                if (res.error) throw res.error;
                if (!res.data || res.data.created_by !== creatorId) {
                    throw new Error('Apenas o dono da casa pode expulsar membros.');
                }

                const updatePromise = (this.client as any)
                    .from('profile')
                    .update({ household_id: null })
                    .eq('id', memberId);

                return from(updatePromise);
            }),
            map((res: any) => {
                if (res.error) throw res.error;
                return res.data;
            })
        );
    }

    getHouseholdMembers(householdId: string): Observable<any[]> {
        const promise = (this.client as any)
            .from('profile')
            .select('*')
            .eq('household_id', householdId);

        return from(promise).pipe(
            map((res: any) => {
                if (res.error) throw res.error;
                return res.data || [];
            })
        );
    }
}
