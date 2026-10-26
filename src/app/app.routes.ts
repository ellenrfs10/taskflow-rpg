import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { TaskListComponent } from './pages/task-list/task-list.component';
import { ShopComponent } from './pages/shop/shop.component';
import { AuthComponent } from './components/authentication/auth.component'; // Ajusta o caminho se o componente estiver noutra pasta
import { RegisterComponent } from './components/register/register.component';



export const routes: Routes = [
    // Rota de Autenticação (Login / Registo)
    { path: 'auth', component: AuthComponent },
    { path: 'register', component: RegisterComponent },

    // Redireciona a raiz para o ecrã de login por defeito
    { path: '', redirectTo: 'auth', pathMatch: 'full' },

    // Vista 1: Dashboard (resumo do jogador e missões ativas)
    { path: 'dashboard', component: DashboardComponent },

    // Vista 2: Missões (listagem, criação, conclusão)
    { path: 'missions', component: TaskListComponent },

    // Vista 3: Loja / Equipa (ou histórico)
    { path: 'shop', component: ShopComponent },

    // Rota coringa para redirecionar URLs inválidos para o auth
    { path: '**', redirectTo: 'auth' }
];