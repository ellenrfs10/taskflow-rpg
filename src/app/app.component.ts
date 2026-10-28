import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GamificationService } from './services/gamification.service';
import { TaskService } from './services/task.service';
import { ThemeService } from './services/theme.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  private gamificationService = inject(GamificationService);
  private taskService = inject(TaskService);
  private authService = inject(AuthService);
  protected theme = inject(ThemeService);

  readonly currentUser = this.authService.currentUser;
  readonly userProfile = this.gamificationService.userProfile;

  readonly pendingInvitesCount = computed(() => {
    const userId = this.userProfile().id;
    if (!userId) return 0;

    const tasks = this.taskService.tasks();

    return tasks.filter((task: any) => {
      if (!task.isCooperative) return false;
      if (!Array.isArray(task.participants)) return false;

      const isParticipant = task.participants.some((p: any) => {
        if (typeof p === 'string') return p === userId;
        if (p && typeof p === 'object') return p.userId === userId;
        return false;
      });

      if (!isParticipant) return false;

      const acknowledged = task.acknowledgedBy || [];
      return !acknowledged.includes(userId);
    }).length;
  });

  ngOnInit() {
    this.taskService.loadTasks();
    // Garante que os perfis são carregados logo ao iniciar a app
    this.gamificationService.loadProfiles();
  }

  logout() {
    this.authService.signOut();
  }
}
