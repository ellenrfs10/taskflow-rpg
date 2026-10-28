import { Injectable, signal } from '@angular/core';

const THEME_KEY = 'taskflow-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
    readonly isDark = signal<boolean>(this.readSaved());

    toggle() {
        this.isDark.update(dark => !dark);
        try {
            localStorage.setItem(THEME_KEY, this.isDark() ? 'dark' : 'light');
        } catch { /* localStorage indisponível */ }
    }

    private readSaved(): boolean {
        try {
            return localStorage.getItem(THEME_KEY) !== 'light';
        } catch {
            return true;
        }
    }
}