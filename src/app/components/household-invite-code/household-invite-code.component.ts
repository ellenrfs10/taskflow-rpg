import { Component, inject, Input, Output, EventEmitter, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-household-invite-code',
    standalone: true,
    imports: [CommonModule],
    template: `
        @if (code()) {
            <div class="household-invite">
                <label class="invite-label">{{ label() }}</label>
                <div class="invite-box">
                    <span class="invite-text">{{ code() }}</span>
                    <button type="button" class="btn-copy" (click)="onCopy()">
                        {{ copied() ? 'Copiado!' : 'Copiar' }}
                    </button>
                </div>
                @if (copied()) {
                    <p class="invite-hint">Código copiado para a área de transferência.</p>
                }
            </div>
        }
    `,
    styles: [`
        .household-invite { display: flex; flex-direction: column; gap: 0.5rem; align-items: center; text-align: center; width: 100%; }
        .invite-label { font-size: 0.75rem; font-weight: 700; color: var(--accent, #7c3aed); text-transform: uppercase; letter-spacing: 0.05em; margin: 0; }
        .invite-box { display: flex; gap: 0.5rem; align-items: center; justify-content: center; width: 100%; }
        .invite-text { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 1.1rem; font-weight: 800; color: var(--text, #1b1235); background: var(--card-bg, #ffffff); padding: 0.5rem 0.75rem; border-radius: 8px; border: 1px solid var(--card-border, #ddd0fb); word-break: break-all; user-select: all; flex: 1; }
        .btn-copy { padding: 0.4rem 0.8rem; font-size: 0.8rem; font-weight: 700; color: var(--accent, #7c3aed); background: transparent; border: 1px solid var(--card-border, #ddd0fb); border-radius: 6px; cursor: pointer; transition: all 0.2s; }
        .btn-copy:hover { background: var(--surface, #f3eeff); border-color: var(--accent, #7c3aed); }
        .invite-hint { font-size: 0.7rem; color: var(--muted, #6b5f8f); margin: 0; }
    `]
})
export class HouseholdInviteCodeComponent {
    readonly code = input<string | null>(null);
    readonly label = input<string>('Código da casa');
    @Output() readonly codeCopied = new EventEmitter<string>();

    readonly copied = signal<boolean>(false);

    onCopy() {
        const c = this.code();
        if (!c) return;
        navigator.clipboard.writeText(c).then(() => {
            this.copied.set(true);
            this.codeCopied.emit(c);
            setTimeout(() => this.copied.set(false), 2000);
        });
    }
}
