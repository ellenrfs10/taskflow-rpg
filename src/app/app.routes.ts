import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { TaskListComponent } from './pages/task-list/task-list.component';
import { ShopComponent } from './pages/shop/shop.component';
import { AuthComponent } from './components/authentication/auth.component';
import { RegisterComponent } from './components/register/register.component';
import { ProfileEditComponent } from './components/profile-edit/profile-edit.component';
import { ProfileSetupComponent } from './pages/profile-setup/profile-setup.component';

export const routes: Routes = [
    // Rota de Autenticação (Login / Registo)
    { path: 'auth', component: AuthComponent },
    { path: 'register', component: RegisterComponent },

    // Configuração de perfil após registo/login
    { path: 'profile-setup', component: ProfileSetupComponent },

    // Redireciona a raiz para o ecrã de login por defeito
    { path: '', redirectTo: 'auth', pathMatch: 'full' },

    // Vista 1: Dashboard (resumo do jogador e missões ativas)
    { path: 'dashboard', component: DashboardComponent },

    // Vista 2: Missões (listagem, criação, conclusão)
    { path: 'missions', component: TaskListComponent },

    // Vista 3: Loja
    { path: 'shop', component: ShopComponent },

    // Vista 4: Edição de Perfil
    { path: 'profile/edit', component: ProfileEditComponent },

    // Rota coringa para redirecionar URLs inválidos para o auth
    { path: '**', redirectTo: 'auth' }
];
