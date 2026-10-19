import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GamificationService } from '../../services/gamification.service';
import { TaskService } from '../../services/task.service';
import { Task } from '../../models/task.model';

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

  // Aceder ao sinal do perfil do utilizador
  readonly userProfile = this.gamificationService.userProfile;

  pendingTasksCount = 0;
  completedTasksCount = 0;

  ngOnInit() {
    this.loadTaskStats();
  }

  loadTaskStats() {
    this.taskService.getTasks().subscribe({
      next: (tasks: Task[]) => {
        this.pendingTasksCount = tasks.filter(t => !t.completed).length;
        this.completedTasksCount = tasks.filter(t => t.completed).length;
      },
      error: () => {
        this.pendingTasksCount = 0;
        this.completedTasksCount = 0;
      }
    });
  }
}