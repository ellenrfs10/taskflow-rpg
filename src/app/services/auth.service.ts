import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase-service';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
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

    // Registar novo utilizador (com metadados de nome e avatar)
    signUp(email: string, password: string, name?: string, avatarId?: number): Observable<any> {
        const options: any = {};
        if (name || avatarId) {
            options.data = {};
            if (name) options.data.name = name;
            if (avatarId) options.data.avatar_id = avatarId;
        }

        const promise = this.client.auth.signUp({
            email,
            password,
            options: Object.keys(options).length > 0 ? options : undefined
        });

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

