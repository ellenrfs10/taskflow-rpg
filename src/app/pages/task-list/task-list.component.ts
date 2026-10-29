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
  private gamificationService: GamificationService = inject(GamificationService);
  private fb = inject(FormBuilder);

  tasks: Task[] = [];
  isLoading = false;
  errorMessage = '';

  members = this.gamificationService.profiles;
  userProfile = this.gamificationService.userProfile;

  memberSearchTerm: string = '';
  selectedParticipants: ParticipantContribution[] = [];

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
      next: (data: Task[]) => {
        this.tasks = data;
        this.isLoading = false;
      },
      error: (err: any) => {
        this.errorMessage = err.message || 'Erro ao carregar as missões.';
        this.isLoading = false;
      }
    });
  }

  get pendingInvites() {
    const userId = (this.userProfile() as any)?.id;
    if (!userId) return [];
    const allProfiles = (this.members() as any[]) || [];

    return this.tasks
      .filter((task: any) => {
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
      })
      .map((task: any) => {
        const inviter = allProfiles.find((p: any) => p.id === task.profile_id);
        return {
          ...task,
          inviterName: inviter?.name || 'Alguém'
        };
      });
  }

  acceptInvite(task: any) {
    const userId = (this.userProfile() as any)?.id;
    if (!userId) return;

    (this.taskService as any).acknowledgeInvitation(task, userId).subscribe({
      next: () => {
        this.tasks = this.tasks.map((t: any) => {
          if (t.id === task.id) {
            const current = t.acknowledgedBy || [];
            return { ...t, acknowledgedBy: [...current, userId] };
          }
          return t;
        });
      },
      error: (err: any) => {
        console.error(err);
        this.errorMessage = 'Erro ao aceitar convite.';
      }
    });
  }

  inviterNameForTask(task: Task): string {
    const allProfiles = (this.members() as any[]) || [];
    const profileId = (task as any)?.profile_id;
    if (!profileId) return 'Alguém';
    const inviter = allProfiles.find((p: any) => p.id === profileId);
    return inviter?.name || 'Alguém';
  }

  get filteredMembers() {
    const term = this.memberSearchTerm.toLowerCase().trim();
    const list = (this.members() as any[]) || [];
    if (!term) return list;
    return list.filter((m: any) => m?.name?.toLowerCase().includes(term));
  }

  get pendingTasks() {
    const userId = (this.userProfile() as any)?.id;
    if (!userId) return [];

    return this.tasks.filter((t: Task) => {
      if (t.completed) return false;
      if (!t.isCooperative) return true;
      if ((t as any).profile_id === userId) return true;
      const acknowledged = (t as any).acknowledgedBy || [];
      return acknowledged.includes(userId);
    });
  }

  get completedTasks() {
    const userId = (this.userProfile() as any)?.id;

    return this.tasks.filter((t: Task) => {
      if (!t.completed) return false;
      if (!userId) return true;
      if (!t.isCooperative) return true;
      if ((t as any).profile_id === userId) return true;
      const acknowledged = (t as any).acknowledgedBy || [];
      return acknowledged.includes(userId);
    });
  }

  onParticipantToggle(member: any, event: Event) {
    const target = event.target as HTMLInputElement;
    if (!target) return;

    if (target.checked) {
      const alreadyExists = this.selectedParticipants.some((p) => p.userId === member.id);
      if (alreadyExists) return;
      this.selectedParticipants.push({
        userId: member.id,
        userName: member.name,
        actionsCompleted: 0
      });
    } else {
      this.selectedParticipants = this.selectedParticipants.filter((p) => p.userId !== member.id);
    }
  }

  createTask() {
    if (this.taskForm.invalid) return;

    const formValues = this.taskForm.value;
    const rewards = this.calculateRewards(formValues.urgency);

    const participantIds = formValues.isCooperative
      ? this.selectedParticipants.map((p) => p.userId)
      : [];

    const newTaskData: any = {
      title: formValues.title,
      description: formValues.description || '',
      category: formValues.category,
      urgency: formValues.urgency,
      completed: false,
      xpReward: rewards.xp,
      coinReward: rewards.coins,
      dueDate: new Date().toISOString().split('T')[0],
      isCooperative: formValues.isCooperative,
      participants: participantIds
    };

    this.taskService.addTask(newTaskData).subscribe({
      next: (createdTask: Task) => {
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
        this.errorMessage = '';
      },
      error: (err: any) => {
        console.error(err);
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
        (this.gamificationService as any).addRewards(task.xpReward, task.coinReward);
      },
      error: (err: any) => {
        console.error(err);
        this.errorMessage = 'Erro ao atualizar o estado da missão.';
      }
    });
  }

  deleteTask(id: number) {
    this.taskService.deleteTask(id).subscribe({
      next: () => {
        this.tasks = this.tasks.filter((t: Task) => t.id !== id);
      },
      error: (err: any) => {
        console.error(err);
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
}
