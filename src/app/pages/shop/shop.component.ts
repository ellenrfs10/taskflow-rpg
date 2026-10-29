import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ShopService } from '../../services/shop.service';
import { GamificationService } from '../../services/gamification.service';
import { SupabaseService } from '../../services/supabase-service';
import { Reward, RewardCategory } from '../../models/reward.model';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.css'
})
export class ShopComponent {
  private shopService = inject(ShopService);
  private gamificationService = inject(GamificationService);
  private supabaseService = inject(SupabaseService);
  private fb = inject(FormBuilder);

  // Perfil ativo
  readonly user = this.gamificationService.userProfile;

  // Filtros
  readonly selectedCategory = signal<string>('Todas');
  readonly sortByPrice = signal<'asc' | 'desc' | 'none'>('none');

  // Estados
  readonly isBuying = signal<boolean>(false);

  categories: string[] = ['Todas', 'Geral', 'Lazer', 'Privilégios', 'Guloseimas'];
  icons: string[] = ['🎁', '🎮', '🍕', '🎬', '🛏️', '🎉', '🧸', '🏆'];

  // Formulário Reativo para criar novo prémio
  rewardForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    cost: [50, [Validators.required, Validators.min(1)]],
    icon: ['🎁', [Validators.required]],
    category: ['Geral' as RewardCategory, [Validators.required]]
  });

  // Lista reativa filtrada e ordenada
  readonly filteredRewards = computed(() => {
    let list = [...this.shopService.rewards()];

    // 1. Filtrar por Categoria
    const category = this.selectedCategory();
    if (category !== 'Todas') {
      list = list.filter((r: Reward) => r.category === category);
    }

    // 2. Ordenar por Preço
    const order = this.sortByPrice();
    if (order === 'asc') {
      list.sort((a: Reward, b: Reward) => a.cost - b.cost);
    } else if (order === 'desc') {
      list.sort((a: Reward, b: Reward) => b.cost - a.cost);
    }

    return list;
  });

  // Métodos de Controlo dos Filtros
  filterByCategory(cat: string): void {
    this.selectedCategory.set(cat);
  }

  setSortOrder(order: 'asc' | 'desc' | 'none'): void {
    this.sortByPrice.set(order);
  }

  // Ação de Comprar Prémio
  async buyReward(reward: Reward): Promise<void> {
    const currentUser = this.user();

    if (!currentUser || !currentUser.id) {
      alert('❌ Erro: Utilizador não identificado.');
      return;
    }

    if (currentUser.coins < reward.cost) {
      alert('❌ Moedas insuficientes para resgatar este prémio!');
      return;
    }

    if (this.isBuying()) return;

    this.isBuying.set(true);

    try {
      const userId = String(currentUser.id);
      const client = this.supabaseService.supabaseClient;

      // 1. Descontar moedas através do GamificationService (mantém o signal sincronizado)
      const spent = this.gamificationService.spendCoins(reward.cost);

      if (!spent) {
        throw new Error('Não foi possível descontar as moedas.');
      }

      // 2. Registar o resgate na tabela user_rewards
      const { error: rewardError } = await client
        .from('user_rewards')
        .insert({
          profile_id: userId,
          reward_id: Number(reward.id)
        });

      if (rewardError) throw rewardError;

      alert(`🎉 Parabéns! Resgataste "${reward.title}" com sucesso!`);
    } catch (err: any) {
      console.error('Erro ao processar resgate:', err);
      alert('❌ Ocorreu um erro ao resgatar o prémio. Tenta novamente.');
    } finally {
      this.isBuying.set(false);
    }
  }

  addReward(): void {
    if (this.rewardForm.invalid) return;

    this.shopService.addReward(this.rewardForm.value);
    this.rewardForm.reset({
      title: '',
      description: '',
      cost: 50,
      icon: '🎁',
      category: 'Geral'
    });
  }

  removeReward(id: string): void {
    if (confirm('Tem a certeza que deseja eliminar este prémio da loja?')) {
      this.shopService.deleteReward(id);
    }
  }
}
