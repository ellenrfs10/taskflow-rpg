import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';
import { Household } from '../../models/household.model';
import { CatalogService } from '../../services/catalog.service';
import { GamificationService } from '../../services/gamification.service';
import { HouseholdService } from '../../services/household.service';
import { SupabaseService } from '../../services/supabase-service';

@Component({
    selector: 'app-profile-setup',
    standalone: true,
    imports: [ReactiveFormsModule, FormsModule],
    templateUrl: './profile-setup.component.html',
    styleUrls: ['./profile-setup.component.css']
})
export class ProfileSetupComponent implements OnDestroy, OnInit {
    private fb = inject(FormBuilder);
    private householdService = inject(HouseholdService);
    private catalog = inject(CatalogService);
    private router = inject(Router);
    private gamificationService = inject(GamificationService);

    private client = inject(SupabaseService).supabaseClient;

    loading = signal<boolean>(false);
    errorMessage = signal<string | null>(null);

    // Avatares e classes vêm do serviço partilhado
    readonly avatars = this.catalog.avatars;
    readonly roles = this.catalog.roles;
    selectedAvatarId = signal<number | null>(null);
    selectedRoleId = signal<number | null>(null);

    mode = signal<'alone' | 'together'>('alone');
    inviteCodeInput = '';

    createdHousehold = signal<Household | null>(null);
    showInviteCode = signal<boolean>(false);
    householdInviteCode = signal<string | null>(null);
    householdName = signal<string>('');

    joinMethod = signal<'code' | 'create'>('code');

    setupForm: FormGroup = this.fb.group({
        name: ['', [Validators.required, Validators.minLength(2)]],
        householdName: ['A nossa casa']
    });

    private subs: Subscription[] = [];

    ngOnInit() {
        this.initSelections();
        this.prefillName();
        this.loadExistingHouseholdCode();
    }

    ngOnDestroy() {
        this.subs.forEach((s) => s.unsubscribe());
    }

    /** Pré-seleciona a escolha feita no registo (ou, em falta, o primeiro item de cada lista). */
    private async initSelections(): Promise<void> {
        await this.catalog.load();

        const profile = this.gamificationService.userProfile();
        const firstAvatar = this.catalog.avatars()[0]?.id ?? null;
        const firstRole = this.catalog.roles()[0]?.id ?? null;

        if (this.selectedAvatarId() === null) {
            this.selectedAvatarId.set(profile.id && profile.idAvatar ? profile.idAvatar : firstAvatar);
        }
        if (this.selectedRoleId() === null) {
            this.selectedRoleId.set(profile.id && profile.idRole ? profile.idRole : firstRole);
        }
    }

    async prefillName() {
        const { data: { user } } = await this.client.auth.getUser();
        if (user?.user_metadata?.['name']) {
            this.setupForm.patchValue({ name: user.user_metadata['name'] });
        }
    }

    private async loadExistingHouseholdCode() {
        const { data: { user } } = await this.client.auth.getUser();
        if (!user) return;

        const { data: profile, error } = await (this.client as any)
            .from('profile')
            .select('household_id')
            .eq('id', user.id)
            .single();

        if (error || !profile?.household_id) return;

        const sub = this.householdService.getHouseholdById(profile.household_id).subscribe({
            next: (household) => {
                this.householdInviteCode.set(household.invite_code);
                this.householdName.set(household.name);
                this.showInviteCode.set(true);
            },
            error: () => {
                this.householdInviteCode.set(null);
            }
        });
        this.subs.push(sub);
    }

    selectMode(value: 'alone' | 'together') {
        this.mode.set(value);
        this.errorMessage.set(null);
        this.showInviteCode.set(false);
        this.createdHousehold.set(null);
        this.inviteCodeInput = '';
        this.joinMethod.set('code');
    }

    selectAvatar(id: number) {
        this.selectedAvatarId.set(id);
        this.errorMessage.set(null);
    }

    selectRole(id: number) {
        this.selectedRoleId.set(id);
        this.errorMessage.set(null);
    }

    async finishSetup() {
        if (this.setupForm.invalid || this.loading()) {
            this.setupForm.markAllAsTouched();
            return;
        }

        if (this.selectedRoleId() === null) {
            this.errorMessage.set('Seleciona a tua classe para continuar.');
            return;
        }

        if (this.selectedAvatarId() === null) {
            this.errorMessage.set('Seleciona o teu avatar para continuar.');
            return;
        }

        if (this.mode() === 'together') {
            if (this.joinMethod() === 'code' && !this.inviteCodeInput.trim()) {
                this.errorMessage.set('Insere o código de convite da casa para entrar.');
                return;
            }
        }

        this.loading.set(true);
        this.errorMessage.set(null);

        try {
            const { data: { user }, error: authError } = await this.client.auth.getUser();
            if (authError || !user) {
                throw new Error('Sessão expirada. Volta a iniciar sessão.');
            }

            let householdId: string | null = null;

            if (this.mode() === 'alone') {
                // Jogador sozinho NÃO cria casa
                this.showInviteCode.set(false);
            } else if (this.joinMethod() === 'code') {
                const household = await firstValueFrom(this.householdService.joinHousehold(this.inviteCodeInput));
                householdId = household.id;
                this.householdInviteCode.set(household.invite_code);
                this.householdName.set(household.name);
                this.showInviteCode.set(true);
            } else {
                const household = await firstValueFrom(
                    this.householdService.createHousehold(this.setupForm.value.householdName)
                );
                householdId = household.id;
                this.createdHousehold.set(household);
                this.householdInviteCode.set(household.invite_code);
                this.householdName.set(household.name);
                this.showInviteCode.set(true);
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

            const { data, error } = await (this.client as any)
                .from('profile')
                .update(payload)
                .eq('id', user.id)
                .select();

            if (error) throw error;
            if (!data?.length) throw new Error('Não foi possível guardar o perfil. Tenta novamente.');

            await this.gamificationService.loadProfiles();

            // Em dupla, fica na página para mostrar o código da casa
            if (!this.showInviteCode()) {
                this.router.navigate(['/dashboard'], { replaceUrl: true });
            }
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
        const code = this.householdInviteCode() ?? this.createdHousehold()?.invite_code;
        if (!code) return;
        navigator.clipboard.writeText(code).then(() => {
            alert('Código copiado: ' + code);
        });
    }

    async leaveHousehold() {
        const { data: { user } } = await this.client.auth.getUser();
        if (!user) return;

        this.loading.set(true);
        try {
            await firstValueFrom(this.householdService.leaveHousehold(user.id));
            this.householdInviteCode.set(null);
            this.householdName.set('');
            this.showInviteCode.set(false);
            this.createdHousehold.set(null);
            this.errorMessage.set(null);
            await this.gamificationService.loadProfiles();
        } catch (err: any) {
            this.errorMessage.set(err?.message || 'Erro ao sair da casa.');
        } finally {
            this.loading.set(false);
        }
    }

    goToProfileEdit() {
        this.router.navigate(['/profile/edit'], { replaceUrl: true });
    }
}
