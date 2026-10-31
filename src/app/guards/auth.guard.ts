import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase-service';

/** Só deixa entrar quem tem sessão; senão envia para /auth. */
export const authGuard: CanActivateFn = async () => {
    // No servidor (SSR) não há sessão: deixa passar e o browser decide
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return true;

    const router = inject(Router);
    const { data } = await inject(SupabaseService).supabaseClient.auth.getSession();
    return data.session ? true : router.createUrlTree(['/auth']);
};

/** Quem já tem sessão não precisa de ver o ecrã de login. */
export const guestGuard: CanActivateFn = async () => {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return true;

    const router = inject(Router);
    const { data } = await inject(SupabaseService).supabaseClient.auth.getSession();
    return data.session ? router.createUrlTree(['/dashboard']) : true;
};
