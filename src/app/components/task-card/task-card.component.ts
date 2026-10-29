import { Component, Input, Output, EventEmitter, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../models/task.model';
import { GamificationService } from '../../services/gamification.service';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.css'
})
export class TaskCardComponent implements OnInit, OnDestroy {
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
    this.intervalId = setInterval(() => {
      this.updateTimer();
    }, 60000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private updateTimer(): void {
    const taskAny = this.task as any;
    const dueDateStr = taskAny?.dueDate || taskAny?.due_date;

    if (!dueDateStr) {
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

    // Lógica de cores baseada no tempo restante
    if (totalHours < 5) {
      // Menos de 5 horas -> Vermelho
      this.isCritical = true;
      this.isWarning = false;
    } else if (totalDays < 1 && totalHours >= 5) {
      // Menos de 24 horas mas mais de 5 -> Amarelo
      this.isCritical = false;
      this.isWarning = true;
    } else {
      // Mais de 24 horas -> Normal
      this.isCritical = false;
      this.isWarning = false;
    }

    // Formatação do tempo restante
    if (totalDays >= 1) {
      this.timeLeft = `Faltam ${totalDays} dia(s) ${hoursLeft}h ${minutesLeft}m`;
      return;
    }

    if (totalHours >= 1) {
      this.timeLeft = `Faltam ${totalHours}h ${minutesLeft}m`;
      return;
    }

    this.timeLeft = `Faltam ${minutesLeft}m`;
  }

  get inviterName(): string {
    const profiles = this.gamificationService.profiles();
    if (!(this.task as any)?.profile_id) return 'Alguém';

    const inviter = profiles.find((p: any) => p.id === (this.task as any).profile_id);
    return inviter?.name || 'Alguém';
  }

  onComplete(): void {
    this.complete.emit(this.task);
  }

  onDelete(): void {
    this.delete.emit(this.task.id);
  }
}
