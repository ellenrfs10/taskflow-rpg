import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GamificationService } from './services/gamification.service';
import { TaskService } from './services/task.service';
import { ThemeService } from './services/theme.service';
import { AuthService } from './services/auth.service';
import { Task } from './models/task.model';

interface PendingInvite {
  task: Task;
  inviterName: string;
}

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
  readonly profiles = this.gamificationService.profiles;

  // Convites pendentes com informação de quem convidou
  readonly pendingInvites = computed<PendingInvite[]>(() => {
    const userId = this.userProfile().id;
    if (!userId) return [];

    const tasks = this.taskService.tasks();
    const allProfiles = this.profiles();

    return tasks
      .filter((task: any) => {
        if (!task.isCooperative) return false;
        if (!Array.isArray(task.participants)) return false;

        // Verifica se o utilizador logado está nos participantes
        const isParticipant = task.participants.some((p: any) => {
          if (typeof p === 'string') return p === userId;
          if (p && typeof p === 'object') return p.userId === userId;
          return false;
        });

        if (!isParticipant) return false;

        // Verifica se já foi reconhecido/aceite
        const acknowledged = task.acknowledgedBy || [];
        return !acknowledged.includes(userId);
      })
      .map((task: any) => {
        const inviter = allProfiles.find((p: any) => p.id === task.profile_id);
        return {
          task,
          inviterName: inviter?.name || 'Alguém'
        };
      });
  });

  readonly pendingInvitesCount = computed(() => this.pendingInvites().length);

  // Texto para mostrar no tooltip
  readonly inviteTooltip = computed(() => {
    const invites = this.pendingInvites();
    if (invites.length === 0) return '';

    if (invites.length === 1) {
      return `${invites[0].inviterName} convidou-te para uma missão em conjunto`;
    }

    return `${invites[0].inviterName} e mais ${invites.length - 1} pessoa(s) convidaram-te para missões em conjunto`;
  });

  ngOnInit() {
    this.taskService.loadTasks();
    this.gamificationService.loadProfiles();
    setTimeout(() => {
      this.gamificationService.checkAndUpdateStreak();
    }, 500);
  }

  logout() {
    this.authService.signOut();
  }
}
