import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { REWARD_CATEGORIES, Reward, RewardCategory } from '../../models/reward.model';
import { GamificationService } from '../../services/gamification.service';
import { ShopService } from '../../services/shop.service';
import { SupabaseService } from '../../services/supabase-service';

type SortOrder = 'asc' | 'desc' | 'none';

interface Feedback {
  kind: 'success' | 'error';
  text: string;
}

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.css'
})
export class ShopComponent implements OnInit {
  private shopService = inject(ShopService);
  private gamificationService = inject(GamificationService);
  private supabaseService = inject(SupabaseService);
  private fb = inject(FormBuilder);

  readonly user = this.gamificationService.userProfile;
  readonly loading = this.shopService.loading;
  readonly error = this.shopService.error;

  readonly selectedCategory = signal<string>('Todas');
  readonly sortByPrice = signal<SortOrder>('none');
  readonly isBuying = signal<boolean>(false);
  readonly feedback = signal<Feedback | null>(null);

  readonly categoryOptions = REWARD_CATEGORIES;
  readonly filterCategories: string[] = ['Todas', ...REWARD_CATEGORIES];

  readonly rewardForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    cost: [50, [Validators.required, Validators.min(1)]],
    icon: ['🎁', [Validators.required]],
    category: ['Geral' as RewardCategory, [Validators.required]]
  });

  readonly filteredRewards = computed(() => {
    let list = [...this.shopService.rewards()];

    const category = this.selectedCategory();
    if (category !== 'Todas') {
      list = list.filter((r: Reward) => r.category === category);
    }

    const order = this.sortByPrice();
    if (order === 'asc') list.sort((a, b) => a.cost - b.cost);
    if (order === 'desc') list.sort((a, b) => b.cost - a.cost);

    return list;
  });

  ngOnInit(): void {
    this.shopService.loadRewards();
  }

  reload(): void {
    this.shopService.loadRewards();
  }

  filterByCategory(cat: string): void {
    this.selectedCategory.set(cat);
  }

  setSortOrder(value: string): void {
    this.sortByPrice.set(value as SortOrder);
  }

  async buyReward(reward: Reward): Promise<void> {
    const currentUser = this.user();

    if (!currentUser.id || this.isBuying()) return;

    if (currentUser.coins < reward.cost) {
      this.showMessage('error', 'Moedas insuficientes para resgatar este prémio.');
      return;
    }

    this.isBuying.set(true);
    try {
      // 1. Regista o resgate; se falhar, ninguém perde moedas
      const { error } = await this.supabaseService.supabaseClient
        .from('user_rewards')
        .insert({ profile_id: String(currentUser.id), reward_id: Number(reward.id) });
      if (error) throw error;

      // 2. Só depois desconta as moedas
      const spent = await this.gamificationService.spendCoins(reward.cost);
      if (!spent) throw new Error('Não foi possível descontar as moedas.');

      this.showMessage('success', `Resgataste "${reward.title}" com sucesso!`);
    } catch (err) {
      console.error('Erro ao processar resgate:', err);
      this.showMessage('error', 'Ocorreu um erro ao resgatar o prémio. Tenta novamente.');
    } finally {
      this.isBuying.set(false);
    }
  }

  addReward(): void {
    if (this.rewardForm.invalid) {
      this.rewardForm.markAllAsTouched();
      return;
    }

    const value = this.rewardForm.getRawValue();
    this.shopService
      .addReward({
        title: value.title ?? '',
        description: value.description ?? '',
        cost: Number(value.cost),
        icon: value.icon ?? '🎁',
        category: value.category ?? 'Geral'
      })
      .subscribe({
        next: () => {
          this.rewardForm.reset({ title: '', description: '', cost: 50, icon: '🎁', category: 'Geral' });
          this.showMessage('success', 'Prémio criado com sucesso!');
        },
        error: () => this.showMessage('error', 'Não foi possível criar o prémio. Tenta novamente.')
      });
  }

  removeReward(id: string): void {
    if (!confirm('Tem a certeza que deseja eliminar este prémio da loja?')) return;

    this.shopService.deleteReward(id).subscribe({
      next: () => this.showMessage('success', 'Prémio eliminado.'),
      error: (err: Error) => this.showMessage('error', err.message || 'Não foi possível eliminar o prémio.')
    });
  }

  private showMessage(kind: Feedback['kind'], text: string): void {
    this.feedback.set({ kind, text });
  }
}
