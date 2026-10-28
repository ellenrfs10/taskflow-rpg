import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../models/task.model';

@Component({
    selector: 'app-task-invitation-modal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './task-invitation-modal.component.html',
    styleUrl: './task-invitation-modal.component.css'
})
export class TaskInvitationModalComponent {
    @Input() invitations: Task[] = [];
    @Input() isOpen = false;

    @Output() accept = new EventEmitter<Task>();
    @Output() view = new EventEmitter<Task>();
    @Output() close = new EventEmitter<void>();

    onAccept(invitation: Task) {
        this.accept.emit(invitation);
    }

    onView(invitation: Task) {
        this.view.emit(invitation);
    }

    onClose() {
        this.close.emit();
    }
}
