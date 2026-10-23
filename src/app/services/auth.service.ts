import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase-service';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
class AuthService {
    private supabaseService = inject(SupabaseService);
    private client = this.supabaseService.supabaseClient;

    // Signal para rastrear o utilizador autenticado atual
    readonly currentUser = signal<any>(null);

    constructor() {
        // Verifica se já existe sessão ativa
        this.client.auth.getSession().then(({ data }: { data: { session: any } }) => {
            this.currentUser.set(data.session?.user || null);
        });

        // Escuta mudanças de estado (login/logout)
        this.client.auth.onAuthStateChange((_event: string, session: { user: any } | null) => {
            this.currentUser.set(session?.user || null);
        });
    }

    // Registar novo utilizador
    signUp(email: string, password: string): Observable<any> {
        const promise = this.client.auth.signUp({ email, password });
        return from(promise).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return data;
            })
        );
    }

    // Iniciar sessão
    signIn(email: string, password: string): Observable<any> {
        const promise = this.client.auth.signInWithPassword({ email, password });
        return from(promise).pipe(
            map(({ data, error }) => {
                if (error) throw error;
                return data;
            })
        );
    }

    // Terminar sessão
    signOut(): Observable<any> {
        const promise = this.client.auth.signOut();
        return from(promise);
    }
}

export { AuthService };