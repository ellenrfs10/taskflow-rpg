import { Component, OnDestroy, computed, effect, inject, signal, untracked } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { GamificationService } from '../../services/gamification.service';
import { TaskService } from '../../services/task.service';
import { HouseholdService } from '../../services/household.service';
import { SupabaseService } from '../../services/supabase-service';
import { HouseholdInviteCodeComponent } from '../../components/household-invite-code/household-invite-code.component';

interface PurchasedReward {
  title: string;
  icon: string;
  redeemed_at: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink, HouseholdInviteCodeComponent],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnDestroy {
  private gamificationService = inject(GamificationService);
  private taskService = inject(TaskService);
  private householdService = inject(HouseholdService);
  private client = inject(SupabaseService).supabaseClient;

  readonly userProfile = this.gamificationService.userProfile;

  // As mesmas regras da página de missões: os números batem sempre
  readonly pendingTasks = this.taskService.pendingTasks;
  readonly completedTasks = this.taskService.completedTasks;

  readonly recentPendingTasks = computed(() => this.pendingTasks().slice(0, 5));
  readonly recentCompletedTasks = computed(() => this.completedTasks().slice(0, 5));

  readonly xpPercent = computed(() => {
    const profile = this.userProfile();
    if (!profile.maxXp) return 0;
    return Math.min(100, (profile.currentXp / profile.maxXp) * 100);
  });

  /** Pendente com o prazo mais próximo (as datas YYYY-MM-DD ordenam-se como texto). */
  readonly closestDeadline = computed(() => {
    const withDate = this.pendingTasks().filter((t) => t.dueDate);
    return [...withDate].sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))[0] ?? null;
  });

  readonly inviteCode = signal<string | null>(null);
  readonly lastPurchasedReward = signal<PurchasedReward | null>(null);

  // computed: só avisa quando o TEXTO do id muda (e não a cada XP ou moeda ganha)
  private readonly userId = computed(() => this.userProfile().id);
  private readonly householdId = computed(() => this.userProfile().household_id ?? null);

  private householdSub?: Subscription;

  constructor() {
    // Casa mudou -> vai buscar o código; a subscrição anterior é cancelada primeiro
    effect(() => {
      const householdId = this.householdId();

      untracked(() => {
        this.householdSub?.unsubscribe();

        if (!householdId) {
          this.inviteCode.set(null);
          return;
        }

        this.householdSub = this.householdService.getHouseholdById(householdId).subscribe({
          next: (household) => this.inviteCode.set(household.invite_code),
          error: () => this.inviteCode.set(null)
        });
      });
    });

    // Perfil carregado -> procura o último prémio resgatado
    effect(() => {
      const id = this.userId();

      untracked(() => {
        if (id) {
          void this.loadLastPurchasedReward(id);
        } else {
          this.lastPurchasedReward.set(null);
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.householdSub?.unsubscribe();
  }

  private async loadLastPurchasedReward(userId: string): Promise<void> {
    try {
      const { data, error } = await (this.client as any)
        .from('user_rewards')
        .select('redeemed_at, rewards(title, icon)')
        .eq('profile_id', userId)
        .order('redeemed_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      const item = data?.[0];
      this.lastPurchasedReward.set(
        item
          ? {
            title: item.rewards?.title || 'Prémio',
            icon: item.rewards?.icon || '🎁',
            redeemed_at: item.redeemed_at
          }
          : null
      );
    } catch (err) {
      console.error('Erro ao carregar último prémio resgatado:', err);
      this.lastPurchasedReward.set(null);
    }
  }
}
