import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeToggleComponent } from './shared/components/theme-toggle.component';
import { ThemeService } from './core/services/theme.service';
import { OrientationPromptComponent } from './shared/components/orientation-prompt.component';
import { MobileInstallPromptComponent } from './shared/components/mobile-install-prompt.component';
import { LanguageService } from './core/services/language.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ThemeToggleComponent, OrientationPromptComponent, MobileInstallPromptComponent],
  template: `
    <router-outlet />
    <app-theme-toggle />
    <app-orientation-prompt />
    <app-mobile-install-prompt />
  `,
})
export class AppComponent {
  readonly _theme = inject(ThemeService);
  readonly _lang  = inject(LanguageService);

  constructor() {
    this._lang.init();
  }
}
