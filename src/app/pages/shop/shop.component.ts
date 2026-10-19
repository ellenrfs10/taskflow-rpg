import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GamificationService } from '../../services/gamification.service';
import { Reward } from '../../models/reward.model';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.css'
})
export class ShopComponent {
  private gamificationService = inject(GamificationService);

  // Aceder ao perfil reativo do jogador via Signals
  readonly userProfile = this.gamificationService.userProfile;

  // Mensagens de feedback de compra
  purchaseSuccessMessage = '';
  purchaseErrorMessage = '';

  // Lista padrão de recompensas disponíveis na loja
  rewards: Reward[] = [
    {
      id: 1,
      title: 'Escolher o Filme da Noite',
      description: 'Direito total à escolha do filme e snacks sem discussão!',
      cost: 50,
      icon: '🎬',
      category: 'lazer'
    },
    {
      id: 2,
      title: 'Dormir Até Mais Tarde',
      description: 'Isenção das tarefas da manhã durante um fim de semana.',
      cost: 100,
      icon: '🛌',
      category: 'descanso'
    },
    {
      id: 3,
      title: 'Jantar no Restante Favorito',
      description: 'Escolher o restaurante do próximo jantar fora.',
      cost: 150,
      icon: '🍕',
      category: 'comida'
    },
    {
      id: 4,
      title: 'Passe Livre de uma Tarefa',
      description: 'Passar uma missão à tua escolha para outro membro da equipa.',
      cost: 200,
      icon: '🎟️',
      category: 'especial'
    }
  ];

  // Formulário para criar nova recompensa personalizada
  newRewardTitle = '';
  newRewardDescription = '';
  newRewardCost = 50;
  newRewardIcon = '🎁';

  // Comprar Recompensa
  buyReward(reward: Reward) {
    this.clearMessages();

    const success = this.gamificationService.spendCoins(reward.cost);

    if (success) {
      this.purchaseSuccessMessage = `🎉 Parabéns! Resgataste "${reward.title}" por ${reward.cost} moedas!`;
    } else {
      this.purchaseErrorMessage = `❌ Moedas insuficientes! Precisas de mais ${reward.cost - this.userProfile().coins} moedas.`;
    }
  }

  // Adicionar Recompensa Personalizada
  addCustomReward() {
    if (!this.newRewardTitle.trim() || this.newRewardCost <= 0) return;

    const newReward: Reward = {
      id: Date.now(),
      title: this.newRewardTitle,
      description: this.newRewardDescription || 'Recompensa personalizada criada pela equipa.',
      cost: this.newRewardCost,
      icon: this.newRewardIcon || '🎁',
      category: 'especial'
    };

    this.rewards.push(newReward);
    this.resetForm();
  }

  private resetForm() {
    this.newRewardTitle = '';
    this.newRewardDescription = '';
    this.newRewardCost = 50;
    this.newRewardIcon = '🎁';
  }

  private clearMessages() {
    this.purchaseSuccessMessage = '';
    this.purchaseErrorMessage = '';
  }
}