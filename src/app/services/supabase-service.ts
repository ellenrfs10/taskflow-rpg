import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Database } from '../../database/supabase';

// 1. Definimos o contrato exato do que o environment deve conter
export interface EnvironmentConfig {
    production: boolean;
    supabaseUrl: string;
    supabaseKey: string;
}

@Injectable({
    providedIn: 'root'
})
export class SupabaseService {
    public supabaseClient: SupabaseClient<Database>;

    constructor() {
        // 2. Fazemos o cast para a nossa interface tipada (adeus 'any')
        const env = environment as EnvironmentConfig;

        this.supabaseClient = createClient<Database>(
            env.supabaseUrl,
            env.supabaseKey
        );
    }
}