import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
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
export class TaskCardComponent {
  private gamificationService = inject(GamificationService);

  @Input({ required: true }) task!: Task;

  @Output() complete = new EventEmitter<Task>();
  @Output() delete = new EventEmitter<number>();

  get inviterName(): string {
    const profiles = this.gamificationService.profiles();
    if (!this.task?.profile_id) return 'Alguém';

    const inviter = profiles.find(p => p.id === this.task.profile_id);
    return inviter?.name || 'Alguém';
  }

  onComplete() {
    this.complete.emit(this.task);
  }

  onDelete() {
    this.delete.emit(this.task.id);
  }
}
