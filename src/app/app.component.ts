import { Component, computed, effect, HostBinding, inject, untracked } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GamificationService } from './services/gamification.service';
import { TaskService } from './services/task.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private gamificationService = inject(GamificationService);
  private taskService = inject(TaskService);
  private authService = inject(AuthService);

  @HostBinding('class.logged-in')
  get loggedIn(): boolean {
    return !!this.currentUser();
  }

  readonly currentUser = this.authService.currentUser;

  /**
   * Só o id interessa: o objeto do utilizador é recriado a cada renovação de sessão,
   * mas o texto do id só muda quando entra ou sai outra pessoa.
   */
  private readonly userId = computed(() => this.currentUser()?.id ?? null);

  // As regras dos convites vivem no TaskService; aqui só se mostram no menu
  readonly pendingInvites = this.taskService.pendingInvites;

  readonly inviteTooltip = computed(() => {
    const invites = this.pendingInvites();
    if (invites.length === 0) return '';

    if (invites.length === 1) {
      return `${invites[0].inviterName} convidou-te para uma missão em conjunto`;
    }

    return `${invites[0].inviterName} e mais ${invites.length - 1} pessoa(s) convidaram-te para missões em conjunto`;
  });

  constructor() {
    // Entrou alguém -> carrega os dados dessa pessoa. Saiu -> apaga tudo.
    effect(() => {
      const id = this.userId();

      untracked(() => {
        if (id) {
          void this.gamificationService.loadProfiles();
          this.taskService.loadTasks();
        } else {
          this.taskService.clear();
          this.gamificationService.reset();
        }
      });
    });
  }

  logout() {
    this.authService.signOut();
  }
}
