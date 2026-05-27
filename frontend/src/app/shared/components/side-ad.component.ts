import { Component, Input, AfterViewInit } from '@angular/core';
import { AdsService } from '../../core/services/ads.service';

@Component({
  selector: 'app-side-ad',
  standalone: true,
  template: `
    @if (isDevMode) {
      <div class="dev-ph"><span>SIDE AD<br>160×600</span></div>
    } @else {
      <ins class="adsbygoogle"
           style="display:inline-block;width:160px;height:600px"
           [attr.data-ad-client]="adClient"
           [attr.data-ad-slot]="adSlot">
      </ins>
    }
  `,
  styles: [`
    /* El componente solo controla visibilidad y ancho.
       La alineación la maneja el contenedor padre. */
    :host { display: none; }
    @media (min-width: 1420px) {
      :host { display: block; width: 160px; }
    }
    @media (min-width: 1700px) {
      :host { width: 300px; }
      .dev-ph { width: 300px; height: 600px; }
    }
    .dev-ph {
      width: 160px;
      height: 600px;
      background: rgba(255,255,255,0.02);
      border: 1px dashed rgba(255,255,255,0.1);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255,255,255,0.18);
      font-size: 10px;
      font-family: monospace;
      text-align: center;
      line-height: 1.6;
    }
  `],
})
export class SideAdComponent implements AfterViewInit {
  @Input() adSlot = '8929285176';

  readonly adClient = 'ca-pub-6638397630622757';
  readonly isDevMode = !!(
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );

  constructor(private readonly ads: AdsService) {}

  ngAfterViewInit(): void {
    if (!this.isDevMode) {
      this.ads.pushBannerAd();
    }
  }
}
