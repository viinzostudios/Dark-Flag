import { Component, inject } from '@angular/core';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  template: `
    <button
      class="toggle"
      (click)="theme.toggle()"
      [title]="theme.theme() === 'dark' ? 'Modo claro' : 'Modo oscuro'"
    >
      {{ theme.theme() === 'dark' ? '☀️' : '🌙' }}
    </button>
  `,
  styles: [`
    .toggle {
      position: fixed;
      bottom: 24px; right: 24px;
      z-index: 9999;
      width: 46px; height: 46px;
      border-radius: 50%;
      border: 1px solid var(--t-bd2, rgba(255,255,255,.12));
      background: var(--t-surface2, rgba(20,20,40,.85));
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      cursor: pointer;
      font-size: 20px;
      line-height: 1;
      display: flex; align-items: center; justify-content: center;
      box-shadow: var(--t-card-shadow, 0 2px 10px rgba(0,0,0,.35));
      transition: transform .15s, box-shadow .15s;
      padding: 0;
    }
    .toggle:hover { transform: scale(1.12); }
  `],
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeService);
}
