import { Component, AfterViewInit, Input } from '@angular/core';
import { AdsService } from '../../core/services/ads.service';

@Component({
  selector: 'app-banner-ad',
  standalone: true,
  template: `
    @if (isDevMode) {
      <div class="dev-placeholder">
        <span>[ BANNER AD — 728×90 — AdSense ]</span>
      </div>
    } @else {
      <ins class="adsbygoogle"
           style="display:block"
           [attr.data-ad-client]="adClient"
           [attr.data-ad-slot]="adSlot"
           data-ad-format="auto"
           data-full-width-responsive="true">
      </ins>
    }
  `,
  styles: [`
    :host { display: block; width: 100%; max-height: 90px; overflow: hidden; }
    .dev-placeholder {
      height: 60px;
      background: rgba(255,255,255,0.03);
      border: 1px dashed rgba(255,255,255,0.1);
      border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
      color: rgba(255,255,255,0.2);
      font-size: 12px;
      font-family: monospace;
    }
  `],
})
export class BannerAdComponent implements AfterViewInit {
  @Input() adSlot = '5836217975';

  readonly adClient = 'ca-pub-6638397630622757';
  readonly isDevMode = !!(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  constructor(private readonly ads: AdsService) {}

  ngAfterViewInit(): void {
    if (!this.isDevMode) {
      this.ads.pushBannerAd();
    }
  }
}
