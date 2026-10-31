import { Component, EventEmitter, inject, Input, OnChanges, OnDestroy, OnInit, Output } from '@angular/core';
import { CATEGORY_LABELS, Task, URGENCY_LABELS } from '../../models/task.model';
import { GamificationService } from '../../services/gamification.service';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [],
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.css'
})
export class TaskCardComponent implements OnInit, OnChanges, OnDestroy {
  private gamificationService = inject(GamificationService);

  @Input({ required: true }) task!: Task;

  @Output() complete = new EventEmitter<Task>();
  @Output() delete = new EventEmitter<number>();

  timeLeft: string = '';
  isWarning: boolean = false;
  isCritical: boolean = false;
  isExpired: boolean = false;

  private intervalId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.updateTimer();
    this.intervalId = setInterval(() => this.updateTimer(), 60000);
  }

  // Se o pai enviar uma missão atualizada, o temporizador acompanha logo
  ngOnChanges(): void {
    this.updateTimer();
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  get urgencyLabel(): string {
    return URGENCY_LABELS[this.task.urgency] ?? this.task.urgency;
  }

  get categoryLabel(): string {
    return CATEGORY_LABELS[this.task.category] ?? this.task.category;
  }

  /** Missões antigas sem dono contam como minhas. */
  get isOwner(): boolean {
    const owner = this.task.profile_id;
    return !owner || owner === this.gamificationService.userProfile().id;
  }

  /** "Convidado por" só faz sentido em missões cooperativas criadas por outra pessoa. */
  get isInvited(): boolean {
    return this.task.isCooperative && !this.isOwner;
  }

  get inviterName(): string {
    const profiles = this.gamificationService.profiles();
    const inviter = profiles.find((p) => p.id === this.task.profile_id);
    return inviter?.name || 'Alguém';
  }

  private updateTimer(): void {
    const taskAny = this.task as any;
    const dueDateStr = taskAny?.dueDate || taskAny?.due_date;

    // Sem prazo, ou já concluída: não há contagem decrescente
    if (!dueDateStr || this.task.completed) {
      this.timeLeft = '';
      this.isWarning = false;
      this.isCritical = false;
      this.isExpired = false;
      return;
    }

    const now = new Date();
    const deadline = new Date(`${dueDateStr}T23:59:59`);
    const diffMs = deadline.getTime() - now.getTime();

    if (diffMs <= 0) {
      this.isExpired = true;
      this.isWarning = false;
      this.isCritical = true;
      this.timeLeft = 'Expirada';
      return;
    }

    this.isExpired = false;

    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);

    const hoursLeft = totalHours % 24;
    const minutesLeft = totalMinutes % 60;

    if (totalHours < 5) {
      this.isCritical = true; // menos de 5 horas: vermelho
      this.isWarning = false;
    } else if (totalDays < 1) {
      this.isCritical = false; // menos de 24 horas: amarelo
      this.isWarning = true;
    } else {
      this.isCritical = false;
      this.isWarning = false;
    }

    if (totalDays >= 1) {
      this.timeLeft = `Faltam ${totalDays} dia(s) ${hoursLeft}h ${minutesLeft}m`;
    } else if (totalHours >= 1) {
      this.timeLeft = `Faltam ${totalHours}h ${minutesLeft}m`;
    } else {
      this.timeLeft = `Faltam ${minutesLeft}m`;
    }
  }

  onComplete(): void {
    this.complete.emit(this.task);
  }

  onDelete(): void {
    this.delete.emit(this.task.id);
  }
}
