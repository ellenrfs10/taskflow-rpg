import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../models/task.model';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.css'
})
export class TaskCardComponent {
  // @Input: Recebe os dados do componente Pai (TaskListComponent)
  @Input({ required: true }) task!: Task;

  // @Output: Emite eventos para o componente Pai tratar
  @Output() complete = new EventEmitter<Task>();
  @Output() delete = new EventEmitter<number>();

  onComplete() {
    this.complete.emit(this.task);
  }

  onDelete() {
    this.delete.emit(this.task.id);
  }
}