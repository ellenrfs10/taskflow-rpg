import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Task } from '../models/task.model';

@Injectable({
    providedIn: 'root'
})
export class TaskService {
    // Função inject importada corretamente do @angular/core
    private http = inject(HttpClient);

    private apiUrl = 'http://localhost:3000/tasks';

    // Obter todas as missões
    getTasks(): Observable<Task[]> {
        return this.http.get<Task[]>(this.apiUrl).pipe(
            catchError(this.handleError)
        );
    }

    // Criar uma nova missão
    addTask(task: Omit<Task, 'id'>): Observable<Task> {
        return this.http.post<Task>(this.apiUrl, task).pipe(
            catchError(this.handleError)
        );
    }

    // Atualizar uma missão
    updateTask(task: Task): Observable<Task> {
        return this.http.put<Task>(`${this.apiUrl}/${task.id}`, task).pipe(
            catchError(this.handleError)
        );
    }

    // Eliminar uma missão
    deleteTask(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`).pipe(
            catchError(this.handleError)
        );
    }

    // Tratamento de erros centralizado
    private handleError(error: HttpErrorResponse) {
        let errorMessage = 'Ocorreu um erro desconhecido!';
        if (error.error instanceof ErrorEvent) {
            errorMessage = `Erro de rede: ${error.error.message}`;
        } else {
            errorMessage = `Código do erro: ${error.status}, Mensagem: ${error.message}`;
        }
        console.error(errorMessage);
        return throwError(() => new Error('Não foi possível carregar as missões. Tente novamente mais tarde.'));
    }
}