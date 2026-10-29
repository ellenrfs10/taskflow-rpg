import { Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GamificationService } from '../../services/gamification.service';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

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

  readonly userProfile = this.gamificationService.userProfile;
  readonly pendingTasks = computed(() => this.taskService.tasks().filter(t => !t.completed));
  readonly completedTasks = computed(() => this.taskService.tasks().filter(t => t.completed));

  // Exibir apenas as últimas 5 missões pendentes
  readonly recentPendingTasks = computed(() => {
    const tasks = this.pendingTasks();
    return [...tasks].slice(0, 5);
  });

  // Exibir apenas as últimas 5 missões concluídas (ordenadas pelas mais recentes)
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

  isDarkMode = this.themeService.isDark;

  ngOnInit() {
    this.taskService.loadTasks();
    this.gamificationService.loadProfiles();
  }
}
