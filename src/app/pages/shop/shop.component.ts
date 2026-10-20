import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ShopService } from '../../services/shop.service';
import { GamificationService } from '../../services/gamification.service';
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

  // Ações de Comprar, Adicionar e Eliminar
  buyReward(reward: Reward) {
    if (this.user().coins >= reward.cost) {
      const success = this.gamificationService.spendCoins(reward.cost);
      if (success) {
        alert(`🎉 Parabéns! Resgataste "${reward.title}"!`);
      }
    } else {
      alert('❌ Moedas insuficientes para resgatar este prémio!');
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