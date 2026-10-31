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
    private router = inject(Router);
    private client = inject(SupabaseService).supabaseClient;

    readonly currentUser = signal<AuthUser | null>(null);

    private readonly publicUrls = ['/', '/auth', '/register'];

    constructor() {
        this.initAuth();
    }

    private initAuth(): void {
        // Cópia de segurança para versões do supabase-js que não emitem INITIAL_SESSION
        this.client.auth.getSession().then(({ data }) => {
            const user = data.session?.user;
            if (user && !this.currentUser()) {
                this.currentUser.set({ id: user.id, email: user.email ?? '' });
            }
        });

        this.client.auth.onAuthStateChange((event, session) => {
            const user = session?.user;
            this.currentUser.set(user ? { id: user.id, email: user.email ?? '' } : null);

            // Ao abrir a app com sessão, só garante que o perfil está completo
            if (user && event === 'INITIAL_SESSION') {
                setTimeout(() => void this.checkProfileCompletion(user.id, false), 0);
            }

            if (!user && event === 'SIGNED_OUT' && !this.isPublicUrl()) {
                this.router.navigate(['/auth'], { replaceUrl: true });
            }
        });
    }

    private isPublicUrl(): boolean {
        return this.publicUrls.includes(this.router.url.split('?')[0]);
    }

    /**
     * Perfil incompleto -> /profile-setup.
     * Perfil completo -> /dashboard, mas só logo após o login (redirectIfComplete).
     */
    private async checkProfileCompletion(userId: string, redirectIfComplete: boolean): Promise<void> {
        const { data, error } = await (this.client as any)
            .from('profile')
            .select('profile_completed')
            .eq('id', userId)
            .maybeSingle();

        if (error) {
            // Em caso de erro não força o setup a contas que já existam
            if (redirectIfComplete && this.isPublicUrl()) {
                await this.router.navigate(['/dashboard'], { replaceUrl: true });
            }
            return;
        }

        if (data?.profile_completed === true) {
            if (redirectIfComplete && this.isPublicUrl()) {
                await this.router.navigate(['/dashboard'], { replaceUrl: true });
            }
            return;
        }

        if (this.router.url.split('?')[0] !== '/profile-setup') {
            await this.router.navigate(['/profile-setup'], { replaceUrl: true });
        }
    }

    async signIn(email: string, password: string): Promise<void> {
        const { data, error } = await this.client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
            await this.checkProfileCompletion(data.user.id, true);
        }
    }

    /** Devolve true se a conta já ficou com sessão (ou seja, sem confirmação de e-mail). */
    async signUp(email: string, password: string, name: string): Promise<boolean> {
        const { data, error } = await this.client.auth.signUp({
            email,
            password,
            options: { data: { name } }
        });
        if (error) throw error;
        return !!data.session;
    }

    async signOut(): Promise<void> {
        const { error } = await this.client.auth.signOut();
        if (error) throw error;
        this.currentUser.set(null);
        await this.router.navigate(['/auth'], { replaceUrl: true });
    }
}
