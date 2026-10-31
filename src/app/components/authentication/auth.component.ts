import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CatalogService } from '../../services/catalog.service';
import { GamificationService } from '../../services/gamification.service';

@Component({
    selector: 'app-auth',
    standalone: true,
    imports: [ReactiveFormsModule],
    templateUrl: './auth.component.html',
    styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit {
    private authService = inject(AuthService);
    private catalog = inject(CatalogService);
    private gamificationService = inject(GamificationService);
    private fb = inject(FormBuilder);
    private router = inject(Router);

    isLoginMode = signal<boolean>(true);
    errorMessage = signal<string | null>(null);
    infoMessage = signal<string | null>(null);
    loading = signal<boolean>(false);

    // Avatares e classes vêm do serviço partilhado (carregados uma só vez)
    readonly avatars = this.catalog.avatars;
    readonly roles = this.catalog.roles;
    selectedAvatarId = signal<number | null>(null);
    selectedRoleId = signal<number | null>(null);

    authForm: FormGroup = this.fb.group({
        name: [''],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['']
    });

    ngOnInit() {
        this.catalog.load();
        this.updateValidators();
    }

    updateValidators() {
        const nameControl = this.authForm.get('name');
        const confirmControl = this.authForm.get('confirmPassword');

        if (this.isLoginMode()) {
            nameControl?.clearValidators();
            confirmControl?.clearValidators();
            this.authForm.clearValidators();
        } else {
            nameControl?.setValidators([Validators.required, Validators.minLength(2)]);
            confirmControl?.setValidators([Validators.required]);
            this.authForm.setValidators(this.passwordMatchValidator.bind(this));
        }

        nameControl?.updateValueAndValidity();
        confirmControl?.updateValueAndValidity();
        this.authForm.updateValueAndValidity();
    }

    private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
        const form = control as FormGroup;
        const nameControl = form.get('name');

        // Só aplica a validação no modo registo
        if (nameControl?.hasValidator(Validators.required)) {
            const password = form.get('password')?.value;
            const confirmPassword = form.get('confirmPassword')?.value;

            if (password && confirmPassword && password !== confirmPassword) {
                return { passwordMismatch: true };
            }
        }

        return null;
    }

    toggleMode() {
        this.isLoginMode.update(val => !val);
        this.errorMessage.set(null);
        this.infoMessage.set(null);
        this.selectedAvatarId.set(null);
        this.selectedRoleId.set(null);
        this.authForm.reset();
        this.updateValidators();
    }

    selectAvatar(id: number) {
        this.selectedAvatarId.set(id);
    }

    selectRole(id: number) {
        this.selectedRoleId.set(id);
    }

    /** Traduz as mensagens em inglês que o Supabase devolve. */
    private friendlyError(err: any): string {
        const message: string = err?.message ?? '';
        if (message.includes('Invalid login credentials')) return 'E-mail ou palavra-passe incorretos.';
        if (message.includes('Email not confirmed')) return 'Confirma o teu e-mail antes de entrar.';
        if (message.includes('already registered')) return 'Já existe uma conta com este e-mail.';
        return message || 'Ocorreu um erro. Tenta novamente.';
    }

    async onSubmit() {
        if (this.authForm.invalid || this.loading()) {
            this.authForm.markAllAsTouched();
            return;
        }

        const { name, email, password } = this.authForm.value;
        this.loading.set(true);
        this.errorMessage.set(null);
        this.infoMessage.set(null);

        try {
            if (this.isLoginMode()) {
                // O AuthService decide o destino: dashboard ou configuração do perfil
                await this.authService.signIn(email, password);
                return;
            }

            const avatarId = this.selectedAvatarId();
            const roleId = this.selectedRoleId();
            if (!avatarId || !roleId) {
                this.errorMessage.set('Seleciona um avatar e a tua classe para criar o herói.');
                return;
            }

            const hasSession = await this.authService.signUp(email, password, name);

            if (hasSession) {
                // Conta criada e já com sessão: grava o perfil e segue para a configuração
                await this.gamificationService.addProfile(name, email, avatarId, roleId);
                await this.router.navigate(['/profile-setup'], { replaceUrl: true });
            } else {
                // O Supabase pede confirmação por e-mail antes de dar sessão
                this.toggleMode();
                this.infoMessage.set('Conta criada! Confirma o teu e-mail e depois entra.');
            }
        } catch (err: any) {
            this.errorMessage.set(this.friendlyError(err));
        } finally {
            this.loading.set(false);
        }
    }
}
