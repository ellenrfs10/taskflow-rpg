import { Component, inject, OnInit, computed } from '@angular/core';
import { DecimalPipe, NgClass, TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GamificationService } from '../../services/gamification.service';
import { TaskService } from '../../services/task.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, NgClass, DecimalPipe, TitleCasePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  private gamificationService = inject(GamificationService);
  private taskService = inject(TaskService);
  private theme = inject(ThemeService);

  readonly userProfile = this.gamificationService.userProfile;

  readonly pendingTasks = computed(() => this.taskService.tasks().filter(t => !t.completed));
  readonly completedTasks = computed(() => this.taskService.tasks().filter(t => t.completed));

  readonly xpPercent = computed(() => {
    const { currentXp, maxXp } = this.userProfile();
    return maxXp > 0 ? Math.min(100, Math.max(0, (currentXp / maxXp) * 100)) : 0;
  });

  // Modo escuro/claro vem do serviço partilhado
  readonly isDarkMode = this.theme.isDark;

  ngOnInit() {
    this.taskService.loadTasks();
  }

  toggleTheme() {
    this.theme.toggle();
  }
}