import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HouseholdService } from '../../services/household.service';
import { SupabaseService } from '../../services/supabase-service';
import { ThemeService } from '../../services/theme.service';
import { GamificationService } from '../../services/gamification.service';
import { Household } from '../../models/household.model';

@Component({
    selector: 'app-profile-setup',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule],
    templateUrl: './profile-setup.component.html',
    styleUrls: ['./profile-setup.component.css']
})
export class ProfileSetupComponent implements OnInit {
    private fb = inject(FormBuilder);
    private householdService = inject(HouseholdService);
    private supabaseService = inject(SupabaseService);
    private router = inject(Router);
    private theme = inject(ThemeService);
    private gamificationService = inject(GamificationService);

    private client = this.supabaseService.supabaseClient;

    loading = signal<boolean>(false);
    errorMessage = signal<string | null>(null);

    avatars = signal<any[]>([]);
    roles = signal<any[]>([]);
    selectedAvatarId = signal<number | null>(null);
    selectedRoleId = signal<number | null>(null);

    mode = signal<'alone' | 'together'>('alone');
    inviteCode = '';

    createdHousehold = signal<Household | null>(null);
    showInviteCode = signal<boolean>(false);

    setupForm: FormGroup = this.fb.group({
        name: ['', [Validators.required, Validators.minLength(2)]],
        householdName: ['A nossa casa']
    });

    readonly isDarkMode = this.theme.isDark;

    ngOnInit() {
        this.loadAvatars();
        this.loadRoles();
        this.prefillName();
    }

    toggleTheme() {
        this.theme.toggle();
    }

    async prefillName() {
        const { data: { user } } = await this.client.auth.getUser();
        if (user?.user_metadata?.['name']) {
            this.setupForm.patchValue({ name: user.user_metadata['name'] });
        }
    }

    async loadAvatars() {
        try {
            const { data, error } = await (this.client as any).from('avatar').select('*').order('id');
            if (!error && data && data.length > 0) {
                this.avatars.set(data);
                if (this.selectedAvatarId() === null) {
                    this.selectedAvatarId.set(data[0].id);
                }
                return;
            }
        } catch (e) {
            console.error('Erro ao carregar avatares:', e);
        }

        const fallback = [
            { id: 1, name: 'Guerreiro', image_url: 'assets/avatars/warrior.png' },
            { id: 2, name: 'Mago', image_url: 'assets/avatars/mage.png' },
            { id: 3, name: 'Arqueiro', image_url: 'assets/avatars/archer.png' },
            { id: 4, name: 'Clérigo', image_url: 'assets/avatars/cleric.png' }
        ];
        this.avatars.set(fallback);
        if (this.selectedAvatarId() === null) this.selectedAvatarId.set(fallback[0].id);
    }

    async loadRoles() {
        try {
            const { data, error } = await (this.client as any).from('role').select('*').order('id');
            if (!error && data && data.length > 0) {
                this.roles.set(data);
                if (this.selectedRoleId() === null) {
                    this.selectedRoleId.set(data[0].id);
                }
                return;
            }
        } catch (e) {
            console.error('Erro ao carregar classes:', e);
        }

        const fallback = [
            { id: 1, name: 'Aventureiro' },
            { id: 2, name: 'Guerreiro' },
            { id: 3, name: 'Mago' },
            { id: 4, name: 'Arqueiro' }
        ];
        this.roles.set(fallback);
        if (this.selectedRoleId() === null) this.selectedRoleId.set(fallback[0].id);
    }

    selectMode(value: 'alone' | 'together') {
        this.mode.set(value);
        this.errorMessage.set(null);
        this.showInviteCode.set(false);
        this.createdHousehold.set(null);
        this.inviteCode = '';
    }

    selectAvatar(id: number) {
        this.selectedAvatarId.set(id);
        this.errorMessage.set(null);
    }

    selectRole(id: number) {
        this.selectedRoleId.set(id);
        this.errorMessage.set(null);
    }

    private async userAlreadyInHousehold(userId: string): Promise<boolean> {
        const { data, error } = await (this.client as any)
            .from('profile')
            .select('household_id')
            .eq('id', userId)
            .single();
        if (error) return false;
        return !!data?.household_id;
    }

    async finishSetup() {
        if (this.setupForm.invalid || this.loading()) return;

        if (this.selectedRoleId() === null) {
            this.errorMessage.set('Seleciona a tua classe para continuar.');
            return;
        }

        if (this.selectedAvatarId() === null) {
            this.errorMessage.set('Seleciona o teu avatar para continuar.');
            return;
        }

        if (this.mode() === 'together' && !this.inviteCode.trim()) {
            this.errorMessage.set('Insere o código de convite da casa para entrar.');
            return;
        }

        this.loading.set(true);
        this.errorMessage.set(null);

        try {
            const { data: { user } } = await this.client.auth.getUser();
            if (!user) throw new Error('Sessão inválida. Volta a iniciar sessão.');

            if (await this.userAlreadyInHousehold(user.id)) {
                throw new Error('Já pertenceste a uma casa. Não podes criar ou entrar noutra.');
            }

            let householdId: string | null = null;

            if (this.mode() === 'alone') {
                const household = await this.householdService.createHousehold(this.setupForm.value.householdName).toPromise();
                if (!household) throw new Error('Não foi possível criar a casa.');
                householdId = household.id;
                this.createdHousehold.set(household);
                this.showInviteCode.set(true);
            } else {
                const household = await this.householdService.joinHousehold(this.inviteCode).toPromise();
                if (!household) throw new Error('Código de convite inválido.');
                householdId = household.id;
            }

            const { name } = this.setupForm.value;

            const payload = {
                name: name.trim(),
                id_avatar: this.selectedAvatarId(),
                id_role: this.selectedRoleId(),
                household_id: householdId,
                setup_mode: this.mode(),
                profile_completed: true,
                active: true
            };

            const { error } = await (this.client as any)
                .from('profile')
                .update(payload)
                .eq('id', user.id);

            if (error) throw error;

            this.gamificationService.loadProfiles();

            if (this.mode() === 'alone' && this.showInviteCode()) {
                return;
            }

            this.router.navigate(['/dashboard'], { replaceUrl: true });
        } catch (err: any) {
            this.errorMessage.set(err?.message || 'Erro ao concluir a configuração do perfil.');
        } finally {
            this.loading.set(false);
        }
    }

    goToDashboard() {
        this.gamificationService.loadProfiles();
        this.router.navigate(['/dashboard'], { replaceUrl: true });
    }

    copyInviteCode() {
        const code = this.createdHousehold()?.invite_code;
        if (!code) return;
        navigator.clipboard.writeText(code).then(() => {
            alert('Código copiado: ' + code);
        });
    }
}
