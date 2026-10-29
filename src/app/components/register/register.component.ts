import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GamificationService } from '../../services/gamification.service';
import { ThemeService } from '../../services/theme.service';
import { SupabaseService } from '../../services/supabase-service';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
    private authService = inject(AuthService);
    private gamificationService = inject(GamificationService);
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private theme = inject(ThemeService);
    private supabaseService = inject(SupabaseService);
    private client = this.supabaseService.supabaseClient;

    loading = signal<boolean>(false);
    errorMessage = signal<string | null>(null);

    readonly isDarkMode = this.theme.isDark;

    selectedAvatarId = signal<number | null>(null);
    selectedRoleId = signal<number | null>(null);

    avatars = signal<any[]>([]);
    roles = signal<any[]>([]);

    registerForm: FormGroup = this.fb.group({
        name: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]]
    }, {
        validators: this.passwordMatchValidator
    });

    ngOnInit() {
        this.loadAvatars();
        this.loadRoles();
    }

    passwordMatchValidator(form: FormGroup) {
        const password = form.get('password')?.value;
        const confirmPassword = form.get('confirmPassword')?.value;
        return password === confirmPassword ? null : { passwordMismatch: true };
    }

    async loadAvatars() {
        const { data, error } = await (this.client as any).from('avatar').select('*');
        if (!error && data) {
            this.avatars.set(data);
        }
    }

    async loadRoles() {
        const { data, error } = await (this.client as any).from('role').select('*');
        if (!error && data) {
            this.roles.set(data);
        }
    }

    selectAvatar(id: number) {
        this.selectedAvatarId.set(id);
    }

    selectRole(id: number) {
        this.selectedRoleId.set(id);
    }

    toggleTheme() {
        this.theme.toggle();
    }

    goToLogin() {
        this.router.navigate(['/auth']);
    }

    async onSubmit(): Promise<void> {
        if (this.registerForm.invalid || this.loading()) return;

        if (!this.selectedAvatarId() || !this.selectedRoleId()) {
            this.errorMessage.set('Seleciona um avatar e uma classe para continuar.');
            return;
        }

        if (this.registerForm.hasError('passwordMismatch')) {
            this.errorMessage.set('As palavras-passe não coincidem.');
            return;
        }

        const { name, email, password } = this.registerForm.value;

        this.loading.set(true);
        this.errorMessage.set(null);

        try {
            // 1) Criar conta no Supabase Auth
            await this.authService.signUp(email, password);

            // 2) Criar perfil na tabela profile
            await this.gamificationService.addProfile(
                name,
                email,
                this.selectedAvatarId()!.toString(),
                this.selectedRoleId()!.toString()
            );

            alert('Conta criada com sucesso! Podes fazer login agora.');
            this.router.navigate(['/auth'], { replaceUrl: true });
        } catch (err: any) {
            const message = err?.message || 'Erro ao criar conta. Tenta novamente.';
            this.errorMessage.set(message);
        } finally {
            this.loading.set(false);
        }
    }
}
