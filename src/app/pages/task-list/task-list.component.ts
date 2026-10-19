import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { GamificationService } from '../../services/gamification.service';
import { Task, TaskUrgency, TaskCategory } from '../../models/task.model';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.css'
})
export class TaskListComponent implements OnInit {
  private taskService = inject(TaskService);
  private gamificationService = inject(GamificationService);

  tasks: Task[] = [];
  isLoading = false;
  errorMessage = '';

  // Formulário de criação de nova missão
  newTaskTitle = '';
  newTaskDescription = '';
  newTaskCategory: TaskCategory = 'diaria';
  newTaskUrgency: TaskUrgency = 'media';
  newTaskIsCooperative = false;

  // Valores possíveis para os selects baseados no teu model
  urgencyLevels: TaskUrgency[] = ['baixa', 'media', 'alta', 'critica'];
  categories: TaskCategory[] = ['diaria', 'semanal', 'mensal'];

  ngOnInit() {
    this.fetchTasks();
  }

  fetchTasks() {
    this.isLoading = true;
    this.taskService.getTasks().subscribe({
      next: (data) => {
        this.tasks = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.message || 'Erro ao carregar as missões.';
        this.isLoading = false;
      }
    });
  }

  // Criar uma nova missão
  createTask() {
    if (!this.newTaskTitle.trim()) return;

    const rewards = this.calculateRewards(this.newTaskUrgency);

    const newTaskData: Omit<Task, 'id'> = {
      title: this.newTaskTitle,
      description: this.newTaskDescription,
      category: this.newTaskCategory,
      urgency: this.newTaskUrgency,
      completed: false,
      xpReward: rewards.xp,
      coinReward: rewards.coins, // Ajustado para o teu model (coinReward)
      dueDate: new Date().toISOString().split('T')[0],
      isCooperative: this.newTaskIsCooperative,
      participants: []
    };

    this.taskService.addTask(newTaskData).subscribe({
      next: (createdTask) => {
        this.tasks.push(createdTask);
        this.resetForm();
      },
      error: () => {
        this.errorMessage = 'Erro ao criar missão. Tente novamente.';
      }
    });
  }

  // Concluir missão e recompensar o jogador
  completeTask(task: Task) {
    if (task.completed) return;

    const updatedTask = { ...task, completed: true };

    this.taskService.updateTask(updatedTask).subscribe({
      next: () => {
        task.completed = true;
        // Atribui XP e Moedas (usando coinReward do teu model)
        this.gamificationService.addRewards(task.xpReward, task.coinReward);
      },
      error: () => {
        this.errorMessage = 'Erro ao atualizar o estado da missão.';
      }
    });
  }

  // Eliminar missão
  deleteTask(id: number) {
    this.taskService.deleteTask(id).subscribe({
      next: () => {
        this.tasks = this.tasks.filter(t => t.id !== id);
      },
      error: () => {
        this.errorMessage = 'Erro ao eliminar a missão.';
      }
    });
  }

  private calculateRewards(urgency: TaskUrgency): { xp: number; coins: number } {
    switch (urgency) {
      case 'critica':
        return { xp: 100, coins: 50 };
      case 'alta':
        return { xp: 60, coins: 30 };
      case 'media':
        return { xp: 40, coins: 20 };
      case 'baixa':
      default:
        return { xp: 20, coins: 10 };
    }
  }

  private resetForm() {
    this.newTaskTitle = '';
    this.newTaskDescription = '';
    this.newTaskCategory = 'diaria';
    this.newTaskUrgency = 'media';
    this.newTaskIsCooperative = false;
  }
}