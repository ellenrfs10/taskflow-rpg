import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-auth',
    standalone: true,
    imports: [ReactiveFormsModule],
    templateUrl: './auth.component.html',
    styleUrls: ['./auth.component.css']
})
export class AuthComponent {
    private authService = inject(AuthService);
    private fb = inject(FormBuilder);
    private router = inject(Router);
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

    toggleMode() {
        this.isLoginMode.update(val => !val);
        this.errorMessage.set(null);
    }

    toggleTheme() {
        this.theme.toggle();
    }

    onSubmit() {
        if (this.authForm.invalid) return;

        const { email, password } = this.authForm.value;
        this.loading.set(true);
        this.errorMessage.set(null);

        if (this.isLoginMode()) {
            this.authService.signIn(email, password).subscribe({
                next: () => {
                    this.loading.set(false);
                    this.router.navigate(['/dashboard']);
                },
                error: (err) => {
                    this.loading.set(false);
                    this.errorMessage.set(err.message || 'Erro ao fazer login.');
                }
            });
        } else {
            this.authService.signUp(email, password).subscribe({
                next: () => {
                    this.loading.set(false);
                    alert('Conta criada com sucesso! Verifica o teu email para confirmar (se aplicável).');
                    this.isLoginMode.set(true);
                },
                error: (err) => {
                    this.loading.set(false);
                    this.errorMessage.set(err.message || 'Erro ao criar conta.');
                }
            });
        }
    }
}