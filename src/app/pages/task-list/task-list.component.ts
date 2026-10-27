import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { GamificationService } from '../../services/gamification.service';
import { Task, TaskUrgency, TaskCategory, ParticipantContribution } from '../../models/task.model';
import { TaskCardComponent } from '../../components/task-card/task-card.component';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TaskCardComponent],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.css'
})
export class TaskListComponent implements OnInit {
  private taskService = inject(TaskService);
  private gamificationService = inject(GamificationService);
  private fb = inject(FormBuilder);

  tasks: Task[] = [];
  isLoading = false;
  errorMessage = '';

  // Membros e termo de busca para o filtro de participantes
  members = this.gamificationService.profiles;
  memberSearchTerm: string = '';
  selectedParticipants: ParticipantContribution[] = [];

  // Formulário Reativo
  taskForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    category: ['diaria' as TaskCategory, Validators.required],
    urgency: ['media' as TaskUrgency, Validators.required],
    isCooperative: [false]
  });

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

  // Getter para filtrar membros com base na barra de pesquisa
  get filteredMembers() {
    const term = this.memberSearchTerm.toLowerCase();
    return this.members().filter(m => m.name.toLowerCase().includes(term));
  }

  // Getters para separar tarefas pendentes e concluídas
  get pendingTasks() {
    return this.tasks.filter(t => !t.completed);
  }

  get completedTasks() {
    return this.tasks.filter(t => t.completed);
  }

  onParticipantToggle(member: any, event: any) {
    if (event.target.checked) {
      this.selectedParticipants.push({
        userId: member.id,
        userName: member.name,
        actionsCompleted: 0
      });
    } else {
      this.selectedParticipants = this.selectedParticipants.filter(p => p.userId !== member.id);
    }
  }

  createTask() {
    if (this.taskForm.invalid) return;

    const formValues = this.taskForm.value;
    const rewards = this.calculateRewards(formValues.urgency);

    const newTaskData: Omit<Task, 'id'> = {
      title: formValues.title,
      description: formValues.description,
      category: formValues.category,
      urgency: formValues.urgency,
      completed: false,
      xpReward: rewards.xp,
      coinReward: rewards.coins,
      dueDate: new Date().toISOString().split('T')[0],
      isCooperative: formValues.isCooperative,
      participants: formValues.isCooperative ? [...this.selectedParticipants] : []
    };

    this.taskService.addTask(newTaskData).subscribe({
      next: (createdTask) => {
        this.tasks.unshift(createdTask);
        this.taskForm.reset({
          title: '',
          description: '',
          category: 'diaria',
          urgency: 'media',
          isCooperative: false
        });
        this.selectedParticipants = [];
        this.memberSearchTerm = '';
      },
      error: () => {
        this.errorMessage = 'Erro ao criar missão. Tente novamente.';
      }
    });
  }

  completeTask(task: Task) {
    if (task.completed) return;

    const updatedTask = { ...task, completed: true };

    this.taskService.updateTask(updatedTask).subscribe({
      next: () => {
        task.completed = true;
        this.gamificationService.addRewards(task.xpReward, task.coinReward);
      },
      error: () => {
        this.errorMessage = 'Erro ao atualizar o estado da missão.';
      }
    });
  }

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
      case 'critica': return { xp: 100, coins: 50 };
      case 'alta': return { xp: 60, coins: 30 };
      case 'media': return { xp: 40, coins: 20 };
      case 'baixa':
      default: return { xp: 20, coins: 10 };
    }
  }
}