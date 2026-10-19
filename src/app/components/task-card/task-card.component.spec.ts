import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskCardComponent } from './task-card.component';
import { Task } from '../../models/task.model';

describe('TaskCardComponent', () => {
  let component: TaskCardComponent;
  let fixture: ComponentFixture<TaskCardComponent>;

  const mockTask: Task = {
    id: 1,
    title: 'Missão de Teste',
    description: 'Descrição de teste',
    category: 'diaria',
    urgency: 'media',
    xpReward: 40,
    coinReward: 20,
    completed: false,
    dueDate: '2026-10-19',
    isCooperative: false
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskCardComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TaskCardComponent);
    component = fixture.componentInstance;

    // Passa a tarefa obrigatória para o @Input antes do detectChanges
    component.task = mockTask;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});