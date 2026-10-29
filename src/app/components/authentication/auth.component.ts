import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GamificationService } from '../../services/gamification.service';
import { ThemeService } from '../../services/theme.service';
import { SupabaseService } from '../../services/supabase-service';


@Component({
    selector: 'app-auth',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './auth.component.html',
    styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit {
    private authService = inject(AuthService);
    private gamificationService = inject(GamificationService);
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private theme = inject(ThemeService);
    private supabaseService = inject(SupabaseService);
    private client = this.supabaseService.supabaseClient;

    isLoginMode = signal<boolean>(true);
    errorMessage = signal<string | null>(null);
    loading = signal<boolean>(false);

    readonly isDarkMode = this.theme.isDark;

    avatars = signal<any[]>([]);
    roles = signal<any[]>([]);
    selectedAvatarId = signal<number | null>(null);
    selectedRoleId = signal<number | null>(null);

    authForm: FormGroup = this.fb.group({
        name: [''],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['']
    });

    ngOnInit() {
        this.loadAvatars();
        this.loadRoles();
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

    async loadAvatars() {
        const { data, error } = await (this.client as any).from('avatar').select('*').order('id');
        if (!error && data) this.avatars.set(data);
    }

    async loadRoles() {
        const { data, error } = await (this.client as any).from('role').select('*').order('id');
        if (!error && data) this.roles.set(data);
    }

    toggleMode() {
        this.isLoginMode.update(val => !val);
        this.errorMessage.set(null);
        this.selectedAvatarId.set(null);
        this.selectedRoleId.set(null);
        this.authForm.reset();
        this.updateValidators();
    }

    toggleTheme() {
        this.theme.toggle();
    }

    selectAvatar(id: number) {
        this.selectedAvatarId.set(id);
    }

    selectRole(id: number) {
        this.selectedRoleId.set(id);
    }

    async onSubmit() {
        if (this.authForm.invalid || this.loading()) return;

        const { name, email, password } = this.authForm.value;
        this.loading.set(true);
        this.errorMessage.set(null);

        try {
            if (this.isLoginMode()) {
                await this.authService.signIn(email, password);
                await this.router.navigate(['/dashboard'], { replaceUrl: true });
            } else {
                if (!this.selectedAvatarId() || !this.selectedRoleId()) {
                    this.errorMessage.set('Seleciona um avatar e a tua classe para criar o herói.');
                    this.loading.set(false);
                    return;
                }

                if (this.authForm.hasError('passwordMismatch')) {
                    this.errorMessage.set('As palavras-passe não coincidem.');
                    this.loading.set(false);
                    return;
                }

                // Criar conta no Auth
                await this.authService.signUp(email, password);

                // Criar perfil
                await (this.gamificationService as any).addProfile(
                    name,
                    email,
                    String(this.selectedAvatarId()),
                    String(this.selectedRoleId())
                );

                alert('Herói criado com sucesso! Faz login para começar a tua aventura.');
                this.toggleMode();
            }
        } catch (err: any) {
            this.errorMessage.set(err?.message || 'Ocorreu um erro. Tenta novamente.');
        } finally {
            this.loading.set(false);
        }
    }
}
