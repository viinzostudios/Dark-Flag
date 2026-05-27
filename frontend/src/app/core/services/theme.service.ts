import { Injectable, signal, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type Theme = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  readonly theme = signal<Theme>(this.loadSaved());

  constructor() {
    this.apply(this.theme());
  }

  toggle(): void {
    const next: Theme = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    localStorage.setItem('ast-theme', next);
    this.apply(next);
  }

  private loadSaved(): Theme {
    const v = localStorage.getItem('ast-theme');
    return v === 'light' ? 'light' : 'dark';
  }

  private apply(t: Theme): void {
    this.doc.documentElement.setAttribute('data-theme', t);
  }
}
