import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FamilyMember } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class GamificationService {
    private platformId = inject(PLATFORM_ID);
    private readonly STORAGE_KEY = 'taskflow_family_members';

    private initialMembers: FamilyMember[] = [
        {
            id: '01',
            name: 'Ellen',
            email: 'ellen.nandes@gmail.com',
            avatar: '🧙‍♀️',
            role: 'Pai/Mãe',
            level: 1,
            currentXp: 0,
            maxXp: 100,
            coins: 50,
            streakDays: 3,
            active: true
        },
        {
            id: '02',
            name: 'Aventureiro Doméstico',
            email: 'aventureiro@gmail.com',
            avatar: '🧙‍♂️',
            role: 'Filho(a)',
            level: 1,
            currentXp: 0,
            maxXp: 100,
            coins: 50,
            streakDays: 1,
            active: false
        }
    ];

    readonly familyMembers = signal<FamilyMember[]>(this.loadMembers());
    readonly userProfile = signal<FamilyMember>(this.getActiveMember());

    private loadMembers(): FamilyMember[] {
        if (isPlatformBrowser(this.platformId)) {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            return saved ? JSON.parse(saved) : this.initialMembers;
        }
        return this.initialMembers;
    }

    private getActiveMember(): FamilyMember {
        const members = this.loadMembers();
        return members.find(m => m.active) || members[0];
    }

    private saveToStorage(members: FamilyMember[]) {
        if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(members));
        }
    }

    switchActiveUser(memberId: string) {
        const updated = this.familyMembers().map(member => ({
            ...member,
            active: member.id === memberId
        }));
        this.familyMembers.set(updated);
        this.saveToStorage(updated);
        this.userProfile.set(this.getActiveMember());
    }

    // Atualizado para receber o email nos parâmetros
    addFamilyMember(name: string, avatar: string, role: FamilyMember['role'], email: string) {
        // Desativa os outros membros para que o novo entre como ativo
        const deactivated = this.familyMembers().map(m => ({ ...m, active: false }));

        const newMember: FamilyMember = {
            id: Date.now().toString(),
            name,
            email, // Atribuído corretamente aqui
            avatar,
            role,
            level: 1,
            currentXp: 0,
            maxXp: 100,
            coins: 20,
            streakDays: 1,
            active: true // Novo membro entra ativo
        };

        const updated = [...deactivated, newMember];
        this.familyMembers.set(updated);
        this.saveToStorage(updated);
        this.userProfile.set(newMember);
    }

    addRewards(xp: number, coins: number) {
        const activeId = this.userProfile().id;
        const updated = this.familyMembers().map(member => {
            if (member.id === activeId) {
                let newXp = member.currentXp + xp;
                let newLevel = member.level;
                let newMaxXp = member.maxXp;

                if (newXp >= newMaxXp) {
                    newXp -= newMaxXp;
                    newLevel += 1;
                    newMaxXp = Math.floor(newMaxXp * 1.2);
                }

                const modified: FamilyMember = {
                    ...member,
                    currentXp: newXp,
                    level: newLevel,
                    maxXp: newMaxXp,
                    coins: member.coins + coins
                };
                this.userProfile.set(modified);
                return modified;
            }
            return member;
        });

        this.familyMembers.set(updated);
        this.saveToStorage(updated);
    }

    spendCoins(amount: number): boolean {
        let success = false;
        const activeId = this.userProfile().id;

        const updated = this.familyMembers().map(member => {
            if (member.id === activeId && member.coins >= amount) {
                success = true;
                const modified: FamilyMember = { ...member, coins: member.coins - amount };
                this.userProfile.set(modified);
                return modified;
            }
            return member;
        });

        if (success) {
            this.familyMembers.set(updated);
            this.saveToStorage(updated);
        }
        return success;
    }
}