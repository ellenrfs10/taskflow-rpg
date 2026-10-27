import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GamificationService } from '../../services/gamification.service';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  private gamificationService = inject(GamificationService);
  private taskService = inject(TaskService);

  // Perfil do jogador
  readonly userProfile = this.gamificationService.userProfile;

  // Sinais computados reativos ligados diretamente ao serviço de tarefas
  readonly pendingTasks = computed(() => this.taskService.tasks().filter(t => !t.completed));
  readonly completedTasks = computed(() => this.taskService.tasks().filter(t => t.completed));

  // Controlo para o Dark Mode / Light Mode
  isDarkMode = true;

  ngOnInit() {
    // Garante que busca e sincroniza as tarefas do Supabase ao abrir o dashboard
    this.taskService.loadTasks();
  }

  // Método para alternar entre o modo escuro e claro
  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
  }
}