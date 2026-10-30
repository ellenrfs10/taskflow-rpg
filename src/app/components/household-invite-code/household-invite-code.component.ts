import { Component, inject, Input, Output, EventEmitter, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-household-invite-code',
    standalone: true,
    imports: [CommonModule],
    template: `
        @if (code()) {
            <div class="household-invite">
                <div class="invite-box">
                    <span class="invite-text">{{ code() }}</span>
                    <button type="button" class="btn-copy" (click)="onCopy()">
                        {{ copied() ? 'Copiado!' : 'Copiar' }}
                    </button>
                </div>
                <label class="invite-label">{{ label() }}</label>
                @if (copied()) {
                    <p class="invite-hint">Código copiado para a área de transferência.</p>
                }
            </div>
        }
    `,
    styles: [`
        .household-invite {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            align-items: center;
            text-align: center;
            width: 100%;
        }

        .invite-box {
            display: flex;
            gap: 0.5rem;
            align-items: center;
            justify-content: center;
            width: 100%;
        }

        .invite-text {
            flex: 1;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 0.9rem;
            font-weight: 700;
            color: #7c3aed;
            background: #ffffff;
            padding: 0.5rem 0.75rem;
            border-radius: 8px;
            border: 1px solid #ddd0fb;
            word-break: break-all;
            user-select: all;
            text-align: center;
            height: 2.2rem;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .btn-copy {
            flex: 0 0 auto;
            padding: 0.5rem 0.8rem;
            font-size: 0.9rem;
            font-weight: 700;
            color: #7c3aed;
            background: transparent;
            border: 1px solid #ddd0fb;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
            height: 2.2rem;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .btn-copy:hover {
            background: #f3eeff;
            border-color: #7c3aed;
        }

        .invite-label {
            font-size: 0.75rem;
            font-weight: 700;
            color: #7c3aed;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin: 0;
        }

        .invite-hint {
            font-size: 0.7rem;
            color: #6b5f8f;
            margin: 0;
        }
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
