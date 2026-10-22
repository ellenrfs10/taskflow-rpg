import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GamificationService } from '../../services/gamification.service';

@Component({
    selector: 'app-family-management',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './family-management.component.html',
    styleUrl: './family-management.component.css'
})
export class FamilyManagementComponent {
    private gamificationService = inject(GamificationService);
    private fb = inject(FormBuilder);

    // Variável que o HTML espera para o *ngFor
    readonly familyMembers = this.gamificationService.profiles;
    readonly activeUser = this.gamificationService.userProfile;

    // Formulário correspondente aos campos do HTML
    memberForm: FormGroup = this.fb.group({
        name: ['', [Validators.required, Validators.minLength(2)]],
        email: ['usuario@taskflow.com', [Validators.required, Validators.email]], // Incluído para satisfazer a BD
        avatar: ['🧙‍♂️', Validators.required],
        role: ['Filho(a)', Validators.required]
    });

    avatars = ['🧙‍♀️', '🧙‍♂️', '🛡️', '⚔️', '🏹', '🐉', '🦁', '👑', '🦸‍♂️'];

    switchMember(id: number) {
        this.gamificationService.switchActiveProfile(id);
    }

    onSubmit() {
        if (this.memberForm.invalid) return;

        const { name, email, avatar, role } = this.memberForm.value;

        // Envia os dados para o serviço gravar na tabela 'profile' do Supabase
        this.gamificationService.addProfile(name, email, avatar, role);

        this.memberForm.reset({
            name: '',
            email: 'usuario@taskflow.com',
            avatar: '🧙‍♂️',
            role: 'Filho(a)'
        });
    }
}