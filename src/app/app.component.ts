import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  host: {
    '[class.dark-theme]': 'theme.isDark()',
    '[class.logged-in]': '!!currentUser()'
  }
})
export class AppComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  readonly theme = inject(ThemeService);

  // Expõe o signal do utilizador atual para o HTML
  readonly currentUser = this.authService.currentUser;

  logout() {
    this.authService.signOut().subscribe({
      next: () => {
        this.router.navigate(['/auth']);
      },
      error: (err) => {
        console.error('Erro ao terminar sessão:', err);
      }
    });
  }
}

// Exporta também como 'App' para satisfazer o main.ts e main.server.ts
export { AppComponent as App };