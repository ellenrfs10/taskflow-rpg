import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-auth',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './auth.component.html',
    styleUrls: ['./auth.component.css']
})
export class AuthComponent {
    private authService = inject(AuthService);
    private fb = inject(FormBuilder);
    private router = inject(Router);

    isLoginMode = signal<boolean>(true);
    errorMessage = signal<string | null>(null);
    loading = signal<boolean>(false);

    authForm: FormGroup = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]]
    });

    toggleMode() {
        this.isLoginMode.update(val => !val);
        this.errorMessage.set(null);
    }

    onSubmit() {
        if (this.authForm.invalid) return;

        const { email, password } = this.authForm.value;
        this.loading.set(true);
        this.errorMessage.set(null);

        if (this.isLoginMode()) {
            // Login
            this.authService.signIn(email, password).subscribe({
                next: () => {
                    this.loading.set(false);
                    this.router.navigate(['/dashboard']); // Redireciona após login
                },
                error: (err) => {
                    this.loading.set(false);
                    this.errorMessage.set(err.message || 'Erro ao fazer login.');
                }
            });
        } else {
            // Registo
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