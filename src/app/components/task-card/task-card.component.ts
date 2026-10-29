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
  isCritical: boolean = false;
  isExpired: boolean = false;

  private intervalId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.updateTimer();
    // Atualiza o temporizador a cada minuto
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
    if (!this.task?.dueDate) {
      this.timeLeft = '';
      this.isCritical = false;
      this.isExpired = false;
      return;
    }

    const now = new Date();
    // Considera o fim do dia como vencimento
    const dueDate = new Date(`${this.task.dueDate}T23:59:59`);
    const diffMs = dueDate.getTime() - now.getTime();

    if (diffMs <= 0) {
      this.isExpired = true;
      this.isCritical = true;
      this.timeLeft = 'Expirada';
      return;
    }

    this.isExpired = false;

    const diffHoursTotal = diffMs / (1000 * 60 * 60);
    const diffDays = Math.floor(diffHoursTotal / 24);
    const hoursLeft = Math.floor(diffHoursTotal % 24);
    const minutesLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    // Fica vermelho quando faltar menos de 2 horas
    this.isCritical = diffHoursTotal <= 2;

    if (diffDays > 0) {
      this.timeLeft = `${diffDays}d ${hoursLeft}h restantes`;
      return;
    }

    if (hoursLeft > 0) {
      this.timeLeft = `${hoursLeft}h ${minutesLeft}m restantes`;
      return;
    }

    this.timeLeft = `${minutesLeft}m restantes`;
  }

  get inviterName(): string {
    const profiles = this.gamificationService.profiles();
    if (!this.task?.profile_id) return 'Alguém';

    const inviter = profiles.find((p: any) => p.id === this.task.profile_id);
    return inviter?.name || 'Alguém';
  }

  onComplete(): void {
    this.complete.emit(this.task);
  }

  onDelete(): void {
    this.delete.emit(this.task.id);
  }
}
