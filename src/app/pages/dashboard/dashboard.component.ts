import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GamificationService } from '../../services/gamification.service';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { HouseholdService } from '../../services/household.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  private gamificationService = inject(GamificationService);
  private taskService = inject(TaskService);
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private householdService = inject(HouseholdService);

  readonly userProfile = this.gamificationService.userProfile;
  readonly inviteCode = signal<string | null>(null);

  readonly pendingTasks = computed(() => this.taskService.tasks().filter(t => !t.completed));
  readonly completedTasks = computed(() => this.taskService.tasks().filter(t => t.completed));

  readonly recentPendingTasks = computed(() => {
    const tasks = this.pendingTasks();
    return [...tasks].slice(0, 5);
  });

  readonly recentCompletedTasks = computed(() => {
    const tasks = this.completedTasks();
    const sorted = [...tasks].sort((a: any, b: any) => {
      const dateA = a.completedAt || a.updatedAt || a.createdAt || a.dueDate;
      const dateB = b.completedAt || b.updatedAt || b.createdAt || b.dueDate;

      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;

      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    return sorted.slice(0, 5);
  });

  readonly xpPercent = computed(() => {
    const profile = this.userProfile();
    if (!profile.maxXp) return 0;
    return Math.min(100, (profile.currentXp / profile.maxXp) * 100);
  });

  readonly closestDeadline = computed(() => {
    const pending = this.pendingTasks();
    const withDate = pending.filter((t: any) => t.dueDate);
    if (withDate.length === 0) return null;
    const sorted = [...withDate].sort((a: any, b: any) =>
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
    return sorted[0];
  });

  readonly lastPurchasedReward = signal<{ title: string; icon: string; redeemed_at: string } | null>(null);

  isDarkMode = this.themeService.isDark;

  constructor() {
    effect(() => {
      const profile = this.userProfile();
      const householdId = profile?.household_id;
      if (householdId) {
        this.householdService.getHouseholdById(householdId).subscribe({
          next: (household) => {
            this.inviteCode.set(household.invite_code);
          },
          error: () => {
            this.inviteCode.set(null);
          }
        });
      } else {
        this.inviteCode.set(null);
      }
    });
  }

  ngOnInit() {
    this.taskService.loadTasks();
    this.gamificationService.loadProfiles();
    this.loadLastPurchasedReward();
  }

  private async loadLastPurchasedReward() {
    const user = this.authService.currentUser();
    if (!user) return;

    try {
      const client = (this as any).supabaseService?.supabaseClient;
      if (!client) return;

      const { data, error } = await client
        .from('user_rewards')
        .select('redeemed_at, rewards(title, icon)')
        .eq('profile_id', user.id)
        .order('redeemed_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        const item = data[0];
        this.lastPurchasedReward.set({
          title: item.rewards?.title || 'Prémio',
          icon: item.rewards?.icon || '🎁',
          redeemed_at: item.redeemed_at
        });
      } else {
        this.lastPurchasedReward.set(null);
      }
    } catch (err) {
      console.error('Erro ao carregar último prémio resgatado:', err);
      this.lastPurchasedReward.set(null);
    }
  }

  copyInviteCode() {
    const code = this.inviteCode();
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      const btn = document.querySelector('.btn-copy-invite');
      if (btn) {
        const original = btn.textContent;
        btn.textContent = 'Copiado!';
        setTimeout(() => { btn.textContent = original; }, 2000);
      }
    });
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
  }
}
