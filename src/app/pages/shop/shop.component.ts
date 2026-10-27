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
  selectedCategory = signal<string>('Todas');
  sortByPrice = signal<'asc' | 'desc' | 'none'>('none');

  categories: string[] = ['Todas', 'Geral', 'Lazer', 'Privilégios', 'Guloseimas'];

  // Formulário Reativo para criar novo prémio
  rewardForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    cost: [50, [Validators.required, Validators.min(1)]],
    icon: ['🎁', Validators.required],
    category: ['Geral' as RewardCategory, Validators.required]
  });

  // Lista reativa filtrada e ordenada
  filteredRewards = computed(() => {
    let list = [...this.shopService.rewards()];

    // 1. Filtrar por Categoria
    const category = this.selectedCategory();
    if (category !== 'Todas') {
      list = list.filter(r => r.category === category);
    }

    // 2. Ordenar por Preço
    const order = this.sortByPrice();
    if (order === 'asc') {
      list.sort((a, b) => a.cost - b.cost); // Do mais barato ao mais caro
    } else if (order === 'desc') {
      list.sort((a, b) => b.cost - a.cost); // Do mais caro ao mais barato
    }

    return list;
  });

  // Métodos de Controlo dos Filtros
  filterByCategory(cat: string) {
    this.selectedCategory.set(cat);
  }

  setSortOrder(order: 'asc' | 'desc' | 'none') {
    this.sortByPrice.set(order);
  }

  // Ação de Comprar Prémio (com conversão segura do ID para string)
  async buyReward(reward: Reward) {
    const currentUser = this.user();

    // 1. Validar se o utilizador e o ID existem
    if (!currentUser || currentUser.id === undefined || currentUser.id === null) {
      alert('❌ Erro: Utilizador não identificado.');
      return;
    }

    // Converte o ID para string para satisfazer a tipagem da tabela
    const userId: string = String(currentUser.id);

    if (currentUser.coins < reward.cost) {
      alert('❌ Moedas insuficientes para resgatar este prémio!');
      return;
    }

    const client = this.supabaseService.supabaseClient;
    const newCoins = currentUser.coins - reward.cost;

    try {
      // 2. Descontar as moedas no perfil do herói
      const { error: profileError } = await client
        .from('profile')
        .update({ coins: newCoins })
        .eq('id', userId);

      if (profileError) throw profileError;

      // 3. Registar o resgate na tabela user_rewards
      const { error: rewardError } = await client
        .from('user_rewards')
        .insert({
          profile_id: userId,
          reward_id: Number(reward.id)
        });

      if (rewardError) throw rewardError;

      // 4. Atualizar o ecrã para refletir as novas moedas
      window.location.reload();

      alert(`🎉 Parabéns! Resgataste "${reward.title}" com sucesso!`);
    } catch (err: any) {
      console.error('Erro ao processar resgate:', err);
      alert('❌ Ocorreu um erro ao resgatar o prémio. Tenta novamente.');
    }
  }

  addReward() {
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

  removeReward(id: string) {
    if (confirm('Tem a certeza que deseja eliminar este prémio da loja?')) {
      this.shopService.deleteReward(id);
    }
  }
}