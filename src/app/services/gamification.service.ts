import { Injectable, signal } from '@angular/core';
import { UserProfile } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class GamificationService {

    // Estado reativo do utilizador/jogador utilizando Signals
    private userProfileSignal = signal<UserProfile>({
        name: 'Aventureiro Doméstico',
        avatar: '🧙‍♂️',
        level: 1,
        currentXp: 0,
        maxXp: 100,
        coins: 50,
        streakDays: 1
    });

    // Expor o perfil como readonly para os componentes consumirem em segurança
    readonly userProfile = this.userProfileSignal.asReadonly();

    // Adicionar XP e Moedas (chamado ao concluir tarefas)
    addRewards(xpEarned: number, coinsEarned: number) {
        const current = this.userProfileSignal();
        let newXp = current.currentXp + xpEarned;
        let newLevel = current.level;
        let newMaxXp = current.maxXp;
        let newCoins = current.coins + coinsEarned;

        // Lógica de Subida de Nível (Ex: cada nível exige Nível * 100 XP)
        if (newXp >= newMaxXp) {
            newXp -= newMaxXp;
            newLevel += 1;
            newMaxXp = newLevel * 100;
            console.log(`Subiu de nível! Agora estás no nível ${newLevel}`);
        }

        // Atualizar o estado do sinal
        this.userProfileSignal.update(profile => ({
            ...profile,
            level: newLevel,
            currentXp: newXp,
            maxXp: newMaxXp,
            coins: newCoins
        }));
    }

    // Gastar moedas na loja de recompensas
    spendCoins(amount: number): boolean {
        const current = this.userProfileSignal();
        if (current.coins >= amount) {
            this.userProfileSignal.update(profile => ({
                ...profile,
                coins: profile.coins - amount
            }));
            return true; // Compra efetuada com sucesso
        }
        return false; // Moedas insuficientes
    }

    // Atualizar a personagem/avatar escolhida
    updateAvatar(avatarIcon: string, name: string) {
        this.userProfileSignal.update(profile => ({
            ...profile,
            avatar: avatarIcon,
            name: name
        }));
    }
}