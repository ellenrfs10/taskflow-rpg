import { Service } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { Database } from '../../database/supabase';

export const environment = {
    supabaseKey: 'sb_publishable_GJRY-7EJDEmxxhb34LWRHA_yBzrWwY5',
    supabaseURL: 'https://ghkasysxdaprrmmlxxtb.supabase.co',
    production: false
};

@Service()
export class SupabaseService {
    readonly supabaseClient = createClient<Database>(environment.supabaseURL, environment.supabaseKey)
};
