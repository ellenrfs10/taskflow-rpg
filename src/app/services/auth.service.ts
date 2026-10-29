import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase-service';
import { from } from 'rxjs';

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
        this.client.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                this.currentUser.set({
                    id: session.user.id,
                    email: session.user.email || ''
                });
                this.checkProfileCompletion(session.user.id);
            } else {
                this.currentUser.set(null);
            }
        });

        this.client.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                this.currentUser.set({
                    id: session.user.id,
                    email: session.user.email || ''
                });
                this.checkProfileCompletion(session.user.id);
            } else {
                this.currentUser.set(null);
                const currentUrl = this.router.url;
                if (currentUrl !== '/auth' && currentUrl !== '/register') {
                    this.router.navigate(['/auth'], { replaceUrl: true });
                }
            }
        });
    }

    private checkProfileCompletion(userId: string) {
        const promise = (this.client as any)
            .from('profile')
            .select('profile_completed')
            .eq('id', userId)
            .maybeSingle();

        from(promise).subscribe({
            next: (res: any) => {
                if (res.error) return;
                const completed = res.data?.profile_completed === true;
                const currentUrl = this.router.url;

                // Se o perfil JÁ ESTÁ completo -> vai sempre para o dashboard
                if (completed) {
                    if (currentUrl === '/profile-setup' || currentUrl === '/auth' || currentUrl === '/register' || currentUrl === '/') {
                        this.router.navigate(['/dashboard'], { replaceUrl: true });
                    }
                    return;
                }

                // Se o perfil NÃO ESTÁ completo -> só redireciona para o setup
                // Evita redirecionar em loop caso já esteja nessa página
                if (!completed && currentUrl !== '/profile-setup') {
                    this.router.navigate(['/profile-setup'], { replaceUrl: true });
                    return;
                }
            },
            error: () => {
                // Em caso de erro, por segurança, não força o setup para contas que já possam existir
                const currentUrl = this.router.url;
                if (currentUrl === '/auth' || currentUrl === '/register' || currentUrl === '/') {
                    this.router.navigate(['/dashboard'], { replaceUrl: true });
                }
            }
        });
    }

    async signIn(email: string, password: string): Promise<void> {
        const { error, data } = await this.client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
            this.checkProfileCompletion(data.user.id);
        }
    }

    async signUp(email: string, password: string): Promise<void> {
        const { error, data } = await this.client.auth.signUp({
            email,
            password,
            options: { data: {} }
        });
        if (error) throw error;
        if (data.user) {
            // Após registo, criamos o perfil com profile_completed: false para forçar o setup
            setTimeout(() => this.checkProfileCompletion(data.user!.id), 400);
        }
    }

    async signOut(): Promise<void> {
        const { error } = await this.client.auth.signOut();
        if (error) throw error;
        this.currentUser.set(null);
        await this.router.navigate(['/auth'], { replaceUrl: true });
    }
}
