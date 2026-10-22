import { inject, Service } from '@angular/core';
import { SupabaseService } from './supabase-service';

@Service()
export class Exemplo {
    readonly supabase = inject(SupabaseService).supabaseClient;
    async getUser(){
        const promise = this.supabase.from('user').select('*')
        return promise
    }
    };
    
        
        
    