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

    createHousehold(name: string): Observable<Household> {
        return from(this.client.auth.getUser()).pipe(
            switchMap(({ data: { user }, error }) => {
                if (error) throw error;
                if (!user) throw new Error('Não autenticado');

                const payload = {
                    name: name?.trim() || 'A nossa casa',
                    invite_code: this.generateInviteCode(),
                    created_by: user.id
                };

                const promise = (this.client as any)
                    .from('households')
                    .insert([payload])
                    .select()
                    .single();

                return from(promise);
            }),
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
}
