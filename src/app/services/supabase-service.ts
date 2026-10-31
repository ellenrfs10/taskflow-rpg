import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Database } from '../../database/supabase';

// Contrato exato do que o environment deve conter
export interface EnvironmentConfig {
    production: boolean;
    supabaseUrl: string;
    supabaseKey: string;
}

@Injectable({
    providedIn: 'root'
})
export class SupabaseService {
    readonly supabaseClient: SupabaseClient<Database>;

    constructor() {
        const env = environment as EnvironmentConfig;

        this.supabaseClient = createClient<Database>(
            env.supabaseUrl,
            env.supabaseKey
        );
    }
}
