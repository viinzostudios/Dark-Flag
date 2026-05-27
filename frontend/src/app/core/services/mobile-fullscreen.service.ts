import { Injectable, signal } from '@angular/core';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Injectable({ providedIn: 'root' })
export class MobileFullscreenService {
  readonly showModal = signal(false);
  readonly canInstall = signal(false);

  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  constructor() {
    // Registrar cuanto antes: beforeinstallprompt puede dispararse antes de ngOnInit
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.canInstall.set(true);
    });
  }

  init(): void {
    if (!this.isMobile()) return;
    if (this.isStandalone()) {
      this.requestFullscreen();
      return;
    }
    this.showModal.set(true);
  }

  async onInstall(): Promise<void> {
    if (!this.deferredPrompt) {
      // Sin prompt nativo (iOS u otro): solo cerrar modal
      this.showModal.set(false);
      return;
    }
    // prompt() debe llamarse directamente desde la gestura del usuario —
    // NO llamar requestFullscreen() antes o Chrome descarta la llamada
    await this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;
    this.canInstall.set(false);
    this.showModal.set(false);
    if (outcome === 'accepted') {
      this.requestFullscreen();
    }
  }

  onContinue(): void {
    this.requestFullscreen();
    this.showModal.set(false);
  }

  requestFullscreen(): void {
    document.documentElement.requestFullscreen?.().catch(() => {});
  }

  private isMobile(): boolean {
    return /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  private isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches
      || window.matchMedia('(display-mode: fullscreen)').matches;
  }
}
