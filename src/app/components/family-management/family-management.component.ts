import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GamificationService } from '../../services/gamification.service';
import { FamilyMember } from '../../models/user.model';

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

    readonly familyMembers = this.gamificationService.familyMembers;
    readonly activeUser = this.gamificationService.userProfile;

    // Adicionado o campo 'email' com validação
    memberForm: FormGroup = this.fb.group({
        name: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        avatar: ['🛡️', Validators.required],
        role: ['Filho(a)' as FamilyMember['role'], Validators.required]
    });

    avatars = ['🧙‍♀️', '🧙‍♂️', '🛡️', '⚔️', '🏹', '🐉', '🦁', '👑', '🦸‍♂️'];

    switchMember(id: string) {
        this.gamificationService.switchActiveUser(id);
    }

    onSubmit() {
        if (this.memberForm.invalid) return;

        const { name, email, avatar, role } = this.memberForm.value;

        // Passamos agora os 4 argumentos exigidos pelo serviço
        this.gamificationService.addFamilyMember(name, avatar, role, email);

        this.memberForm.reset({
            name: '',
            email: '',
            avatar: '🛡️',
            role: 'Filho(a)'
        });
    }
}