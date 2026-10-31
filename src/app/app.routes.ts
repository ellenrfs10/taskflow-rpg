import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guards/auth.guard';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { TaskListComponent } from './pages/task-list/task-list.component';
import { ShopComponent } from './pages/shop/shop.component';
import { AuthComponent } from './components/authentication/auth.component';
import { ProfileEditComponent } from './components/profile-edit/profile-edit.component';
import { ProfileSetupComponent } from './pages/profile-setup/profile-setup.component';

export const routes: Routes = [
    // Login / Registo (quem já tem sessão vai direto para o dashboard)
    { path: 'auth', component: AuthComponent, canActivate: [guestGuard], title: 'Entrar · TaskFlow RPG' },

    // O registo é feito no AuthComponent; links antigos para /register vão para lá
    { path: 'register', redirectTo: 'auth' },

    // Configuração de perfil após registo/login
    { path: 'profile-setup', component: ProfileSetupComponent, canActivate: [authGuard], title: 'Perfil · TaskFlow RPG' },

    // Redireciona a raiz para o ecrã de login por defeito
    { path: '', redirectTo: 'auth', pathMatch: 'full' },

    // Vista 1: Dashboard (resumo do jogador e missões ativas)
    { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard], title: 'Painel do Herói · TaskFlow RPG' },

    // Vista 2: Missões (listagem, criação, conclusão)
    { path: 'missions', component: TaskListComponent, canActivate: [authGuard], title: 'Missões · TaskFlow RPG' },

    // Vista 3: Loja
    { path: 'shop', component: ShopComponent, canActivate: [authGuard], title: 'Loja · TaskFlow RPG' },

    // Vista 4: Edição de Perfil
    { path: 'profile/edit', component: ProfileEditComponent, canActivate: [authGuard], title: 'Editar perfil · TaskFlow RPG' },

    // Rota coringa para redirecionar URLs inválidos para o auth
    { path: '**', redirectTo: 'auth' }
];
