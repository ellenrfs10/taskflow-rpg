import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormsModule, Validators } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { GamificationService } from '../../services/gamification.service';
import { Task, TaskUrgency, TASK_URGENCIES, URGENCY_LABELS } from '../../models/task.model';
import { TaskCardComponent } from '../../components/task-card/task-card.component';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, TaskCardComponent],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.css'
})
export class TaskListComponent implements OnInit {
  private taskService = inject(TaskService);
  private gamificationService = inject(GamificationService);
  private fb = inject(FormBuilder);

  readonly tasks = this.taskService.tasks;
  readonly members = this.gamificationService.profiles;
  readonly userProfile = this.gamificationService.userProfile;

  // Estados vindos do serviço: só deixa de carregar quando a resposta chega mesmo
  readonly isLoading = this.taskService.loading;
  readonly loadError = this.taskService.error;
  readonly errorMessage = signal<string>('');

  readonly today = this.localDateString();

  readonly urgencyLevels = TASK_URGENCIES;
  readonly urgencyLabels = URGENCY_LABELS;

  // Estado do seletor de participantes (signals, para o template reagir sozinho)
  readonly memberSearchTerm = signal<string>('');
  readonly selectedParticipantIds = signal<string[]>([]);

  readonly taskForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.maxLength(50)]],
    urgency: ['media' as TaskUrgency, Validators.required],
    dueDate: [''],
    isCooperative: [false]
  });

  /** Membros da casa, sem o próprio utilizador, filtrados pela pesquisa. */
  readonly filteredMembers = computed(() => {
    const term = this.memberSearchTerm().toLowerCase().trim();
    const me = this.userProfile().id;
    return this.members().filter(
      (m) => m.id !== me && (!term || m.name.toLowerCase().includes(term))
    );
  });

  // Regras partilhadas com o Dashboard e o menu: vivem todas no TaskService
  readonly pendingInvites = this.taskService.pendingInvites;
  readonly pendingTasks = this.taskService.pendingTasks;
  readonly completedTasks = this.taskService.completedTasks;

  ngOnInit(): void {
    this.taskService.loadTasks();
  }

  reload(): void {
    this.taskService.loadTasks();
  }

  toggleParticipant(memberId: string, checked: boolean): void {
    this.selectedParticipantIds.update((ids) => {
      if (!checked) return ids.filter((id) => id !== memberId);
      return ids.includes(memberId) ? ids : [...ids, memberId];
    });
  }

  /** Rótulo da urgência; se vier um valor antigo da BD, mostra-o tal como está. */
  urgencyLabel(value: string): string {
    return (URGENCY_LABELS as Record<string, string>)[value] ?? value;
  }

  acceptInvite(task: Task): void {
    const userId = this.userProfile().id;
    if (!userId) return;

    this.taskService.acknowledgeInvitation(task, userId).subscribe({
      next: () => this.errorMessage.set(''),
      error: (err: unknown) => {
        console.error(err);
        this.errorMessage.set('Erro ao aceitar convite.');
      }
    });
  }

  createTask(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    const values = this.taskForm.getRawValue();
    const urgency = values.urgency ?? 'media';
    const rewards = this.calculateRewards(urgency);

    const newTaskData: any = {
      title: values.title,
      description: values.description || '',
      category: 'diaria',
      urgency,
      completed: false,
      xpReward: rewards.xp,
      coinReward: rewards.coins,
      dueDate: values.dueDate || null,
      isCooperative: values.isCooperative,
      participants: values.isCooperative ? this.selectedParticipantIds() : []
    };

    this.taskService.addTask(newTaskData).subscribe({
      next: () => {
        this.taskForm.reset({
          title: '',
          description: '',
          urgency: 'media',
          dueDate: '',
          isCooperative: false
        });
        this.selectedParticipantIds.set([]);
        this.memberSearchTerm.set('');
        this.errorMessage.set('');
      },
      error: () => this.errorMessage.set('Erro ao criar missão. Tenta novamente.')
    });
  }

  completeTask(task: Task): void {
    if (task.completed) return;

    this.taskService.updateTask({ ...task, completed: true }).subscribe({
      next: () => this.gamificationService.addRewards(task.xpReward, task.coinReward),
      error: (err: unknown) => {
        console.error(err);
        this.errorMessage.set('Erro ao atualizar o estado da missão.');
      }
    });
  }

  deleteTask(id: number): void {
    this.taskService.deleteTask(id).subscribe({
      error: (err: unknown) => {
        console.error(err);
        this.errorMessage.set('Erro ao eliminar a missão.');
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
      default:
        return { xp: 20, coins: 10 };
    }
  }

  /** Data de hoje no fuso local (YYYY-MM-DD), para o mínimo do prazo. */
  private localDateString(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
