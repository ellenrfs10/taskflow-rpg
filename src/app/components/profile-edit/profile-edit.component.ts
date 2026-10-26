import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SupabaseService } from '../../services/supabase-service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { from } from 'rxjs';

@Component({
    selector: 'app-profile-edit',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './profile-edit.component.html',
    styleUrls: ['./profile-edit.component.css']
})
export class ProfileEditComponent implements OnInit {
    private supabaseService = inject(SupabaseService);
    private authService = inject(AuthService);
    private fb = inject(FormBuilder);
    private router = inject(Router);

    avatars = signal<any[]>([]);
    roles = signal<any[]>([]);
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

    loadCatalogsAndProfile() {
        const client = this.supabaseService.supabaseClient;
        const user = this.authService.currentUser();

        if (!user) {
            this.router.navigate(['/auth']);
            return;
        }

        // 1. Carregar avatares
        from(client.from('avatar').select('*')).subscribe((res: any) => {
            if (res.data) this.avatars.set(res.data);
        });

        // 2. Carregar roles
        from(client.from('role').select('*')).subscribe((res: any) => {
            if (res.data) this.roles.set(res.data);
        });

        // 3. Carregar dados atuais do perfil do utilizador
        from(client.from('profile').select('*').eq('id', user.id).single()).subscribe((res: any) => {
            if (res.data) {
                this.profileForm.patchValue({ name: res.data.name });
                this.selectedAvatarId.set(res.data.id_avatar);
                this.selectedRoleId.set(res.data.id_role);
            }
        });
    }

    selectAvatar(id: number) { this.selectedAvatarId.set(id); }
    selectRole(id: number) { this.selectedRoleId.set(id); }

    onSubmit() {
        if (this.profileForm.invalid) return;

        const user = this.authService.currentUser();
        if (!user) return;

        this.loading.set(true);
        this.successMessage.set(null);
        this.errorMessage.set(null);

        const updates = {
            name: this.profileForm.value.name,
            id_avatar: this.selectedAvatarId(),
            id_role: this.selectedRoleId()
        };

        const promise = this.supabaseService.supabaseClient
            .from('profile')
            .update(updates)
            .eq('id', user.id);

        from(promise).subscribe({
            next: (res: any) => {
                this.loading.set(false);
                if (res.error) {
                    this.errorMessage.set(res.error.message);
                } else {
                    this.successMessage.set('Perfil atualizado com sucesso, Herói!');
                }
            },
            error: (err) => {
                this.loading.set(false);
                this.errorMessage.set(err.message || 'Erro ao atualizar perfil.');
            }
        });
    }
}