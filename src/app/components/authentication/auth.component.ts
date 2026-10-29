import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
    selector: 'app-auth',
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule],
    templateUrl: './auth.component.html',
    styleUrls: ['./auth.component.css']
})
export class AuthComponent {
    private authService = inject(AuthService);
    private fb = inject(FormBuilder);
    private theme = inject(ThemeService);

    isLoginMode = signal<boolean>(true);
    errorMessage = signal<string | null>(null);
    loading = signal<boolean>(false);

    // Modo escuro/claro vem do serviço partilhado
    readonly isDarkMode = this.theme.isDark;

    authForm: FormGroup = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]]
    });

    toggleMode(): void {
        this.isLoginMode.update((val) => !val);
        this.errorMessage.set(null);
        this.authForm.reset();
    }

    toggleTheme(): void {
        this.theme.toggle();
    }

    async onSubmit(): Promise<void> {
        if (this.authForm.invalid || this.loading()) return;

        const { email, password } = this.authForm.value;

        this.loading.set(true);
        this.errorMessage.set(null);

        try {
            if (this.isLoginMode()) {
                // O AuthService já trata do redirecionamento para /dashboard
                await this.authService.signIn(email, password);
            } else {
                // Criação de conta
                await this.authService.signUp(email, password);
                this.errorMessage.set(null);
                alert('Conta criada com sucesso! Verifica o teu email para confirmar, caso seja necessário.');
                this.isLoginMode.set(true);
                this.authForm.reset();
            }
        } catch (err: any) {
            const message = err?.message || 'Ocorreu um erro ao tentar autenticar. Tenta novamente.';
            this.errorMessage.set(message);
        } finally {
            this.loading.set(false);
        }
    }
}
