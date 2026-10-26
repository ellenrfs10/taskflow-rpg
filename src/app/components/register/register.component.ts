import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SupabaseService } from '../../services/supabase-service';
import { Router, RouterLink } from '@angular/router';
import { from } from 'rxjs';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
    private authService = inject(AuthService);
    private supabaseService = inject(SupabaseService);
    private fb = inject(FormBuilder);
    private router = inject(Router);

    avatars = signal<any[]>([]);
    selectedAvatarId = signal<number | null>(null);
    errorMessage = signal<string | null>(null);
    loading = signal<boolean>(false);

    registerForm: FormGroup = this.fb.group({
        name: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]]
    });

    ngOnInit() {
        this.loadAvatars();
    }

    loadAvatars() {
        const promise = this.supabaseService.supabaseClient
            .from('avatar')
            .select('*');

        from(promise).subscribe({
            next: (res: any) => {
                if (res.data) {
                    this.avatars.set(res.data);
                    if (res.data.length > 0) {
                        this.selectedAvatarId.set(res.data[0].id); // Seleciona o primeiro por defeito
                    }
                }
            },
            error: (err) => console.error('Erro ao carregar avatares:', err)
        });
    }

    selectAvatar(id: number) {
        this.selectedAvatarId.set(id);
    }

    onSubmit() {
        if (this.registerForm.invalid || !this.selectedAvatarId()) return;

        const { name, email, password } = this.registerForm.value;
        const avatarId = this.selectedAvatarId()!;

        this.loading.set(true);
        this.errorMessage.set(null);

        this.authService.signUp(email, password, name, avatarId).subscribe({
            next: () => {
                this.loading.set(false);
                alert('Herói registado com sucesso! Podes fazer login.');
                this.router.navigate(['/auth']);
            },
            error: (err) => {
                this.loading.set(false);
                this.errorMessage.set(err.message || 'Erro ao criar conta.');
            }
        });
    }
}