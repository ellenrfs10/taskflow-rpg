import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CatalogService } from '../../services/catalog.service';
import { GamificationService } from '../../services/gamification.service';
import { SupabaseService } from '../../services/supabase-service';

@Component({
    selector: 'app-profile-edit',
    standalone: true,
    imports: [ReactiveFormsModule],
    templateUrl: './profile-edit.component.html',
    styleUrls: ['./profile-edit.component.css']
})
export class ProfileEditComponent implements OnInit {
    private client = inject(SupabaseService).supabaseClient;
    private catalog = inject(CatalogService);
    private gamificationService = inject(GamificationService);
    private fb = inject(FormBuilder);
    private router = inject(Router);

    readonly avatars = this.catalog.avatars;
    readonly roles = this.catalog.roles;

    loading = signal<boolean>(false);
    successMessage = signal<string | null>(null);
    errorMessage = signal<string | null>(null);

    selectedAvatarId = signal<number | null>(null);
    selectedRoleId = signal<number | null>(null);

    profileForm: FormGroup = this.fb.group({
        name: ['', [Validators.required, Validators.minLength(2)]]
    });

    ngOnInit() {
        this.loadCatalogsAndProfile();
    }

    /** Lê o utilizador da sessão (e não do signal), por isso funciona também depois de F5. */
    private async getUserId(): Promise<string | null> {
        const { data } = await this.client.auth.getSession();
        return data.session?.user.id ?? null;
    }

    async loadCatalogsAndProfile(): Promise<void> {
        const userId = await this.getUserId();
        if (!userId) {
            this.router.navigate(['/auth']);
            return;
        }

        await this.catalog.load();

        const { data, error } = await (this.client as any)
            .from('profile')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !data) {
            this.errorMessage.set('Não foi possível carregar o teu perfil.');
            return;
        }

        this.profileForm.patchValue({ name: data.name });
        this.selectedAvatarId.set(data.id_avatar);
        this.selectedRoleId.set(data.id_role);
    }

    selectAvatar(id: number) { this.selectedAvatarId.set(id); }
    selectRole(id: number) { this.selectedRoleId.set(id); }

    async onSubmit(): Promise<void> {
        if (this.profileForm.invalid) {
            this.profileForm.markAllAsTouched();
            return;
        }

        const userId = await this.getUserId();
        if (!userId) return;

        this.loading.set(true);
        this.successMessage.set(null);
        this.errorMessage.set(null);

        try {
            const { data, error } = await (this.client as any)
                .from('profile')
                .update({
                    name: this.profileForm.value.name.trim(),
                    id_avatar: this.selectedAvatarId(),
                    id_role: this.selectedRoleId()
                })
                .eq('id', userId)
                .select();

            if (error) throw error;
            if (!data?.length) throw new Error('Não foi possível guardar: perfil não encontrado.');

            this.successMessage.set('Perfil atualizado com sucesso, Herói!');
            // Atualiza nome e avatar no Dashboard e no resto da app
            await this.gamificationService.refreshProfile();
        } catch (err: any) {
            this.errorMessage.set(err?.message || 'Erro ao atualizar perfil.');
        } finally {
            this.loading.set(false);
        }
    }
}
