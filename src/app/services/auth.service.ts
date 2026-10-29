import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase-service';

export interface AuthUser {
    id: string;
    email: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private supabaseService = inject(SupabaseService);
    private router = inject(Router);
    private client = this.supabaseService.supabaseClient;

    readonly currentUser = signal<AuthUser | null>(null);

    constructor() {
        this.initAuth();
    }

    private initAuth() {
        // Verifica sessão ao iniciar
        this.client.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                this.currentUser.set({
                    id: session.user.id,
                    email: session.user.email || ''
                });
            } else {
                this.currentUser.set(null);
            }
        });

        // Escuta alterações na autenticação
        this.client.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                this.currentUser.set({
                    id: session.user.id,
                    email: session.user.email || ''
                });
            } else {
                this.currentUser.set(null);
            }
        });
    }

    async signIn(email: string, password: string): Promise<void> {
        const { error } = await this.client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await this.router.navigate(['/dashboard'], { replaceUrl: true });
    }

    async signUp(email: string, password: string): Promise<void> {
        const { error } = await this.client.auth.signUp({
            email,
            password,
            options: {
                data: {}
            }
        });
        if (error) throw error;
    }

    async signOut(): Promise<void> {
        const { error } = await this.client.auth.signOut();
        if (error) throw error;
        this.currentUser.set(null);
        await this.router.navigate(['/auth'], { replaceUrl: true });
    }
}
