import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Database } from '../../database/supabase';

@Injectable({
    providedIn: 'root'
})
export class SupabaseService {
    public supabaseClient: SupabaseClient<Database>;

    constructor() {
        const env = environment as any;

        // Tenta ler do environment, mas usa os teus valores reais como segurança infalível
        const supabaseUrl = env?.supabaseURL || env?.supabaseUrl || 'https://ghkasysxdaprrmmlxxtb.supabase.co';
        const supabaseKey = env?.supabaseKey || 'sb_publishable_GJRY-7EJDEmxxhb34LWRHA_yBzrWwY5';

        this.supabaseClient = createClient<Database>(supabaseUrl, supabaseKey);
    }
}