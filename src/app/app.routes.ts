import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { TaskListComponent } from './pages/task-list/task-list.component';
import { ShopComponent } from './pages/shop/shop.component';

export const routes: Routes = [
    // Redireciona a raiz para o dashboard por defeito
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

    // Vista 1: Dashboard (resumo do jogador e missões ativas)
    { path: 'dashboard', component: DashboardComponent },

    // Vista 2: Missões (listagem, criação, conclusão)
    { path: 'missions', component: TaskListComponent },

    // Vista 3: Loja / Equipa (ou histórico)
    { path: 'shop', component: ShopComponent },

    // Rota coringa para redirecionar URLs inválidos para o dashboard
    { path: '**', redirectTo: 'dashboard' }
];