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

  readonly isDarkMode = this.theme.isDark;

  // Verifica se o avatar é uma imagem ou um emoji
  readonly avatarIsImage = computed(() => {
    const avatar = this.userProfile().avatar;
    if (!avatar) return false;
    return avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.includes('/assets/');
  });

  readonly avatarImageSrc = computed(() => {
    const avatar = this.userProfile().avatar;
    if (this.avatarIsImage()) return avatar;
    return null;
  });

  readonly avatarEmoji = computed(() => {
    const avatar = this.userProfile().avatar;
    if (this.avatarIsImage()) return null;
    return avatar || '🧙‍♂️';
  });

  ngOnInit() {
    this.taskService.loadTasks();
    // Força o reload do perfil para garantir avatar atualizado
    this.gamificationService.loadProfiles();
  }

  toggleTheme() {
    this.theme.toggle();
  }
}
